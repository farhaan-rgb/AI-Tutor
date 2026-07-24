/**
 * Exam & Subject Selector Component
 * Allows users to switch between exams and subjects in the learning path
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { useUserPreferences } from '../app/hooks/use-user-preferences';
import { EXAM_CONFIGS } from '../app/data/exam-config';

interface ExamSubjectSelectorProps {
  selectedSubject: string;
  onSubjectChange: (subjectId: string) => void;
}

export function ExamSubjectSelector({ selectedSubject, onSubjectChange }: ExamSubjectSelectorProps) {
  const { examConfig, selectedLanguage, supportsMultipleLanguages, setLanguage } = useUserPreferences();
  const [showSubjects, setShowSubjects] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  if (!examConfig) return null;

  const currentSubject = examConfig.subjects.find(s => s.id === selectedSubject) || examConfig.subjects[0];
  const currentLanguage = examConfig.languages.find(l => l.code === selectedLanguage) || examConfig.languages[0];

  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Subject Selector */}
        <div style={{ position: 'relative', flex: 1 }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSubjects(!showSubjects)}
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              fontFamily: 'var(--font-family-inter)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{currentSubject?.icon}</span>
              <span>{currentSubject?.name || 'Select Subject'}</span>
            </div>
            <motion.div
              animate={{ rotate: showSubjects ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown style={{ width: 16, height: 16 }} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {showSubjects && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSubjects(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                  }}
                />
                
                {/* Dropdown */}
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: 'var(--elevation-sm)',
                    overflow: 'hidden',
                    zIndex: 101,
                  }}
                >
                  {examConfig.subjects.map((subject) => (
                    <motion.button
                      key={subject.id}
                      whileHover={{ backgroundColor: 'var(--muted)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onSubjectChange(subject.id);
                        setShowSubjects(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        border: 'none',
                        background: subject.id === selectedSubject ? 'var(--muted)' : 'transparent',
                        fontFamily: 'var(--font-family-inter)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--foreground)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{subject.icon}</span>
                      <span>{subject.name}</span>
                      {subject.id === selectedSubject && (
                        <Check style={{ marginLeft: 'auto', width: 18, height: 18, color: 'var(--primary)', strokeWidth: 3 }} />
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Language Selector - Only if exam supports multiple languages */}
        {supportsMultipleLanguages && (
          <div style={{ position: 'relative' }}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLanguages(!showLanguages)}
              style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                cursor: 'pointer',
              }}
            >
              <Globe style={{ width: 18, height: 18, color: 'var(--foreground)' }} />
            </motion.button>

            <AnimatePresence>
              {showLanguages && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowLanguages(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 100,
                    }}
                  />
                  
                  {/* Dropdown */}
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 4,
                      minWidth: 180,
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-card)',
                      boxShadow: 'var(--elevation-sm)',
                      overflow: 'hidden',
                      zIndex: 101,
                    }}
                  >
                    {examConfig.languages.map((language) => (
                      <motion.button
                        key={language.code}
                        whileHover={{ backgroundColor: 'var(--muted)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setLanguage(language.code);
                          setShowLanguages(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: 'none',
                          background: language.code === selectedLanguage ? 'var(--muted)' : 'transparent',
                          fontFamily: 'var(--font-family-inter)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-normal)',
                          color: 'var(--foreground)',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          textAlign: 'left',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{language.nativeName}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>{language.name}</div>
                        </div>
                        {language.code === selectedLanguage && (
                          <Check style={{ width: 18, height: 18, color: 'var(--primary)', strokeWidth: 3 }} />
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Exam name display */}
      <div style={{
        marginTop: 8,
        fontFamily: 'var(--font-family-inter)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--font-weight-normal)',
        color: 'var(--muted-foreground)',
        textAlign: 'center',
      }}>
        {examConfig.name} 
        {supportsMultipleLanguages && ` • ${currentLanguage?.nativeName}`}
      </div>
    </div>
  );
}