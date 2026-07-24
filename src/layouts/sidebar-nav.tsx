import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";

/* ── Same icon set as bottom-nav (filled/outline pairs) ── */
function HomeIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9.02 2.84l-5.39 4.2C2.73 7.74 2 9.23 2 10.36v7.41c0 2.02 1.64 3.67 3.66 3.67h12.68c2.02 0 3.66-1.64 3.66-3.66v-7.26c0-1.21-.81-2.76-1.8-3.45l-6.18-4.33c-1.4-.98-3.65-.93-5 .1z" fill="currentColor"/>
      <path d="M12 17.99v-3" stroke="var(--gray-950)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M9.02 2.84l-5.39 4.2C2.73 7.74 2 9.23 2 10.36v7.41c0 2.02 1.64 3.67 3.66 3.67h12.68c2.02 0 3.66-1.64 3.66-3.66v-7.26c0-1.21-.81-2.76-1.8-3.45l-6.18-4.33c-1.4-.98-3.65-.93-5 .1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 17.99v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function BookIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/>
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M2 7l10-5 10 5-10 5L2 7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}


function ProfileIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4.5" fill="currentColor"/>
      <path d="M3.41 22c0-3.87 3.85-7 8.59-7s8.59 3.13 8.59 7" fill="currentColor"/>
      <path d="M3.41 22c0-3.87 3.85-7 8.59-7s8.59 3.13 8.59 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3.41 22c0-3.87 3.85-7 8.59-7s8.59 3.13 8.59 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

const tabs = [
  { id: "learn", label: "Learn", Icon: BookIcon, path: "/learning-path" },
  { id: "profile", label: "Profile", Icon: ProfileIcon, path: "/profile" },
] as const;

export function SidebarNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = (() => {
    const p = location.pathname;
    // Learn tab — learning path + lesson screens
    const learnPaths = ["/learning-path", "/lesson-complete"];
    if (learnPaths.some(lp => p === lp || p.startsWith(lp + "/"))) return "learn";
    // Profile tab
    const profilePaths = ["/profile"];
    if (profilePaths.some(pp => p === pp || p.startsWith(pp + "/"))) return "profile";
    return "learn";
  })();

  return (
    <nav
      className="hidden md:flex flex-col shrink-0"
      style={{
        width: 240,
        height: "100vh",
        backgroundColor: "var(--background)",
        borderRight: "1px solid var(--border)",
        fontFamily: "var(--font-family-inter)",
        position: "sticky",
        top: 0,
      }}
    >
      {/* ── Brand header ── */}
      <div
        className="flex items-center shrink-0 gap-[10px]"
        style={{ height: 64, padding: "0 20px" }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius)",
            background: "var(--gradient-primary-btn)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--white)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: "var(--font-family-inter)",
            fontSize: "var(--text-lg)",
            fontWeight: "var(--font-weight-semibold)",
            color: "var(--foreground)",
          }}
        >
          PrepMaster
        </span>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, backgroundColor: "var(--border)", margin: "0 16px" }} />

      {/* ── Nav items ── */}
      <div className="flex flex-col flex-1 gap-1" style={{ padding: "12px 12px" }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(tab.path)}
              className="flex items-center gap-3 cursor-pointer"
              style={{
                height: 44,
                padding: "0 12px",
                borderRadius: "var(--radius)",
                backgroundColor: isActive ? "var(--accent)" : "transparent",
                border: isActive ? "1px solid var(--border)" : "1px solid transparent",
                color: isActive ? "var(--accent-foreground)" : "var(--muted-foreground)",
                transition: "all 0.15s ease",
              }}
            >
              <tab.Icon filled={isActive} />
              <span
                style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-medium)",
                  color: isActive ? "var(--accent-foreground)" : "var(--muted-foreground)",
                }}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: "0 12px 16px" }}>
        <div style={{ height: 1, backgroundColor: "var(--border)", marginBottom: 16 }} />
        {/* Version */}
        <div className="flex justify-center">
          <span
            style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-weight-normal)",
              color: "var(--muted-foreground)",
            }}
          >
            PrepMaster v1.2.0
          </span>
        </div>
      </div>
    </nav>
  );
}