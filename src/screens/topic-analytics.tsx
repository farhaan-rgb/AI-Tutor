/**
 * Topic Analytics Screen - Complete analysis of student's strength in a topic
 * Shows prep score breakdown, performance metrics, weak areas, and recommendations
 */

import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Clock, Target, Zap, Award, AlertCircle, CheckCircle2, Brain, BarChart3 } from 'lucide-react';
import { StatusBar } from '../shared/premium-ui';
import { PageTransition } from '../shared/page-transition';

export function Component() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const DEFAULT_TOPIC = "Newton's Second Law";
  const topicName = searchParams.get('topic') || DEFAULT_TOPIC;

  const getRecIcon = (type: string) => {
    const style = { width: 16, height: 16, strokeWidth: 2 };
    if (type === 'practice') return <Target style={style} />;
    if (type === 'learn') return <Brain style={style} />;
    return <Clock style={style} />;
  };

  // TODO(api): GET /api/topics/:id/analytics
  const DUMMY_analytics = {
    prepScore: 68,
    scoreChange: 12, // positive = improvement
    totalAttempts: 45,
    correctAnswers: 32,
    accuracy: 71,
    averageTime: '1m 24s',
    fastestTime: '42s',
    slowestTime: '3m 15s',
    streak: 5,
    lastPracticed: '2 hours ago',
    
    // Breakdown by difficulty
    breakdown: [
      { difficulty: 'Easy', attempted: 18, correct: 16, accuracy: 89, color: 'var(--success)' },
      { difficulty: 'Medium', attempted: 20, correct: 13, accuracy: 65, color: 'var(--warning)' },
      { difficulty: 'Hard', attempted: 7, correct: 3, accuracy: 43, color: 'var(--destructive)' },
    ],
    
    // Strengths and weaknesses
    strengths: [
      'Calculating acceleration',
      'Force vector analysis',
      'Basic problem solving',
    ],
    weaknesses: [
      'Complex multi-body systems',
      'Time-based calculations',
      'Conceptual questions',
    ],
    
    // PYQ performance
    pyqStats: {
      attempted: 12,
      correct: 8,
      accuracy: 67,
    },
    
    // Recommendations
    recommendations: [
      { type: 'practice', text: 'Practice 10 more Hard problems to improve mastery' },
      { type: 'learn', text: 'Review Solved Examples for multi-body systems' },
      { type: 'speed', text: 'Focus on reducing time for Medium difficulty' },
    ],
  };

  return (
    <PageTransition>
      <div
        className="w-full min-h-screen relative"
        style={{
          backgroundColor: 'var(--background)',
        }}
      >
        {/* Fixed Header */}
        <div
          className="sticky top-0 left-0 right-0"
          style={{
            zIndex: 50,
            backgroundColor: 'var(--card)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <StatusBar />
          
          <div
            className="flex items-center gap-3 px-4"
            style={{
              height: 56,
              maxWidth: 1280,
              margin: '0 auto',
            }}
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: 44,
                height: 44,
                background: 'transparent',
                border: 'none',
              }}
            >
              <ArrowLeft style={{ width: 24, height: 24, color: 'var(--foreground)', strokeWidth: 2 }} />
            </motion.button>

            <div className="flex-1">
              <h1 style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)',
                margin: '0 0 2px 0',
              }}>
                Topic Analytics
              </h1>

              <div style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-xs)',
                color: 'var(--muted-foreground)',
              }}>
                {topicName}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          className="w-full px-4 py-5"
          style={{
            maxWidth: 1280,
            margin: '0 auto',
          }}
        >
          
          {/* Prep Score Card */}
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            border: '1px solid var(--border)',
          }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div style={{
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--muted-foreground)',
                  marginBottom: 8,
                }}>
                  Prep Score
                </div>
                <div style={{
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--foreground)',
                  lineHeight: 1,
                }}>
                  {DUMMY_analytics.prepScore}
                </div>
              </div>
              
              {/* Change indicator */}
              <div style={{
                display: 'inline-flex',
                padding: '4px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: DUMMY_analytics.scoreChange > 0 ? 'var(--success-alpha-12)' : 'var(--error-alpha-10)',
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: DUMMY_analytics.scoreChange > 0 ? 'var(--success)' : 'var(--error)',
              }}>
                {DUMMY_analytics.scoreChange > 0 ? '↑' : '↓'} {Math.abs(DUMMY_analytics.scoreChange)}%
              </div>
            </div>

            {/* Progress bar */}
            <div
              className="w-full overflow-hidden mb-3"
              style={{
                height: 8,
                backgroundColor: 'var(--muted)',
                borderRadius: 4,
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${DUMMY_analytics.prepScore}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  backgroundColor: 'var(--primary)',
                  borderRadius: 4,
                }}
              />
            </div>

            <div style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 'var(--text-xs)',
              color: 'var(--muted-foreground)',
            }}>
              Last practiced {DUMMY_analytics.lastPracticed}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div
            className="mb-5"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <StatCard
              icon={<Target style={{ width: 20, height: 20, color: 'var(--primary)', strokeWidth: 2 }} />}
              label="Accuracy"
              value={`${DUMMY_analytics.accuracy}%`}
            />
            <StatCard
              icon={<Clock style={{ width: 20, height: 20, color: 'var(--primary)', strokeWidth: 2 }} />}
              label="Avg Time"
              value={DUMMY_analytics.averageTime}
            />
            <StatCard
              icon={<CheckCircle2 style={{ width: 20, height: 20, color: 'var(--success)', strokeWidth: 2 }} />}
              label="Correct"
              value={`${DUMMY_analytics.correctAnswers}/${DUMMY_analytics.totalAttempts}`}
            />
            <StatCard
              icon={<Zap style={{ width: 20, height: 20, color: 'var(--warning)', strokeWidth: 2 }} />}
              label="Streak"
              value={`${DUMMY_analytics.streak} days`}
            />
          </div>

          {/* Difficulty Breakdown */}
          <div className="mb-5">
            <h2
              className="flex items-center gap-2 mb-3"
              style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: '0 0 12px 0',
              }}
            >
              <BarChart3 style={{ width: 16, height: 16, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
              Performance by Difficulty
            </h2>

            <div className="flex flex-col gap-3">
              {DUMMY_analytics.breakdown.map((item, index) => (
                <DifficultyBreakdownItem key={index} item={item} />
              ))}
            </div>
          </div>

          {/* PYQ Performance */}
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            border: '1px solid var(--border)',
          }}>
            <div className="flex items-center justify-between mb-3">
              <h2
                className="flex items-center gap-2"
                style={{
                  fontFamily: 'var(--font-family-inter)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                  margin: 0,
                }}
              >
                <Award style={{ width: 16, height: 16, color: 'var(--warning)', strokeWidth: 2 }} />
                PYQ Performance
              </h2>
              <div style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--foreground)',
              }}>
                {DUMMY_analytics.pyqStats.accuracy}%
              </div>
            </div>
            
            <div style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 'var(--text-xs)',
              color: 'var(--muted-foreground)',
            }}>
              {DUMMY_analytics.pyqStats.correct} correct out of {DUMMY_analytics.pyqStats.attempted} attempted
            </div>
          </div>

          {/* Strengths */}
          <div className="mb-5">
            <h2
              className="flex items-center gap-2"
              style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: '0 0 12px 0',
              }}
            >
              <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--success)', strokeWidth: 2 }} />
              Strengths
            </h2>

            <div className="flex flex-col gap-2">
              {DUMMY_analytics.strengths.map((strength, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--success-alpha-8)',
                    borderRadius: 8,
                    padding: 12,
                    borderLeft: '3px solid var(--success)',
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                  }}
                >
                  <CheckCircle2 style={{
                    width: 16,
                    height: 16,
                    color: 'var(--success)',
                    strokeWidth: 2.5,
                    flexShrink: 0,
                  }} />
                  {strength}
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="mb-5">
            <h2
              className="flex items-center gap-2"
              style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: '0 0 12px 0',
              }}
            >
              <AlertCircle style={{ width: 16, height: 16, color: 'var(--destructive)', strokeWidth: 2 }} />
              Areas to Improve
            </h2>

            <div className="flex flex-col gap-2">
              {DUMMY_analytics.weaknesses.map((weakness, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--error-alpha-8)',
                    borderRadius: 8,
                    padding: 12,
                    borderLeft: '3px solid var(--destructive)',
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--foreground)',
                  }}
                >
                  <AlertCircle style={{
                    width: 16,
                    height: 16,
                    color: 'var(--destructive)',
                    strokeWidth: 2.5,
                    flexShrink: 0,
                  }} />
                  {weakness}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-5">
            <h2
              className="flex items-center gap-2"
              style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: '0 0 12px 0',
              }}
            >
              <Brain style={{ width: 16, height: 16, color: 'var(--primary)', strokeWidth: 2 }} />
              Recommendations
            </h2>

            <div className="flex flex-col gap-2">
              {DUMMY_analytics.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3"
                  style={{
                    backgroundColor: 'var(--card)',
                    borderRadius: 8,
                    padding: 12,
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--foreground)',
                  }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: 'var(--muted)',
                      color: 'var(--primary)',
                    }}
                  >
                    {getRecIcon(rec.type)}
                  </div>
                  <div className="flex-1 pt-1">
                    {rec.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}

// Stat Card Component
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--card)',
      borderRadius: 12,
      padding: 16,
      border: '1px solid var(--border)',
    }}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span style={{
          fontFamily: 'var(--font-family-inter)',
          fontSize: 'var(--text-xs)',
          color: 'var(--muted-foreground)',
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontFamily: 'var(--font-family-inter)',
        fontSize: 'var(--text-xl)',
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--foreground)',
      }}>
        {value}
      </div>
    </div>
  );
}

interface BreakdownItem {
  difficulty: string;
  attempted: number;
  correct: number;
  accuracy: number;
  color: string;
}

// Difficulty Breakdown Item
function DifficultyBreakdownItem({ item }: { item: BreakdownItem }) {
  return (
    <div style={{
      backgroundColor: 'var(--card)',
      borderRadius: 12,
      padding: 16,
      border: '1px solid var(--border)',
    }}>
      <div className="flex items-center justify-between mb-3">
        <div style={{
          fontFamily: 'var(--font-family-inter)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
        }}>
          {item.difficulty}
        </div>
        <div style={{
          fontFamily: 'var(--font-family-inter)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-weight-bold)',
          color: item.color,
        }}>
          {item.accuracy}%
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="w-full overflow-hidden mb-2"
        style={{
          height: 8,
          backgroundColor: 'var(--muted)',
          borderRadius: 4,
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${item.accuracy}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          style={{
            height: '100%',
            backgroundColor: item.color,
            borderRadius: 4,
          }}
        />
      </div>

      <div style={{
        fontFamily: 'var(--font-family-inter)',
        fontSize: 'var(--text-xs)',
        color: 'var(--muted-foreground)',
      }}>
        {item.correct}/{item.attempted} correct
      </div>
    </div>
  );
}