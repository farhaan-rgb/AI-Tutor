/**
 * TagChipGroup — multi-select (or single-select) chip flow.
 * Used in: review tag chips, post-class issue chips, wishlist format chips.
 *
 * Chips wrap. 32h, AntD-token tinted on selection.
 */

import { motion } from "motion/react";

export interface ChipOption {
  value: string;
  label: string;
  color?: string;     // default var(--primary-500)
}

interface Props {
  options: ChipOption[];
  value: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;    // default true
}

export function TagChipGroup({ options, value, onChange, multi = true }: Props) {
  function toggle(v: string) {
    if (multi) {
      onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    } else {
      onChange(value[0] === v ? [] : [v]);
    }
  }

  return (
    <div className="flex flex-wrap" style={{ gap: 8 }}>
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        const color = opt.color ?? "var(--primary-500)";
        return (
          <motion.button
            key={opt.value}
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => toggle(opt.value)}
            style={{
              height: 32, paddingLeft: 12, paddingRight: 12,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              backgroundColor: selected
                ? `color-mix(in srgb, ${color} 16%, transparent)`
                : "var(--card-bg-secondary)",
              fontFamily: "inherit",
              transition: "background-color 0.15s ease",
              display: "inline-flex", alignItems: "center",
            }}
          >
            <span style={{
              fontSize: "var(--text-xs)",
              fontWeight: selected ? 700 : 500,
              color: selected ? color : "var(--foreground)",
              letterSpacing: 0.1,
              whiteSpace: "nowrap",
            }}>
              {opt.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
