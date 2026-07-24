/**
 * Mistakes Review Screen
 */

import { useNavigate } from 'react-router';
import { ArrowLeft, X } from 'lucide-react';
import { motion } from 'motion/react';
import { StatusBar } from '../shared/premium-ui';

const MISTAKES = [
  {
    id: 1,
    exam: 'Quick Practice',
    date: '2 days ago',
    difficulty: 'Easy',
    question: 'A constant force acts on a mass of 2 kg for 3 seconds. The velocity changes from 0 to 15 m/s. Find the force applied.',
    yourAnswer: 'A',
    correctAnswer: 'B',
  },
  {
    id: 2,
    exam: 'Mock Test #4',
    date: '5 days ago',
    difficulty: 'Medium',
    question: 'Two blocks of mass m₁ and m₂ are connected by a massless string over a frictionless pulley. Find the acceleration.',
    yourAnswer: 'C',
    correctAnswer: 'A',
  },
  {
    id: 3,
    exam: 'PYQ Practice',
    date: '1 week ago',
    difficulty: 'Hard',
    question: 'A particle of mass m is placed on a smooth inclined plane of angle θ. A horizontal force F is applied to keep it stationary.',
    yourAnswer: 'B',
    correctAnswer: 'D',
  },
];

export function Component() {
  const navigate = useNavigate();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return { bg: 'var(--success-alpha-12)', text: 'var(--success-500)' };
      case 'Medium':
        return { bg: 'var(--warning-alpha-12)', text: 'var(--warning-500)' };
      case 'Hard':
        return { bg: 'var(--error-alpha-12)', text: 'var(--error-500)' };
      default:
        return { bg: 'var(--gray-alpha-12)', text: 'var(--gray-400)' };
    }
  };

  return (
    <div className="w-full flex flex-col" style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="sticky top-0 shrink-0" style={{ zIndex: 50, backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
        <StatusBar />
        
        <div className="flex items-center gap-3" style={{ height: 52, padding: '0 20px' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center justify-center cursor-pointer"
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
            }}
          >
            <ArrowLeft style={{ width: 24, height: 24, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
          </motion.button>

          <div className="flex-1">
            <h1 style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}>
              Mistakes
            </h1>
            <p style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 'var(--text-xs)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}>
              Newton's Second Law
            </p>
          </div>
        </div>
      </div>

      {/* Subtitle */}
      <div style={{ padding: '8px 20px' }}>
        <p style={{
          fontFamily: 'var(--font-family-inter)',
          fontSize: 'var(--text-xs)',
          color: 'var(--muted-foreground)',
          margin: 0,
        }}>
          {MISTAKES.length} questions you got wrong
        </p>
      </div>

      {/* Mistakes List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3" style={{ padding: '12px 20px 120px' }}>
        {MISTAKES.map((mistake) => {
          const difficultyColors = getDifficultyColor(mistake.difficulty);

          return (
            <motion.div
              key={mistake.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/practice/quick')}
              className="relative overflow-hidden cursor-pointer"
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0" style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, var(--gray-700) 50%, transparent 100%)' }} />

              {/* Header: Exam + Difficulty + Date */}
              <div className="flex items-center gap-[6px]" style={{ marginBottom: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--muted-foreground)',
                }}>
                  {mistake.exam}
                </span>

                <span style={{
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium)',
                  color: difficultyColors.text,
                  backgroundColor: difficultyColors.bg,
                  padding: '2px 6px',
                  borderRadius: 999,
                }}>
                  {mistake.difficulty}
                </span>

                <span style={{
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 10,
                  color: 'var(--muted-foreground)',
                  marginLeft: 'auto',
                }}>
                  {mistake.date}
                </span>
              </div>

              {/* Question Text */}
              <p style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.5,
                color: 'var(--foreground)',
                margin: '0 0 12px 0',
              }}>
                {mistake.question}
              </p>

              {/* Answer Info */}
              <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                <div className="flex items-center gap-1">
                  <X style={{ width: 12, height: 12, color: 'var(--error-500)', strokeWidth: 2.5 }} />
                  <span style={{
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--muted-foreground)',
                  }}>
                    Your answer: <span style={{ color: 'var(--error-500)', fontWeight: 'var(--font-weight-medium)' }}>{mistake.yourAnswer}</span>
                  </span>
                </div>

                <span style={{
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--muted-foreground)',
                }}>
                  Correct: <span style={{ color: 'var(--success-500)', fontWeight: 'var(--font-weight-medium)' }}>{mistake.correctAnswer}</span>
                </span>
              </div>

              {/* Action */}
              <span style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--primary)',
              }}>
                Review Solution →
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0" style={{ padding: '12px 20px 24px', background: 'linear-gradient(to top, var(--background) 70%, transparent)' }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/practice/quick')}
          className="w-full cursor-pointer"
          style={{
            padding: 12,
            background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary-700) 100%)',
            border: 'none',
            borderRadius: 10,
            boxShadow: 'var(--glow-primary-md)',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-family-inter)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--white)',
          }}>
            Practice All Mistakes
          </span>
        </motion.button>
      </div>
    </div>
  );
}