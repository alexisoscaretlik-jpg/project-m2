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

// Cover photos rotated through episode cards. Both supplied by Oscar
// (Unsplash, free commercial license — see plan/photo style guide).
const COVER_BLUE_YELLOW =
  "https://images.unsplash.com/photo-1618331833071-ce81bd50d300?auto=format&fit=crop&w=1200&q=80";
const COVER_SMARTPHONE =
  "https://images.unsplash.com/photo-1773332611514-238856b76198?auto=format&fit=crop&w=1200&q=80";

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
  try {
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
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateMono(iso: string) {
  const d = new Date(iso);
  const months = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUI", "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC"];
  return `${months[d.getMonth()]} ${d.getDate()} · ${d.getFullYear()}`;
}

export default async function PodcastIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{ theme?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const themeFilter = params.theme;
  const all = await listEpisodes();
  const episodes = themeFilter
    ? all.filter((e) => (e.meta.theme ?? "money") === themeFilter)
    : all;

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/podcast" />

      {/* Row 1 — peach pastel block with mega wordmark stack. */}
      <section
        className="ic-block-peach px-6 pt-12 pb-8 sm:px-8 sm:pt-16 sm:pb-12"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
        aria-labelledby="podcast-mark"
      >
        <span className="ic-eyebrow-mono">Podcast</span>
        <h1 id="podcast-mark" className="mt-5">
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            LE COACHING
          </span>
          <span className="ic-mega" style={{ fontSize: "clamp(56px, 13vw, 200px)" }}>
            EN DEUX VOIX
          </span>
        </h1>
      </section>

      {/* Row 2 — mono tagline strip. */}
      <p className="ic-strip">
        Coach 80%. Investisseur 20%. Aucune publicité. Aucune leçon.
      </p>

      {/* Row 3 — lilac × abstract-painting split. */}
      <div
        className="grid md:grid-cols-2"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div
          className="ic-block-lilac flex min-h-[420px] flex-col justify-between px-6 py-12 sm:px-10 sm:py-16 md:min-h-[520px]"
          style={{ borderRight: "1px solid var(--ink-700)" }}
        >
          <div>
            <span className="ic-eyebrow-mono mb-6 inline-flex">La méthode</span>
            <h2 className="ic-bigsection mb-6" style={{ fontSize: "clamp(34px, 5vw, 72px)" }}>
              Une vidéo<br />par semaine.<br />Une loi<br />par épisode.
            </h2>
            <p
              className="max-w-[440px] text-[16px]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--ink-700)",
                lineHeight: 1.55,
              }}
            >
              Tu choisis une vidéo YouTube qui te parle. On en tire une seule
              règle d&apos;argent et on la branche sur un vrai salaire
              français — PEA, AV, fiscalité comprise. Vingt minutes, deux voix,
              une action concrète à la fin.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="https://open.spotify.com/show/"
              target="_blank"
              rel="noreferrer"
              className="ic-btn-block"
            >
              ↳ S&apos;abonner sur Spotify
            </a>
            <p
              className="text-[11px]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--ink-700)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Pas un conseil en investissement personnalisé
            </p>
          </div>
        </div>

        <div className="relative min-h-[260px] md:min-h-[520px]">
          <img
            src={COVER_BLUE_YELLOW}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ display: "block" }}
          />
        </div>
      </div>

      {/* Row 4 — Spotify embeds (curated) + episode cards (.ic-edcard grid). */}
      <section className="px-6 py-16 sm:px-8" style={{ borderBottom: "1px solid var(--ink-700)" }}>
        <div className="mx-auto" style={{ maxWidth: "1280px" }}>
          <div className="mb-8 flex items-baseline justify-between gap-4">
            <span className="ic-eyebrow-mono">Épisodes</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--fg-muted)",
              }}
            >
              {episodes.length} {episodes.length > 1 ? "épisodes" : "épisode"}
            </span>
          </div>

          {/* Curated Spotify episodes (renders nothing if list is empty). */}
          <div className="mb-12">
            <SpotifyEpisodeList />
          </div>

          {episodes.length === 0 ? (
            <div
              className="ic-block-rose"
              style={{
                border: "1px solid var(--ink-700)",
                padding: "32px 28px",
              }}
            >
              <span className="ic-eyebrow-mono">Premier épisode bientôt</span>
              <p
                className="mt-3 text-[16px]"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--ink-700)",
                  lineHeight: 1.5,
                  maxWidth: "520px",
                }}
              >
                On enregistre un épisode neuf chaque semaine. Abonne-toi à la
                newsletter pour ne pas le rater.
              </p>
            </div>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {episodes.map((ep, idx) => {
                const epNumber = String(episodes.length - idx).padStart(2, "0");
                const cover = idx % 2 === 0 ? COVER_BLUE_YELLOW : COVER_SMARTPHONE;
                return (
                  <li key={ep.slug}>
                    <article className="ic-edcard h-full">
                      <div className="ic-edcard-media">
                        <img
                          src={cover}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="ic-edcard-foot">
                        <span>EP {epNumber}</span>
                        <span>{formatDateMono(ep.date)}</span>
                      </div>
                      <div
                        className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-4"
                        style={{ borderTop: "1px solid var(--ink-700)" }}
                      >
                        <h3
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "20px",
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            color: "var(--ink-700)",
                          }}
                        >
                          {ep.meta.title}
                        </h3>
                        <p
                          className="flex-1 text-[14px]"
                          style={{
                            fontFamily: "var(--font-display)",
                            color: "var(--fg-muted)",
                            lineHeight: 1.55,
                          }}
                        >
                          {ep.meta.summary}
                        </p>
                        <EpisodePlayer src={ep.audioUrl} />
                        <p
                          className="text-[10px]"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "var(--fg-subtle)",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                          }}
                        >
                          Coaching IA · pas un conseil personnalisé
                        </p>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Row 5 — rose prose block with editorial drop-cap (echoes homepage hero). */}
      <section className="ic-block-rose px-6 py-20 sm:px-8">
        <div className="mx-auto" style={{ maxWidth: "720px" }}>
          <span className="ic-eyebrow-mono">Comment on choisit la vidéo</span>
          <h3
            className="mt-5 mb-6"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "var(--ink-700)",
              textTransform: "uppercase",
            }}
          >
            Une vidéo qui te parle, pas une qui buzz.
          </h3>
          <p
            className="ic-dropcap"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "17px",
              lineHeight: 1.65,
              color: "var(--ink-700)",
            }}
          >
            Chaque dimanche, tu envoies une vidéo YouTube — tutoriel finance,
            interview de gérant, pamphlet contre le PER, peu importe. On la
            regarde, on retient une seule loi, on la décompose. Pas de citation
            d&apos;auteur, pas de slogan, pas de leçon. Coach pose les
            questions, Investisseur s&apos;impatiente. À la fin, tu sais quoi
            cliquer dans ton espace courtier cette semaine.
          </p>
          <p
            className="mt-6 text-[15px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.65,
            }}
          >
            Pas de compétition avec les podcasts d&apos;experts. C&apos;est ton
            podcast — on prend ta vidéo, on chiffre tes choix.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
