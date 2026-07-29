import { Outlet } from "react-router";
import { BottomNav } from "./bottom-nav";
import { SidebarNav } from "./sidebar-nav";
import { AiTutorAccessAssistant } from "../shared/ai-tutor-access-assistant";

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

      {/* Mounted here (not per-screen) so "find my chapter" is reachable
          from anywhere in the main app — Classes, Practice, Marketplace,
          Profile — matching the "access anytime" value prop rather than
          only being available once a student has already drilled into a
          specific subject's chapter-home. */}
      <AiTutorAccessAssistant />
    </div>
  );
}