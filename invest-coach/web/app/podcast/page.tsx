import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { serviceClient } from "@/lib/supabase/service";

export const metadata = {
  title: "Podcast — Invest Coach",
  description:
    "Des épisodes de coaching financier en français, inspirés de L'homme le plus riche de Babylone.",
};

const BUCKET = "podcasts";

type EpisodeMeta = {
  title: string;
  summary: string;
  law: string;
  character: { name: string; age: number; city: string; situation: string };
  source: { url: string; creator: string };
};

type Episode = {
  slug: string;
  date: string;
  audioUrl: string;
  meta: EpisodeMeta;
};

async function listEpisodes(): Promise<Episode[]> {
  const sb = serviceClient();
  const dates = await sb.storage.from(BUCKET).list("babylon", {
    sortBy: { column: "name", order: "desc" },
  });
  if (dates.error || !dates.data) return [];

  const episodes: Episode[] = [];
  for (const dateFolder of dates.data) {
    if (!dateFolder.name.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
    const files = await sb.storage
      .from(BUCKET)
      .list(`babylon/${dateFolder.name}`);
    if (files.error || !files.data) continue;

    const mp3s = files.data.filter((f) => f.name.endsWith(".mp3"));
    for (const mp3 of mp3s) {
      const slug = mp3.name.replace(/\.mp3$/, "");
      const path = `babylon/${dateFolder.name}/${mp3.name}`;
      const metaPath = `babylon/${dateFolder.name}/${slug}.json`;

      const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
      const metaDl = await sb.storage.from(BUCKET).download(metaPath);
      if (metaDl.error || !metaDl.data) continue;
      const text = await metaDl.data.text();
      let meta: EpisodeMeta;
      try {
        meta = JSON.parse(text) as EpisodeMeta;
      } catch {
        continue;
      }

      episodes.push({
        slug,
        date: dateFolder.name,
        audioUrl: pub.publicUrl,
        meta,
      });
    }
  }
  return episodes;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PodcastIndexPage() {
  const episodes = await listEpisodes();

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/podcast" />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10">
          <div className="cap-eyebrow">Le podcast</div>
          <h1 className="cap-h1 mt-3">Épisodes</h1>
          <p className="cap-lede mt-4 max-w-[640px]">
            Des leçons inspirées de <em>L&apos;homme le plus riche de Babylone</em>,
            appliquées à un salarié français aujourd&apos;hui. Vingt minutes,
            trois actes, une action concrète.
          </p>
        </div>

        {episodes.length === 0 && (
          <p
            className="text-[14px] italic"
            style={{ fontFamily: "var(--font-serif)", color: "var(--fg-muted)" }}
          >
            Pas encore d&apos;épisode publié. Reviens bientôt.
          </p>
        )}

        <ul className="space-y-6">
          {episodes.map((ep) => (
            <li key={ep.slug}>
              <article className="cap-card">
                <div className="cap-eyebrow mb-2">
                  {formatDate(ep.date)} · {ep.meta.character.city}
                </div>
                <h2
                  className="text-[22px] font-semibold leading-snug"
                  style={{
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.01em",
                    color: "var(--fg)",
                  }}
                >
                  {ep.meta.title}
                </h2>
                <p
                  className="mt-2 text-[15px]"
                  style={{
                    fontFamily: "var(--font-serif)",
                    lineHeight: 1.55,
                    color: "var(--fg-muted)",
                  }}
                >
                  {ep.meta.summary}
                </p>
                <audio
                  controls
                  preload="metadata"
                  src={ep.audioUrl}
                  className="mt-4 w-full"
                />
                <p
                  className="mt-3 text-[11px]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--fg-subtle)",
                  }}
                >
                  Source : {ep.meta.source.creator} · IA, pas un conseil en
                  investissement
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
      <Footer />
    </main>
  );
}
