/**
 * Profile sub-page placeholder — a single screen standing in for the profile
 * menu destinations that exist in the production Teachmint app but aren't built
 * out in this prototype (institute, devices, drive, support, account, legal).
 * Keeps the profile's navigation honest (no dead chevrons) without 10 stub files.
 *
 * Route: /profile/:slug
 */

import { useNavigate, useParams } from "react-router";
import { ChevronLeft, Construction } from "lucide-react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";

// slug → human title. TODO(api): replace each with its real screen.
const TITLES: Record<string, string> = {
  "my-institute": "My Institute",
  "devices": "My Devices",
  "books": "Books",
  "archived": "Archived Classroom",
  "contact-support": "Contact Support",
  "community": "Teachmint Community",
  "password-security": "Password & Security",
  "account-settings": "Account Settings",
  "privacy-policy": "Privacy Policy",
  "terms": "Terms & Conditions",
  "ncert-license": "NCERT License",
};

export function Component() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const title = TITLES[slug ?? ""] ?? "Coming soon";

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)", fontFamily: "var(--font-family-inter)" }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, padding: "0 8px 0 12px", gap: 8 }}>
          <button onClick={() => navigate("/profile")} aria-label="Back" className="flex items-center justify-center"
            style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer" }}>
            <ChevronLeft size={22} style={{ color: "var(--foreground)" }} />
          </button>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>{title}</span>
        </div>
      </GlassHeader>

      <div className="flex flex-col items-center justify-center text-center" style={{ flex: 1, gap: 12, padding: 24 }}>
        <div className="flex items-center justify-center" style={{
          width: 64, height: 64, borderRadius: "var(--radius-full)",
          backgroundColor: "color-mix(in srgb, var(--muted-foreground) 12%, transparent)",
        }}>
          <Construction size={28} style={{ color: "var(--muted-foreground)" }} />
        </div>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--foreground)" }}>{title}</span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--muted-foreground)", maxWidth: 300, lineHeight: 1.5 }}>
          This is part of the app's navigation. The full screen lands in production.
        </span>
      </div>
    </div>
  );
}
