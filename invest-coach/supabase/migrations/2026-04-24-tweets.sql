-- X/Twitter tweet cache.
-- Fed by /api/cron/fetch-tweets (daily at 07:00 local via launchd).
-- Read by /api/cron/weekly-digest to build the "Ça se passe sur X" section.

CREATE TABLE IF NOT EXISTS tweets (
    id            TEXT        PRIMARY KEY,           -- X tweet id
    author_id     TEXT        NOT NULL,
    author_handle TEXT        NOT NULL,
    author_name   TEXT,
    text          TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL,
    url           TEXT        NOT NULL,
    metrics       JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- {like_count, retweet_count, reply_count, quote_count}
    entities      JSONB,                                     -- URLs / mentions / hashtags (for rich rendering later)
    fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tweets_created_at_idx     ON tweets (created_at DESC);
CREATE INDEX IF NOT EXISTS tweets_author_handle_idx  ON tweets (author_handle, created_at DESC);

ALTER TABLE tweets ENABLE ROW LEVEL SECURITY;

-- Read-only for the public anon key (matches companies/cards pattern).
-- Writes always go through the service-role key from the cron endpoint.
DROP POLICY IF EXISTS "tweets_read_anon" ON tweets;
CREATE POLICY "tweets_read_anon"
    ON tweets FOR SELECT
    TO anon
    USING (true);
