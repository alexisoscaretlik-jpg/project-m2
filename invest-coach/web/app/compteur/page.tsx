import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

import { Compteur } from "./compteur";

export const metadata = {
  title: "Le Compteur · Combien tu auras à la retraite — Invest Coach",
  description:
    "Trois sliders, un chiffre. Calcule combien ton épargne mensuelle peut devenir avec les intérêts composés sur 30 ans. Spoiler : tu vas être surpris.",
  openGraph: {
    title: "Le Compteur — combien tu auras vraiment à la retraite",
    description:
      "Bouge trois curseurs. Vois le chiffre. Pour les épargnants français.",
  },
};

type Search = { age?: string; m?: string; rate?: string };

export default async function CompteurPage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  const params = (await searchParams) ?? {};
  const initial = {
    age: clampInt(params.age, 18, 65, 28),
    monthly: clampInt(params.m, 0, 5000, 200),
    rate: clampFloat(params.rate, 0, 15, 7),
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/compteur" />
      <Compteur initial={initial} />
      <Footer />
    </main>
  );
}

function clampInt(raw: string | undefined, min: number, max: number, fallback: number): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function clampFloat(raw: string | undefined, min: number, max: number, fallback: number): number {
  if (!raw) return fallback;
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}
