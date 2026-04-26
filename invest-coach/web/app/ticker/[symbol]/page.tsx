import Link from "next/link";
import { notFound } from "next/navigation";

import { Nav } from "@/components/nav";
import { TvChart } from "@/components/tv-chart";
import { supabase } from "@/lib/supabase";
import { toTvSymbol } from "@/lib/tradingview";

type Company = {
  id: number;
  ticker: string;
  name: string;
  country: string;
  exchange: string | null;
  cik: string | null;
};

type Card = {
  id: number;
  title: string;
  body_markdown: string;
  tone: string | null;
  published_at: string;
};

const toneStyles: Record<string, string> = {
  bullish: "bg-[color:var(--forest-100)] text-[color:var(--forest-700)] border-[color:var(--forest-200)]",
  cautious: "bg-[color:var(--warning-soft)] text-[color:var(--warning)] border-[color:var(--warning)]",
  red_flag: "bg-[color:var(--terracotta-100)] text-[color:var(--terracotta-700)] border-[color:var(--terracotta-200)]",
  educational: "bg-muted text-foreground border-border",
};

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    out.push(
      <ul key={`ul-${out.length}`} className="my-3 list-disc space-y-1 pl-6">
        {listBuffer.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: inline(item) }} />
        ))}
      </ul>,
    );
    listBuffer = [];
  };

  const inline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1 py-0.5 text-sm">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline">$1</a>');

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("### ")) {
      flushList();
      out.push(
        <h3 key={`h-${out.length}`} className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
    } else if (line === "") {
      flushList();
    } else {
      flushList();
      out.push(
        <p key={`p-${out.length}`} className="my-2" dangerouslySetInnerHTML={{ __html: inline(line) }} />,
      );
    }
  }
  flushList();
  return out;
}

export default async function TickerPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const ticker = decodeURIComponent(symbol).toUpperCase();

  const { data: company } = await supabase
    .from("companies")
    .select("id, ticker, name, country, exchange, cik")
    .eq("ticker", ticker)
    .single<Company>();

  if (!company) notFound();

  const { data: cards } = await supabase
    .from("cards")
    .select("id, title, body_markdown, tone, published_at")
    .eq("company_id", company.id)
    .order("published_at", { ascending: false })
    .limit(5);

  const latest = cards?.[0] ?? null;

  return (
    <main className="min-h-screen bg-muted">
      <Nav active="/" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-sm text-primary hover:underline">
            &larr; Feed
          </Link>
          <Link
            href="/companies"
            className="text-sm text-primary hover:underline"
          >
            All companies
          </Link>
        </div>
        <div className="mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="font-mono text-3xl font-bold text-foreground">
              {company.ticker}
            </h1>
            <span className="text-xl text-foreground">{company.name}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {company.country} · {company.exchange}
          </p>
        </div>

        <div className="mb-6">
          <TvChart symbol={toTvSymbol(company.ticker)} />
        </div>

        {latest ? (
          <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {latest.title}
              </h2>
              {latest.tone ? (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    toneStyles[latest.tone] ?? toneStyles.educational
                  }`}
                >
                  {latest.tone.replace("_", " ")}
                </span>
              ) : null}
            </div>
            <div className="text-foreground">
              {renderMarkdown(latest.body_markdown)}
            </div>
          </article>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            No cards yet for {company.ticker}.
            {!company.cik ? (
              <p className="mt-2 text-xs">
                Non-US ticker — EDGAR ingest not enabled.
              </p>
            ) : (
              <p className="mt-2 text-xs">
                Run the worker to generate one.
              </p>
            )}
          </div>
        )}

        {cards && cards.length > 1 ? (
          <section className="mt-8">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Previous cards
            </h3>
            <ul className="space-y-2">
              {cards.slice(1).map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-border bg-card p-3 text-sm"
                >
                  <span className="text-foreground">{c.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {new Date(c.published_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
