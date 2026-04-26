"use client";

import { useState, useRef, useCallback } from "react";
import type { PodcastScript, DialogueLine } from "@/app/api/podcast/generate/route";

type TtsState = "idle" | "playing" | "paused";

export function CoachingPodcast() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [podcast, setPodcast] = useState<PodcastScript | null>(null);
  const [tts, setTts] = useState<TtsState>("idle");
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const cancelRef = useRef(false);

  async function generate() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setPodcast(null);
    setActiveIdx(-1);
    stopTts();

    try {
      const res = await fetch("/api/podcast/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Erreur inconnue.");
      } else {
        setPodcast(data as PodcastScript);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const stopTts = useCallback(() => {
    cancelRef.current = true;
    synth?.cancel();
    setTts("idle");
    setActiveIdx(-1);
  }, [synth]);

  function speakScript(lines: DialogueLine[]) {
    if (!synth) return;
    const s = synth;
    cancelRef.current = false;
    setTts("playing");

    function speakLine(idx: number) {
      if (idx >= lines.length || cancelRef.current) {
        setTts("idle");
        setActiveIdx(-1);
        return;
      }
      setActiveIdx(idx);
      const utt = new SpeechSynthesisUtterance(lines[idx].text);
      utt.lang = "fr-FR";
      utt.rate = 0.95;
      utt.pitch = lines[idx].speaker === "Coach" ? 0.9 : 1.15;
      utt.onend = () => speakLine(idx + 1);
      utt.onerror = () => speakLine(idx + 1);
      s.speak(utt);
    }

    speakLine(0);
  }

  function toggleTts() {
    if (!podcast || !synth) return;
    if (tts === "playing") {
      synth.pause();
      setTts("paused");
    } else if (tts === "paused") {
      synth.resume();
      setTts("playing");
    } else {
      speakScript(podcast.script);
    }
  }

  return (
    <section
      className="mb-12 rounded-2xl p-6"
      style={{
        background: "var(--paper-100)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="cap-eyebrow mb-1">Podcast · IA</div>
      <h2
        className="mb-1 text-[22px] font-semibold leading-snug"
        style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
      >
        Transforme une vidéo en coaching
      </h2>
      <p
        className="mb-5 text-[14px]"
        style={{ fontFamily: "var(--font-serif)", color: "var(--fg-muted)" }}
      >
        Colle l&apos;URL d&apos;une vidéo YouTube sur l&apos;investissement ou la gestion de patrimoine.
        On génère un dialogue en français entre un coach et un investisseur — comme un podcast privé.
      </p>

      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
          placeholder="https://www.youtube.com/watch?v=..."
          className="min-w-0 flex-1 rounded-lg border px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-[var(--forest-600)]"
          style={{
            fontFamily: "var(--font-mono)",
            background: "var(--paper-50)",
            borderColor: "var(--border)",
            color: "var(--fg)",
          }}
          disabled={loading}
        />
        <button
          onClick={generate}
          disabled={loading || !url.trim()}
          className="shrink-0 rounded-lg px-4 py-2.5 text-[14px] font-medium transition-colors disabled:opacity-50"
          style={{
            fontFamily: "var(--font-display)",
            background: "var(--forest-600)",
            color: "var(--paper-50)",
          }}
        >
          {loading ? "Génération…" : "Générer"}
        </button>
      </div>

      {error && (
        <p
          className="mt-3 text-[13px]"
          style={{ color: "var(--terracotta-500)", fontFamily: "var(--font-mono)" }}
        >
          {error}
        </p>
      )}

      {loading && (
        <div className="mt-6 flex items-center gap-3">
          <Spinner />
          <p
            className="text-[13px] italic"
            style={{ fontFamily: "var(--font-serif)", color: "var(--fg-muted)" }}
          >
            Gemini regarde la vidéo et écrit le script… (60-90 secondes)
          </p>
        </div>
      )}

      {podcast && (
        <div className="mt-6">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h3
              className="text-[17px] font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
            >
              {podcast.title}
            </h3>
            <button
              onClick={tts === "idle" ? toggleTts : stopTts}
              className="shrink-0 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{
                fontFamily: "var(--font-display)",
                background: tts !== "idle" ? "var(--terracotta-500)" : "var(--forest-600)",
                color: "var(--paper-50)",
              }}
            >
              {tts === "playing" ? "⏸ Pause" : tts === "paused" ? "▶ Reprendre" : "▶ Écouter"}
            </button>
          </div>
          <p
            className="mb-5 text-[13px] italic"
            style={{ fontFamily: "var(--font-serif)", color: "var(--fg-muted)" }}
          >
            {podcast.summary}
          </p>

          <div className="space-y-3">
            {podcast.script.map((line, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl p-3.5 transition-colors"
                style={{
                  background:
                    activeIdx === i
                      ? line.speaker === "Coach"
                        ? "color-mix(in srgb, var(--forest-600) 12%, transparent)"
                        : "color-mix(in srgb, var(--terracotta-500) 10%, transparent)"
                      : "transparent",
                  border: "1px solid",
                  borderColor:
                    activeIdx === i ? "var(--border-strong)" : "transparent",
                }}
              >
                <span
                  className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.04em",
                    background:
                      line.speaker === "Coach"
                        ? "color-mix(in srgb, var(--forest-600) 15%, transparent)"
                        : "color-mix(in srgb, var(--terracotta-500) 12%, transparent)",
                    color:
                      line.speaker === "Coach"
                        ? "var(--forest-600)"
                        : "var(--terracotta-500)",
                    height: "fit-content",
                    marginTop: "3px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {line.speaker}
                </span>
                <p
                  className="text-[15px] leading-relaxed"
                  style={{ fontFamily: "var(--font-serif)", color: "var(--fg)" }}
                >
                  {line.text}
                </p>
              </div>
            ))}
          </div>

          <p
            className="mt-4 text-[11px]"
            style={{ fontFamily: "var(--font-mono)", color: "var(--fg-subtle)" }}
          >
            Script généré par IA · pas un conseil en investissement
          </p>
        </div>
      )}
    </section>
  );
}

function Spinner() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--forest-600)"
      strokeWidth="2"
      strokeLinecap="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
