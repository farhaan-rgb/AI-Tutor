/**
 * Marketplace WebView — iframe shell for partner apps
 * Handles loading state, X-Frame-Options fallback, and back navigation overlay
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, RefreshCw, ExternalLink, WifiOff, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ─── App Metadata ─────────────────────────────────────────────────────────────
// TODO(api): GET /api/marketplace/partner-apps/:id
interface AppMeta {
  name: string;
  url: string;
  iconLabel: string;
  gradient: string;
}

const APP_META: Record<string, AppMeta> = {
  "app-pw":         { name: "Physics Wallah",  url: "https://www.pw.live",           iconLabel: "PW", gradient: "linear-gradient(135deg, var(--primary-800) 0%, var(--purple-600) 100%)" },
  "app-khan":       { name: "Khan Academy",    url: "https://www.khanacademy.org",   iconLabel: "KA", gradient: "linear-gradient(135deg, var(--warning-700) 0%, var(--warning-500) 100%)" },
  "app-duolingo":   { name: "Duolingo",        url: "https://www.duolingo.com",      iconLabel: "DL", gradient: "linear-gradient(135deg, var(--success-600) 0%, var(--cyan-400) 100%)" },
  "app-unacademy":  { name: "Unacademy",       url: "https://unacademy.com",         iconLabel: "UN", gradient: "linear-gradient(135deg, var(--success-700) 0%, var(--success-500) 100%)" },
  "app-byjus":      { name: "BYJU'S",          url: "https://byjus.com",             iconLabel: "BY", gradient: "linear-gradient(135deg, var(--purple-700) 0%, var(--primary-400) 100%)" },
  "app-coursera":   { name: "Coursera",        url: "https://www.coursera.org",      iconLabel: "CR", gradient: "linear-gradient(135deg, var(--primary-600) 0%, var(--cyan-400) 100%)" },
  "app-testbook":   { name: "Testbook",        url: "https://testbook.com",          iconLabel: "TB", gradient: "linear-gradient(135deg, var(--error-700) 0%, var(--orange-400) 100%)" },
  "app-vedantu":    { name: "Vedantu",         url: "https://www.vedantu.com",       iconLabel: "VD", gradient: "linear-gradient(135deg, var(--cyan-700) 0%, var(--primary-400) 100%)" },
  "app-embibe":     { name: "Embibe",          url: "https://www.embibe.com",        iconLabel: "EM", gradient: "linear-gradient(135deg, var(--purple-600) 0%, var(--error-400) 100%)" },
  "app-toppr":      { name: "Toppr",           url: "https://www.toppr.com",         iconLabel: "TP", gradient: "linear-gradient(135deg, var(--warning-800) 0%, var(--orange-400) 100%)" },
  "furtados":       { name: "Furtados School of Music", url: "https://www.furtadosonline.com", iconLabel: "FM", gradient: "linear-gradient(135deg, #1a0533 0%, #3b0764 50%, #6b21a8 100%)" },
};

const FALLBACK_APP: AppMeta = {
  name: "Partner App",
  url: "",
  iconLabel: "APP",
  gradient: "linear-gradient(135deg, var(--primary-800) 0%, var(--purple-600) 100%)",
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="flex flex-col" style={{ flex: 1, padding: 16, gap: 16 }}>
      {[80, 120, 60, 100, 80].map((width, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          style={{
            height: i % 2 === 0 ? 16 : 12,
            width: `${width}%`,
            borderRadius: 8,
            backgroundColor: "var(--border)",
          }}
        />
      ))}
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        style={{ height: 160, borderRadius: 12, backgroundColor: "var(--border)", marginTop: 8 }}
      />
      {[90, 70, 55].map((width, i) => (
        <motion.div
          key={`b${i}`}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 + i * 0.1 }}
          style={{
            height: 14,
            width: `${width}%`,
            borderRadius: 8,
            backgroundColor: "var(--border)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Blocked / Error State ────────────────────────────────────────────────────
function BlockedScreen({ app, onOpenExternal }: { app: AppMeta; onOpenExternal: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ flex: 1, padding: 32, gap: 20 }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: app.gradient,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
      }}>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>
          {app.iconLabel}
        </span>
      </div>

      <div className="flex flex-col items-center" style={{ gap: 8 }}>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", textAlign: "center" }}>
          {app.name} can't open here
        </span>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center", lineHeight: 1.5 }}>
          This app blocks embedded views for security. Open it in your browser for the full experience.
        </span>
      </div>

      <div className="flex flex-col" style={{ gap: 12, width: "100%" }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onOpenExternal}
          className="w-full flex items-center justify-center"
          style={{
            height: 52, borderRadius: 12,
            background: app.gradient,
            border: "none", cursor: "pointer", gap: 8,
          }}
        >
          <ExternalLink style={{ width: 16, height: 16, color: "var(--white)", strokeWidth: 2 }} />
          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)" }}>
            Open {app.name} in Browser
          </span>
        </motion.button>

        <div className="flex items-center" style={{ gap: 8 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>or</span>
          <div style={{ flex: 1, height: 1, backgroundColor: "var(--border)" }} />
        </div>

        <div className="flex items-center" style={{ gap: 8, padding: 12, borderRadius: 12, backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 16%, transparent)" }}>
          <Smartphone style={{ width: 16, height: 16, color: "var(--primary-300)", strokeWidth: 1.5, flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)", lineHeight: 1.4 }}>
            Install the <span style={{ color: "var(--primary-300)", fontWeight: "var(--font-weight-medium)" }}>{app.name}</span> app on your device for the best experience.
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Network Error ────────────────────────────────────────────────────────────
function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ flex: 1, padding: 32, gap: 16 }}>
      <div style={{
        width: 64, height: 64, borderRadius: 9999,
        backgroundColor: "color-mix(in srgb, var(--error-500) 10%, transparent)",
        border: "1.5px solid color-mix(in srgb, var(--error-500) 20%, transparent)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <WifiOff style={{ width: 28, height: 28, color: "var(--error-500)", strokeWidth: 1.5 }} />
      </div>
      <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center" }}>
        Unable to load the page. Check your connection.
      </span>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onRetry}
        className="flex items-center"
        style={{ height: 44, paddingLeft: 24, paddingRight: 24, borderRadius: 9999, backgroundColor: "var(--primary)", border: "none", cursor: "pointer", gap: 8 }}
      >
        <RefreshCw style={{ width: 14, height: 14, color: "var(--white)", strokeWidth: 2 }} />
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)" }}>Retry</span>
      </motion.button>
    </div>
  );
}

// ─── Not Found ───────────────────────────────────────────────────────────────
function NotFoundScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ flex: 1, padding: 32, gap: 20 }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: "linear-gradient(135deg, var(--muted) 0%, var(--border) 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Smartphone style={{ width: 32, height: 32, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
      </div>
      <div className="flex flex-col items-center" style={{ gap: 8 }}>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: "var(--font-weight-bold)", color: "var(--foreground)", textAlign: "center" }}>
          App not found
        </span>
        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--muted-foreground)", textAlign: "center", lineHeight: 1.5 }}>
          This app is no longer available. Browse other partner apps in the marketplace.
        </span>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onBack}
        style={{ height: 48, paddingLeft: 28, paddingRight: 28, borderRadius: 9999, backgroundColor: "var(--primary)", border: "none", cursor: "pointer", fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)" }}
      >
        Browse Apps
      </motion.button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const { appId = "" } = useParams<{ appId: string }>();
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "blocked" | "error" | "notfound">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isKnownApp = appId in APP_META;
  const app = isKnownApp ? APP_META[appId] : FALLBACK_APP;

  useEffect(() => {
    if (!isKnownApp) {
      setLoadState("notfound");
      return;
    }
    setLoadState("loading");
    loadTimerRef.current = setTimeout(() => {
      setLoadState("blocked");
    }, 10000);
    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    };
  }, [reloadKey, isKnownApp]);

  const handleLoad = () => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    // Try to check if the iframe loaded actual content; if X-Frame-Options blocked,
    // accessing contentDocument throws a SecurityError — we catch that as "blocked"
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc || doc.body.innerHTML === "") {
        setLoadState("blocked");
      } else {
        setLoadState("loaded");
      }
    } catch {
      setLoadState("blocked");
    }
  };

  const handleError = () => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    setLoadState("error");
  };

  const handleRetry = () => {
    setReloadKey((k) => k + 1);
  };

  const handleOpenExternal = () => {
    if (app.url) window.open(app.url, "_blank", "noopener noreferrer");
  };

  return (
    <div className="flex flex-col" style={{ fontFamily: "var(--font-family-inter)", backgroundColor: "var(--background)", height: "100vh", overflow: "hidden" }}>
      {/* Floating header overlay */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, transparent 100%)",
        paddingTop: 12, paddingBottom: 24,
      }}>
        <div className="flex items-center" style={{ paddingLeft: 4, paddingRight: 16, gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: 44, height: 44, borderRadius: 9999,
              backgroundColor: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <ArrowLeft style={{ width: 18, height: 18, color: "var(--white)", strokeWidth: 2 }} />
          </motion.button>

          <div className="flex items-center" style={{ flex: 1, gap: 8, overflow: "hidden" }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: app.gradient,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--white)" }}>
                {app.iconLabel}
              </span>
            </div>
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {app.name}
            </span>
          </div>

          {(loadState === "loaded" || loadState === "blocked") && app.url && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleOpenExternal}
              aria-label="Open in browser"
              style={{
                width: 40, height: 40, borderRadius: 9999,
                backgroundColor: "rgba(0,0,0,0.35)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ExternalLink style={{ width: 16, height: 16, color: "rgba(255,255,255,0.8)", strokeWidth: 2 }} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-col" style={{ flex: 1, position: "relative" }}>
        <AnimatePresence mode="wait">
          {loadState === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
              style={{ position: "absolute", inset: 0, backgroundColor: "var(--background)", paddingTop: 64, zIndex: 10 }}
            >
              <LoadingSkeleton />
            </motion.div>
          )}

          {loadState === "blocked" && (
            <motion.div
              key="blocked"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
              style={{ position: "absolute", inset: 0, backgroundColor: "var(--background)", paddingTop: 64, zIndex: 10 }}
            >
              <BlockedScreen app={app} onOpenExternal={handleOpenExternal} />
            </motion.div>
          )}

          {loadState === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
              style={{ position: "absolute", inset: 0, backgroundColor: "var(--background)", paddingTop: 64, zIndex: 10 }}
            >
              <NetworkError onRetry={handleRetry} />
            </motion.div>
          )}

          {loadState === "notfound" && (
            <motion.div
              key="notfound"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
              style={{ position: "absolute", inset: 0, backgroundColor: "var(--background)", paddingTop: 64, zIndex: 10 }}
            >
              <NotFoundScreen onBack={() => navigate("/marketplace/apps")} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* iframe — always rendered so it can attempt to load */}
        {app.url && (
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={app.url}
            title={app.name}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              flex: 1,
              width: "100%",
              height: "100%",
              border: "none",
              display: loadState === "loaded" ? "block" : "none",
            }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            allow="camera; microphone; fullscreen"
          />
        )}
      </div>
    </div>
  );
}
