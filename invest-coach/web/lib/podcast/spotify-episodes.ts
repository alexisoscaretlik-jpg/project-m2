// Spotify for Creators publishes each episode at
// https://open.spotify.com/episode/<ID>. This list keeps the IDs we
// embed on the site. Append a new entry as each episode goes live on
// Spotify (after their ~24h review for the first one, near-instant
// after).
//
// The id is the path segment after `/episode/` in the share URL.
// The slug must match the Supabase Storage path for the same episode
// (`podcasts/babylon/<date>/<slug>.mp3`) so the two views can be
// reconciled later if needed.

export type SpotifyEpisode = {
  id: string;
  slug: string;
  title: string;
};

export const SPOTIFY_EPISODES: SpotifyEpisode[] = [
  // Add as Spotify approves each episode. Example shape:
  // {
  //   id: "5tD7kJxXyZabc123XyZ",
  //   slug: "trois-regles-d-argent-qui-changent-tout",
  //   title: "Trois règles d'argent qui changent tout",
  // },
];
