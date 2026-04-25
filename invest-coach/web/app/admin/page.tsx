// Admin dashboard. Localhost-only — the Next.js server binds to 127.0.0.1
// (see invest-coach/web/launch.sh) so this page is unreachable from outside
// the Mac. No auth needed, intentionally.

import { headers } from "next/headers";

import { serviceClient } from "@/lib/supabase/service";
import { readServices } from "@/lib/admin/services";
import { recentTrades } from "@/lib/admin/trades";
import { alpacaSnapshot } from "@/lib/admin/alpaca";
import { readLogs } from "@/lib/admin/logs";
import { restartService, sendDigestNow, triggerFetchTweetsNow } from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── small helpers ───────────────────────────────────────────────────────────
function fmtEUR(n: number | string | undefined): string {
  if (n === undefined) return "—";
  const num = typeof n === "string" ? Number.parseFloat(n) : n;
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const delta = Date.now() - d.getTime();
  const min = Math.round(delta / 60_000);
  if (min < 1)      return "just now";
  if (min < 60)    return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24)     return `${hr} h ago`;
  const day = Math.round(hr / 24);
  return `${day} d ago`;
}

function StatusPill({ healthy, label }: { healthy: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        healthy
          ? "bg-[color:var(--forest-50)]0/15 text-[color:var(--forest-300)]"
          : "bg-[color:var(--terracotta-50)]0/15 text-[color:var(--terracotta-300)]"
      }`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${healthy ? "bg-[color:var(--forest-400)]" : "bg-[color:var(--terracotta-400)]"}`} />
      {label}
    </span>
  );
}

// ── data gathering (parallel) ───────────────────────────────────────────────
async function loadAll() {
  const sb = serviceClient();

  const [services, trades, alpaca, logs, subscribersRes, cardsRes, tweetsRes, latestTweetRes] =
    await Promise.all([
      readServices(),
      Promise.resolve(recentTrades(8)),
      alpacaSnapshot(),
      Promise.resolve(readLogs()),
      sb.from("newsletter_subscribers").select("email", { count: "exact", head: true }).eq("unsubscribed", false),
      sb.from("cards").select("id", { count: "exact", head: true }).gte("published_at", new Date(Date.now() - 7 * 86400_000).toISOString()),
      sb.from("tweets").select("id", { count: "exact", head: true }),
      sb.from("tweets").select("text, created_at, author_handle, url, metrics").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

  return {
    services,
    trades,
    alpaca,
    logs,
    subscribers: subscribersRes.count ?? 0,
    cardsLast7d: cardsRes.count ?? 0,
    tweetsTotal: tweetsRes.count ?? 0,
    latestTweet: latestTweetRes.data as
      | { text: string; created_at: string; author_handle: string; url: string; metrics: Record<string, number> | null }
      | null,
  };
}

// ── page ────────────────────────────────────────────────────────────────────
export default async function AdminPage() {
  // Block access from non-loopback sources as belt-and-suspenders,
  // even though launch.sh binds to localhost.
  const h = await headers();
  const forwarded = h.get("x-forwarded-for") ?? "";
  if (forwarded && !forwarded.split(",").some((ip) => ip.trim().startsWith("127.") || ip.trim() === "::1")) {
    return <main className="p-8 text-[color:var(--terracotta-400)]">Admin is localhost-only.</main>;
  }

  const data = await loadAll();

  return (
    <main className="min-h-screen bg-[color:var(--ink-800)] text-[color:var(--paper-200)] font-sans">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-10 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invest Coach · Admin</h1>
            <p className="text-sm text-muted-foreground">Localhost control panel · {new Date().toLocaleString("fr-FR")}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin/notes"
              className="rounded-md border border-[color:var(--ink-500)] px-3 py-1 text-xs text-[color:var(--paper-200)] hover:bg-[color:var(--ink-600)]"
            >
              Private notes →
            </a>
            <form action={async () => { "use server"; const { revalidatePath } = await import("next/cache"); revalidatePath("/admin"); }}>
              <button className="rounded-md border border-[color:var(--ink-500)] px-3 py-1 text-xs text-[color:var(--paper-200)] hover:bg-[color:var(--ink-600)]">
                ↻ Refresh
              </button>
            </form>
          </div>
        </header>

        {/* SERVICES ──────────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Services</h2>
          <div className="overflow-hidden rounded-lg border border-[color:var(--ink-500)] bg-foreground/50">
            <table className="w-full text-sm">
              <thead className="bg-foreground text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Service</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">PID</th>
                  <th className="px-4 py-2 text-left font-medium">Summary</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.services.map((s) => (
                  <tr key={s.label}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.display}</div>
                      <div className="text-xs text-muted-foreground font-mono">{s.label}</div>
                    </td>
                    <td className="px-4 py-3">
                      {s.kind === "keepalive" ? (
                        <StatusPill healthy={s.healthy} label={s.healthy ? "running" : "stopped"} />
                      ) : (
                        <StatusPill healthy={s.healthy} label="scheduled" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{s.pid ?? "—"}</td>
                    <td className="px-4 py-3 text-[color:var(--paper-200)]">{s.summary}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={restartService.bind(null, s.label)} className="inline">
                        <button className="rounded-md border border-[color:var(--ink-500)] px-2 py-1 text-xs text-[color:var(--paper-200)] hover:bg-[color:var(--ink-600)]" title="unload + load">
                          Restart
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mb-10 grid gap-6 md:grid-cols-2">
          {/* TRADER ──────────────────────────────────────────────── */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Trading · Alpaca {data.alpaca.paper ? "Paper" : "LIVE"}</h2>
            <div className="rounded-lg border border-[color:var(--ink-500)] bg-foreground/50 p-4">
              {data.alpaca.configured && data.alpaca.account ? (
                <>
                  <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground">Equity</div>
                      <div className="font-mono text-lg">${fmtEUR(data.alpaca.account.equity)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Cash</div>
                      <div className="font-mono text-lg">${fmtEUR(data.alpaca.account.cash)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Positions</div>
                      <div className="font-mono text-lg">{data.alpaca.positions.length}</div>
                    </div>
                  </div>
                  <div className="mb-2 text-xs text-muted-foreground">Account {data.alpaca.account.account_number} · {data.alpaca.account.status}</div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Alpaca keys not readable from ~/Projects/trading-agent-v2/.env</div>
              )}

              <div className="mt-4">
                <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Last trades</div>
                {data.trades.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No trades yet.</div>
                ) : (
                  <ul className="space-y-1 font-mono text-xs">
                    {data.trades.map((t, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{t.timestamp.slice(0, 19).replace("T", " ")}</span>
                        <span className="text-[color:var(--paper-50)]">{t.action} {t.shares} {t.ticker}</span>
                        <span className="text-muted-foreground">{t.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* NEWSLETTER ──────────────────────────────────────────── */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Newsletter</h2>
            <div className="space-y-4 rounded-lg border border-[color:var(--ink-500)] bg-foreground/50 p-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">Subscribers</div>
                  <div className="font-mono text-lg">{data.subscribers}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Cards (7d)</div>
                  <div className="font-mono text-lg">{data.cardsLast7d}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={sendDigestNow}>
                  <button className="rounded-md bg-primary/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary">
                    Send digest now
                  </button>
                </form>
                <a href="/api/cron/weekly-digest?preview=1" target="_blank" className="rounded-md border border-[color:var(--ink-500)] px-3 py-1.5 text-xs text-[color:var(--paper-200)] hover:bg-[color:var(--ink-600)]">
                  Preview digest (no send)
                </a>
              </div>
              <div className="text-xs text-muted-foreground">
                Sender: <span className="font-mono text-muted-foreground">{process.env.EMAIL_FROM || "not set"}</span>
              </div>
            </div>
          </section>
        </div>

        {/* TWITTER ──────────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">X / Twitter</h2>
          <div className="space-y-4 rounded-lg border border-[color:var(--ink-500)] bg-foreground/50 p-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-muted-foreground">Tweets cached</div>
                <div className="font-mono text-lg">{data.tweetsTotal}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Handle</div>
                <div className="font-mono text-[color:var(--paper-200)]">@{process.env.TWITTER_CREATOR_HANDLE || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Latest tweet</div>
                <div className="text-[color:var(--paper-200)]">{fmtRelative(data.latestTweet?.created_at)}</div>
              </div>
              <form action={triggerFetchTweetsNow} className="ml-auto">
                <button className="rounded-md border border-[color:var(--ink-500)] px-3 py-1.5 text-xs text-[color:var(--paper-200)] hover:bg-[color:var(--ink-600)]">
                  Fetch now
                </button>
              </form>
            </div>
            {data.latestTweet ? (
              <a
                href={data.latestTweet.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-[color:var(--ink-500)] bg-[color:var(--ink-800)]/60 p-3 text-sm text-[color:var(--paper-200)] hover:bg-foreground"
              >
                <div className="mb-1 text-xs text-muted-foreground">
                  @{data.latestTweet.author_handle} · {new Date(data.latestTweet.created_at).toLocaleString("fr-FR")}
                </div>
                <div className="whitespace-pre-line">{data.latestTweet.text}</div>
              </a>
            ) : null}
          </div>
        </section>

        {/* LOGS ──────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent logs</h2>
          <div className="space-y-4">
            {data.logs.map((log) => (
              <div key={log.path} className="rounded-lg border border-[color:var(--ink-500)] bg-foreground/50">
                <div className="flex items-center justify-between border-b border-[color:var(--ink-500)] px-4 py-2 text-xs">
                  <span className="font-medium text-[color:var(--paper-200)]">{log.label}</span>
                  <span className="text-muted-foreground">
                    {log.exists ? `${(log.bytes / 1024).toFixed(1)} KB · ${fmtRelative(log.mtime)}` : "missing"}
                  </span>
                </div>
                <pre className="max-h-56 overflow-auto px-4 py-2 text-xs text-muted-foreground">
                  {log.lastLines.length ? log.lastLines.join("\n") : "(empty)"}
                </pre>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-[color:var(--ink-500)] pt-6 text-xs text-muted-foreground">
          <p>
            This page is only reachable from <span className="font-mono">http://localhost:3000/admin</span>.
            It reads from the filesystem, Supabase, and Alpaca paper API.
            Restart buttons call <span className="font-mono">launchctl</span> as your user.
          </p>
        </footer>
      </div>
    </main>
  );
}
