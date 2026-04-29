"use client";

import { useEffect, useRef, useState } from "react";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function EpisodePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration);
    const onTime = () => {
      if (!scrubbing) setCurrent(audio.currentTime);
    };
    const onEnded = () => setPlaying(false);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [scrubbing]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => undefined);
      setPlaying(true);
    }
  };

  const seek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrent(value);
  };

  const skip = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className="rounded-full"
      style={{
        background: "var(--paper-100)",
        border: "1px solid var(--paper-200)",
        padding: "8px 16px 8px 8px",
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Lecture"}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-all hover:scale-105"
          style={{
            background: "var(--lavender-600)",
            color: "var(--paper-0)",
          }}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <rect x="4" y="3" width="3.5" height="12" rx="1" />
              <rect x="10.5" y="3" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M5 3v12l10-6z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={() => skip(-15)}
          aria-label="Reculer 15 secondes"
          className="hidden h-9 w-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-[var(--paper-200)] sm:grid"
          style={{ color: "var(--ink-700)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
            <text x="9" y="16" fontSize="7" fontWeight="600" fill="currentColor" stroke="none">15</text>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => skip(30)}
          aria-label="Avancer 30 secondes"
          className="hidden h-9 w-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-[var(--paper-200)] sm:grid"
          style={{ color: "var(--ink-700)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
            <path d="M21 3v5h-5" />
            <text x="9" y="16" fontSize="7" fontWeight="600" fill="currentColor" stroke="none">30</text>
          </svg>
        </button>

        <div className="flex flex-1 items-center gap-3">
          <span
            className="shrink-0 text-[11px]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--fg-muted)",
              minWidth: "32px",
            }}
          >
            {formatTime(current)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={(e) => seek(Number(e.target.value))}
            onMouseDown={() => setScrubbing(true)}
            onMouseUp={() => setScrubbing(false)}
            onTouchStart={() => setScrubbing(true)}
            onTouchEnd={() => setScrubbing(false)}
            aria-label="Position de lecture"
            className="ic-player-range flex-1"
            style={{
              // @ts-expect-error CSS custom property used in <style jsx> below
              "--progress": `${progress}%`,
            }}
          />
          <span
            className="shrink-0 text-[11px]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--fg-muted)",
              minWidth: "32px",
              textAlign: "right",
            }}
          >
            {formatTime(duration)}
          </span>
        </div>
      </div>
      <style jsx>{`
        .ic-player-range {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(
            to right,
            var(--lavender-600) 0%,
            var(--lavender-600) var(--progress),
            var(--paper-200) var(--progress),
            var(--paper-200) 100%
          );
          cursor: pointer;
        }
        .ic-player-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--lavender-600);
          border: 2px solid var(--paper-0);
          box-shadow: 0 1px 4px rgba(20, 16, 40, 0.2);
          cursor: pointer;
        }
        .ic-player-range::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--lavender-600);
          border: 2px solid var(--paper-0);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
