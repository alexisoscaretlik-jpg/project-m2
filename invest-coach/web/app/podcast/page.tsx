import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { serviceClient } from "@/lib/supabase/service";
import { SPOTIFY_EPISODES } from "@/lib/podcast/spotify-episodes";

export const metadata = {
  title: "Argent · Podcast — Invest Coach",
  description:
    "Le podcast français qui transforme une vidéo YouTube en coaching personnel. Coach et Investisseur creusent une seule loi de l'argent par épisode.",
};

const BUCKET = "podcasts";

// Cover photos curated by Oscar (Unsplash, free commercial license).
// One per episode card — no repeats. Eight photos for up to eight cards.
const COVERS: string[] = [
  "https://images.unsplash.com/photo-1618331833071-ce81bd50d300?auto=format&fit=crop&w=1200&q=85", // abstract painting blue/yellow
  "https://images.unsplash.com/photo-1773332611514-238856b76198?auto=format&fit=crop&w=1200&q=85", // smartphone
  "https://images.unsplash.com/photo-1762760081003-28ae8d6adbbb?auto=format&fit=crop&w=1200&q=85", // balcony
  "https://images.unsplash.com/photo-1776693836271-3c25955c90de?auto=format&fit=crop&w=1200&q=85", // sailboat
  "https://images.unsplash.com/photo-1774618683913-b8262a72fa53?auto=format&fit=crop&w=1200&q=85", // staircase
  "https://images.unsplash.com/photo-1764831685497-3095f33bada2?auto=format&fit=crop&w=1200&q=85", // orange tunnel
  "https://images.unsplash.com/photo-1776066361430-dd62847db7c6?auto=format&fit=crop&w=1200&q=85", // autumn truck
  "https://images.unsplash.com/photo-1777033481363-96640776ae62?auto=format&fit=crop&w=1200&q=85", // orange/black fluid
];

// Hero painting (lilac × photo split right pane).
const HERO_PAINTING =
  "https://images.unsplash.com/photo-1618331833071-ce81bd50d300?auto=format&fit=crop&w=1600&q=85";

// Spotify show URL — the creator's show on Spotify. We use the first
// episode URL as a stand-in until a true show URL is available.
const SPOTIFY_SHOW_URL =
  SPOTIFY_EPISODES.length > 0
    ? `https://open.spotify.com/episode/${SPOTIFY_EPISODES[0].id}`
    : "https://open.spotify.com";

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

function formatDateMono(iso: string) {
  const d = new Date(iso);
  const months = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUI", "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC"];
  return `${months[d.getMonth()]} ${d.getDate()} · ${d.getFullYear()}`;
}

// Match a Supabase episode slug to its Spotify ID, if published.
function spotifyIdFor(slug: string): string | null {
  const hit = SPOTIFY_EPISODES.find((s) => s.slug === slug);
  return hit?.id ?? null;
}

// Mock episodes used as fallback when Supabase env isn't configured
// (dev preview). Mirrors the real schema so the layout fills in.
const MOCK_EPISODES: Episode[] = [
  {
    slug: "trois-regles-d-argent-qui-changent-tout",
    date: "2026-04-28",
    audioUrl: "",
    meta: {
      title: "Trois règles d'argent qui changent tout",
      summary:
        "Coach et Investisseur partent du moment où le RIB clignote rouge le 22 du mois pour démonter le piège de l'épargne sans méthode. Une seule action concrète à la fin pour reprendre la main sur ton revenu en 2026.",
      law: "Pay yourself first",
      character: { name: "Camille", age: 34, city: "Lyon", situation: "Salariée" },
    },
  },
  {
    slug: "le-vrai-levier-c-est-la-valeur",
    date: "2026-04-21",
    audioUrl: "",
    meta: {
      title: "Le vrai levier n'est pas d'épargner, c'est de monter en valeur",
      summary:
        "Pour un cadre français qui sent que son argent dort, l'épisode démonte le piège de la course à l'épargne sans valeur ajoutée. Camille et Thomas montent un plan 90 jours : avant de faire travailler ton argent, fais travailler ta valeur sur le marché.",
      law: "Skill compounding",
      character: { name: "Thomas", age: 38, city: "Paris", situation: "Cadre" },
    },
  },
  {
    slug: "arreter-de-disperser-chaque-euro",
    date: "2026-04-14",
    audioUrl: "",
    meta: {
      title: "Arrêter de disperser chaque euro",
      summary:
        "Thomas, marketing, coloc dans le 11e, a 4 200 € qui dorment sur son compte courant depuis deux ans. Camille lui montre que ces 4 200 € en valent déjà 3 700, et lui dépose trois règles à appliquer lundi matin.",
      law: "Cash is melting ice",
      character: { name: "Thomas", age: 29, city: "Paris", situation: "Marketing" },
    },
  },
];

export default async function PodcastIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{ theme?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const themeFilter = params.theme;
  const live = await listEpisodes();
  // Use real episodes if Supabase has data; otherwise fall back to
  // mock copy so the page is never empty during a prototype review.
  const sourceEpisodes = live.length > 0 ? live : MOCK_EPISODES;
  const episodes = themeFilter
    ? sourceEpisodes.filter((e) => (e.meta.theme ?? "money") === themeFilter)
    : sourceEpisodes;

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
              href={SPOTIFY_SHOW_URL}
              target="_blank"
              rel="noreferrer"
              className="ic-btn-block"
            >
              ↳ Écouter sur Spotify
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
            src={HERO_PAINTING}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ display: "block" }}
          />
        </div>
      </div>

      {/* Row 4 — episode cards (.ic-edcard grid) with Spotify embeds.
          Each card has a unique cover photo and an embedded Spotify
          player when an ID is available. */}
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
                const cover = COVERS[idx % COVERS.length];
                const sid = spotifyIdFor(ep.slug);
                const episodeUrl = sid
                  ? `https://open.spotify.com/episode/${sid}`
                  : SPOTIFY_SHOW_URL;
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
                            textTransform: "uppercase",
                          }}
                        >
                          {ep.meta.title}
                        </h3>
                        <p
                          className="flex-1 text-[14px]"
                          style={{
                            fontFamily: "var(--font-source-serif), Georgia, serif",
                            fontStyle: "italic",
                            color: "var(--ink-700)",
                            lineHeight: 1.55,
                          }}
                        >
                          « {ep.meta.summary} »
                        </p>
                        {sid ? (
                          <iframe
                            title={ep.meta.title}
                            src={`https://open.spotify.com/embed/episode/${sid}?utm_source=generator&theme=0`}
                            width="100%"
                            height="152"
                            frameBorder="0"
                            loading="lazy"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            style={{
                              borderRadius: "0",
                              border: "1px solid var(--ink-700)",
                              display: "block",
                            }}
                          />
                        ) : (
                          <a
                            href={episodeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ic-btn-block w-full"
                          >
                            ↳ Bientôt sur Spotify
                          </a>
                        )}
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
