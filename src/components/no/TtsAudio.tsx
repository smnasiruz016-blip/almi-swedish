"use client";

// Listening audio via the browser SpeechSynthesis API — free, no Blob storage.
// Reads the transcript in is-IS (Norwegian). Where speech synthesis is unavailable,
// it gracefully falls back to showing the transcript.

import { useEffect, useRef, useState } from "react";
import { ttsLang } from "./shared";

export function TtsAudio({
  transcript,
}: {
  transcript: string;
}) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showText, setShowText] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function play() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(transcript);
    u.lang = ttsLang();
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utterRef.current = u;
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }

  function stop() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return (
    <div className="rounded-xl border border-almi-bg-peach bg-almi-bg-peach/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden className="text-lg">🎧</span>
        {supported ? (
          <>
            <button
              type="button"
              onClick={speaking ? stop : play}
              className="inline-flex min-h-[40px] items-center rounded-full bg-almi-teal px-4 py-2 text-sm font-semibold text-almi-paper hover:opacity-90"
            >
              {speaking ? "Stop" : "Play audio"}
            </button>
            <button
              type="button"
              onClick={() => setShowText((v) => !v)}
              className="text-sm font-semibold text-almi-coral hover:underline"
            >
              {showText ? "Hide transcript" : "Show transcript"}
            </button>
          </>
        ) : (
          <span className="text-sm text-almi-text-muted">
            Audio playback isn&apos;t available here — read the transcript below.
          </span>
        )}
      </div>
      {(showText || !supported) && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-almi-text">{transcript}</p>
      )}
    </div>
  );
}
