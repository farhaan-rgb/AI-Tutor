/**
 * AI Tutor Access Assistant — "help me find the right chapter."
 *
 * A different job from FloatingAITutor (that one answers doubts about a
 * chapter you're already inside). This one solves an earlier problem: which
 * chapter, in which subject, does the student even need to open — from a
 * free-text description ("I have a test on coordinate geometry tomorrow",
 * a concept name, an exam scope, or a Social Science topic without knowing
 * which of the four books it's in). Real navigation only: /api/find-content
 * matches against the real catalog and returns a real sku + chapter index,
 * validated server-side — never an invented destination.
 *
 * Mounted globally in AppLayout (Classes/Practice/Marketplace/Profile), not
 * on chapter-home/explain/solve — those screens are already inside a
 * specific subject, so cross-subject search matters most before that.
 */
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Compass, X, Send, Mic, Square, ArrowRight, Sparkles } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

interface FindResult {
  found: boolean;
  sku?: string;
  chapterIndex?: number;
  chapterTitle?: string;
  subjectTitle?: string;
  otherChapters?: string[];
  reasoning?: string;
  urgentTip?: string | null;
}

interface ChatEntry {
  from: "student" | "tutor";
  text?: string;
  result?: FindResult;
}

// Deliberately spans different subjects and different REQUEST SHAPES (a
// concept, a bare subject name, an exam-scope range) — not just four
// rewordings of the same maths example — so the chip row itself demonstrates
// the breadth of what this can resolve.
const EXAMPLE_PROMPTS = [
  "I have a test on coordinate geometry tomorrow",
  "Where do I revise Federalism?",
  "Everything up to polynomials, for my exam",
  "I need Hindi grammar practice",
];

export function AiTutorAccessAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "transcribing">("idle");
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  async function handleSend(raw?: string) {
    const q = (raw ?? message).trim();
    if (!q || loading) return;
    setHistory((h) => [...h, { from: "student", text: q }]);
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/find-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const result: FindResult = await res.json();
      setHistory((h) => [...h, { from: "tutor", result }]);
    } catch {
      setHistory((h) => [
        ...h,
        {
          from: "tutor",
          result: {
            found: false,
            reasoning: "Couldn't reach the tutor — make sure ai-tutor-server is running (npm run dev in /server), or try again.",
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function goToChapter(result?: FindResult) {
    if (!result?.sku || result.chapterIndex === undefined) return;
    setIsOpen(false);
    navigate(`/ai-tutor/chapter-home?sku=${result.sku}&chapter=${result.chapterIndex}`);
  }

  // Same real recording → Whisper transcription pattern already built for
  // analytical answers (ai-tutor-solve.tsx) — reused here so a student can
  // speak the request instead of typing it, same real endpoint either way.
  async function startRecording() {
    setRecordingError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setRecordingState("transcribing");
        try {
          const audioDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const res = await fetch(`${API_BASE}/api/transcribe-audio`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioDataUrl }),
          });
          if (!res.ok) throw new Error(`Transcription request failed (${res.status})`);
          const data = await res.json();
          if (data.transcript) await handleSend(data.transcript);
        } catch {
          setRecordingError("Couldn't transcribe that recording — try typing instead.");
        } finally {
          setRecordingState("idle");
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingState("recording");
    } catch {
      setRecordingError("Couldn't access the microphone — check your browser's permission for this site.");
    }
  }
  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed flex items-center justify-center cursor-pointer"
            style={{
              bottom: 140,
              right: 20,
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--warning) 0%, var(--warning-600, var(--warning)) 100%)",
              border: "none",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              zIndex: 100,
            }}
            aria-label="Find a chapter or topic"
          >
            <Compass style={{ width: 24, height: 24, color: "var(--white)", strokeWidth: 2 }} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed flex flex-col overflow-hidden"
            style={{
              bottom: 96, right: 20, width: 360, maxWidth: "calc(100vw - 40px)",
              height: 520, maxHeight: "calc(100vh - 180px)",
              backgroundColor: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 16, boxShadow: "var(--elevation-xl)", zIndex: 100,
            }}
          >
            <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--warning) 0%, var(--warning-600, var(--warning)) 100%)" }}>
                  <Compass style={{ width: 16, height: 16, color: "var(--white)", strokeWidth: 2 }} />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)", margin: 0 }}>Find a chapter</p>
                  <p style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", margin: 0 }}>Across every subject</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer" }}>
                <X style={{ width: 20, height: 20, color: "var(--muted-foreground)", strokeWidth: 2 }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-4" style={{ padding: 20 }}>
              {history.length === 0 && (
                <>
                  <TutorBubble>
                    Tell me what you need — a chapter, a topic, or something urgent like a test tomorrow. I'll find the real chapter and take you there.
                  </TutorBubble>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleSend(p)}
                        style={{ padding: "8px 12px", backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, cursor: "pointer" }}
                      >
                        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>{p}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {history.map((entry, i) =>
                entry.from === "student" ? (
                  <div key={i} className="flex justify-end">
                    <div style={{ backgroundColor: "var(--primary)", borderRadius: 12, padding: "10px 14px", maxWidth: "80%" }}>
                      <p style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--white)", margin: 0, lineHeight: 1.4 }}>{entry.text}</p>
                    </div>
                  </div>
                ) : (
                  <TutorResultBubble key={i} result={entry.result} onGo={() => goToChapter(entry.result)} />
                )
              )}

              {loading && (
                <div className="flex gap-2 items-center">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--warning) 0%, var(--warning-600, var(--warning)) 100%)" }}
                  >
                    <Sparkles style={{ width: 14, height: 14, color: "var(--white)" }} />
                  </motion.div>
                  <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>Looking that up…</span>
                </div>
              )}
            </div>

            <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
              {recordingError && (
                <p style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)", color: "var(--error)", margin: "0 0 8px" }}>{recordingError}</p>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex-1 flex items-center gap-2" style={{ backgroundColor: "var(--input-background)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" }}>
                  <input
                    type="text"
                    placeholder={recordingState === "recording" ? "Listening…" : "e.g. test on trigonometry tomorrow"}
                    value={message}
                    disabled={recordingState !== "idle"}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                    className="flex-1"
                    style={{ background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--foreground)" }}
                  />
                  <button
                    onClick={recordingState === "recording" ? stopRecording : startRecording}
                    disabled={recordingState === "transcribing"}
                    style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                    aria-label={recordingState === "recording" ? "Stop recording" : "Record a voice question"}
                  >
                    {recordingState === "recording" ? (
                      <Square style={{ width: 16, height: 16, color: "var(--error)" }} fill="var(--error)" />
                    ) : (
                      <Mic style={{ width: 18, height: 18, color: recordingState === "transcribing" ? "var(--muted-foreground)" : "var(--muted-foreground)", strokeWidth: 2 }} />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!message.trim() || loading}
                  className="flex items-center justify-center"
                  style={{
                    width: 40, height: 40, borderRadius: 10, border: "none",
                    background: message.trim() && !loading ? "linear-gradient(135deg, var(--warning) 0%, var(--warning-600, var(--warning)) 100%)" : "var(--button-disabled-bg)",
                    cursor: message.trim() && !loading ? "pointer" : "not-allowed",
                    opacity: message.trim() && !loading ? 1 : 0.5,
                  }}
                >
                  <Send style={{ width: 18, height: 18, color: message.trim() ? "var(--white)" : "var(--button-disabled-text)", strokeWidth: 2 }} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TutorBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start">
      <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--warning) 0%, var(--warning-600, var(--warning)) 100%)" }}>
        <Compass style={{ width: 14, height: 14, color: "var(--white)", strokeWidth: 2 }} />
      </div>
      <div style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", maxWidth: "80%" }}>
        <p style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--foreground)", margin: 0 }}>{children}</p>
      </div>
    </div>
  );
}

// Not-found and found results share this one shape — the difference is
// purely whether there's a real chapter to navigate to, never a different
// visual treatment that would make "I couldn't find that" look like a
// smaller/lesser version of success (rule 8's spirit: don't fake a result).
function TutorResultBubble({ result, onGo }: { result?: FindResult; onGo: () => void }) {
  if (!result) return null;
  return (
    <TutorBubble>
      <span style={{ display: "block", marginBottom: result.found ? 10 : 0 }}>{result.reasoning}</span>
      {result.found && (
        <>
          {result.urgentTip && (
            <span style={{ display: "block", marginBottom: 10, padding: "8px 10px", borderRadius: 8, background: "var(--warning-alpha-8, rgba(250,173,20,0.1))", color: "var(--warning-600, var(--warning))", fontSize: "var(--text-xs)" }}>
              {result.urgentTip}
            </span>
          )}
          {!!result.otherChapters?.length && (
            <span style={{ display: "block", marginBottom: 10, fontSize: "var(--text-2xs)", color: "var(--muted-foreground)" }}>
              Also touches: {result.otherChapters.join(", ")}
            </span>
          )}
          <button
            onClick={onGo}
            className="flex items-center justify-center gap-1.5"
            style={{ width: "100%", height: 36, borderRadius: 10, border: "none", background: "var(--primary)", cursor: "pointer" }}
          >
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)" }}>
              Go to {result.chapterTitle}
            </span>
            <ArrowRight style={{ width: 13, height: 13, color: "var(--white)" }} />
          </button>
        </>
      )}
    </TutorBubble>
  );
}
