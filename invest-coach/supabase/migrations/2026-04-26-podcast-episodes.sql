-- Podcast episodes generated from YouTube videos via Gemini.
-- Displayed on the coaching tab immediately on login — no user action needed.

CREATE TABLE IF NOT EXISTS podcast_episodes (
    id          SERIAL      PRIMARY KEY,
    youtube_url TEXT        NOT NULL,
    title       TEXT        NOT NULL,
    summary     TEXT        NOT NULL,
    script      JSONB       NOT NULL,   -- [{speaker: "Coach"|"Investisseur", text: string}]
    published   BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS podcast_episodes_created_idx
    ON podcast_episodes (created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS podcast_episodes_url_idx
    ON podcast_episodes (youtube_url);

ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read published episodes
CREATE POLICY "auth_read_podcast_episodes"
    ON podcast_episodes FOR SELECT
    TO authenticated
    USING (published = true);

-- Service role can insert/update (used by cron)
-- Service role bypasses RLS by design — no policy needed for it.
