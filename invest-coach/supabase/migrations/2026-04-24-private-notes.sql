-- Private learning notes. Fed by /admin/notes on the m2 app.
-- Never exposed to anon reads. Only the server's service-role key touches
-- this table — RLS is ON and deliberately has no policies.

CREATE TABLE IF NOT EXISTS private_notes (
    id         SERIAL      PRIMARY KEY,
    source     TEXT,                                 -- free-text label: "meet-kevin-2026-04-24", etc.
    raw_input  TEXT        NOT NULL,
    polished   TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS private_notes_created_idx
    ON private_notes (created_at DESC);

ALTER TABLE private_notes ENABLE ROW LEVEL SECURITY;
-- No SELECT / INSERT policies for anon: the anon key CANNOT reach these rows.
-- The m2 admin page uses the service-role key (via serviceClient()), which
-- bypasses RLS by design. That's the correct and only access path.
