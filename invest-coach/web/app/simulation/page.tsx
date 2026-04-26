import { Nav } from "@/components/nav";

import { SimForm } from "./sim-form";

export default function SimulationPage() {
  return (
    <main className="min-h-screen bg-muted">
      <Nav active="/simulation" />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">Simulateur</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Combien gagnes-tu vraiment selon l&apos;enveloppe ? Tous impôts
          compris. Change les curseurs, compare PEA, assurance-vie,
          compte-titres et PER.
        </p>
        <div className="mt-6">
          <SimForm />
        </div>
      </div>
    </main>
  );
}
