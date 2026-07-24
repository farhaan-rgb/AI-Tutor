/**
 * Marketplace Addresses — Saved address management
 * Route: /marketplace/addresses
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, MapPin, Home, Briefcase, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StatusBar, GlassHeader, Card, typo } from "../shared/premium-ui";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Address {
  id: string;
  name: string;
  type: "Home" | "Office" | "Other";
  line1: string;
  line2: string;
  phone: string;
  isDefault: boolean;
}

// ─── DUMMY Data ───────────────────────────────────────────────────────────────
// TODO(api): GET /api/user/addresses
const DUMMY_ADDRESSES: Address[] = [
  {
    id: "addr-1",
    name: "Sagar Prabhu",
    type: "Home",
    line1: "42, Lotus Apartments, Sector 18",
    line2: "Noida, Uttar Pradesh — 201301",
    phone: "+91 98765 43210",
    isDefault: true,
  },
  {
    id: "addr-2",
    name: "Sagar Prabhu",
    type: "Office",
    line1: "Teachmint Technologies, DLF Cybercity",
    line2: "Gurugram, Haryana — 122002",
    phone: "+91 98765 43210",
    isDefault: false,
  },
  {
    id: "addr-3",
    name: "Priya Prabhu",
    type: "Other",
    line1: "15, Sindhi Colony, Near RTO Office",
    line2: "Pune, Maharashtra — 411001",
    phone: "+91 91234 56789",
    isDefault: false,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function TypeIcon({ type }: { type: Address["type"] }) {
  if (type === "Home") return <Home style={{ width: 13, height: 13, strokeWidth: 1.5 }} />;
  if (type === "Office") return <Briefcase style={{ width: 13, height: 13, strokeWidth: 1.5 }} />;
  return <MoreHorizontal style={{ width: 13, height: 13, strokeWidth: 1.5 }} />;
}

function AddressCard({
  address,
  onSetDefault,
  onEdit,
  onDelete,
}: {
  address: Address;
  onSetDefault: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card style={{ padding: 16 }}>
        {/* Top row: badges */}
        <div className="flex items-center" style={{ gap: 6, marginBottom: 8 }}>
          {address.isDefault && (
            <span style={{
              height: 20, paddingLeft: 8, paddingRight: 8, borderRadius: 9999,
              display: "inline-flex", alignItems: "center",
              backgroundColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
              border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
              fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)",
              fontWeight: "var(--font-weight-semibold)", color: "var(--primary-300)",
              letterSpacing: "0.4px",
            }}>
              DEFAULT
            </span>
          )}
          <span style={{
            height: 20, paddingLeft: 8, paddingRight: 8, borderRadius: 9999,
            display: "inline-flex", alignItems: "center", gap: 4,
            backgroundColor: "color-mix(in srgb, var(--gray-600) 20%, transparent)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xs)",
            fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)",
          }}>
            <TypeIcon type={address.type} />
            {address.type}
          </span>
        </div>

        {/* Name */}
        <span style={{
          display: "block",
          fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)",
          marginBottom: 4,
        }}>
          {address.name}
        </span>

        {/* Address lines */}
        <span style={{
          display: "block",
          fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)",
          color: "var(--muted-foreground)", lineHeight: "1.5",
          marginBottom: 2,
        }}>
          {address.line1}
        </span>
        <span style={{
          display: "block",
          fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)",
          color: "var(--muted-foreground)", lineHeight: "1.5",
          marginBottom: 8,
        }}>
          {address.line2}
        </span>

        {/* Phone */}
        <span style={{
          display: "block",
          fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)",
          color: "var(--muted-foreground)", marginBottom: 12,
        }}>
          {address.phone}
        </span>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: "var(--border)", marginBottom: 12 }} />

        {/* Actions row or inline confirm */}
        <AnimatePresence mode="wait">
          {confirmDelete ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between"
            >
              <span style={{
                fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)",
                color: "var(--foreground)",
              }}>
                Remove this address?
              </span>
              <div className="flex items-center" style={{ gap: 8 }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    height: 32, paddingLeft: 12, paddingRight: 12,
                    borderRadius: 8, border: "1px solid var(--border)",
                    backgroundColor: "transparent", cursor: "pointer",
                    fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)",
                  }}
                >
                  No
                </button>
                <button
                  onClick={() => onDelete(address.id)}
                  style={{
                    height: 32, paddingLeft: 12, paddingRight: 12,
                    borderRadius: 8, border: "none",
                    backgroundColor: "color-mix(in srgb, var(--error-500) 18%, transparent)",
                    cursor: "pointer",
                    fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-weight-semibold)", color: "var(--error-500)",
                  }}
                >
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex items-center"
              style={{ gap: 4 }}
            >
              <button
                onClick={() => !address.isDefault && onSetDefault(address.id)}
                disabled={address.isDefault}
                style={{
                  height: 32, paddingLeft: 8, paddingRight: 8,
                  borderRadius: 8, border: "none", background: "none",
                  cursor: address.isDefault ? "default" : "pointer",
                  fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-medium)",
                  color: address.isDefault ? "var(--muted-foreground)" : "var(--primary-300)",
                  opacity: address.isDefault ? 0.45 : 1,
                }}
              >
                Set as Default
              </button>

              <div style={{ width: 1, height: 14, backgroundColor: "var(--border)" }} />

              <button
                onClick={() => onEdit(address.id)}
                style={{
                  height: 32, paddingLeft: 8, paddingRight: 8,
                  borderRadius: 8, border: "none", background: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)",
                }}
              >
                Edit
              </button>

              <div style={{ width: 1, height: 14, backgroundColor: "var(--border)" }} />

              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  height: 32, paddingLeft: 8, paddingRight: 8,
                  borderRadius: 8, border: "none", background: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)",
                  fontWeight: "var(--font-weight-medium)", color: "var(--error-500)",
                }}
              >
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function Component() {
  const navigate = useNavigate();

  // TODO(api): GET /api/user/addresses
  const [addresses, setAddresses] = useState<Address[]>(DUMMY_ADDRESSES);

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  const handleEdit = (id: string) => {
    navigate(`/marketplace/addresses/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div
      className="flex flex-col"
      style={{
        fontFamily: "var(--font-family-inter)",
        backgroundColor: "var(--background)",
        minHeight: "100vh",
      }}
    >
      {/* ── Header ── */}
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, paddingLeft: 4, paddingRight: 20, gap: 4 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: 44, height: 44, borderRadius: 9999, border: "none",
              backgroundColor: "transparent", display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <ArrowLeft style={{ width: 20, height: 20, color: "var(--foreground)", strokeWidth: 2 }} />
          </motion.button>
          <span style={typo.pageTitleStyle}>My Addresses</span>
        </div>
      </GlassHeader>

      {/* ── Scrollable content ── */}
      <div className="flex-1" style={{ padding: "16px 16px 32px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Add New Address button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/marketplace/addresses/new")}
          className="w-full flex items-center justify-center"
          style={{
            height: 48, borderRadius: 12,
            border: "1.5px dashed var(--primary-300)",
            backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
            cursor: "pointer", gap: 8,
          }}
        >
          <Plus style={{ width: 16, height: 16, color: "var(--primary-300)", strokeWidth: 2 }} />
          <span style={{
            fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)",
            fontWeight: "var(--font-weight-semibold)", color: "var(--primary-300)",
          }}>
            Add New Address
          </span>
        </motion.button>

        {/* Address list or empty state */}
        <AnimatePresence mode="popLayout">
          {addresses.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center"
              style={{ gap: 12, paddingTop: 64, paddingBottom: 64 }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 72, height: 72, borderRadius: 9999,
                  backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                }}
              >
                <MapPin style={{ width: 32, height: 32, color: "var(--primary-300)", strokeWidth: 1.5 }} />
              </div>
              <span style={{
                fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)",
                fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)",
              }}>
                No saved addresses
              </span>
              <span style={{
                fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)",
                color: "var(--muted-foreground)", textAlign: "center",
              }}>
                Add a delivery address to get started
              </span>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/marketplace/addresses/new")}
                style={{
                  height: 44, paddingLeft: 24, paddingRight: 24,
                  borderRadius: 12, border: "none",
                  backgroundColor: "var(--primary)",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-semibold)", color: "var(--white)",
                }}
              >
                Add one now
              </motion.button>
            </motion.div>
          ) : (
            addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onSetDefault={handleSetDefault}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
