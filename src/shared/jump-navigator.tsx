/**
 * Jump Navigator - Bottom sheet for quick chapter/topic navigation
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, ChevronDown, Check } from 'lucide-react';
import { getExamConfig } from '../app/data/exam-config';
import { getTopicsForChapter } from '../app/data/topics-config';

interface JumpNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  currentSubjectId: string;
  onNavigate: (chapterId: string, topicId?: string) => void;
}

export function JumpNavigator({ isOpen, onClose, examId, currentSubjectId, onNavigate }: JumpNavigatorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const examConfig = getExamConfig(examId);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) { setSearchQuery(''); setExpandedChapter(null); }
  }, [isOpen]);

  const chapters = useMemo(() => {
    if (!examConfig) return [];
    return examConfig.chapters
      .filter(ch => ch.subjectId === currentSubjectId)
      .map((ch, i) => ({
        ...ch,
        topics: getTopicsForChapter(ch.id),
        progress: i === 0 ? 80 : i === 1 ? 45 : i === 2 ? 10 : 0,
      }));
  }, [examConfig, currentSubjectId]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase();
    return chapters.filter(ch =>
      ch.title.toLowerCase().includes(q) ||
      ch.topics.some(t => t.title.toLowerCase().includes(q))
    );
  }, [chapters, searchQuery]);

  if (!examConfig) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0"
            style={{ backgroundColor: 'var(--overlay)', backdropFilter: 'blur(4px)', zIndex: 999 }}
          />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 flex flex-col"
            style={{
              backgroundColor: 'var(--background)',
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              boxShadow: 'var(--elevation-xl)',
              zIndex: 1000, height: '85vh',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between shrink-0" style={{ padding: '20px 16px 16px' }}>
              <span style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)',
              }}>
                Jump to Lesson
              </span>
              <button
                onClick={onClose}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  background: 'none', border: 'none',
                  padding: 4, color: 'var(--muted-foreground)',
                }}
              >
                <X style={{ width: 24, height: 24, strokeWidth: 2 }} />
              </button>
            </div>

            {/* Search */}
            <div className="shrink-0" style={{ padding: '0 16px 12px' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 16, height: 16, color: 'var(--muted-foreground)',
                }} />
                <input
                  type="text"
                  placeholder="Search chapters or topics..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full"
                  style={{
                    boxSizing: 'border-box',
                    padding: '10px 12px 10px 36px',
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)', borderRadius: 12,
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 'var(--text-sm)', color: 'var(--foreground)', outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '4px 16px 32px' }}>
              {filtered.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px 0',
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)',
                }}>
                  No chapters found
                </div>
              ) : filtered.map((chapter, idx) => {
                const isExpanded = expandedChapter === chapter.id;
                // Resolve topics first, then compute completedCount against actual length
                const topics = chapter.topics.length > 0 ? chapter.topics : [
                  { id: 't1', title: 'Introduction' },
                  { id: 't2', title: 'Core Concepts' },
                  { id: 't3', title: 'Practice Problems' },
                  { id: 't4', title: 'Advanced Topics' },
                  { id: 't5', title: 'Summary & Revision' },
                ];
                const completedCount = Math.floor((chapter.progress / 100) * topics.length);

                return (
                  <div key={chapter.id} style={{ marginBottom: 8 }}>
                    {/* Chapter row */}
                    <button
                      onClick={() => setExpandedChapter(prev => prev === chapter.id ? null : chapter.id)}
                      className="w-full flex items-center gap-3 cursor-pointer"
                      style={{
                        padding: '12px 12px',
                        backgroundColor: isExpanded ? 'var(--primary-alpha-8)' : 'var(--card)',
                        border: `1px solid ${isExpanded ? 'var(--primary-alpha-20)' : 'var(--border)'}`,
                        borderRadius: 12, textAlign: 'left',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      {/* Number badge */}
                      <div className="flex items-center justify-center shrink-0" style={{
                        width: 36, height: 36, borderRadius: 10,
                        backgroundColor: isExpanded ? 'var(--primary)' : 'var(--primary-alpha-20)',
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-family-inter)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-bold)',
                          color: isExpanded ? 'var(--white)' : 'var(--primary)',
                        }}>
                          {idx + 1}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div style={{
                          fontFamily: 'var(--font-family-inter)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          marginBottom: 2,
                        }}>
                          {chapter.title}
                        </div>
                        <div className="flex items-center gap-[6px]" style={{
                          fontFamily: 'var(--font-family-inter)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--muted-foreground)',
                        }}>
                          <span>{completedCount}/{topics.length} topics</span>
                          {chapter.progress > 0 && (
                            <span style={{
                              color: chapter.progress === 100 ? 'var(--success)' : 'var(--primary)',
                              fontWeight: 'var(--font-weight-semibold)',
                            }}>
                              {chapter.progress}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Chevron */}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="shrink-0"
                      >
                        <ChevronDown style={{ width: 16, height: 16, color: isExpanded ? 'var(--primary)' : 'var(--muted-foreground)', strokeWidth: 2.5 }} />
                      </motion.div>
                    </button>

                    {/* Topics */}
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div style={{
                          marginTop: 4, padding: '8px 12px 4px',
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                        }}>
                          {topics.map((topic, topicIdx) => {
                            const isCompleted = topicIdx < completedCount;
                            return (
                              <div
                                key={topic.id}
                                onClick={() => { onNavigate(chapter.id, topic.id); onClose(); }}
                                className="flex items-center gap-3 cursor-pointer"
                                style={{
                                  padding: '11px 8px',
                                  borderBottom: topicIdx < topics.length - 1 ? '1px solid color-mix(in srgb, var(--border) 40%, transparent)' : 'none',
                                }}
                              >
                                {/* Number circle */}
                                <div className="flex items-center justify-center shrink-0" style={{
                                  width: 24, height: 24, borderRadius: '50%',
                                  backgroundColor: isCompleted
                                    ? 'color-mix(in srgb, var(--success) 15%, transparent)'
                                    : 'color-mix(in srgb, var(--primary) 10%, transparent)',
                                  border: `1.5px solid ${isCompleted
                                    ? 'color-mix(in srgb, var(--success) 40%, transparent)'
                                    : 'color-mix(in srgb, var(--primary) 30%, transparent)'}`,
                                }}>
                                  <span style={{
                                    fontFamily: 'var(--font-family-inter)', fontSize: 10,
                                    fontWeight: 'var(--font-weight-bold)',
                                    color: isCompleted ? 'var(--success)' : 'var(--primary)',
                                  }}>
                                    {topicIdx + 1}
                                  </span>
                                </div>

                                {/* Title */}
                                <span className="flex-1" style={{
                                  fontFamily: 'var(--font-family-inter)',
                                  fontSize: 'var(--text-sm)',
                                  fontWeight: 'var(--font-weight-medium)',
                                  color: 'var(--foreground)',
                                }}>
                                  {topic.title}
                                </span>

                                {/* Right side */}
                                {isCompleted ? (
                                  <span className="shrink-0" style={{
                                    fontFamily: 'var(--font-family-inter)', fontSize: 10,
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: 'var(--success)',
                                    backgroundColor: 'color-mix(in srgb, var(--success) 12%, transparent)',
                                    padding: '2px 8px', borderRadius: 20,
                                  }}>Done</span>
                                ) : (
                                  <ChevronDown className="shrink-0" style={{ width: 14, height: 14, color: 'var(--muted-foreground)', strokeWidth: 2, transform: 'rotate(-90deg)' }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
