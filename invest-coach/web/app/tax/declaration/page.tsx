import { redirect } from "next/navigation";
import Link from "next/link";

import { Nav } from "@/components/nav";
import { DEV_USER_ID, IS_DEV } from "@/lib/devUser";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";

import { Wizard } from "./wizard";

type Answers = Record<string, string | number | boolean | null>;

export default async function DeclarationPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const userId = user?.id ?? (IS_DEV ? DEV_USER_ID : null);
  if (!userId) redirect("/login?next=/tax/declaration");
  const db = user ? sb : serviceClient();

  const { data } = await db
    .from("typeform_responses")
    .select("answers")
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const initial = (data?.answers ?? null) as Answers | null;

  return (
    <main className="min-h-screen bg-muted">
      <Nav active="/tax" />

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Déclaration Cerfa 2042
            </h1>
            <p className="text-xs text-muted-foreground">
              Un questionnaire guidé, une question à la fois. À la fin,
              vous pourrez télécharger votre déclaration pré-remplie.
            </p>
          </div>
          <Link
            href="/tax"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            ← Fiscalité
          </Link>
        </div>

        <Wizard initial={initial} />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Informations éducatives. Votre déclaration officielle reste
          sous votre responsabilité — vous la signez et la soumettez
          sur impots.gouv.fr.
        </p>
      </div>
    </main>
  );
}
