/**
 * Marketplace Address Form — Add or edit a saved address
 * Route (new):  /marketplace/addresses/new
 * Route (edit): /marketplace/addresses/:id/edit
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Home, Briefcase, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { StatusBar, GlassHeader, PrimaryButton, typo } from "../shared/premium-ui";

// ─── Types ────────────────────────────────────────────────────────────────────
type AddressType = "Home" | "Office" | "Other";

interface FormState {
  name: string;
  type: AddressType;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

// ─── DUMMY Data (edit mode prefill) ──────────────────────────────────────────
// TODO(api): GET /api/user/addresses/:id
const DUMMY_ADDRESS_BY_ID: Record<string, FormState> = {
  "addr-1": {
    name: "Sagar Prabhu",
    type: "Home",
    line1: "42, Lotus Apartments, Sector 18",
    line2: "",
    city: "Noida",
    state: "Uttar Pradesh",
    pincode: "201301",
    phone: "+91 98765 43210",
    isDefault: true,
  },
  "addr-2": {
    name: "Sagar Prabhu",
    type: "Office",
    line1: "Teachmint Technologies, DLF Cybercity",
    line2: "",
    city: "Gurugram",
    state: "Haryana",
    pincode: "122002",
    phone: "+91 98765 43210",
    isDefault: false,
  },
  "addr-3": {
    name: "Priya Prabhu",
    type: "Other",
    line1: "15, Sindhi Colony, Near RTO Office",
    line2: "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    phone: "+91 91234 56789",
    isDefault: false,
  },
};

const EMPTY_FORM: FormState = {
  name: "",
  type: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  isDefault: false,
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function TypeChip({
  value,
  selected,
  icon: Icon,
  onClick,
}: {
  value: AddressType;
  selected: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      type="button"
      style={{
        height: 36,
        paddingLeft: 12,
        paddingRight: 12,
        borderRadius: 8,
        border: selected ? "1px solid color-mix(in srgb, var(--primary) 40%, transparent)" : "1px solid var(--border)",
        backgroundColor: selected
          ? "color-mix(in srgb, var(--primary) 12%, transparent)"
          : "transparent",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-family-inter)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--font-weight-medium)",
        color: selected ? "var(--primary-300)" : "var(--muted-foreground)",
        transition: "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease",
      }}
    >
      <Icon style={{ width: 14, height: 14, strokeWidth: 1.5 }} />
      {value}
    </motion.button>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <label
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--font-weight-semibold)",
          color: "var(--muted-foreground)",
          letterSpacing: "0.4px",
          textTransform: "uppercase",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--error-500)", marginLeft: 2 }}>*</span>
        )}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          height: 44,
          borderRadius: 8,
          border: focused
            ? "1px solid color-mix(in srgb, var(--primary) 60%, transparent)"
            : "1px solid var(--border)",
          backgroundColor: "var(--card)",
          padding: "0 12px",
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-sm)",
          color: "var(--foreground)",
          outline: "none",
          transition: "border-color 0.15s ease",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full"
      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
    >
      <span
        style={{
          fontFamily: "var(--font-family-inter)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-medium)",
          color: "var(--foreground)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          backgroundColor: checked
            ? "var(--primary)"
            : "color-mix(in srgb, var(--foreground) 16%, transparent)",
          position: "relative",
          transition: "background-color 0.2s ease",
          flexShrink: 0,
        }}
      >
        <motion.div
          animate={{ x: checked ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            position: "absolute",
            top: 2,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: "var(--white)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const isEdit = Boolean(params.id);

  const prefill = isEdit && params.id ? DUMMY_ADDRESS_BY_ID[params.id] ?? EMPTY_FORM : EMPTY_FORM;
  const [form, setForm] = useState<FormState>(prefill);

  const set = (key: keyof FormState) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isValid =
    form.name.trim() &&
    form.line1.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.pincode.length === 6 &&
    form.phone.trim().length >= 10;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const handleSubmit = () => {
    if (!isValid) return;
    // TODO(api): POST /api/user/addresses (new) or PUT /api/user/addresses/:id (edit)
    navigate("/marketplace/addresses");
  };

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", overflow: "hidden", backgroundColor: "var(--background)" }}
    >
      <StatusBar />
      <GlassHeader transparent={!scrolled}>
        <div className="flex items-center" style={{ height: 52, paddingLeft: 4, paddingRight: 20, gap: 4 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: 44, height: 44, borderRadius: 9999, border: "none",
              backgroundColor: "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <ArrowLeft style={{ width: 20, height: 20, color: "var(--foreground)", strokeWidth: 2 }} />
          </motion.button>
          <span style={typo.pageTitleStyle}>
            {isEdit ? "Edit Address" : "Add New Address"}
          </span>
        </div>
      </GlassHeader>

      {/* Scrollable form */}
      <div ref={scrollRef} className="flex-1 min-h-0" style={{ overflowY: "auto" }}>
        <div className="flex flex-col" style={{ padding: "20px 16px 24px", gap: 20 }}>

          {/* Address type */}
          <div className="flex flex-col" style={{ gap: 8 }}>
            <span
              style={{
                fontFamily: "var(--font-family-inter)",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--muted-foreground)",
                letterSpacing: "0.4px",
                textTransform: "uppercase",
              }}
            >
              Address type
            </span>
            <div className="flex" style={{ gap: 8 }}>
              <TypeChip value="Home" selected={form.type === "Home"} icon={Home} onClick={() => set("type")("Home")} />
              <TypeChip value="Office" selected={form.type === "Office"} icon={Briefcase} onClick={() => set("type")("Office")} />
              <TypeChip value="Other" selected={form.type === "Other"} icon={MapPin} onClick={() => set("type")("Other")} />
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col" style={{ borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--card)", padding: 16, gap: 16 }}>
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)", letterSpacing: "0.4px", textTransform: "uppercase" }}>
              Contact
            </span>
            <FormField label="Full name" value={form.name} onChange={set("name")} placeholder="Recipient's full name" required />
            <FormField label="Phone number" value={form.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" type="tel" inputMode="tel" required />
          </div>

          {/* Address details */}
          <div className="flex flex-col" style={{ borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--card)", padding: 16, gap: 16 }}>
            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)", letterSpacing: "0.4px", textTransform: "uppercase" }}>
              Address
            </span>
            <FormField label="Address line 1" value={form.line1} onChange={set("line1")} placeholder="House / Flat no., Building name, Street" required />
            <FormField label="Address line 2" value={form.line2} onChange={set("line2")} placeholder="Landmark, Area (optional)" />
            <div className="flex" style={{ gap: 12 }}>
              <div className="flex-1">
                <FormField label="City" value={form.city} onChange={set("city")} placeholder="City" required />
              </div>
              <div style={{ width: 100 }}>
                <FormField
                  label="Pincode"
                  value={form.pincode}
                  onChange={(v) => { if (/^\d{0,6}$/.test(v)) set("pincode")(v); }}
                  placeholder="6 digits"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </div>
            </div>
            <FormField label="State" value={form.state} onChange={set("state")} placeholder="State" required />
          </div>

          {/* Default toggle */}
          <div style={{ borderRadius: 12, border: "1px solid var(--border)", backgroundColor: "var(--card)", padding: 16 }}>
            <Toggle checked={form.isDefault} onChange={set("isDefault")} label="Set as default address" />
          </div>

        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          backgroundColor: "var(--background)",
        }}
      >
        <PrimaryButton
          fullWidth
          onClick={handleSubmit}
          style={{ opacity: isValid ? 1 : 0.45, pointerEvents: isValid ? "auto" : "none" }}
        >
          {isEdit ? "Save Changes" : "Save Address"}
        </PrimaryButton>
      </div>
    </div>
  );
}
