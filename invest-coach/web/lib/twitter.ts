// X (Twitter) API v2 client — read-only, single-creator timeline.
// Uses app-only auth (Bearer Token). No posting, no OAuth dance.
// Docs: https://docs.x.com/x-api/introduction

import type { SupabaseClient } from "@supabase/supabase-js";

const X_BASE = "https://api.x.com/2";

export type XTweetRaw = {
  id: string;
  text: string;
  created_at: string;
  attachments?: { media_keys?: string[] };
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
  entities?: unknown;
};

type XMedia = {
  media_key: string;
  type: "photo" | "video" | "animated_gif";
  url?: string;
  preview_image_url?: string;
};

type XListResponse = {
  data?: XTweetRaw[];
  meta?: { next_token?: string };
  includes?: { media?: XMedia[] };
};

/** Pick the best URL for each tweet's photos. Falls back to preview for videos. */
function resolveMediaUrls(
  tweet: XTweetRaw,
  mediaPool: Record<string, XMedia>,
): string[] {
  const keys = tweet.attachments?.media_keys ?? [];
  const urls: string[] = [];
  for (const k of keys) {
    const m = mediaPool[k];
    if (!m) continue;
    if (m.type === "photo" && m.url) urls.push(m.url);
    else if (m.preview_image_url) urls.push(m.preview_image_url);
  }
  return urls;
}

export type XUser = { id: string; name: string; username: string };

function authHeaders(): Record<string, string> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) throw new Error("TWITTER_BEARER_TOKEN not set");
  return { Authorization: `Bearer ${token}` };
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${X_BASE}${path}`, {
    headers: authHeaders(),
    // Next.js "no-store" — we manage caching at the DB layer, not the fetch layer
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `X API ${res.status} ${res.statusText} on ${path}: ${body.slice(0, 300)}`,
    );
  }
  return (await res.json()) as T;
}

/** GET /2/users/by/username/:username — resolve @handle to the numeric user id. */
export async function resolveUserId(handle: string): Promise<XUser> {
  const clean = handle.replace(/^@/, "");
  const body = await apiGet<{ data?: XUser }>(
    `/users/by/username/${encodeURIComponent(clean)}`,
  );
  if (!body.data) {
    throw new Error(`X user lookup returned no data for @${clean}`);
  }
  return body.data;
}

/** GET /2/users/:id/tweets — original posts only (no retweets, no replies).
 *  Now expands media so each tweet's photos/preview URLs are returned alongside.
 */
export async function fetchRecentTweets(
  userId: string,
  max = 50,
): Promise<{ tweets: XTweetRaw[]; mediaByKey: Record<string, XMedia> }> {
  const qs = new URLSearchParams({
    max_results: String(Math.min(Math.max(max, 5), 100)),
    "tweet.fields": "created_at,public_metrics,entities,attachments",
    expansions: "attachments.media_keys",
    "media.fields": "url,preview_image_url,type",
    exclude: "retweets,replies",
  });
  const body = await apiGet<XListResponse>(
    `/users/${encodeURIComponent(userId)}/tweets?${qs.toString()}`,
  );
  const mediaByKey: Record<string, XMedia> = {};
  for (const m of body.includes?.media ?? []) mediaByKey[m.media_key] = m;
  return { tweets: body.data ?? [], mediaByKey };
}

/**
 * Paginated historical fetch — pulls every original tweet posted by `userId`
 * since `sinceIso`. Used on first run of the cron to seed a 30-day window.
 *
 * X API v2 caps `max_results` at 100 per page, so we follow `meta.next_token`
 * until either (a) no more pages, (b) we cross the `sinceIso` boundary, or
 * (c) we hit `safetyCap` to avoid runaway loops on a chatty account.
 */
export async function fetchTweetsSince(
  userId: string,
  sinceIso: string,
  safetyCap = 600,
): Promise<{ tweets: XTweetRaw[]; mediaByKey: Record<string, XMedia> }> {
  const collected: XTweetRaw[] = [];
  const mediaByKey: Record<string, XMedia> = {};
  let nextToken: string | undefined;

  do {
    const qs = new URLSearchParams({
      max_results: "100",
      "tweet.fields": "created_at,public_metrics,entities,attachments",
      expansions: "attachments.media_keys",
      "media.fields": "url,preview_image_url,type",
      exclude: "retweets,replies",
      start_time: sinceIso,
    });
    if (nextToken) qs.set("pagination_token", nextToken);

    const body = await apiGet<XListResponse>(
      `/users/${encodeURIComponent(userId)}/tweets?${qs.toString()}`,
    );

    collected.push(...(body.data ?? []));
    for (const m of body.includes?.media ?? []) mediaByKey[m.media_key] = m;

    if (collected.length >= safetyCap) break;
    nextToken = body.meta?.next_token;
  } while (nextToken);

  return { tweets: collected.slice(0, safetyCap), mediaByKey };
}

/**
 * Top-level sync used by the daily cron. Idempotent — upserts on tweet id,
 * so re-running within the rate-limit window is safe.
 *
 * Strategy:
 *   - If the table has zero tweets for this handle → bulk-pull last 30 days.
 *   - Otherwise → incremental pull of the most recent ~50 (cheap).
 *
 * The `sinceDays` arg overrides the bulk window (e.g. pass 90 to seed deeper).
 */
export async function syncHandle(
  handle: string,
  sb: SupabaseClient,
  sinceDays = 30,
): Promise<{
  handle: string;
  user_id: string;
  fetched: number;
  upserted: number;
  with_media: number;
  mode: "bulk" | "incremental" | "media-backfill";
}> {
  const user = await resolveUserId(handle);

  // Three modes:
  //   - bulk: empty table, pull last `sinceDays` days
  //   - media-backfill: rows exist but none have media_urls (post-vision-upgrade), re-pull bulk to populate
  //   - incremental: pull most recent ~50 to catch new posts
  const { count: existingCount } = await sb
    .from("tweets")
    .select("id", { count: "exact", head: true })
    .eq("author_handle", user.username);

  const { count: withMediaCount } = await sb
    .from("tweets")
    .select("id", { count: "exact", head: true })
    .eq("author_handle", user.username)
    .not("media_urls", "eq", "{}");

  let tweets: XTweetRaw[];
  let mediaByKey: Record<string, XMedia>;
  let mode: "bulk" | "incremental" | "media-backfill";

  if ((existingCount ?? 0) === 0) {
    const sinceIso = new Date(
      Date.now() - sinceDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    ({ tweets, mediaByKey } = await fetchTweetsSince(user.id, sinceIso));
    mode = "bulk";
  } else if ((withMediaCount ?? 0) === 0 && (existingCount ?? 0) > 0) {
    // Vision upgrade backfill — re-pull recent tweets so we get media URLs
    // attached to existing rows. Idempotent thanks to upsert on tweet id.
    const sinceIso = new Date(
      Date.now() - sinceDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    ({ tweets, mediaByKey } = await fetchTweetsSince(user.id, sinceIso));
    mode = "media-backfill";
  } else {
    ({ tweets, mediaByKey } = await fetchRecentTweets(user.id, 50));
    mode = "incremental";
  }

  if (tweets.length === 0) {
    return {
      handle: user.username,
      user_id: user.id,
      fetched: 0,
      upserted: 0,
      with_media: 0,
      mode,
    };
  }

  let withMedia = 0;
  const rows = tweets.map((t) => {
    const mediaUrls = resolveMediaUrls(t, mediaByKey);
    if (mediaUrls.length > 0) withMedia += 1;
    return {
      id: t.id,
      author_id: user.id,
      author_handle: user.username,
      author_name: user.name,
      text: t.text,
      created_at: t.created_at,
      url: `https://x.com/${user.username}/status/${t.id}`,
      metrics: t.public_metrics ?? {},
      entities: t.entities ?? null,
      media_urls: mediaUrls,
    };
  });

  const { error, count } = await sb
    .from("tweets")
    .upsert(rows, { onConflict: "id", count: "exact" });

  if (error) {
    throw new Error(`tweets upsert failed: ${error.message}`);
  }

  return {
    handle: user.username,
    user_id: user.id,
    fetched: tweets.length,
    upserted: count ?? rows.length,
    with_media: withMedia,
    mode,
  };
}
