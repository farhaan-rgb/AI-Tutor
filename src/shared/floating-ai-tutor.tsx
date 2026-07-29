/**
 * Floating AI Tutor - real doubt-answering chat, scoped to the chapter the
 * student is currently viewing (see ai-tutor-access-assistant.tsx for the
 * different, global "help me find a chapter" assistant).
 *
 * Wired to the existing /api/ask-tutor endpoint (already built for the
 * Explain-screen "raise hand" flow) — same real, grounded-answer contract:
 * `context` here is a real summary of this chapter's actual sections/topics
 * (built in ai-tutor-chapter-home.tsx from the same data driving the topic
 * list on screen), not a generic title string, so answers stay grounded in
 * real content rather than inventing beyond it. Quick-suggestion chips are
 * likewise real topic titles from the current chapter, not a hardcoded
 * "Explain F = ma" that used to show regardless of subject.
 */

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Mic, Square } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

interface FloatingAITutorProps {
  topicContext?: string;
  // Real grounding text sent to /api/ask-tutor as `context` — required for
  // a genuine answer; falls back to topicContext alone if not supplied so
  // this component never 400s, but callers should pass real chapter data.
  contextSummary?: string;
  // Real topic titles from the current chapter, phrased as starter
  // questions — replaces the old hardcoded, subject-agnostic chip set.
  suggestions?: string[];
  onClose?: () => void;
}

interface ChatTurn {
  role: 'student' | 'tutor';
  text: string;
}

export function FloatingAITutor({ topicContext = "this chapter", contextSummary, suggestions = [], onClose }: FloatingAITutorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleToggle = () => setIsOpen(!isOpen);
  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  async function handleSend(raw?: string) {
    const q = (raw ?? message).trim();
    if (!q || loading) return;
    const nextHistory: ChatTurn[] = [...history, { role: 'student', text: q }];
    setHistory(nextHistory);
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ask-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          topicTitle: topicContext,
          context: contextSummary || `Chapter: ${topicContext}`,
          history: history.map((t) => ({ role: t.role, text: t.text })),
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setHistory([...nextHistory, { role: 'tutor', text: data.answer || "I couldn't work out an answer to that — try rephrasing?" }]);
    } catch {
      setHistory([
        ...nextHistory,
        { role: 'tutor', text: "Couldn't reach the tutor — make sure ai-tutor-server is running (npm run dev in /server), or try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Same real recording → Whisper transcription pattern used in
  // ai-tutor-solve.tsx and ai-tutor-access-assistant.tsx.
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
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setRecordingState('transcribing');
        try {
          const audioDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const res = await fetch(`${API_BASE}/api/transcribe-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioDataUrl }),
          });
          if (!res.ok) throw new Error(`Transcription request failed (${res.status})`);
          const data = await res.json();
          if (data.transcript) await handleSend(data.transcript);
        } catch {
          setRecordingError("Couldn't transcribe that recording — try typing instead.");
        } finally {
          setRecordingState('idle');
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingState('recording');
    } catch {
      setRecordingError("Couldn't access the microphone — check your browser's permission for this site.");
    }
  }
  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            className="fixed flex items-center justify-center cursor-pointer"
            style={{
              bottom: 140,
              right: 20,
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)',
              border: 'none',
              boxShadow: 'var(--glow-primary-strong)',
              zIndex: 100,
            }}
            aria-label="Ask the AI tutor about this chapter"
          >
            <Sparkles style={{ width: 24, height: 24, color: 'var(--white)', strokeWidth: 2 }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed flex flex-col overflow-hidden"
            style={{
              bottom: 96,
              right: 20,
              width: 360,
              maxWidth: 'calc(100vw - 40px)',
              height: 480,
              maxHeight: 'calc(100vh - 180px)',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              boxShadow: 'var(--elevation-xl)',
              zIndex: 100,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
            }}>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center" style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)',
                }}>
                  <Sparkles style={{ width: 16, height: 16, color: 'var(--white)', strokeWidth: 2 }} />
                </div>
                <div>
                  <p style={{
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    margin: 0,
                  }}>
                    AI Tutor
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--muted-foreground)',
                    margin: 0,
                  }}>
                    {topicContext}
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 4,
                }}
              >
                <X style={{ width: 20, height: 20, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
              </motion.button>
            </div>

            {/* Context Banner */}
            <div style={{
              padding: '12px 20px',
              backgroundColor: 'var(--primary-alpha-8)',
              border: '1px solid var(--primary-alpha-12)',
              borderLeft: 'none',
              borderRight: 'none',
            }}>
              <p style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-xs)',
                color: 'var(--muted-foreground)',
                margin: 0,
              }}>
                Ask doubts about <span style={{ color: 'var(--primary)', fontWeight: 'var(--font-weight-semibold)' }}>{topicContext}</span>
              </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-4" style={{ padding: 20 }}>
              {history.length === 0 && (
                <>
                  <div className="flex gap-2 items-start">
                    <div className="flex items-center justify-center shrink-0" style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)',
                    }}>
                      <Sparkles style={{ width: 14, height: 14, color: 'var(--white)', strokeWidth: 2 }} />
                    </div>
                    <div style={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      maxWidth: '80%',
                    }}>
                      <p style={{
                        fontFamily: 'var(--font-family-inter)',
                        fontSize: 'var(--text-sm)',
                        lineHeight: 1.5,
                        color: 'var(--foreground)',
                        margin: 0,
                      }}>
                        Hi! I'm here to help you understand <strong>{topicContext}</strong>. What would you like to know?
                      </p>
                    </div>
                  </div>

                  {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion) => (
                        <motion.button
                          key={suggestion}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSend(suggestion)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: 20,
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{
                            fontFamily: 'var(--font-family-inter)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--muted-foreground)',
                          }}>
                            {suggestion}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {history.map((turn, i) =>
                turn.role === 'student' ? (
                  <div key={i} className="flex justify-end">
                    <div style={{ backgroundColor: 'var(--primary)', borderRadius: 12, padding: '10px 14px', maxWidth: '80%' }}>
                      <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', color: 'var(--white)', margin: 0, lineHeight: 1.4 }}>{turn.text}</p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)' }}>
                      <Sparkles style={{ width: 14, height: 14, color: 'var(--white)', strokeWidth: 2 }} />
                    </div>
                    <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', maxWidth: '80%' }}>
                      <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.5, color: 'var(--foreground)', margin: 0 }}>{turn.text}</p>
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="flex gap-2 items-center">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)' }}
                  >
                    <Sparkles style={{ width: 14, height: 14, color: 'var(--white)' }} />
                  </motion.div>
                  <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>Thinking…</span>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div style={{
              padding: 16,
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
            }}>
              {recordingError && (
                <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', color: 'var(--error)', margin: '0 0 8px' }}>{recordingError}</p>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex-1 flex items-center gap-2" style={{
                  backgroundColor: 'var(--input-background)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}>
                  <input
                    type="text"
                    placeholder={recordingState === 'recording' ? 'Listening…' : 'Ask a question...'}
                    value={message}
                    disabled={recordingState !== 'idle'}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend();
                    }}
                    className="flex-1"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'var(--font-family-inter)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={recordingState === 'recording' ? stopRecording : startRecording}
                    disabled={recordingState === 'transcribing'}
                    className="flex cursor-pointer"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                    }}
                    aria-label={recordingState === 'recording' ? 'Stop recording' : 'Record a voice question'}
                  >
                    {recordingState === 'recording' ? (
                      <Square style={{ width: 15, height: 15, color: 'var(--error)' }} fill="var(--error)" />
                    ) : (
                      <Mic style={{ width: 18, height: 18, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
                    )}
                  </motion.button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend()}
                  disabled={!message.trim() || loading}
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: message.trim() && !loading
                      ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)'
                      : 'var(--button-disabled-bg)',
                    border: 'none',
                    cursor: message.trim() && !loading ? 'pointer' : 'not-allowed',
                    opacity: message.trim() && !loading ? 1 : 0.5,
                  }}
                >
                  <Send style={{
                    width: 18,
                    height: 18,
                    color: message.trim() ? 'var(--white)' : 'var(--button-disabled-text)',
                    strokeWidth: 2
                  }} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
