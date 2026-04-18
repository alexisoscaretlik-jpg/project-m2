import Link from "next/link";

import { Nav } from "@/components/nav";
import { ARTICLES } from "./articles";

export const metadata = {
  title: "Articles — Invest Coach",
  description:
    "Guides pratiques pour investir en France : PEA, assurance-vie, fiscalité, stratégie long terme.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ArticlesIndexPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Nav active="/articles" />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Guides</h1>
          <p className="mt-2 text-slate-600">
            Les bases, sans jargon. Chaque guide est pensé pour te faire gagner
            du temps — pas pour te vendre un produit.
          </p>
        </div>

        <ul className="space-y-4">
          {ARTICLES.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/articles/${a.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {a.title}
                  </h2>
                  <span className="shrink-0 text-xs text-slate-500">
                    {a.readMinutes} min
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{a.teaser}</p>
                <p className="mt-3 text-xs text-slate-400">
                  Mis à jour le {formatDate(a.updated)}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-xs text-slate-400">
          Invest Coach publie des contenus éducatifs. Rien de ce qui est écrit
          ici ne constitue un conseil en investissement personnalisé.
        </p>
      </div>
    </main>
  );
}
