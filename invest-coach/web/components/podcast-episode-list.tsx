"use client";

import { useState, useRef, useCallback } from "react";
import type { PodcastEpisode } from "@/app/page";

type TtsState = "idle" | "playing" | "paused";

function EpisodeCard({ ep }: { ep: PodcastEpisode }) {
  const [scriptOpen, setScriptOpen] = useState(false);
  // Browser TTS fallback — only used when no audioUrl
  const [tts, setTts] = useState<TtsState>("idle");
  const [activeIdx, setActiveIdx] = useState(-1);
  const cancelRef = useRef(false);
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  const stopTts = useCallback(() => {
    cancelRef.current = true;
    synth?.cancel();
    setTts("idle");
    setActiveIdx(-1);
  }, [synth]);

  function speakFrom(startIdx: number) {
    if (!synth) return;
    const s = synth;
    cancelRef.current = false;
    setTts("playing");
    function next(idx: number) {
      if (idx >= ep.script.length || cancelRef.current) { setTts("idle"); setActiveIdx(-1); return; }
      setActiveIdx(idx);
      const utt = new SpeechSynthesisUtterance(ep.script[idx].text);
      utt.lang = "fr-FR"; utt.rate = 0.95;
      utt.pitch = ep.script[idx].speaker === "Coach" ? 0.9 : 1.15;
      utt.onend = () => next(idx + 1);
      utt.onerror = () => next(idx + 1);
      s.speak(utt);
    }
    next(startIdx);
  }

  return (
    <article
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "var(--paper-50)" }}
    >
      <div className="p-5">
        {/* Title + summary */}
        <h3
          className="text-[18px] font-semibold leading-snug mb-1.5"
          style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
        >
          {ep.title}
        </h3>
        <p
          className="text-[14px] leading-snug mb-4"
          style={{ fontFamily: "var(--font-serif)", color: "var(--fg-muted)" }}
        >
          {ep.summary}
        </p>

        {/* Audio player — shown when real audio exists */}
        {ep.audio_url ? (
          <audio
            controls
            className="w-full rounded-lg mb-3"
            style={{ accentColor: "var(--forest-600)" }}
            preload="metadata"
          >
            <source src={ep.audio_url} type="audio/wav" />
          </audio>
        ) : (
          /* Browser TTS fallback */
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => tts === "idle" ? speakFrom(0) : tts === "playing" ? (synth?.pause(), setTts("paused")) : (synth?.resume(), setTts("playing"))}
              className="rounded-full w-9 h-9 flex items-center justify-center transition-colors"
              style={{ background: tts !== "idle" ? "var(--terracotta-500)" : "var(--forest-600)", color: "var(--paper-50)" }}
            >
              {tts === "playing" ? <PauseIcon /> : <PlayIcon />}
            </button>
            {tts !== "idle" && (
              <button onClick={stopTts} className="text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--fg-subtle)" }}>■ stop</button>
            )}
            <span className="text-[12px] italic" style={{ fontFamily: "var(--font-serif)", color: "var(--fg-subtle)" }}>
              Lecture TTS · audio HD bientôt disponible
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScriptOpen(!scriptOpen)}
            className="text-[13px] font-medium"
            style={{ fontFamily: "var(--font-display)", color: "var(--forest-600)" }}
          >
            {scriptOpen ? "Masquer ↑" : "Lire le script ↓"}
          </button>
          <a href={ep.youtube_url} target="_blank" rel="noreferrer"
            className="text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--fg-subtle)" }}>
            ↗ source
          </a>
        </div>
      </div>

      {/* Script — collapsible */}
      {scriptOpen && (
        <div className="border-t px-5 pb-5 pt-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--paper-100)" }}>
          {ep.script.map((line, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-xl p-3 cursor-pointer transition-colors"
              style={{
                background: activeIdx === i
                  ? line.speaker === "Coach"
                    ? "color-mix(in srgb, var(--forest-600) 12%, transparent)"
                    : "color-mix(in srgb, var(--terracotta-500) 10%, transparent)"
                  : "transparent",
              }}
              onClick={() => !ep.audio_url && (stopTts(), speakFrom(i))}
              role="button"
            >
              <span
                className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  fontFamily: "var(--font-mono)", letterSpacing: "0.04em",
                  height: "fit-content", marginTop: "3px", whiteSpace: "nowrap",
                  background: line.speaker === "Coach"
                    ? "color-mix(in srgb, var(--forest-600) 15%, transparent)"
                    : "color-mix(in srgb, var(--terracotta-500) 12%, transparent)",
                  color: line.speaker === "Coach" ? "var(--forest-600)" : "var(--terracotta-500)",
                }}
              >
                {line.speaker}
              </span>
              <p className="text-[15px] leading-relaxed" style={{ fontFamily: "var(--font-serif)", color: "var(--fg)" }}>
                {line.text}
              </p>
            </div>
          ))}
          <p className="text-[11px] pt-1" style={{ fontFamily: "var(--font-mono)", color: "var(--fg-subtle)" }}>
            Script généré par IA · pas un conseil en investissement
          </p>
        </div>
      )}
    </article>
  );
}

export function PodcastEpisodeList({ episodes }: { episodes: PodcastEpisode[] }) {
  if (episodes.length === 0) {
    return (
      <section className="mb-10">
        <div className="cap-eyebrow mb-4">Podcasts · Money Coaching</div>
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--paper-100)", border: "1px solid var(--border)" }}>
          <p className="text-[15px] italic" style={{ fontFamily: "var(--font-serif)", color: "var(--fg-muted)" }}>
            Les premiers épisodes arrivent bientôt.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="cap-eyebrow mb-4">Podcasts · Money Coaching</div>
      <div className="space-y-4">
        {episodes.map((ep) => <EpisodeCard key={ep.id} ep={ep} />)}
      </div>
    </section>
  );
}

function PlayIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>;
}
function PauseIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>;
}
