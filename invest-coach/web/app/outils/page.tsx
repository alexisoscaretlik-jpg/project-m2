import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { OutilsHub } from "./outils-hub";

export const metadata = {
  title: "Outils — Invest Coach",
  description:
    "Cinq outils pour piloter ton argent en français : fiscalité, simulateur d'enveloppes, watchlist coachée, analyse bancaire, vue technique. Une suite, une méthode, palette commune.",
};

export default function OutilsPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper-50)" }}>
      <Nav active="/outils" />
      <OutilsHub />
      <Footer />
    </main>
  );
}
