import { useNavigate } from "react-router";
import { ArrowLeft, TrendingUp, Clock, Target, Award } from "lucide-react";
import { motion } from "motion/react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";

/**
 * Analytics Screen
 * Shows detailed study analytics and performance metrics
 */
export function Component() {
  const navigate = useNavigate();

  // TODO(api): GET /api/analytics/subjects
  const DUMMY_subjectProgress = [
    { subject: "Physics", progress: 68, color: "var(--physics)" },
    { subject: "Chemistry", progress: 54, color: "var(--chemistry)" },
    { subject: "Mathematics", progress: 72, color: "var(--mathematics)" },
  ];

  // TODO(api): GET /api/analytics/weekly
  const DUMMY_weeklyActivity = [
    { day: "Mon", hours: 3.5 },
    { day: "Tue", hours: 4.2 },
    { day: "Wed", hours: 2.8 },
    { day: "Thu", hours: 4.5 },
    { day: "Fri", hours: 3.9 },
    { day: "Sat", hours: 5.2 },
    { day: "Sun", hours: 1.5 },
  ];

  const maxHours = Math.max(...DUMMY_weeklyActivity.map(d => d.hours));

  return (
    <div className="flex flex-col" style={{ height: "100vh", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      {/* Header */}
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, padding: "0 20px", gap: 12 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex items-center justify-center shrink-0"
            style={{ width: 44, height: 44, borderRadius: "var(--radius)", color: "var(--muted-foreground)", background: "transparent", border: "none" }}
          >
            <ArrowLeft style={{ width: 20, height: 20, strokeWidth: 1.5 }} />
          </motion.button>
          <span style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-lg)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
          }}>Analytics</span>
        </div>
      </GlassHeader>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-y-auto gap-6" style={{ padding: "20px" }}>
        {/* Stats Grid — TODO(api): GET /api/analytics/summary */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard icon={Clock} label="Study Time" value="25.6 hrs" subtitle="This week" color="var(--primary-500)" />
          <MetricCard icon={Target} label="Questions" value="342" subtitle="Solved" color="var(--success-500)" />
          <MetricCard icon={Award} label="Accuracy" value="78%" subtitle="Overall" color="var(--warning-500)" />
          <MetricCard icon={TrendingUp} label="Streak" value="7 days" subtitle="Current" color="var(--chemistry)" />
        </div>

        {/* Weekly Activity Chart */}
        <div className="flex flex-col gap-3">
          <span style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
          }}>Weekly Activity</span>
          <div style={{
            padding: "16px",
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}>
            <div
              role="img"
              aria-label="Weekly study activity chart"
              className="flex items-end justify-between"
              style={{ height: 120, gap: 8 }}
            >
              {DUMMY_weeklyActivity.map((day, i) => {
                const heightPercent = (day.hours / maxHours) * 100;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 gap-1">
                    <div className="flex flex-col items-center justify-end" style={{ height: 80, width: "100%" }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        style={{
                          width: "100%",
                          backgroundColor: day.hours === maxHours ? "var(--primary-500)" : "var(--primary-alpha-20)",
                          borderRadius: "var(--radius)",
                          minHeight: 8,
                        }}
                      />
                    </div>
                    <span style={{
                      fontFamily: "var(--font-family-inter)",
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--font-weight-normal)",
                      color: "var(--muted-foreground)",
                    }}>{day.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Subject Progress */}
        <div className="flex flex-col gap-3">
          <span style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
          }}>Subject Progress</span>
          <div className="flex flex-col gap-3">
            {DUMMY_subjectProgress.map((item, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span style={{
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-weight-medium)",
                    color: "var(--foreground)",
                  }}>{item.subject}</span>
                  <span style={{
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: item.color,
                  }}>{item.progress}%</span>
                </div>
                <div style={{
                  height: 8,
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--muted)",
                  overflow: "hidden",
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                    style={{
                      height: "100%",
                      backgroundColor: item.color,
                      borderRadius: "var(--radius-full)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div style={{
          padding: "16px",
          borderRadius: "var(--radius-card)",
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}>
          <div className="flex flex-col gap-3">
            <span style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--foreground)",
            }}>Performance Summary</span>
            <div className="flex flex-col gap-2">
              <SummaryRow label="Tests Taken" value="12" />
              <SummaryRow label="Average Score" value="78.5%" />
              <SummaryRow label="Highest Score" value="94%" />
              <SummaryRow label="Topics Mastered" value="24/42" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, subtitle, color }: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-2" style={{
      padding: "16px",
      borderRadius: "var(--radius-card)",
      backgroundColor: "var(--card)",
      border: "1px solid var(--border)",
    }}>
      <div className="flex items-center justify-center" style={{
        width: 32,
        height: 32,
        borderRadius: "var(--radius)",
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}>
        <Icon style={{ width: 16, height: 16, color, strokeWidth: 2 }} />
      </div>
      <div className="flex flex-col gap-[2px]">
        <span style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-xl)",
          fontWeight: "var(--font-weight-bold)",
          color: "var(--foreground)",
        }}>{value}</span>
        <span style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--font-weight-normal)",
          color: "var(--muted-foreground)",
        }}>{label}</span>
        <span style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--font-weight-normal)",
          color: "var(--muted-foreground)",
        }}>{subtitle}</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{
        fontFamily: "var(--font-family-inter)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--font-weight-normal)",
        color: "var(--muted-foreground)",
      }}>{label}</span>
      <span style={{
        fontFamily: "var(--font-family-inter)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--font-weight-semibold)",
        color: "var(--foreground)",
      }}>{value}</span>
    </div>
  );
}
