/**
 * Centralised TTS manager.
 *
 * Chrome blocks speechSynthesis.speak() in iframes until a user gesture has
 * occurred inside that iframe. This module handles three bugs:
 *
 * Bug 1 — No user gesture in iframe on page load
 *   Fix: ttsUnlock() must be called on the first user click (capture phase,
 *        before React handlers). Components that need to speak on a user
 *        gesture should call ttsSpeak() synchronously inside the onClick
 *        handler — NOT inside useEffect / setTimeout.
 *
 * Bug 2 — cancel() + speak() in the same call stack silently drops the utterance
 *   Fix: 50 ms setTimeout between cancel() and speak() lets Chrome flush the
 *        cancel before queuing the new utterance. 50 ms is well within the
 *        5-second transient-activation window so speak() still has user gesture.
 *
 * Bug 3 — Chrome GC'ing the utterance mid-speech
 *   Fix: module-level _utt ref holds the active utterance alive.
 *
 * Activation model:
 *   Chrome iframes require speak() to be in the DIRECT call chain of a user
 *   gesture. speak() called from setTimeout/useEffect does NOT inherit
 *   transient activation. Always call ttsSpeak() synchronously inside onClick.
 *   For animation (beak, wings), subscribe to onTtsStart/onTtsEnd instead.
 */

export interface TtsOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

type TtsCallback = () => void;

let _unlocked = false;
let _utt: SpeechSynthesisUtterance | null = null; // GC guard
let _voices: SpeechSynthesisVoice[] = [];

// Pre-load voices — Chrome loads them async; keep the cache warm
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const load = () => { _voices = window.speechSynthesis.getVoices(); };
  window.speechSynthesis.addEventListener('voiceschanged', load);
  load(); // Synchronous on Safari / Firefox; no-op on Chrome until event fires
}

// Global TTS event subscriptions — lets components animate in response to
// speech started/ended without needing to call ttsSpeak() themselves.
const _startSubs: Set<TtsCallback> = new Set();
const _endSubs: Set<TtsCallback> = new Set();

/** Subscribe to TTS start. Returns an unsubscribe function. */
export function onTtsStart(fn: TtsCallback): () => void {
  _startSubs.add(fn);
  return () => _startSubs.delete(fn);
}

/** Subscribe to TTS end (includes error/cancel). Returns an unsubscribe function. */
export function onTtsEnd(fn: TtsCallback): () => void {
  _endSubs.add(fn);
  return () => _endSubs.delete(fn);
}

function _pickVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  // Use cached list; fall back to live query if cache is still empty
  const vs = _voices.length ? _voices : window.speechSynthesis.getVoices();
  // Only consider voices that are ready to speak (localService = built-in/downloaded,
  // or non-local Google voices which always work in Chrome). This prevents picking a
  // macOS voice that's listed but not downloaded, which fails silently.
  const ready = vs.filter(v => v.localService || v.name.startsWith('Google'));
  const pool = ready.length ? ready : vs; // fall back to full list if nothing qualifies
  const n = (v: SpeechSynthesisVoice) => v.name.toLowerCase();
  return (
    // 1. Daniel — British English male, natural quality (built-in on macOS)
    pool.find(v => v.name === 'Daniel') ||
    // 2. Indian English, non-female
    pool.find(v => v.lang === 'en-IN' && !n(v).includes('female')) ||
    pool.find(v => v.lang === 'en-IN') ||
    // 3. Chrome's built-in male
    pool.find(v => v.name === 'Google UK English Male') ||
    // 4. Any English male by name
    pool.find(v => v.lang.startsWith('en') && n(v).includes('male') && !n(v).includes('female')) ||
    // 5. Any English fallback
    pool.find(v => v.lang.startsWith('en')) ||
    null
  );
}

function _doSpeak(text: string, opts: TtsOptions): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.resume(); // Unconditional — fixes Chrome auto-pause stall
  const u = new SpeechSynthesisUtterance(text);
  _utt = u;
  u.rate   = opts.rate   ?? 1.0;
  u.pitch  = opts.pitch  ?? 1.0;
  u.volume = opts.volume ?? 1;
  const voice = _pickVoice();
  if (voice) u.voice = voice;
  u.onstart = () => { _startSubs.forEach(fn => fn()); opts.onStart?.(); };
  u.onend   = () => { _utt = null; _endSubs.forEach(fn => fn()); opts.onEnd?.(); };
  u.onerror = () => { _utt = null; _endSubs.forEach(fn => fn()); opts.onError?.(); };
  window.speechSynthesis.speak(u);
}

/**
 * Returns true if TTS has been unlocked by a user gesture.
 */
export function isTtsUnlocked(): boolean {
  return _unlocked;
}

/**
 * Call once on the first user gesture (click / touchstart) inside the iframe.
 * Speaks a zero-volume, near-instant utterance to prime Chrome's speech synthesis
 * activation inside the iframe — without this, speak() is silently ignored on
 * desktop even from onClick handlers.
 * Dispatches 'tts-ready' on document so components can re-fire pending speech.
 */
export function ttsUnlock(): void {
  if (_unlocked) return;
  _unlocked = true;
  if ('speechSynthesis' in window) {
    try {
      const wake = new SpeechSynthesisUtterance(' ');
      wake.volume = 0;
      wake.rate = 10; // ends in ~10 ms — no audible blip
      window.speechSynthesis.speak(wake);
    } catch { /* ignore */ }
  }
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new Event('tts-ready'));
  }
}

/**
 * Speak text. Must be called SYNCHRONOUSLY inside a user gesture handler
 * (onClick, onTouchStart) for Chrome iframe activation to propagate correctly.
 * Do NOT call from useEffect or setTimeout — use onTtsStart/onTtsEnd for
 * animation callbacks instead.
 *
 * If nothing is currently speaking/pending, speaks immediately (no cancel race).
 * If something is speaking, cancel() → 50 ms gap → speak() to avoid Chrome bug.
 */
export function ttsSpeak(text: string, opts: TtsOptions = {}): void {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  if (synth.speaking || synth.pending) {
    synth.cancel();
    setTimeout(() => _doSpeak(text, opts), 50);
  } else {
    _doSpeak(text, opts);
  }
}

/** Cancel current speech and release the GC guard. */
export function ttsCancel(): void {
  if (_utt) { _endSubs.forEach(fn => fn()); }
  _utt = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
