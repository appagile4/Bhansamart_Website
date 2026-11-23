"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Search, X, RotateCcw, AlertCircle } from "lucide-react";

/* ── Minimal Web Speech API typings (not in lib.dom for every TS version) ── */
interface SpeechAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechAlternative;
}
interface SpeechResultEvent {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [index: number]: SpeechResult };
}
interface SpeechErrorEvent {
  readonly error: string;
}
interface Recognizer {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognizerCtor = new () => Recognizer;

/** The browser's speech recognizer, or null (Firefox, older browsers, server). */
export function getSpeechRecognition(): RecognizerCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** Recognition language — English with Indian/Nepali accents and product names */
const VOICE_LANG = "en-IN";

const SUGGESTIONS = ["Milk", "Atta", "Fresh vegetables", "Paneer", "Basmati rice"];

type Phase = "listening" | "done" | "error" | "unsupported";

const ERROR_TEXT: Record<string, string> = {
  "not-allowed":
    "Microphone access is blocked. Click the lock/mic icon in your browser's address bar, allow the microphone, then try again.",
  "service-not-allowed":
    "Your browser has turned off voice input for this site. Allow the microphone in site settings, then try again.",
  "no-speech": "We didn't hear anything. Tap the mic and speak a little louder.",
  "audio-capture": "No microphone was found. Connect a microphone and try again.",
  network: "Voice recognition needs an internet connection. Check your connection and try again.",
  "language-not-supported": "Your browser can't recognise speech right now. Please type your search instead.",
  insecure:
    "Voice search only works on a secure (https://) page. Open the site over https, or on localhost while testing.",
};

export default function VoiceSearchModal({
  open,
  onClose,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  /** Called with the final text when the user confirms the search */
  onSearch: (text: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("listening");
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  // Keep the recognizer alive in a ref — a local variable can be garbage-collected
  // mid-listen in Chrome, which is why results "never came back" before.
  const recRef = useRef<Recognizer | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const errorRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  const stopRecognizer = useCallback((hard = false) => {
    const rec = recRef.current;
    if (!rec) return;
    rec.onresult = rec.onerror = rec.onend = rec.onstart = null;
    try {
      if (hard) rec.abort();
      else rec.stop();
    } catch {
      /* already stopped */
    }
    recRef.current = null;
  }, []);

  const start = useCallback(
    () => {
      stopRecognizer(true);
      setError("");
      setInterim("");
      setFinalText("");
      finalRef.current = "";
      interimRef.current = "";
      errorRef.current = "";

      const Ctor = getSpeechRecognition();
      if (!Ctor) {
        setPhase("unsupported");
        return;
      }
      if (!window.isSecureContext) {
        setError(ERROR_TEXT.insecure);
        setPhase("error");
        return;
      }

      const rec = new Ctor();
      rec.lang = VOICE_LANG;
      rec.continuous = false; // stops by itself after a pause
      rec.interimResults = true; // show words while the user is still speaking
      rec.maxAlternatives = 1;

      rec.onresult = (e) => {
        let fin = "";
        let mid = "";
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i];
          const t = r[0]?.transcript || "";
          if (r.isFinal) fin += t;
          else mid += t;
        }
        finalRef.current = fin.trim();
        interimRef.current = mid.trim();
        setFinalText(fin.trim());
        setInterim(mid.trim());
      };
      rec.onerror = (e) => {
        if (e.error === "aborted") return;
        // "no-speech" after some words were heard is fine — keep what we have
        if (e.error === "no-speech" && (finalRef.current || interimRef.current)) return;
        errorRef.current = ERROR_TEXT[e.error] || `Voice search stopped (${e.error}). Please try again.`;
        setError(errorRef.current);
        setPhase("error");
      };
      rec.onend = () => {
        recRef.current = null;
        // If the browser ended before marking the last words final, keep them
        const heard = [finalRef.current, interimRef.current].filter(Boolean).join(" ").trim();
        finalRef.current = heard;
        interimRef.current = "";
        setFinalText(heard);
        setInterim("");
        if (errorRef.current) return; // onerror already showed the reason
        if (heard) {
          setPhase("done");
        } else {
          setError(ERROR_TEXT["no-speech"]);
          setPhase("error");
        }
      };

      recRef.current = rec;
      setPhase("listening");
      try {
        rec.start();
      } catch {
        setError("Couldn't start the microphone. Please try again.");
        setPhase("error");
      }
    },
    [stopRecognizer]
  );

  // Start listening each time the popup opens; stop when it closes or unmounts
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the popup starts the microphone
    start();
    return () => stopRecognizer(true);
  }, [open, start, stopRecognizer]);

  // Escape closes; lock page scroll behind the popup
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Once listening finishes, put the cursor in the text box so the user can fix a word
  useEffect(() => {
    if (phase === "done") inputRef.current?.focus();
  }, [phase]);

  if (!open) return null;

  const listening = phase === "listening";
  const shown = [finalText, interim].filter(Boolean).join(" ");
  const canSearch = !listening && finalText.trim().length > 0;

  const submit = (text = finalText) => {
    const q = text.trim();
    if (!q) return;
    stopRecognizer(true);
    onSearch(q);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-search-title"
      onMouseDown={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92dvh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 id="voice-search-title" className="text-base font-extrabold text-slate-900">
            Search by voice
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Close voice search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-5 overflow-y-auto">
          {phase === "unsupported" ? (
            <div className="py-6 text-center">
              <span className="w-16 h-16 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
                <MicOff className="w-7 h-7" />
              </span>
              <p className="text-sm font-bold text-slate-900">Voice search isn&apos;t available in this browser</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Use Google Chrome, Microsoft Edge or Safari, or just type what you&apos;re looking for.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 px-5 h-10 rounded-xl bg-[#0C831F] hover:bg-[#0a6f1a] text-white text-sm font-bold cursor-pointer"
              >
                Type instead
              </button>
            </div>
          ) : (
            <>
              {/* Mic + status */}
              <div className="flex flex-col items-center pt-2 pb-4">
                <button
                  type="button"
                  onClick={() => (listening ? recRef.current?.stop() : start())}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition cursor-pointer ${
                    listening ? "bg-rose-500 shadow-rose-500/30" : "bg-[#0C831F] hover:bg-[#0a6f1a] shadow-emerald-700/25"
                  }`}
                  aria-label={listening ? "Stop listening" : "Speak again"}
                >
                  {listening && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-rose-400/50 animate-ping" />
                      <span className="absolute -inset-2 rounded-full border-2 border-rose-300/70 animate-pulse" />
                    </>
                  )}
                  <Mic className="relative w-8 h-8" />
                </button>
                <p className="mt-3 text-sm font-bold text-slate-800" aria-live="polite">
                  {listening
                    ? shown
                      ? "Listening…"
                      : "Listening… speak now"
                    : phase === "done"
                      ? "Got it! Check the text and tap Search"
                      : "Tap the mic to try again"}
                </p>
              </div>

              {/* Live / editable transcript */}
              {listening ? (
                <div className="min-h-14 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center text-base text-slate-900 break-words">
                  {shown ? (
                    <>
                      {finalText}
                      {interim && <span className="text-slate-400"> {interim}</span>}
                    </>
                  ) : (
                    <span className="text-slate-400 text-sm">Try saying “{SUGGESTIONS[0]}” or “{SUGGESTIONS[1]}”</span>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                >
                  <label htmlFor="voice-search-text" className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                    You said
                  </label>
                  <input
                    id="voice-search-text"
                    ref={inputRef}
                    value={finalText}
                    onChange={(e) => {
                      finalRef.current = e.target.value;
                      setFinalText(e.target.value);
                    }}
                    enterKeyHint="search"
                    placeholder="Speak again or type here"
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 outline-none"
                  />
                </form>
              )}

              {error && phase === "error" && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => start()}
                  disabled={listening}
                  className="h-11 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Speak again
                </button>
                <button
                  type="button"
                  onClick={() => submit()}
                  disabled={!canSearch}
                  className="h-11 rounded-xl bg-[#0C831F] hover:bg-[#0a6f1a] text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
