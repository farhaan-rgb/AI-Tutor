import { Outlet } from "react-router";
import { SidebarNav } from "./sidebar-nav";

/** Layout wrapper for back-arrow screens (no bottom nav). Provides sidebar on desktop. */
export function FullScreenLayout() {
  return (
    <div
      className="flex w-full"
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        fontFamily: "var(--font-family-inter)",
      }}
    >
      {/* Desktop sidebar — hidden on mobile via CSS inside SidebarNav */}
      <SidebarNav />

      <div className="flex flex-col flex-1 min-w-0" style={{ minHeight: "100vh" }}>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}