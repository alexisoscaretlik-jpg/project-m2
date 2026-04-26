-- Chart analysis pivot.
--
-- The old vue_technique table was per-company-per-week. The new model is
-- per-tweet-per-asset: every chart-analysis tweet from @great_martis becomes
-- one or more rows here (one per asset he charted), categorized by class.
--
-- Pipeline:
--   tweets → Gemini Flash extracts (asset, class, levels, direction, tv_symbol)
--          → Claude API writes the Capucine-voiced editorial that preserves
--            the analyst's metaphors
--          → upsert into chart_analysis on (tweet_id, asset_slug)
--
-- Surfaces:
--   /charts            — categorized index, grouped by asset_class
--   /charts/[slug]     — latest analysis for that asset, with TV embed
--                         tuned to the same symbol/interval/studies

CREATE TABLE IF NOT EXISTS chart_analysis (
    id              BIGSERIAL    PRIMARY KEY,
    tweet_id        TEXT         NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
    asset_slug      TEXT         NOT NULL,        -- url-safe, e.g. "sox", "intel", "btc-usd"
    asset_name      TEXT         NOT NULL,        -- display, e.g. "Indice Semi-conducteurs (SOX)"
    asset_class     TEXT         NOT NULL,        -- one of: indice, action, devise, matiere, crypto, etf, obligation, fund, autre
    tv_symbol       TEXT         NOT NULL,        -- TradingView symbol, e.g. "TVC:SOX"
    tv_interval     TEXT         NOT NULL DEFAULT 'D',  -- '1' '5' '15' '30' '60' '240' 'D' 'W' 'M'
    tv_studies      JSONB        NOT NULL DEFAULT '["MASimple@tv-basicstudies","RSI@tv-basicstudies"]'::jsonb,
    direction       TEXT         NOT NULL,        -- bullish | bearish | neutral
    key_quote       TEXT         NOT NULL,        -- 1-2 sentence pull quote (preserves analyst voice)
    body_md         TEXT         NOT NULL,        -- Capucine-voiced editorial, French, ~150-250 words
    key_levels      JSONB        NOT NULL DEFAULT '[]'::jsonb,
    model           TEXT         NOT NULL,        -- e.g. "gemini+claude"
    tweet_created_at TIMESTAMPTZ NOT NULL,        -- denormalized for sorting without join
    generated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (tweet_id, asset_slug)
);

CREATE INDEX IF NOT EXISTS chart_analysis_class_idx
    ON chart_analysis (asset_class, tweet_created_at DESC);
CREATE INDEX IF NOT EXISTS chart_analysis_slug_idx
    ON chart_analysis (asset_slug, tweet_created_at DESC);
CREATE INDEX IF NOT EXISTS chart_analysis_recent_idx
    ON chart_analysis (tweet_created_at DESC);

ALTER TABLE chart_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chart_analysis_read_anon" ON chart_analysis;
CREATE POLICY "chart_analysis_read_anon"
    ON chart_analysis FOR SELECT
    TO anon
    USING (true);

DROP POLICY IF EXISTS "chart_analysis_read_auth" ON chart_analysis;
CREATE POLICY "chart_analysis_read_auth"
    ON chart_analysis FOR SELECT
    TO authenticated
    USING (true);
