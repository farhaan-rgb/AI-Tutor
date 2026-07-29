import { Outlet } from "react-router";
import { BottomNav } from "./bottom-nav";
import { SidebarNav } from "./sidebar-nav";
import { FloatingAITutor } from "../shared/floating-ai-tutor";

export function AppLayout() {
  return (
    <div
      className="flex w-full"
      style={{
        minHeight: "100vh",
        height: "100vh",
        backgroundColor: "var(--background)",
        fontFamily: "var(--font-family-inter)",
        overflow: "hidden", // Prevent horizontal scroll
        maxWidth: "100vw",
      }}
    >
      {/* Desktop sidebar — hidden on mobile via CSS inside SidebarNav */}
      <SidebarNav />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 max-w-full">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
        {/* Bottom nav — mobile only */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>

      {/* Mounted here (not per-screen) so the AI tutor — doubts and
          "find my chapter" both — is reachable from anywhere in the main
          app: Classes, Practice, Marketplace, Profile. No chapterContext
          here, so every message is navigation-only (see
          floating-ai-tutor.tsx) — there's no specific chapter open yet. */}
      <FloatingAITutor />
    </div>
  );
}