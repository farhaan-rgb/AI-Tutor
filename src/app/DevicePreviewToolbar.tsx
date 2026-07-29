import { useState, useRef, useEffect } from "react";
import { PROMO_DISMISSED_KEY } from "../shared/feature-promo-modal";

const PREVIEW_PATH_KEY = "devicePreviewToolbar.currentPath";

// This build covers two journeys — Class 10 NCERT Maths and Science via the
// AI Tutor prototype — so the scenario list only lists screens that are
// actually reachable from them, instead of the full production app's ~130.
const PAGES = [
  { path: "/classes-v1?demo=ai-tutor", label: "★ AI Tutor · Demo: no classes → enroll → schedule → new screens" },
  { path: "/ai-tutor", label: "AI Tutor · hub" },
  { path: "/ai-tutor/chapter-home", label: "AI Tutor · Chapter Home (Maths)" },
  { path: "/ai-tutor/chapter-home?sku=ncert-10-science", label: "AI Tutor · Chapter Home (Science)" },
  { path: "/ai-tutor/curriculum-preview?demo=ai-tutor", label: "AI Tutor · Curriculum preview, free Ch.1 (Maths)" },
  { path: "/ai-tutor/curriculum-preview?demo=ai-tutor&sku=ncert-10-science", label: "AI Tutor · Curriculum preview, free Ch.1 (Science)" },
  { path: "/ai-tutor/explain?topic=balancing-chemical-equations", label: "AI Tutor · Explain (Science sample)" },
  { path: "/ai-tutor/solve?topic=reaction-types-redox", label: "AI Tutor · Solve (Science sample)" },
  { path: "/ai-tutor/explain", label: "AI Tutor · Explain (Maths)" },
  { path: "/ai-tutor/solve", label: "AI Tutor · Solve (Maths)" },
  { path: "/ai-tutor/guided-lesson", label: "AI Tutor · Guided Lesson" },

  { path: "/classes", label: "classes" },
  { path: "/classes-v1", label: "classes-v1" },
  { path: "/practice", label: "practice" },
  { path: "/profile", label: "profile" },
  { path: "/my-certificates", label: "My Certificates" },
  { path: "/profile/account-settings", label: "Profile sub-page (stub)" },
  { path: "/refer-and-earn", label: "refer-and-earn" },
  { path: "/analytics", label: "analytics" },
  { path: "/study-schedule", label: "study-schedule" },
  { path: "/paywall-v2", label: "paywall-v2" },

  { path: "/marketplace-v1?demo=ai-tutor", label: "marketplace-v1 · Discover (demo listing)" },
  { path: "/marketplace/orders", label: "marketplace-orders" },
  { path: "/marketplace/order-detail", label: "marketplace-order-detail" },
  { path: "/marketplace/addresses", label: "marketplace-addresses" },
  { path: "/marketplace/addresses/new", label: "marketplace-address-new" },
  { path: "/marketplace/addresses/addr-1/edit", label: "marketplace-address-edit" },
  { path: "/marketplace/wishlist", label: "marketplace-wishlist" },

  { path: "/crash-course-detail?sku=ncert-10-maths&demo=ai-tutor", label: "crash-course-detail · NCERT Maths" },
  { path: "/crash-course-enrolled?sku=ncert-10-maths", label: "crash-course-enrolled · NCERT Maths" },
  { path: "/onboarding-crash-course?sku=ncert-10-maths", label: "onboarding-crash-course · NCERT Maths (stepper)" },
  { path: "/crash-course-success?sku=ncert-10-maths", label: "crash-course-success · NCERT Maths (all set)" },
  { path: "/crash-course-detail?sku=ncert-10-science&demo=ai-tutor", label: "crash-course-detail · NCERT Science" },
  { path: "/crash-course-enrolled?sku=ncert-10-science", label: "crash-course-enrolled · NCERT Science" },
  { path: "/onboarding-crash-course?sku=ncert-10-science", label: "onboarding-crash-course · NCERT Science (stepper)" },
  { path: "/crash-course-success?sku=ncert-10-science", label: "crash-course-success · NCERT Science (all set)" },
];

export default function DevicePreviewToolbar({
  children,
}: {
  children: React.ReactNode;
}) {
  const isEmbed = window.self !== window.top || new URLSearchParams(window.location.search).has('embed');

  const [visible, setVisible] = useState(true);
  const [device, setDevice] = useState<"mobile" | "web">("mobile");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [showOrientation, setShowOrientation] = useState(false);
  // Real bug, real fix: this used to ignore whatever URL the top-level page
  // was actually loaded with, always falling back to localStorage (or "/")
  // instead — so sharing a deep link to a specific screen (e.g. a
  // curriculum-preview URL for a colleague) silently landed wherever this
  // particular browser's toolbar state happened to be, not the URL that was
  // shared. A real, non-"/" URL now wins outright; "/" itself (the bare
  // domain, with no specific screen requested) still falls back to
  // localStorage/PAGES[0] for in-session continuity via the toolbar's own
  // page-selector dropdown.
  const [currentPath, setCurrentPath] = useState(() => {
    const requested = window.location.pathname + window.location.search;
    if (requested && requested !== "/") return requested;
    return localStorage.getItem(PREVIEW_PATH_KEY) || PAGES[0].path;
  });
  const [showPages, setShowPages] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [webScale, setWebScale] = useState(1);

  const BASE_W = 1280, BASE_H = 800;
  const width = device === "web" ? BASE_W : orientation === "portrait" ? 360 : 800;
  const height = device === "web" ? BASE_H : orientation === "portrait" ? 800 : 360;

  useEffect(() => {
    if (device !== "web") return;
    const compute = () => {
      if (!previewRef.current) return;
      const pad = 48;
      const availW = previewRef.current.clientWidth - pad;
      const availH = previewRef.current.clientHeight - pad;
      setWebScale(Math.min(availW / BASE_W, availH / BASE_H, 1.5));
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (previewRef.current) ro.observe(previewRef.current);
    return () => ro.disconnect();
  }, [device]);

  // When loaded as embed, render just the app
  if (isEmbed) {
    return <>{children}</>;
  }

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    localStorage.setItem(PREVIEW_PATH_KEY, path);
    setShowPages(false);
    if (iframeRef.current) {
      iframeRef.current.src = `${window.location.origin}${path}`;
    }
  };

  const embedUrl = `${window.location.origin}${currentPath}`;

  if (!visible) {
    return (
      <>
        <button
          onClick={() => setVisible(true)}
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 99999,
            background: "#2c2c2c",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "system-ui, sans-serif",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          Preview
        </button>
        {children}
      </>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: "#1a1a1a",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#2c2c2c",
          padding: "8px 16px",
          gap: 12,
          flexShrink: 0,
          fontFamily: "system-ui, sans-serif",
          fontSize: 13,
          color: "#fff",
          borderBottom: "1px solid #404040",
          position: "relative",
        }}
      >
        {/* Page selector (left) */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowPages(!showPages)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#3a3a3a",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              minWidth: 120,
            }}
          >
            <span style={{ color: "#999", fontSize: 14 }}>↻</span>
            <span style={{ color: "#ccc" }}>/</span>
            <span>{PAGES.find((p) => p.path === currentPath)?.label || currentPath}</span>
            <span style={{ marginLeft: "auto", color: "#999", fontSize: 10 }}>▼</span>
          </button>

          {/* Dropdown */}
          {showPages && (
            <>
              <div
                onClick={() => setShowPages(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 99998,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  background: "#2c2c2c",
                  border: "1px solid #444",
                  borderRadius: 10,
                  padding: "6px 0",
                  zIndex: 99999,
                  maxHeight: 400,
                  overflowY: "auto",
                  minWidth: 220,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
              >
                {PAGES.map((page) => {
                  const isActive = page.path === currentPath;
                  return (
                    <button
                      key={page.path}
                      onClick={() => navigateTo(page.path)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "8px 14px",
                        background: isActive ? "rgba(120, 110, 200, 0.45)" : "transparent",
                        color: isActive ? "#d4cfff" : "#ccc",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13,
                        fontFamily: "inherit",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span>{page.label}</span>
                      {isActive && <span style={{ fontSize: 14 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Reset AI-tutor demo — clears both courses' enrollment localStorage
            keys (cc_enrolled_<sku> / cc_setup_complete_<sku> / cc_progress_<sku>),
            the demo-only per-topic Explain/Practice completion flags, and jumps
            back to the starred demo entry, so testing the not-purchased/
            not-started state doesn't require manually clearing browser storage
            every time. */}
        <button
          onClick={() => {
            for (const sku of ["ncert-10-maths", "ncert-10-science"]) {
              localStorage.removeItem(`cc_enrolled_${sku}`);
              localStorage.removeItem(`cc_setup_complete_${sku}`);
              localStorage.removeItem(`cc_progress_${sku}`);
            }
            Object.keys(localStorage)
              .filter((k) => k.startsWith("ai_tutor_demo_"))
              .forEach((k) => localStorage.removeItem(k));
            localStorage.removeItem(PROMO_DISMISSED_KEY);
            navigateTo(PAGES[0].path);
          }}
          title="Clear AI-tutor demo enrollment and reload the starred entry"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#3a3a3a",
            color: "#ccc",
            border: "1px solid #555",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span style={{ color: "#999", fontSize: 13 }}>↺</span>
          <span>Reset demo</span>
        </button>

        {/* Device toggle (center) */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", background: "#3a3a3a", borderRadius: 8, padding: 3, border: "1px solid #555" }}>
            <button
              onClick={() => setDevice("mobile")}
              title="Mobile (360×800)"
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: device === "mobile" ? "#6c63ff" : "transparent",
                color: device === "mobile" ? "#fff" : "#999",
                transition: "all 0.15s",
                lineHeight: 1,
              }}
            >
              <svg width="14" height="20" viewBox="0 0 14 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="0" width="12" height="20" rx="2"/><circle cx="7" cy="17" r="1" fill="currentColor" stroke="none"/><rect x="4" y="1.5" width="6" height="1" rx="0.5" fill="currentColor" stroke="none"/></svg>
            </button>
            <button
              onClick={() => setDevice("web")}
              title="Web (1280×800)"
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: device === "web" ? "#6c63ff" : "transparent",
                color: device === "web" ? "#fff" : "#999",
                transition: "all 0.15s",
                lineHeight: 1,
              }}
            >
              <svg width="22" height="18" viewBox="0 0 22 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="0" width="20" height="14" rx="2"/><path d="M7 17h8M11 14v3" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Orientation toggle (right, mobile only) + Close */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {device === "mobile" && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowOrientation(!showOrientation)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#3a3a3a",
                  color: "#ccc",
                  border: "1px solid #555",
                  borderRadius: 6,
                  padding: "6px 10px",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                <span style={{ fontSize: 13, fontFamily: "inherit" }}>{orientation === "portrait" ? "Portrait" : "Landscape"}</span>
                <span style={{ color: "#999", fontSize: 10 }}>▼</span>
              </button>
              {showOrientation && (
                <>
                  <div onClick={() => setShowOrientation(false)} style={{ position: "fixed", inset: 0, zIndex: 99998 }} />
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    background: "#2c2c2c",
                    border: "1px solid #444",
                    borderRadius: 8,
                    padding: "4px 0",
                    zIndex: 99999,
                    minWidth: 130,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  }}>
                    {([
                      { value: "portrait", label: "Portrait", icon: <svg width="12" height="18" viewBox="0 0 12 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="10" height="16" rx="2"/></svg> },
                      { value: "landscape", label: "Landscape", icon: <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="16" height="10" rx="2"/></svg> },
                    ] as const).map((o) => (
                      <button
                        key={o.value}
                        onClick={() => { setOrientation(o.value); setShowOrientation(false); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          padding: "8px 12px",
                          background: orientation === o.value ? "rgba(108,99,255,0.2)" : "transparent",
                          color: orientation === o.value ? "#d4cfff" : "#ccc",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 13,
                          fontFamily: "inherit",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => { if (orientation !== o.value) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                        onMouseLeave={(e) => { if (orientation !== o.value) e.currentTarget.style.background = "transparent"; }}
                      >
                        {o.icon}
                        <span>{o.label}</span>
                        {orientation === o.value && <span style={{ marginLeft: "auto", fontSize: 14 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <button
            onClick={() => setVisible(false)}
            style={{
              background: "none",
              border: "none",
              color: "#999",
              fontSize: 20,
              cursor: "pointer",
              padding: "4px 8px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div
        ref={previewRef}
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: device === "web" ? "center" : "flex-start",
          overflow: "auto",
          padding: 24,
        }}
      >
        {device === "web" ? (
          <div style={{
            width: BASE_W * webScale,
            height: BASE_H * webScale,
            flexShrink: 0,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}>
            <iframe
              ref={iframeRef}
              src={embedUrl}
              allow="autoplay; speech-synthesis"
              style={{
                width: BASE_W,
                height: BASE_H,
                border: "none",
                transform: `scale(${webScale})`,
                transformOrigin: "top left",
                display: "block",
              }}
            />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            allow="autoplay; speech-synthesis"
            style={{
              width,
              height,
              border: "none",
              borderRadius: 12,
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              flexShrink: 0,
            }}
          />
        )}
      </div>
    </div>
  );
}
