"use client";

import { useState, useTransition } from "react";

import { uploadAvis } from "./actions";

export function UploadForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await uploadAvis(fd);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="file"
        name="avis"
        accept="application/pdf"
        required
        className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-accent"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary disabled:opacity-50"
      >
        {pending ? "Analyzing with Claude…" : "Analyze my avis"}
      </button>
      {error ? <p className="text-sm text-[color:var(--terracotta-500)]">{error}</p> : null}
      <p className="text-xs text-muted-foreground">
        PDF stays private in Supabase Storage. We read it once with Claude
        Haiku and store the extracted figures.
      </p>
    </form>
  );
}
