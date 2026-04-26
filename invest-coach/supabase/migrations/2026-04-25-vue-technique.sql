-- Vue Technique — per-company technical-analysis pages, synthesized from
-- @great_martis (and later, additional analysts) by Gemini Flash.
--
-- One row per (company, week_start). Re-running the synthesis cron in the
-- same week upserts the row instead of creating duplicates.
--
-- Fed by:    /api/cron/synthesize-views (weekly Sunday night)
-- Read by:   /charts and /charts/[symbol]

CREATE TABLE IF NOT EXISTS vue_technique (
    id              BIGSERIAL    PRIMARY KEY,
    company_id      BIGINT       NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    week_start      DATE         NOT NULL,         -- ISO week's Monday
    body_md         TEXT         NOT NULL,         -- editorial synthesis, French, Capucine voice
    key_levels      JSONB        NOT NULL DEFAULT '[]'::jsonb,  -- [{label, value, type:"support"|"resistance"|"target"}]
    source_tweet_ids TEXT[]      NOT NULL DEFAULT '{}',         -- tweet ids cited in body_md
    tweet_count     INT          NOT NULL DEFAULT 0,            -- how many @great_martis tweets fed the synthesis
    model           TEXT         NOT NULL,                       -- e.g. "gemini-2.5-flash"
    generated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (company_id, week_start)
);

CREATE INDEX IF NOT EXISTS vue_technique_week_idx
    ON vue_technique (week_start DESC);

CREATE INDEX IF NOT EXISTS vue_technique_company_idx
    ON vue_technique (company_id, week_start DESC);

ALTER TABLE vue_technique ENABLE ROW LEVEL SECURITY;

-- Public read (matches the tweets / companies / cards pattern).
DROP POLICY IF EXISTS "vue_technique_read_anon" ON vue_technique;
CREATE POLICY "vue_technique_read_anon"
    ON vue_technique FOR SELECT
    TO anon
    USING (true);

-- Authenticated users read it too (no per-user filtering — content is public).
DROP POLICY IF EXISTS "vue_technique_read_auth" ON vue_technique;
CREATE POLICY "vue_technique_read_auth"
    ON vue_technique FOR SELECT
    TO authenticated
    USING (true);
