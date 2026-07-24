import { useState, useRef, useEffect } from "react";

const PREVIEW_PATH_KEY = "devicePreviewToolbar.currentPath";

const PAGES = [
  { path: "/classes-v1?demo=ai-tutor", label: "★ AI Tutor · Demo: no classes → enroll → schedule → new screens" },
  { path: "/ai-tutor", label: "AI Tutor · hub (new)" },
  { path: "/ai-tutor/chapter-home", label: "AI Tutor · Chapter Home (new)" },
  { path: "/ai-tutor/curriculum-preview", label: "AI Tutor · Curriculum preview, free Ch.1 (new)" },
  { path: "/ai-tutor/chapter-home?chapter=1&preview=1", label: "AI Tutor · Chapter Home, jump to Polynomials (new)" },
  { path: "/ai-tutor/explain", label: "AI Tutor · Explain (new)" },
  { path: "/ai-tutor/solve", label: "AI Tutor · Solve (new)" },
  { path: "/ai-tutor/guided-lesson", label: "AI Tutor · Guided Lesson (new)" },

  { path: "/classes", label: "classes" },
  { path: "/classes-v1", label: "classes-v1" },
  { path: "/practice", label: "practice" },
  { path: "/learning-path", label: "learning-path" },
  { path: "/onboarding-cat", label: "Onboarding (CAT)" },
  { path: "/onboarding-default", label: "Onboarding (default)" },
{ path: "/profile", label: "profile" },
  { path: "/my-certificates", label: "My Certificates" },
  { path: "/profile/account-settings", label: "Profile sub-page (stub)" },
  { path: "/course-complete/piano-beginner-solo", label: "Course Complete (cert)" },
  { path: "/refer-and-earn", label: "refer-and-earn" },
  { path: "/learning-path/topic-analytics", label: "topic-analytics" },
  { path: "/analytics", label: "analytics" },
  { path: "/study-schedule", label: "study-schedule" },
  { path: "/live-class", label: "live-class" },
  { path: "/lesson-complete", label: "lesson-complete" },
  { path: "/practice/pyq", label: "pyqs" },
  { path: "/notifications-demo", label: "notifications-demo" },
  { path: "/paywall-v2", label: "paywall-v2" },
  { path: "/payment-success?exam=cat", label: "payment-success" },
  { path: "/build-study-plan?exam=cat", label: "build-study-plan" },
  { path: "/study-plan-creating?exam=cat", label: "study-plan-creating" },
  { path: "/study-plan-ready", label: "study-plan-ready" },
  { path: "/recording", label: "recording" },
  { path: "/recording-v2", label: "recording-v2" },
{ path: "/course-detail", label: "course-detail" },
  { path: "/course-curriculum", label: "course-curriculum" },
  { path: "/ai-summer-camp", label: "ai-summer-camp" },
  { path: "/summer-camp-purchased?track=explorer", label: "summer-camp-purchased" },
  { path: "/marketplace", label: "marketplace-home" },
  { path: "/marketplace-home-v1", label: "marketplace-home-v1" },
  { path: "/marketplace-v1", label: "marketplace-v1" },
  { path: "/marketplace-v2", label: "marketplace-v2" },
  { path: "/marketplace/product/fd-1", label: "marketplace-product" },
  { path: "/marketplace/cart", label: "marketplace-cart" },
  { path: "/marketplace/checkout", label: "marketplace-checkout" },
  { path: "/marketplace/order-confirm", label: "marketplace-order-confirm" },
  { path: "/marketplace/orders", label: "marketplace-orders" },
  { path: "/marketplace/order-detail", label: "marketplace-order-detail" },
  { path: "/marketplace/return", label: "marketplace-return" },
  { path: "/my-test-series/mt-jee-main", label: "my-test-series · JEE Main (mid-progress)" },
  { path: "/my-test-series/mt-neet-ug", label: "my-test-series · NEET UG (fresh)" },
  { path: "/my-test-series/mt-jee-main/mock/mock-3/instructions", label: "mock instructions" },
  { path: "/my-test-series/mt-jee-main/mock/mock-3/take", label: "mock take" },
  { path: "/arena", label: "Arena · hub" },
  { path: "/arena?demo=new", label: "Arena · hub (new user)" },
  { path: "/arena?demo=pro", label: "Arena · hub (established)" },
  { path: "/arena/onboarding", label: "Arena · onboarding" },
  { path: "/arena/play", label: "Arena · daily sprint (legacy)" },
  { path: "/arena/event?id=speed-climb", label: "Arena · event (live ladder)" },
  { path: "/arena/event?id=saturday-showdown", label: "Arena · event (locked)" },
  { path: "/arena/event?id=champions-ladder", label: "Arena · event (GYD pass)" },
  { path: "/arena/event?id=grand-aptitude-test", label: "Arena · event (exam)" },
  { path: "/arena/level?event=speed-climb", label: "Arena · level play" },
  { path: "/arena/spin", label: "Arena · daily spin" },
  { path: "/arena/hearts", label: "Arena · hearts store" },
  { path: "/arena/events", label: "Arena · all events" },
  { path: "/arena/my-events", label: "Arena · my events & results" },
  { path: "/arena/result", label: "Arena · sprint result" },
  { path: "/arena/review", label: "Arena · review" },
  { path: "/arena/teaser", label: "Arena · teaser (M0)" },
  { path: "/arena/whats-next", label: "Arena · what's next" },
  { path: "/arena/squads", label: "Arena · squads & schools" },
  { path: "/arena/mastery", label: "Arena · skills (level + mastery)" },
  { path: "/arena/rewards", label: "Arena · rewards" },
  { path: "/olympiad", label: "Olympiads · home" },
  { path: "/olympiad/rewards", label: "Olympiad · my rewards" },
  { path: "/olympiad/math-titans", label: "Olympiad · Math Titans (LIVE)" },
  { path: "/olympiad/aptitude-challenge", label: "Olympiad · Aptitude (closing soon)" },
  { path: "/olympiad/science-sprint", label: "Olympiad · Science Sprint (paid, upcoming)" },
  { path: "/olympiad/jee-grand", label: "Olympiad · JEE Grand (results out, attempted)" },
  { path: "/olympiad/neet-warmup", label: "Olympiad · NEET Warm-up (missed)" },
  { path: "/olympiad/math-titans/lobby", label: "Olympiad · lobby" },
  { path: "/olympiad/jee-grand/result", label: "Olympiad · result" },
  { path: "/olympiad/jee-grand/leaderboard", label: "Olympiad · leaderboard" },
  { path: "/olympiad/jee-grand/certificate", label: "Olympiad · certificate" },
  { path: "/olympiad/jee-grand/claim", label: "Olympiad · claim reward" },
  { path: "/olympiad/jee-grand/feedback", label: "Olympiad · feedback" },
  { path: "/marketplace/product/pb-neo", label: "primebook-neo-detail" },
  { path: "/marketplace/product/pb-pro", label: "primebook-pro-detail" },
  { path: "/marketplace/product/pb-max", label: "primebook-max-detail" },
  { path: "/marketplace/addresses", label: "marketplace-addresses" },
  { path: "/marketplace/addresses/new", label: "marketplace-address-new" },
  { path: "/marketplace/addresses/addr-1/edit", label: "marketplace-address-edit" },
  { path: "/marketplace/wishlist", label: "marketplace-wishlist" },
  { path: "/marketplace/category/courses", label: "marketplace-category" },
  { path: "/marketplace/search", label: "marketplace-search" },
  { path: "/marketplace/apps", label: "marketplace-apps" },
  { path: "/marketplace/webview/app-pw", label: "marketplace-webview" },
  { path: "/marketplace/music/piano-beginner-solo", label: "music-course-detail" },
  { path: "/marketplace/category/music", label: "marketplace-category-music" },
  { path: "/marketplace/games-pass", label: "games-pass-checkout" },
  { path: "/marketplace/product/crash-9/reviews", label: "reviews-all · Crash Class 9" },
  { path: "/marketplace/product/cat/reviews", label: "reviews-all · CAT Complete Prep" },
  { path: "/marketplace/game/brain-sprint", label: "game-detail · Math Mountain" },
  { path: "/marketplace/game/word-wars", label: "game-detail · Word Wizard" },
  { path: "/marketplace/game/quiz-duel/play", label: "game-play · Brain Battle" },
  { path: "/marketplace/game/daily-sprint/play", label: "game-play · Daily Drill" },
  { path: "/marketplace/game/word-wars/play", label: "game-play · Word Wizard" },
  { path: "/marketplace/game/brain-sprint/play", label: "game-play · Math Mountain" },
  { path: "/marketplace/game/concept-labs/play", label: "game-play · Science Lab" },
  { path: "/marketplace/game/live-quiz-arena/play", label: "game-play · Sunday Showdown" },
  { path: "/marketplace/game/memory-match/play", label: "game-play · Memory Match" },
  { path: "/marketplace/game/pattern-puzzles/play", label: "game-play · Pattern Puzzles" },
  { path: "/marketplace/game/reading-race/play", label: "game-play · Reading Race" },
  { path: "/crash-course-detail?class=8", label: "crash-course-detail" },
  { path: "/crash-course-detail?preview=no-plan", label: "crash-course-detail (no plan)" },
  { path: "/crash-course-enrolled?class=8", label: "crash-course-enrolled (welcome)" },
  { path: "/onboarding-crash-course?class=8", label: "onboarding-crash-course (stepper)" },
  { path: "/crash-course-success?class=8", label: "crash-course-success (all set)" },
  { path: "/crash-course-hub?class=8", label: "crash-course-hub (6–10)" },
  { path: "/crash-course-detail?sku=crash-11-pcm", label: "crash · Class 11 PCM" },
  { path: "/crash-course-detail?sku=crash-11-pcb", label: "crash · Class 11 PCB" },
  { path: "/crash-course-detail?sku=crash-12-pcm", label: "crash · Class 12 PCM" },
  { path: "/crash-course-detail?sku=crash-12-pcb", label: "crash · Class 12 PCB" },
  { path: "/crash-course-hub?sku=crash-12-pcm", label: "crash-hub · Class 12 PCM" },
  { path: "/marketplace/vocab/vf-cat", label: "vocabfast · CAT" },
  { path: "/marketplace/vocab/vf-grade-9", label: "vocabfast · Grade 9" },
  { path: "/marketplace/vocab/vf-grade-12", label: "vocabfast · Grade 12" },
  { path: "/marketplace/vocab/vf-gre", label: "vocabfast · GRE" },
  { path: "/marketplace/vocab/vf-ielts", label: "vocabfast · IELTS (coming soon)" },
  { path: "/marketplace/webview/vf-cat", label: "vocabfast · CAT (webview)" },
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
  const [currentPath, setCurrentPath] = useState(() => localStorage.getItem(PREVIEW_PATH_KEY) || "/");
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

        {/* Reset AI-tutor demo — clears the sku's enrollment localStorage keys
            (cc_selected_sku / cc_setup_complete_ / cc_progress_), the demo-only
            per-topic Explain/Practice completion flags, and jumps back to the
            starred demo entry, so testing the not-purchased/not-started state
            doesn't require manually clearing browser storage every time. */}
        <button
          onClick={() => {
            localStorage.removeItem("cc_selected_sku");
            localStorage.removeItem("cc_setup_complete_ncert-10-maths");
            localStorage.removeItem("cc_progress_ncert-10-maths");
            Object.keys(localStorage)
              .filter((k) => k.startsWith("ai_tutor_demo_"))
              .forEach((k) => localStorage.removeItem(k));
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
