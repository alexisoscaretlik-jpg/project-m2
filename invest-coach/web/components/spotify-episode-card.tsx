import { SPOTIFY_EPISODES } from "@/lib/podcast/spotify-episodes";

// Embed Spotify episodes on the site. Renders nothing until the user
// publishes an episode on Spotify for Creators and adds it to
// `lib/podcast/spotify-episodes.ts` — that's the single switch.
//
// Spotify's standard embed iframe: 152px tall, rounded, plays without
// requiring a Spotify account.

export function SpotifyEpisodeList() {
  if (SPOTIFY_EPISODES.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="mb-4">
        <span className="ic-eyebrow-mono">Sur Spotify</span>
      </div>
      <div className="space-y-3">
        {SPOTIFY_EPISODES.map((ep) => (
          <iframe
            key={ep.id}
            title={ep.title}
            src={`https://open.spotify.com/embed/episode/${ep.id}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            style={{ borderRadius: "12px", border: "1px solid var(--border)" }}
          />
        ))}
      </div>
    </section>
  );
}
