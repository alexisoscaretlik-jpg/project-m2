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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
        '<a href="$2" class="text-primary underline">$1</a>',
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
          color: "var(--fg)",
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
          color: "var(--fg)",
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
          <div key={`mid-${out.length}`} className="my-10">
            {midSlot}
          </div>,
        );
        midInjected = true;
      }
      out.push(
        <h2
          key={`h2-${out.length}`}
          className="mt-12 mb-4 text-[30px] font-bold"
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.025em",
            color: "var(--ink-700)",
            lineHeight: 1.2,
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
      // Blank line ends paragraph & list
      flushAll();
    } else if (listBuffer.length > 0 && paraBuffer.length === 0) {
      // Soft-wrap continuation of the last list item (no blank line, not "- ")
      listBuffer[listBuffer.length - 1] += " " + line;
    } else {
      // Accumulate consecutive non-empty lines into a single paragraph
      flushList();
      paraBuffer.push(line);
    }
  }
  flushAll();
  // If article was too short to hit the trigger, append the CTA at the end
  if (midSlot && !midInjected) {
    out.push(
      <div key={`mid-${out.length}`} className="my-10">
        {midSlot}
      </div>,
    );
  }
  return out;
}

function MidArticleCTA({ slug }: { slug: string }) {
  return (
    <div
      className="ic-card-pastel-lavender"
      style={{
        borderRadius: "var(--r-2xl)",
        padding: "28px",
        border: "1px solid rgba(124,91,250,0.12)",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex-1">
          <div
            className="text-[11px] font-semibold uppercase"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--lavender-700)",
              letterSpacing: "0.12em",
            }}
          >
            Newsletter
          </div>
          <p
            className="mt-1 text-[16px] font-semibold"
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
    </div>
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

  const others = ARTICLES.filter((a) => a.slug !== slug).slice(0, 3);

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/articles" />

      <div className="mx-auto max-w-[720px] px-6 py-12">
        <Link
          href="/articles"
          className="inline-block text-[13px] font-medium"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--lavender-600)",
          }}
        >
          ← Tous les guides
        </Link>

        <article
          className="mt-6 pb-8"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="ic-eyebrow">
            Guide · {article.readMinutes} min de lecture
          </div>
          <h1
            className="mt-3 text-[44px] font-bold"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "var(--ink-700)",
            }}
          >
            {article.title}
          </h1>
          <p
            className="mt-5 text-[20px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            {article.teaser}
          </p>
          <p
            className="mt-6 text-[12px]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--fg-subtle)",
              letterSpacing: "0.04em",
            }}
          >
            Mis à jour le {formatDate(article.updated)}
          </p>
        </article>

        <div className="mt-10 reader-body">
          {renderMarkdown(
            article.body,
            <MidArticleCTA slug={slug} />,
          )}
        </div>

        <section
          className="mt-14 ic-card-pastel-lavender"
          style={{
            borderRadius: "var(--r-2xl)",
            padding: "32px 28px",
          }}
        >
          <div
            className="text-[12px] font-semibold uppercase"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--lavender-700)",
              letterSpacing: "0.12em",
            }}
          >
            La lettre du dimanche
          </div>
          <h3
            className="mt-2 text-[22px] font-bold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--ink-700)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Reçois un guide comme celui-ci, chaque dimanche.
          </h3>
          <p
            className="mt-2 text-[15px]"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--fg-muted)",
              lineHeight: 1.55,
            }}
          >
            Pas de spam, pas de pub déguisée. Désabonnement en un clic.
          </p>
          <div className="mt-5">
            <SubscribeForm variant="hero" source={`article-bottom:${slug}`} />
          </div>
        </section>

        {others.length > 0 ? (
          <section className="mt-12">
            <div className="cap-eyebrow">À lire ensuite</div>
            <ul className="mt-4 space-y-3">
              {others.map((a) => (
                <li key={a.slug}>
                  <Link href={`/articles/${a.slug}`} className="block">
                    <article className="cap-card">
                      <div className="flex items-baseline justify-between gap-3">
                        <span
                          className="text-[18px] font-medium"
                          style={{
                            fontFamily: "var(--font-display)",
                            color: "var(--fg)",
                          }}
                        >
                          {a.title}
                        </span>
                        <span
                          className="shrink-0 text-[11px]"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "var(--fg-subtle)",
                          }}
                        >
                          {a.readMinutes} min
                        </span>
                      </div>
                      <p
                        className="mt-1.5 text-[14px]"
                        style={{
                          fontFamily: "var(--font-serif)",
                          color: "var(--fg-muted)",
                          lineHeight: 1.5,
                        }}
                      >
                        {a.teaser}
                      </p>
                    </article>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p
          className="mt-12 text-[12px] italic"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--fg-subtle)",
          }}
        >
          Contenu éducatif. Rien de ce qui est écrit ici ne constitue un conseil
          en investissement personnalisé.
        </p>
      </div>
      <Footer />
    </main>
  );
}
