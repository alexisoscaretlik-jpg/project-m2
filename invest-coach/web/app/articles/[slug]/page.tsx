import Link from "next/link";
import { notFound } from "next/navigation";

import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SubscribeForm } from "@/app/newsletter/subscribe-form";
import { ARTICLES, findArticle } from "../articles";

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = findArticle(slug);
  if (!a) return { title: "Article introuvable — Invest Coach" };
  return {
    title: `${a.title} — Invest Coach`,
    description: a.teaser,
  };
}

// Default cover photo for the blog post template — pink/violet watercolor
// (Unsplash TzWRjbPVTxY, palette-C-friendly). Articles can override later.
const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1767321173860-52dea6b50337?auto=format&fit=crop&w=2000&q=85";

function formatDateMono(iso: string) {
  const d = new Date(iso);
  const months = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUI", "JUL", "AOÛ", "SEP", "OCT", "NOV", "DÉC"];
  return `${months[d.getMonth()]} ${d.getDate()} · ${d.getFullYear()}`;
}

function renderMarkdown(md: string, midSlot?: React.ReactNode) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let paraBuffer: string[] = [];
  let headingCount = 0;
  let midInjected = false;

  const inline = (s: string) =>
    s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(
        /`([^`]+)`/g,
        '<code class="rounded bg-muted px-1 py-0.5 text-sm">$1</code>',
      )
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="underline" style="color:var(--ink-700);text-underline-offset:3px">$1</a>',
      );

  const flushList = () => {
    if (listBuffer.length === 0) return;
    out.push(
      <ul
        key={`ul-${out.length}`}
        className="my-5 list-disc space-y-2 pl-6 text-[17px]"
        style={{
          fontFamily: "var(--font-display)",
          lineHeight: 1.6,
          color: "var(--ink-700)",
        }}
      >
        {listBuffer.map((item, i) => (
          <li
            key={i}
            dangerouslySetInnerHTML={{ __html: inline(item) }}
          />
        ))}
      </ul>,
    );
    listBuffer = [];
  };

  const flushPara = () => {
    if (paraBuffer.length === 0) return;
    const text = paraBuffer.join(" ");
    out.push(
      <p
        key={`p-${out.length}`}
        className="mb-5 text-[18px]"
        style={{
          fontFamily: "var(--font-display)",
          lineHeight: 1.65,
          color: "var(--ink-700)",
          textWrap: "pretty",
        }}
        dangerouslySetInnerHTML={{ __html: inline(text) }}
      />,
    );
    paraBuffer = [];
  };

  const flushAll = () => {
    flushList();
    flushPara();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flushAll();
      headingCount += 1;
      // Inject mid-article CTA after the 2nd top-level heading (~30% through)
      if (midSlot && !midInjected && headingCount === 3) {
        out.push(
          <div key={`mid-${out.length}`} className="my-12">
            {midSlot}
          </div>,
        );
        midInjected = true;
      }
      out.push(
        <h2
          key={`h2-${out.length}`}
          className="mt-14 mb-4"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px, 3.4vw, 36px)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "var(--ink-700)",
            lineHeight: 1.15,
            textTransform: "uppercase",
          }}
        >
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("### ")) {
      flushAll();
      out.push(
        <h3
          key={`h3-${out.length}`}
          className="mt-8 mb-2 text-[20px] font-semibold"
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.015em",
            color: "var(--ink-700)",
          }}
        >
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith("- ")) {
      flushPara();
      listBuffer.push(line.slice(2));
    } else if (line === "") {
      flushAll();
    } else if (listBuffer.length > 0 && paraBuffer.length === 0) {
      listBuffer[listBuffer.length - 1] += " " + line;
    } else {
      flushList();
      paraBuffer.push(line);
    }
  }
  flushAll();
  if (midSlot && !midInjected) {
    out.push(
      <div key={`mid-${out.length}`} className="my-12">
        {midSlot}
      </div>,
    );
  }
  return out;
}

function MidArticleCTA({ slug }: { slug: string }) {
  return (
    <aside
      className="ic-block-lilac"
      style={{
        border: "1px solid var(--ink-700)",
        padding: "28px",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex-1">
          <span className="ic-eyebrow-mono">Newsletter</span>
          <p
            className="mt-2 text-[16px] font-semibold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              lineHeight: 1.3,
              letterSpacing: "-0.015em",
            }}
          >
            Tu lis ça parce que ça compte. Ne rate pas le prochain.
          </p>
        </div>
        <div className="shrink-0 sm:max-w-[300px]">
          <SubscribeForm
            variant="compact"
            source={`article-mid:${slug}`}
            placeholder="ton@email.fr"
          />
        </div>
      </div>
    </aside>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) notFound();

  const others = ARTICLES.filter((a) => a.slug !== slug);
  const nextArticle = others[0] ?? null;

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/articles" />

      {/* Row 1 — rose block with back link, hairline, mega title. */}
      <section
        className="ic-block-rose px-6 pt-10 pb-12 sm:px-8 sm:pt-14 sm:pb-16"
        style={{ borderBottom: "1px solid var(--ink-700)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "1280px" }}>
          <Link
            href="/articles"
            className="ic-eyebrow-mono"
            style={{ textDecoration: "none" }}
          >
            Retour aux guides
          </Link>
          <div
            aria-hidden="true"
            className="mt-6 mb-8"
            style={{ borderTop: "1px solid var(--ink-700)" }}
          />
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 7.5vw, 120px)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 0.96,
              color: "var(--ink-700)",
              textTransform: "uppercase",
              textWrap: "balance",
            }}
          >
            {article.title}
          </h1>
          <p
            className="mt-6 max-w-[720px] text-[18px] sm:text-[20px]"
            style={{
              fontFamily: "var(--font-source-serif), Georgia, serif",
              fontStyle: "italic",
              color: "var(--ink-700)",
              lineHeight: 1.45,
            }}
          >
            {article.teaser}
          </p>
        </div>
      </section>

      {/* Row 2 — full-bleed cover photo. */}
      <div
        className="relative"
        style={{
          aspectRatio: "16 / 7",
          borderBottom: "1px solid var(--ink-700)",
          background: "var(--ink-700)",
        }}
      >
        <img
          src={DEFAULT_COVER}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ display: "block" }}
        />
      </div>

      {/* Row 3 — mono date row right-aligned + read time on the left. */}
      <div
        className="px-6 py-5 sm:px-8"
        style={{
          background: "var(--paper-0)",
          borderBottom: "1px solid var(--ink-700)",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between gap-4"
          style={{ maxWidth: "1280px" }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-700)",
            }}
          >
            {article.readMinutes} min de lecture
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--fg-muted)",
            }}
          >
            Mis à jour {formatDateMono(article.updated)}
          </span>
        </div>
      </div>

      {/* Row 4 — body container. */}
      <article className="mx-auto px-6 py-16 sm:px-8" style={{ maxWidth: "720px" }}>
        <div className="reader-body">
          {renderMarkdown(article.body, <MidArticleCTA slug={slug} />)}
        </div>
      </article>

      {/* Row 5 — bottom newsletter CTA in lilac block. */}
      <section
        className="ic-block-lilac px-6 py-16 sm:px-8"
        style={{
          borderTop: "1px solid var(--ink-700)",
          borderBottom: "1px solid var(--ink-700)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "720px" }}>
          <span className="ic-eyebrow-mono">La lettre du dimanche</span>
          <h3
            className="mt-4 mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3.4vw, 36px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              color: "var(--ink-700)",
              textTransform: "uppercase",
            }}
          >
            Reçois un guide comme celui-ci, chaque dimanche.
          </h3>
          <p
            className="mb-5 text-[15px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              lineHeight: 1.55,
            }}
          >
            Pas de spam, pas de pub déguisée. Désabonnement en un clic.
          </p>
          <SubscribeForm variant="hero" source={`article-bottom:${slug}`} />
        </div>
      </section>

      {/* Row 6 — bottom hairline + "next article" link, Innostart-style. */}
      {nextArticle ? (
        <section style={{ borderBottom: "1px solid var(--ink-700)" }}>
          <Link
            href={`/articles/${nextArticle.slug}`}
            className="block transition-colors hover:bg-[var(--paper-100)]"
          >
            <div
              className="mx-auto flex items-baseline justify-between gap-4 px-6 py-8 sm:px-8 sm:py-10"
              style={{ maxWidth: "1280px" }}
            >
              <div>
                <span className="ic-eyebrow-mono">Article suivant</span>
                <h4
                  className="mt-3"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(20px, 2.4vw, 28px)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--ink-700)",
                    textTransform: "uppercase",
                  }}
                >
                  {nextArticle.title}
                </h4>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--ink-700)",
                }}
                aria-hidden="true"
              >
                ↳
              </span>
            </div>
          </Link>
        </section>
      ) : null}

      {/* Other guides list — Innostart-flat 3-col. */}
      {others.length > 0 ? (
        <section className="px-6 py-16 sm:px-8" style={{ borderBottom: "1px solid var(--ink-700)" }}>
          <div className="mx-auto" style={{ maxWidth: "1280px" }}>
            <span className="ic-eyebrow-mono">Autres guides</span>
            <ul
              className="mt-8 grid gap-0 md:grid-cols-2 lg:grid-cols-3"
              style={{ border: "1px solid var(--ink-700)" }}
            >
              {others.slice(0, 6).map((a, idx) => {
                const col = idx % 3;
                return (
                  <li
                    key={a.slug}
                    style={{
                      borderRight:
                        col < 2 ? "1px solid var(--ink-700)" : "none",
                      borderBottom:
                        idx < others.slice(0, 6).length - (others.slice(0, 6).length % 3 || 3)
                          ? "1px solid var(--ink-700)"
                          : "none",
                    }}
                  >
                    <Link
                      href={`/articles/${a.slug}`}
                      className="block h-full transition-colors hover:bg-[var(--paper-100)]"
                    >
                      <article className="flex h-full flex-col gap-3 p-6">
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "var(--fg-muted)",
                          }}
                        >
                          {a.readMinutes} min · Guide
                        </span>
                        <h5
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "20px",
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            color: "var(--ink-700)",
                            textTransform: "uppercase",
                          }}
                        >
                          {a.title}
                        </h5>
                        <p
                          className="flex-1 text-[14px]"
                          style={{
                            fontFamily: "var(--font-source-serif), Georgia, serif",
                            fontStyle: "italic",
                            color: "var(--ink-700)",
                            lineHeight: 1.55,
                          }}
                        >
                          « {a.teaser} »
                        </p>
                      </article>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Disclaimer strip. */}
      <p className="ic-strip">
        Contenu éducatif · Pas un conseil en investissement personnalisé
      </p>

      <Footer />
    </main>
  );
}
