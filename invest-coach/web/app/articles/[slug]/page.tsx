import Link from "next/link";
import { notFound } from "next/navigation";

import { Nav } from "@/components/nav";
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
        '<code class="rounded bg-slate-100 px-1 py-0.5 text-sm">$1</code>',
      )
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-blue-600 underline">$1</a>',
      );

  const flushList = () => {
    if (listBuffer.length === 0) return;
    out.push(
      <ul key={`ul-${out.length}`} className="my-4 list-disc space-y-2 pl-6">
        {listBuffer.map((item, i) => (
          <li
            key={i}
            className="text-slate-700"
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
          className="mt-8 text-xl font-semibold text-slate-900"
        >
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("### ")) {
      flushList();
      out.push(
        <h3
          key={`h3-${out.length}`}
          className="mt-6 text-base font-semibold text-slate-900"
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
          className="my-3 leading-relaxed text-slate-700"
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
    <main className="min-h-screen bg-slate-50">
      <Nav active="/articles" />

      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/articles"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Tous les guides
        </Link>

        <article className="mt-6">
          <h1 className="text-3xl font-bold text-slate-900">{article.title}</h1>
          <p className="mt-3 text-lg text-slate-600">{article.teaser}</p>
          <p className="mt-4 text-xs text-slate-400">
            {article.readMinutes} min de lecture · Mis à jour le{" "}
            {formatDate(article.updated)}
          </p>

          <div className="mt-8 border-t border-slate-200 pt-6">
            {renderMarkdown(article.body)}
          </div>
        </article>

        <section className="mt-10 rounded-xl border border-blue-100 bg-blue-50 p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Un guide par semaine dans ta boîte mail
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Pas de spam, pas de pub déguisée. Tu peux te désabonner en un clic.
          </p>
          <div className="mt-4">
            <SubscribeForm variant="compact" source={`article:${slug}`} />
          </div>
        </section>

        {others.length > 0 ? (
          <section className="mt-10">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              À lire ensuite
            </h3>
            <ul className="mt-4 space-y-3">
              {others.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/articles/${a.slug}`}
                    className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-300"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium text-slate-900">
                        {a.title}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {a.readMinutes} min
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{a.teaser}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-12 text-xs text-slate-400">
          Contenu éducatif. Rien de ce qui est écrit ici ne constitue un
          conseil en investissement personnalisé.
        </p>
      </div>
    </main>
  );
}
