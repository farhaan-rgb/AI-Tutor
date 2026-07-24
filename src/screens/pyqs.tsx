/**
 * PYQs (Previous Year Questions) — End-to-End Flow
 * Views: list → solve → explanation → summary
 */

import { useNavigate } from 'react-router';
import { ArrowLeft, Check, X, ChevronRight, Clock, Trophy, RotateCcw, BookOpen, Star, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBar } from '../shared/premium-ui';
import { useState, useEffect, useRef } from 'react';

// ─── Data ─────────────────────────────────────────────────────────────────────

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Status = 'unattempted' | 'correct' | 'incorrect';

interface Question {
  id: number;
  exam: string;
  difficulty: Difficulty;
  question: string;
  options: string[];
  correct: number; // 0-indexed
  explanation: string;
  status: Status;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    exam: 'JEE Main 2025 (Jan)',
    difficulty: 'Easy',
    question: 'A constant force acts on a mass of 2 kg for 3 seconds. The velocity changes from 0 to 15 m/s. Find the force applied.',
    options: ['5 N', '10 N', '15 N', '20 N'],
    correct: 1,
    explanation: 'Using Newton\'s 2nd law: F = ma. Acceleration a = Δv/t = 15/3 = 5 m/s². Therefore F = 2 × 5 = 10 N.',
    status: 'unattempted',
  },
  {
    id: 2,
    exam: 'JEE Main 2024 (Apr)',
    difficulty: 'Medium',
    question: 'Two blocks of masses m₁ and m₂ are connected by a massless string over a frictionless pulley (Atwood machine). Find the acceleration of the system.',
    options: [
      '(m₁ + m₂)g / (m₁ − m₂)',
      '(m₁ − m₂)g / (m₁ + m₂)',
      'g / 2',
      '(m₁ × m₂)g / (m₁ + m₂)',
    ],
    correct: 1,
    explanation: 'For the Atwood machine, net force = (m₁ − m₂)g, total mass = m₁ + m₂. By Newton\'s 2nd law, a = (m₁ − m₂)g / (m₁ + m₂).',
    status: 'correct',
  },
  {
    id: 3,
    exam: 'JEE Advanced 2023',
    difficulty: 'Hard',
    question: 'A particle of mass m is placed on a smooth inclined plane of angle θ. A horizontal force F is applied to keep it stationary. Find F.',
    options: ['mg sin θ', 'mg cos θ', 'mg tan θ', 'mg / tan θ'],
    correct: 2,
    explanation: 'Resolving forces along and perpendicular to the incline, and solving for equilibrium: the horizontal force F must equal mg tan θ. The normal force adjusts accordingly.',
    status: 'unattempted',
  },
  {
    id: 4,
    exam: 'JEE Main 2022 (Jul)',
    difficulty: 'Medium',
    question: 'A body of mass 5 kg is acted upon by two perpendicular forces 12 N and 5 N. Find the magnitude of its acceleration.',
    options: ['1.2 m/s²', '2.0 m/s²', '2.6 m/s²', '3.4 m/s²'],
    correct: 2,
    explanation: 'Net force = √(12² + 5²) = √(144 + 25) = √169 = 13 N. Acceleration = F/m = 13/5 = 2.6 m/s².',
    status: 'unattempted',
  },
  {
    id: 5,
    exam: 'JEE Main 2021 (Feb)',
    difficulty: 'Easy',
    question: 'The momentum of a body is increased by 50%. By what percentage does its kinetic energy increase?',
    options: ['50%', '100%', '125%', '225%'],
    correct: 2,
    explanation: 'KE = p²/2m. New p = 1.5p₀, so new KE = (1.5)² × KE₀ = 2.25 × KE₀. Increase = 125%.',
    status: 'unattempted',
  },
];

const YEARS = ['All Years', '2025', '2024', '2023', '2022', '2021'];
const QUESTION_TIME = 60; // seconds per question

// ─── Difficulty colors ────────────────────────────────────────────────────────

function diffColor(difficulty: Difficulty) {
  if (difficulty === 'Easy') return { bg: 'rgba(82,196,26,0.12)', text: 'var(--success, #52c41a)' };
  if (difficulty === 'Medium') return { bg: 'rgba(250,173,20,0.12)', text: 'var(--warning, #faad14)' };
  return { bg: 'rgba(255,77,79,0.12)', text: 'var(--error, #ff4d4f)' };
}

// ─── Session state ────────────────────────────────────────────────────────────

interface SessionAnswer {
  questionId: number;
  selected: number | null; // null = skipped
  correct: boolean;
  timeSpent: number;
}

// ─── Views ────────────────────────────────────────────────────────────────────

type View = 'list' | 'solve' | 'explanation' | 'summary';

// ─── Solve View ───────────────────────────────────────────────────────────────

function SolveView({
  question,
  index,
  total,
  onSubmit,
  onSkip,
}: {
  question: Question;
  index: number;
  total: number;
  onSubmit: (selected: number, timeSpent: number) => void;
  onSkip: (timeSpent: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const startTime = useRef(Date.now());

  useEffect(() => {
    setSelected(null);
    setTimeLeft(QUESTION_TIME);
    startTime.current = Date.now();
  }, [question.id]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onSkip(Math.round((Date.now() - startTime.current) / 1000));
      return;
    }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, question.id]);

  const timePercent = (timeLeft / QUESTION_TIME) * 100;
  const timerColor = timeLeft > 20 ? 'var(--success, #52c41a)' : timeLeft > 10 ? '#f59e0b' : 'var(--error, #ff4d4f)';
  const dc = diffColor(question.difficulty);

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="flex flex-col flex-1 gap-4"
      style={{ padding: '16px 20px 24px' }}
    >
      {/* Progress + Timer row */}
      <div className="flex items-center gap-3">
        {/* Question dots */}
        <div className="flex-1 flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                height: 4, borderRadius: 2,
                background: i < index ? 'var(--success, #52c41a)' : i === index ? 'var(--primary)' : 'var(--border)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="relative shrink-0" style={{ width: 40, height: 40 }}>
          <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border)" strokeWidth="3" />
            <motion.circle
              cx="20" cy="20" r="16" fill="none"
              stroke={timerColor}
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16}`}
              animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - timePercent / 100) }}
              transition={{ duration: 0.5, ease: 'linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: 'var(--font-family-inter)', fontSize: 11, fontWeight: 700, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Question card */}
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: '16px', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-[6px]" style={{ marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 11, color: 'var(--muted-foreground)' }}>{question.exam}</span>
          <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 10, fontWeight: 600, color: dc.text, background: dc.bg, padding: '2px 6px', borderRadius: 999 }}>{question.difficulty}</span>
          <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 11, color: 'var(--muted-foreground)', marginLeft: 'auto' }}>Q{index + 1}/{total}</span>
        </div>
        <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 15, lineHeight: 1.6, color: 'var(--foreground)', margin: 0 }}>
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-[10px]">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(i)}
              className="w-full flex items-center gap-3 cursor-pointer"
              style={{
                padding: '14px 16px', borderRadius: 14,
                border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                background: isSelected ? 'color-mix(in srgb, var(--primary) 10%, var(--card))' : 'var(--card)',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div className="flex items-center justify-center shrink-0" style={{
                width: 26, height: 26, borderRadius: '50%',
                border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                background: isSelected ? 'var(--primary)' : 'transparent',
                fontFamily: 'var(--font-family-inter)', fontSize: 12, fontWeight: 700,
                color: isSelected ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}>
                {String.fromCharCode(65 + i)}
              </div>
              <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 14, fontWeight: 500, color: 'var(--foreground)' }}>{opt}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-[10px]" style={{ marginTop: 'auto' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onSkip(Math.round((Date.now() - startTime.current) / 1000))}
          className="flex-1 cursor-pointer"
          style={{ padding: '13px', background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 12, fontFamily: 'var(--font-family-inter)', fontSize: 14, fontWeight: 600, color: 'var(--muted-foreground)' }}
        >
          Skip
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (selected !== null) onSubmit(selected, Math.round((Date.now() - startTime.current) / 1000));
          }}
          className="flex-[2]"
          style={{
            padding: '13px', background: selected !== null ? 'var(--primary)' : 'var(--secondary)',
            border: 'none', borderRadius: 12, cursor: selected !== null ? 'pointer' : 'default',
            fontFamily: 'var(--font-family-inter)', fontSize: 14, fontWeight: 700,
            color: selected !== null ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
            boxShadow: selected !== null ? 'var(--glow-primary)' : 'none',
            opacity: selected !== null ? 1 : 0.6, transition: 'all 0.2s ease',
          }}
        >
          Submit Answer
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Explanation View ─────────────────────────────────────────────────────────

function ExplanationView({
  question,
  answer,
  isLast,
  onNext,
  onSummary,
}: {
  question: Question;
  answer: SessionAnswer;
  isLast: boolean;
  onNext: () => void;
  onSummary: () => void;
}) {
  const isCorrect = answer.correct;
  const isSkipped = answer.selected === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="flex flex-col flex-1 gap-4"
      style={{ padding: '16px 20px 32px' }}
    >
      {/* Result banner */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        style={{
          padding: '16px 20px', borderRadius: 16,
          background: isSkipped
            ? 'rgba(100,100,100,0.1)'
            : isCorrect
            ? 'rgba(82,196,26,0.12)'
            : 'rgba(255,77,79,0.1)',
          border: isSkipped
            ? '1px solid var(--border)'
            : isCorrect
            ? '1.5px solid rgba(82,196,26,0.3)'
            : '1.5px solid rgba(255,77,79,0.3)',
        }}
        className="flex items-center gap-[14px]"
      >
        <div className="flex items-center justify-center shrink-0" style={{
          width: 44, height: 44, borderRadius: '50%',
          background: isSkipped ? 'var(--secondary)' : isCorrect ? 'rgba(82,196,26,0.2)' : 'rgba(255,77,79,0.15)',
        }}>
          {isSkipped
            ? <Clock style={{ width: 22, height: 22, color: 'var(--muted-foreground)' }} />
            : isCorrect
            ? <Check style={{ width: 22, height: 22, color: 'var(--success, #52c41a)', strokeWidth: 3 }} />
            : <X style={{ width: 22, height: 22, color: 'var(--error, #ff4d4f)', strokeWidth: 3 }} />}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 17, fontWeight: 700, color: 'var(--foreground)', marginBottom: 2 }}>
            {isSkipped ? 'Skipped' : isCorrect ? 'Correct!' : 'Incorrect'}
          </div>
          <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 12, color: 'var(--muted-foreground)' }}>
            {isSkipped ? 'You ran out of time' : isCorrect ? `+20 XP · ${answer.timeSpent}s` : `Correct: Option ${String.fromCharCode(65 + question.correct)}`}
          </div>
        </div>
      </motion.div>

      {/* Options with reveal */}
      <div className="flex flex-col gap-2">
        {question.options.map((opt, i) => {
          const isCorrectOpt = i === question.correct;
          const isSelectedWrong = answer.selected === i && !isCorrect;
          const bg = isCorrectOpt
            ? 'rgba(82,196,26,0.12)'
            : isSelectedWrong
            ? 'rgba(255,77,79,0.1)'
            : 'var(--card)';
          const border = isCorrectOpt
            ? '1.5px solid rgba(82,196,26,0.5)'
            : isSelectedWrong
            ? '1.5px solid rgba(255,77,79,0.4)'
            : '1px solid var(--border)';

          return (
            <div
              key={i}
              className="flex items-center gap-[10px]"
              style={{ padding: '12px 14px', borderRadius: 12, background: bg, border }}
            >
              <div className="flex items-center justify-center shrink-0" style={{
                width: 24, height: 24, borderRadius: '50%',
                background: isCorrectOpt ? 'rgba(82,196,26,0.2)' : isSelectedWrong ? 'rgba(255,77,79,0.15)' : 'var(--secondary)',
                fontFamily: 'var(--font-family-inter)', fontSize: 11, fontWeight: 700,
                color: isCorrectOpt ? 'var(--success, #52c41a)' : isSelectedWrong ? 'var(--error, #ff4d4f)' : 'var(--muted-foreground)',
              }}>
                {String.fromCharCode(65 + i)}
              </div>
              <span className="flex-1" style={{ fontFamily: 'var(--font-family-inter)', fontSize: 13, fontWeight: isCorrectOpt ? 600 : 500, color: 'var(--foreground)' }}>{opt}</span>
              {isCorrectOpt && <Check className="shrink-0" style={{ width: 14, height: 14, color: 'var(--success, #52c41a)', strokeWidth: 3 }} />}
              {isSelectedWrong && <X className="shrink-0" style={{ width: 14, height: 14, color: 'var(--error, #ff4d4f)', strokeWidth: 3 }} />}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      <div style={{ background: 'color-mix(in srgb, var(--primary) 6%, var(--card))', border: '1px solid color-mix(in srgb, var(--primary) 20%, var(--border))', borderRadius: 14, padding: '14px 16px' }}>
        <div className="flex items-center gap-[6px]" style={{ marginBottom: 8 }}>
          <BookOpen className="shrink-0" style={{ width: 14, height: 14, color: 'var(--primary)' }} />
          <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Explanation</span>
        </div>
        <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 14, lineHeight: 1.65, color: 'var(--foreground)', margin: 0 }}>
          {question.explanation}
        </p>
      </div>

      {/* Next / Summary */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={isLast ? onSummary : onNext}
        className="w-full flex items-center justify-center gap-2 cursor-pointer"
        style={{
          padding: '15px', background: 'var(--primary)',
          color: 'var(--primary-foreground)', border: 'none', borderRadius: 14,
          fontFamily: 'var(--font-family-inter)', fontSize: 15, fontWeight: 700,
          boxShadow: 'var(--glow-primary)', marginTop: 'auto',
        }}
      >
        {isLast ? 'See Results' : 'Next Question'}
        <ChevronRight style={{ width: 18, height: 18, strokeWidth: 2.5 }} />
      </motion.button>
    </motion.div>
  );
}

// ─── Summary View ─────────────────────────────────────────────────────────────

function SummaryView({
  questions,
  answers,
  onRetry,
  onBack,
}: {
  questions: Question[];
  answers: SessionAnswer[];
  onRetry: () => void;
  onBack: () => void;
}) {
  const correct = answers.filter(a => a.correct).length;
  const skipped = answers.filter(a => a.selected === null).length;
  const incorrect = answers.length - correct - skipped;
  const accuracy = Math.round((correct / answers.length) * 100);
  const totalTime = answers.reduce((s, a) => s + a.timeSpent, 0);
  const xpEarned = correct * 20;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="flex flex-col flex-1 overflow-y-auto gap-[14px]"
      style={{ padding: '16px 20px 32px' }}
    >
      {/* Score card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, var(--card)) 0%, var(--card) 100%)',
          border: '1px solid color-mix(in srgb, var(--primary) 25%, var(--border))',
          borderRadius: 20, padding: '24px 20px', textAlign: 'center',
        }}
      >
        <Trophy style={{ width: 40, height: 40, color: '#f59e0b', margin: '0 auto 12px' }} />
        <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 44, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1 }}>
          {correct}<span style={{ fontSize: 24, color: 'var(--muted-foreground)' }}>/{questions.length}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 15, color: 'var(--muted-foreground)', marginTop: 4 }}>
          {accuracy}% accuracy
        </div>

        {/* XP earned */}
        {xpEarned > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
            className="inline-flex items-center gap-[6px]"
            style={{ marginTop: 14, padding: '8px 18px', background: 'linear-gradient(135deg, #f59e0b, var(--warning, #d97706))', borderRadius: 999 }}
          >
            <Star style={{ width: 14, height: 14, color: '#fff' }} />
            <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 14, fontWeight: 700, color: '#fff' }}>+{xpEarned} XP</span>
          </motion.div>
        )}
      </motion.div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Correct', value: correct, color: 'var(--success, #52c41a)' },
          { label: 'Incorrect', value: incorrect, color: 'var(--error, #ff4d4f)' },
          { label: 'Skipped', value: skipped, color: 'var(--muted-foreground)' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Time */}
      <div className="flex items-center gap-2" style={{ padding: '12px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>
        <Clock style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
        <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 13, color: 'var(--muted-foreground)' }}>Total time</span>
        <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginLeft: 'auto' }}>
          {Math.floor(totalTime / 60)}m {totalTime % 60}s
        </span>
      </div>

      {/* Per-question breakdown */}
      <div>
        <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>Question Breakdown</p>
        <div className="flex flex-col gap-[7px]">
          {questions.map((q, i) => {
            const ans = answers[i];
            const isCorrect = ans?.correct;
            const isSkipped = ans?.selected === null;
            const dc = diffColor(q.difficulty);
            return (
              <div key={q.id} className="flex items-center gap-[10px]" style={{ padding: '10px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <div className="flex items-center justify-center shrink-0" style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: isSkipped ? 'var(--secondary)' : isCorrect ? 'rgba(82,196,26,0.15)' : 'rgba(255,77,79,0.12)',
                }}>
                  {isSkipped
                    ? <AlertCircle style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }} />
                    : isCorrect
                    ? <Check style={{ width: 14, height: 14, color: 'var(--success, #52c41a)', strokeWidth: 3 }} />
                    : <X style={{ width: 14, height: 14, color: 'var(--error, #ff4d4f)', strokeWidth: 3 }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</p>
                </div>
                <span className="shrink-0" style={{ fontFamily: 'var(--font-family-inter)', fontSize: 10, fontWeight: 600, color: dc.text, background: dc.bg, padding: '2px 6px', borderRadius: 999 }}>{q.difficulty}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-[10px]" style={{ marginTop: 4 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-[6px] cursor-pointer"
          style={{ padding: '13px', background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 12, fontFamily: 'var(--font-family-inter)', fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}
        >
          <RotateCcw style={{ width: 14, height: 14, strokeWidth: 2.5 }} />
          Retry
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="flex-[2] cursor-pointer"
          style={{ padding: '13px', background: 'var(--primary)', border: 'none', borderRadius: 12, fontFamily: 'var(--font-family-inter)', fontSize: 14, fontWeight: 700, color: 'var(--primary-foreground)', boxShadow: 'var(--glow-primary)' }}
        >
          Back to PYQs
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Component({ embedded }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('list');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);

  const filteredQuestions = selectedYear === 'All Years'
    ? QUESTIONS
    : QUESTIONS.filter(q => q.exam.includes(selectedYear));

  const startSession = (questionsToUse: Question[]) => {
    setSessionQuestions(questionsToUse);
    setCurrentQIndex(0);
    setAnswers([]);
    setView('solve');
  };

  const handleSubmit = (selected: number, timeSpent: number) => {
    const q = sessionQuestions[currentQIndex];
    const isCorrect = selected === q.correct;
    const ans: SessionAnswer = { questionId: q.id, selected, correct: isCorrect, timeSpent };
    setAnswers(prev => [...prev, ans]);
    setView('explanation');
  };

  const handleSkip = (timeSpent: number) => {
    const q = sessionQuestions[currentQIndex];
    const ans: SessionAnswer = { questionId: q.id, selected: null, correct: false, timeSpent };
    setAnswers(prev => [...prev, ans]);
    setView('explanation');
  };

  const handleNext = () => {
    if (currentQIndex + 1 < sessionQuestions.length) {
      setCurrentQIndex(i => i + 1);
      setView('solve');
    } else {
      setView('summary');
    }
  };

  const handleRetry = () => {
    setCurrentQIndex(0);
    setAnswers([]);
    setView('solve');
  };

  const handleBackToList = () => {
    setView('list');
    setSessionQuestions([]);
    setCurrentQIndex(0);
    setAnswers([]);
  };

  // ─ List View ─────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div className="w-full flex flex-col" style={{ minHeight: embedded ? 'auto' : '100vh', backgroundColor: 'var(--background)' }}>
        {!embedded && (
          <div className="sticky top-0 left-0 right-0 shrink-0" style={{ zIndex: 50, backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
            <StatusBar />
            <div className="flex items-center gap-3" style={{ height: 52, padding: '0 20px' }}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(-1)} className="flex items-center cursor-pointer" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                <ArrowLeft style={{ width: 24, height: 24, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
              </motion.button>
              <div className="flex-1">
                <h1 style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>PYQs</h1>
                <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', margin: 0 }}>Newton's Second Law</p>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: '8px 20px' }}>
          <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', margin: 0 }}>
            {filteredQuestions.length} questions from JEE 2021–2025
          </p>
        </div>

        {/* Year filter */}
        <div className="flex overflow-x-auto gap-2" style={{ padding: '8px 0', paddingLeft: 20, paddingRight: 20 }}>
          {YEARS.map(year => {
            const isSelected = selectedYear === year;
            return (
              <motion.button
                key={year} whileTap={{ scale: 0.95 }} onClick={() => setSelectedYear(year)}
                className="shrink-0 cursor-pointer"
                style={{ padding: '6px 12px', backgroundColor: isSelected ? 'var(--primary)' : 'var(--card)', border: isSelected ? 'none' : '1px solid var(--border)', borderRadius: 999 }}
              >
                <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: isSelected ? 'var(--white)' : 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                  {year}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Questions list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3" style={{ padding: '12px 20px 120px' }}>
          {filteredQuestions.map(question => {
            const dc = diffColor(question.difficulty);
            const isCorrect = question.status === 'correct';
            return (
              <motion.div
                key={question.id} whileTap={{ scale: 0.98 }}
                onClick={() => startSession([question])}
                style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              >
                <div className="absolute top-0 left-0 right-0" style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, var(--gray-700, #374151) 50%, transparent 100%)' }} />

                <div className="flex items-center gap-[6px]" style={{ marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>{question.exam}</span>
                  <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 10, fontWeight: 600, color: dc.text, backgroundColor: dc.bg, padding: '2px 6px', borderRadius: 999 }}>{question.difficulty}</span>
                  {isCorrect && (
                    <span className="flex items-center gap-[3px]" style={{ marginLeft: 'auto' }}>
                      <Check style={{ width: 11, height: 11, color: 'var(--success, #52c41a)', strokeWidth: 2.5 }} />
                      <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 10, color: 'var(--success, #52c41a)', fontWeight: 600 }}>Done</span>
                    </span>
                  )}
                </div>

                <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.5, color: 'var(--foreground)', margin: '0 0 12px' }}>
                  {question.question}
                </p>

                <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: isCorrect ? 'var(--muted-foreground)' : 'var(--primary)' }}>
                  {isCorrect ? 'Review →' : 'Attempt →'}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0" style={{ padding: '12px 20px 24px', background: 'linear-gradient(to top, var(--background) 70%, transparent)' }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => startSession(filteredQuestions)}
            className="w-full cursor-pointer"
            style={{ padding: 12, background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-700, var(--primary)) 100%)', border: 'none', borderRadius: 10, boxShadow: 'var(--glow-primary-md, var(--glow-primary))' }}
          >
            <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--white)' }}>
              Start All PYQs ({filteredQuestions.length})
            </span>
          </motion.button>
        </div>
      </div>
    );
  }

  // ─ Solve / Explanation / Summary share a full-screen layout ──────────────

  return (
    <div className="w-full flex flex-col" style={{ minHeight: embedded ? 'auto' : '100vh', backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="sticky top-0 left-0 right-0 shrink-0" style={{ zIndex: 50, backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
        {!embedded && <StatusBar />}
        <div className="flex items-center gap-3" style={{ height: 52, padding: '0 20px' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToList}
            className="flex items-center cursor-pointer"
            style={{ background: 'transparent', border: 'none', padding: 0 }}
          >
            <ArrowLeft style={{ width: 24, height: 24, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
          </motion.button>
          <div className="flex-1">
            <h1 style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
              {view === 'summary' ? 'Results' : `Question ${currentQIndex + 1} of ${sessionQuestions.length}`}
            </h1>
          </div>
          {view !== 'summary' && (
            <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 12, color: 'var(--muted-foreground)' }}>
              {answers.filter(a => a.correct).length} correct
            </span>
          )}
        </div>
      </div>

      {/* View content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'solve' && (
            <SolveView
              key={`solve-${currentQIndex}`}
              question={sessionQuestions[currentQIndex]}
              index={currentQIndex}
              total={sessionQuestions.length}
              onSubmit={handleSubmit}
              onSkip={handleSkip}
            />
          )}
          {view === 'explanation' && (
            <ExplanationView
              key={`explanation-${currentQIndex}`}
              question={sessionQuestions[currentQIndex]}
              answer={answers[answers.length - 1]}
              isLast={currentQIndex === sessionQuestions.length - 1}
              onNext={handleNext}
              onSummary={() => setView('summary')}
            />
          )}
          {view === 'summary' && (
            <SummaryView
              key="summary"
              questions={sessionQuestions}
              answers={answers}
              onRetry={handleRetry}
              onBack={handleBackToList}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
