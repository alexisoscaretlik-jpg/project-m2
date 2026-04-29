import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SpotifyEpisodeList } from "@/components/spotify-episode-card";
import { EpisodePlayer } from "@/components/episode-player";
import { serviceClient } from "@/lib/supabase/service";

export const metadata = {
  title: "Argent · Podcast — Invest Coach",
  description:
    "Le podcast français qui transforme une vidéo YouTube en coaching personnel. Coach et Investisseur creusent une seule loi de l'argent par épisode.",
};

const BUCKET = "podcasts";

type EpisodeMeta = {
  title: string;
  summary: string;
  law: string;
  theme?: string;
  character: { name: string; age: number; city: string; situation: string };
  source?: { url: string; creator: string };
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

export default async function PodcastIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{ theme?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const themeFilter = params.theme;
  const all = await listEpisodes();
  // Episodes default to "money" theme when the field is absent (back-compat).
  const episodes = themeFilter
    ? all.filter((e) => (e.meta.theme ?? "money") === themeFilter)
    : all;

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/podcast" />

      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, var(--lavender-100) 0%, var(--paper-50) 60%, var(--paper-50) 100%)",
        }}
      >
        <div
          className="mx-auto px-6 pt-16 pb-10 text-center sm:px-8 sm:pt-20"
          style={{ maxWidth: "880px" }}
        >
          <div className="mb-6 flex justify-center">
            <span className="ic-pill">
              <span className="ic-pill-badge">Podcast</span>
              Une loi de l&apos;argent par épisode
            </span>
          </div>
          <h1 className="ic-h1 mx-auto" style={{ maxWidth: "720px" }}>
            Vingt minutes, une loi de l&apos;argent, <em>une action concrète.</em>
          </h1>
          <p
            className="mx-auto mt-5 text-[17px]"
            style={{
              maxWidth: "560px",
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.55,
            }}
          >
            Coach et Investisseur creusent une seule règle d&apos;argent par
            épisode, appliquée à un vrai salaire français. À la fin, tu sais
            exactement ce qu&apos;il faut faire cette semaine.
          </p>

          {/* Decorative animated waveform — visual signature for the audio theme. */}
          <div
            aria-hidden="true"
            className="mx-auto mt-10 flex h-12 items-center justify-center gap-[3px]"
            style={{ maxWidth: "320px" }}
          >
            {Array.from({ length: 32 }).map((_, i) => {
              // Pseudo-random heights, deterministic per index so SSR matches.
              const h = 10 + ((i * 13) % 28) + (i % 5) * 4;
              return (
                <span
                  key={i}
                  className="ic-podcast-bar block"
                  style={{
                    width: "3px",
                    height: `${h}px`,
                    background: "var(--lavender-500)",
                    borderRadius: "2px",
                    opacity: 0.55,
                    // @ts-expect-error animation delay CSS var
                    "--bar-delay": `${(i % 8) * 0.08}s`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 pt-4 pb-16 sm:px-8">
        <SpotifyEpisodeList />

        {episodes.length === 0 ? (
          <div
            className="ic-card-pastel-lavender"
            style={{
              borderRadius: "var(--r-2xl)",
              padding: "32px 28px",
              border: "1px solid rgba(124,91,250,0.14)",
            }}
          >
            <div
              className="text-[11px] font-semibold uppercase"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--lavender-700)",
                letterSpacing: "0.12em",
              }}
            >
              Premier épisode bientôt
            </div>
            <p
              className="mt-2 text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.45,
              }}
            >
              On enregistre un épisode neuf chaque semaine. Abonne-toi à la
              newsletter pour ne pas le rater.
            </p>
          </div>
        ) : null}

        <ul className="mt-2 space-y-4">
          {episodes.map((ep, idx) => (
            <li key={ep.slug}>
              <article
                className="rounded-2xl px-6 py-6"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="text-[11px] font-semibold uppercase"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--lavender-700)",
                    letterSpacing: "0.12em",
                  }}
                >
                  Épisode {episodes.length - idx} · {formatDate(ep.date)}
                </div>
                <h2
                  className="mt-2 text-[22px] font-bold"
                  style={{
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.02em",
                    color: "var(--ink-700)",
                    lineHeight: 1.25,
                  }}
                >
                  {ep.meta.title}
                </h2>
                <p
                  className="mt-3 text-[15px]"
                  style={{
                    fontFamily: "var(--font-display)",
                    lineHeight: 1.55,
                    color: "var(--fg-muted)",
                  }}
                >
                  {ep.meta.summary}
                </p>
                <div className="mt-5">
                  <EpisodePlayer src={ep.audioUrl} />
                </div>
                <p
                  className="mt-4 text-[11px]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--fg-subtle)",
                  }}
                >
                  Coaching IA · pas un conseil en investissement personnalisé
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
