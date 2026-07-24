/**
 * Floating AI Tutor - Quick access to AI help during learning
 * Shows in bottom-right corner during learn/practice flows
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Mic } from 'lucide-react';

interface FloatingAITutorProps {
  topicContext?: string;
  onClose?: () => void;
}

export function FloatingAITutor({ topicContext = "Newton's Second Law", onClose }: FloatingAITutorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleSend = () => {
    if (message.trim()) {
      // TODO(api): POST /api/tutor/message — send `message` to the AI tutor
      setMessage('');
    }
  };

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
              bottom: 140, // Above bottom actions + safe spacing
              right: 20,
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)',
              border: 'none',
              boxShadow: 'var(--glow-primary-strong)',
              zIndex: 100,
            }}
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
              {/* Sample AI Message */}
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

              {/* Quick Action Chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  'Explain F = ma',
                  'Give an example',
                  'Common mistakes?',
                  'Practice problem',
                ].map((suggestion) => (
                  <motion.button
                    key={suggestion}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMessage(suggestion)}
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
            </div>

            {/* Input Area */}
            <div style={{
              padding: 16,
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--card)',
            }}>
              <div className="flex gap-2 items-end">
                <div className="flex-1 flex items-center gap-2" style={{
                  backgroundColor: 'var(--input-background)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}>
                  <input
                    type="text"
                    placeholder="Ask a question..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSend();
                      }
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
                    className="flex cursor-pointer"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                    }}
                  >
                    <Mic style={{ width: 18, height: 18, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
                  </motion.button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: message.trim()
                      ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%)'
                      : 'var(--button-disabled-bg)',
                    border: 'none',
                    cursor: message.trim() ? 'pointer' : 'not-allowed',
                    opacity: message.trim() ? 1 : 0.5,
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