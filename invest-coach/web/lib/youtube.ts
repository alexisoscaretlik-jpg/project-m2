// Minimal YouTube helpers — no API key, no SDK.
// Uses the public channel RSS feed (always available, rate-limit-free).

export type YtVideo = {
  id: string;
  title: string;
  published: string;   // ISO 8601
  url: string;
};

/**
 * Fetch the channel's RSS feed and parse recent videos.
 * YouTube returns the ~15 most recent uploads regardless of age.
 * Works for both /@handle and channel_id — we need the channel_id form.
 */
export async function fetchChannelVideos(channelId: string): Promise<YtVideo[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`YouTube RSS ${res.status} for channel_id=${channelId}`);
  }
  const xml = await res.text();

  const videos: YtVideo[] = [];
  // Entries look like:
  //   <entry>
  //     <yt:videoId>ABCDEFGHIJK</yt:videoId>
  //     <title>Some title</title>
  //     <published>2026-04-24T10:00:00+00:00</published>
  //     ...
  //   </entry>
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const id        = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(block)?.[1];
    const title     = /<title>([^<]+)<\/title>/.exec(block)?.[1];
    const published = /<published>([^<]+)<\/published>/.exec(block)?.[1];
    if (!id || !title || !published) continue;
    videos.push({
      id,
      title: decodeXmlEntities(title),
      published,
      url: `https://www.youtube.com/watch?v=${id}`,
    });
  }
  return videos;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g,  "&")
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'");
}
