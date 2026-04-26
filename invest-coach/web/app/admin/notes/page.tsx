// Private learning notes — paste raw text (Discord transcript, article, your
// own notes), Gemini distills, result is stored in Supabase. Never sent to
// subscribers, never publicly readable.

import { headers } from "next/headers";

import { serviceClient } from "@/lib/supabase/service";
import { deleteNote, polishAndSave } from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type NoteRow = {
  id: number;
  source: string | null;
  raw_input: string;
  polished: string;
  created_at: string;
};

async function loadNotes(): Promise<NoteRow[]> {
  const sb = serviceClient();
  const { data } = await sb
    .from("private_notes")
    .select("id, source, raw_input, polished, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as NoteRow[];
}

export default async function NotesPage() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") ?? "";
  if (
    forwarded &&
    !forwarded.split(",").some((ip) => {
      const t = ip.trim();
      return t.startsWith("127.") || t === "::1";
    })
  ) {
    return <main className="p-8 text-[color:var(--terracotta-400)]">Admin is localhost-only.</main>;
  }

  const notes = await loadNotes();

  return (
    <main className="min-h-screen bg-[color:var(--ink-800)] text-[color:var(--paper-200)] font-sans">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Private notes</h1>
            <p className="text-sm text-muted-foreground">
              Your learning log. Paraphrased by Gemini. Never sent to subscribers, never publicly readable.
            </p>
          </div>
          <a href="/admin" className="text-xs text-muted-foreground hover:text-[color:var(--paper-200)]">
            ← back to admin
          </a>
        </header>

        {/* ── Paste form ─────────────────────────────────────────────── */}
        <section className="mb-10 rounded-lg border border-[color:var(--ink-500)] bg-foreground/50 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Paste raw text
          </h2>
          <form action={polishAndSave} className="space-y-3">
            <input
              name="source"
              placeholder="Source label — e.g. meet-kevin-discord-2026-04-24"
              className="w-full rounded-md border border-[color:var(--ink-500)] bg-[color:var(--ink-800)]/60 px-3 py-2 text-sm text-[color:var(--paper-200)] placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <textarea
              name="raw"
              required
              rows={12}
              placeholder="Paste the raw broadcast / article / transcript here. Gemini will distill it into TL;DR + key points + tickers + action items + open questions."
              className="w-full rounded-md border border-[color:var(--ink-500)] bg-[color:var(--ink-800)]/60 px-3 py-2 text-sm text-[color:var(--paper-200)] placeholder:text-muted-foreground font-mono focus:border-primary focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-accent0">
                Distill &amp; save
              </button>
              <span className="text-xs text-muted-foreground">
                Gemini typically takes 3-8 seconds. The page refreshes with your new note at the top.
              </span>
            </div>
          </form>
        </section>

        {/* ── List ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {notes.length} note{notes.length === 1 ? "" : "s"}
          </h2>
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet. Paste something above.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((n) => (
                <details
                  key={n.id}
                  className="rounded-lg border border-[color:var(--ink-500)] bg-foreground/50 p-4 text-sm open:pb-6"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-medium text-[color:var(--paper-200)] truncate">
                        {n.source || "Untitled note"}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </summary>

                  <div className="mt-4 whitespace-pre-line text-[13px] leading-relaxed text-[color:var(--paper-200)]">
                    {n.polished}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[color:var(--ink-500)] pt-3">
                    <form action={deleteNote.bind(null, n.id)}>
                      <button className="text-xs text-[color:var(--terracotta-400)] hover:text-[color:var(--terracotta-300)]">
                        Delete
                      </button>
                    </form>
                    <details className="ml-auto text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-[color:var(--paper-200)]">
                        Show raw input
                      </summary>
                      <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded bg-[color:var(--ink-800)] p-3 text-[11px] text-muted-foreground">
                        {n.raw_input}
                      </pre>
                    </details>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-12 border-t border-[color:var(--ink-500)] pt-6 text-xs text-muted-foreground">
          <p>
            Notes are stored in the <span className="font-mono">private_notes</span> Supabase table
            with RLS enabled and no policies — only the server's service-role key can read or write
            them. The weekly digest never touches this table.
          </p>
        </footer>
      </div>
    </main>
  );
}
