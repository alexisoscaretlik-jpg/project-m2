import { serviceClient } from "@/lib/supabase/service";

// Persist a generated podcast MP3 + metadata to Supabase Storage.
//
// Bucket: "podcasts" (must be created in Supabase dashboard, public-read,
// since we serve the audio via <audio src> in the app).
//
// Path layout:
//   podcasts/babylon/<yyyy-mm-dd>/<slug>.mp3
//   podcasts/babylon/<yyyy-mm-dd>/<slug>.json   (metadata: title, summary, source, lines)

const BUCKET = "podcasts";

export type PodcastUploadResult = {
  audioUrl: string;
  metadataUrl: string;
  path: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "episode";
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function uploadEpisode(args: {
  title: string;
  audio: Uint8Array;
  metadata: Record<string, unknown>;
}): Promise<PodcastUploadResult> {
  const sb = serviceClient();
  const date = todayIsoDate();
  const slug = slugify(args.title);
  const baseDir = `babylon/${date}`;
  const audioPath = `${baseDir}/${slug}.mp3`;
  const metaPath = `${baseDir}/${slug}.json`;

  const { error: audioErr } = await sb.storage.from(BUCKET).upload(audioPath, args.audio, {
    contentType: "audio/mpeg",
    cacheControl: "3600",
    upsert: true,
  });
  if (audioErr) throw new Error(`Upload MP3 échoué: ${audioErr.message}`);

  const metaBytes = new TextEncoder().encode(JSON.stringify(args.metadata, null, 2));
  const { error: metaErr } = await sb.storage.from(BUCKET).upload(metaPath, metaBytes, {
    contentType: "application/json",
    cacheControl: "3600",
    upsert: true,
  });
  if (metaErr) throw new Error(`Upload metadata échoué: ${metaErr.message}`);

  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(audioPath);
  const { data: pubMeta } = sb.storage.from(BUCKET).getPublicUrl(metaPath);

  return {
    audioUrl: pub.publicUrl,
    metadataUrl: pubMeta.publicUrl,
    path: audioPath,
  };
}
