// X (Twitter) API v2 client — read-only, single-creator timeline.
// Uses app-only auth (Bearer Token). No posting, no OAuth dance.
// Docs: https://docs.x.com/x-api/introduction

import type { SupabaseClient } from "@supabase/supabase-js";

const X_BASE = "https://api.x.com/2";

export type XTweetRaw = {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
  entities?: unknown;
};

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

/** GET /2/users/:id/tweets — original posts only (no retweets, no replies). */
export async function fetchRecentTweets(
  userId: string,
  max = 50,
): Promise<XTweetRaw[]> {
  const qs = new URLSearchParams({
    max_results: String(Math.min(Math.max(max, 5), 100)),
    "tweet.fields": "created_at,public_metrics,entities",
    exclude: "retweets,replies",
  });
  const body = await apiGet<{ data?: XTweetRaw[] }>(
    `/users/${encodeURIComponent(userId)}/tweets?${qs.toString()}`,
  );
  return body.data ?? [];
}

/**
 * Top-level sync used by the daily cron. Idempotent — upserts on tweet id,
 * so re-running within the rate-limit window is safe.
 */
export async function syncHandle(
  handle: string,
  sb: SupabaseClient,
): Promise<{
  handle: string;
  user_id: string;
  fetched: number;
  upserted: number;
}> {
  const user = await resolveUserId(handle);
  const tweets = await fetchRecentTweets(user.id, 50);

  if (tweets.length === 0) {
    return { handle: user.username, user_id: user.id, fetched: 0, upserted: 0 };
  }

  const rows = tweets.map((t) => ({
    id: t.id,
    author_id: user.id,
    author_handle: user.username,
    author_name: user.name,
    text: t.text,
    created_at: t.created_at,
    url: `https://x.com/${user.username}/status/${t.id}`,
    metrics: t.public_metrics ?? {},
    entities: t.entities ?? null,
  }));

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
  };
}
