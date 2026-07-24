import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check } from "lucide-react";
import { motion } from "motion/react";
import { GlassHeader, StatusBar } from "../shared/premium-ui";

const LANGUAGES = [
  { id: "en", name: "English", native: "English" },
  { id: "hi", name: "Hindi", native: "\u0939\u093F\u0902\u0926\u0940" },
  { id: "ta", name: "Tamil", native: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD" },
  { id: "te", name: "Telugu", native: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41" },
  { id: "kn", name: "Kannada", native: "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1" },
  { id: "mr", name: "Marathi", native: "\u092E\u0930\u093E\u0920\u0940" },
  { id: "bn", name: "Bengali", native: "\u09AC\u09BE\u0982\u09B2\u09BE" },
  { id: "gu", name: "Gujarati", native: "\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0" },
];

const f = "var(--font-family-inter)";

export function Component() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("en");

  const handleSelect = (id: string) => {
    setSelected(id);
    localStorage.setItem("selected-language", id);
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--background)", fontFamily: f }}>
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center gap-3" style={{ height: 52, padding: "0 20px" }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            className="flex items-center cursor-pointer"
            style={{ background: "transparent", border: "none", padding: 0 }}>
            <ArrowLeft style={{ width: 22, height: 22, color: "var(--muted-foreground)", strokeWidth: 1.5 }} />
          </motion.button>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--foreground)" }}>Language</span>
        </div>
      </GlassHeader>

      <div className="flex-1 overflow-y-auto" style={{ padding: "16px 20px 100px" }}>
        <div className="overflow-hidden" style={{
          backgroundColor: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 16,
        }}>
          {LANGUAGES.map((lang, i) => {
            const isSelected = selected === lang.id;
            const isLast = i === LANGUAGES.length - 1;
            return (
              <motion.button
                key={lang.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(lang.id)}
                className="w-full flex items-center gap-[14px]"
                style={{
                  padding: "16px 18px", border: "none",
                  background: isSelected ? "var(--primary-alpha-8)" : "none",
                  cursor: "pointer", textAlign: "left",
                  borderBottom: isLast ? "none" : "1px solid var(--border)",
                  transition: "all 0.15s ease",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)", marginBottom: 2 }}>
                    {lang.name}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                    {lang.native}
                  </div>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 24, height: 24, borderRadius: "50%",
                      backgroundColor: "var(--primary)",
                    }}
                  >
                    <Check style={{ width: 14, height: 14, color: "var(--white)", strokeWidth: 3 }} />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
