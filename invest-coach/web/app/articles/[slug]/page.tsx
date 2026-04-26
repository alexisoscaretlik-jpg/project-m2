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

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let listBuffer: string[] = [];

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
      <ul key={`ul-${out.length}`} className="my-4 list-disc space-y-2 pl-6">
        {listBuffer.map((item, i) => (
          <li
            key={i}
            className="text-foreground"
            dangerouslySetInnerHTML={{ __html: inline(item) }}
          />
        ))}
      </ul>,
    );
    listBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flushList();
      out.push(
        <h2
          key={`h2-${out.length}`}
          className="mt-10 mb-3 text-[28px] font-semibold"
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.01em",
            color: "var(--fg)",
          }}
        >
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("### ")) {
      flushList();
      out.push(
        <h3
          key={`h3-${out.length}`}
          className="mt-6 text-[20px] font-medium"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--fg)",
          }}
        >
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
        <p
          key={`p-${out.length}`}
          className="mb-5 text-[19px]"
          style={{
            fontFamily: "var(--font-serif)",
            lineHeight: 1.65,
            color: "var(--fg)",
            textWrap: "pretty",
          }}
          dangerouslySetInnerHTML={{ __html: inline(line) }}
        />,
      );
    }
  }
  flushList();
  return out;
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
            color: "var(--forest-600)",
          }}
        >
          ← Tous les guides
        </Link>

        <article
          className="mt-6 pb-8"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="cap-eyebrow">
            Guide · {article.readMinutes} min de lecture
          </div>
          <h1 className="cap-h1 mt-3 text-[46px] leading-[1.05]">
            {article.title}
          </h1>
          <p
            className="mt-4 text-[22px] italic"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--fg-muted)",
              lineHeight: 1.45,
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

        <div className="mt-8 reader-body">
          {renderMarkdown(article.body)}
        </div>

        <section
          className="cap-aside mt-12"
          style={{ background: "var(--paper-100)" }}
        >
          <div className="cap-eyebrow">La lettre du dimanche</div>
          <h3
            className="mt-2 text-[20px] font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
          >
            Un guide par semaine dans ta boîte mail
          </h3>
          <p
            className="mt-1 text-[15px]"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--fg-muted)",
              lineHeight: 1.55,
            }}
          >
            Pas de spam, pas de pub déguisée. Tu peux te désabonner en un clic.
          </p>
          <div className="mt-4">
            <SubscribeForm variant="compact" source={`article:${slug}`} />
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
