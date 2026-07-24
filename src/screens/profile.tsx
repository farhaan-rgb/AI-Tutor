import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, X as XIcon, CheckCircle2, Moon, Sun, Crown } from 'lucide-react';
// Filled (Material) icons for the profile menu — Lucide is outline-only.
import BarChartIcon from '@mui/icons-material/BarChart';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LanguageIcon from '@mui/icons-material/Language';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LockIcon from '@mui/icons-material/Lock';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SyncIcon from '@mui/icons-material/Sync';
import ShieldIcon from '@mui/icons-material/Shield';
import DescriptionIcon from '@mui/icons-material/Description';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SchoolIcon from '@mui/icons-material/School';
import LogoutIcon from '@mui/icons-material/Logout';
import { motion, AnimatePresence } from 'motion/react';
import { StatusBar, GlassHeader, StaggerList, StaggerItem, Card, typo } from '../shared/premium-ui';
import { useTheme } from '../app/contexts/theme-context';
import { useReferrals } from '../shared/referral-storage';

/* ─── Helpers ─── */
function MenuRow({
  icon: Icon,
  label,
  trailing,
  onClick,
  danger,
}: {
  icon: React.ComponentType<any>;
  label: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center"
      style={{ minHeight: 48, padding: "0 16px", gap: 12, cursor: "pointer", background: "transparent", border: "none" }}
    >
      {/* Uniform icon treatment — same neutral tile + line glyph for every row
          (no per-row colour). Only the destructive row tints red. */}
      <div className="flex items-center justify-center shrink-0" style={{
        width: 32, height: 32, borderRadius: "var(--radius)",
        backgroundColor: danger ? "var(--error-alpha-8)" : "var(--secondary)",
      }}>
        <Icon style={{ width: 16, height: 16, color: danger ? "var(--error-500)" : "var(--muted-foreground)", strokeWidth: 1.5 }} />
      </div>
      <span className="flex-1" style={{
        fontFamily: "var(--font-family-inter)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--font-weight-medium)",
        color: danger ? "var(--error-500)" : "var(--foreground)",
        textAlign: "left",
      }}>{label}</span>
      {trailing}
    </motion.button>
  );
}

function Divider() {
  return <div style={{ height: 1, backgroundColor: "var(--border)", marginLeft: 16, marginRight: 16 }} />;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <motion.div
      whileTap={{ scale: 0.9 }}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      role="switch"
      aria-checked={on}
      tabIndex={0}
      className="flex items-center shrink-0 cursor-pointer"
      style={{
        width: 44, height: 24, borderRadius: "var(--radius-full)",
        backgroundColor: on ? "var(--primary-600)" : "var(--muted)",
        padding: 2,
        justifyContent: on ? "flex-end" : "flex-start",
      }}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ width: 20, height: 20, borderRadius: "var(--radius-full)", backgroundColor: "var(--white)" }}
      />
    </motion.div>
  );
}

function ChevronTrailing() {
  return <ChevronRight style={{ width: 14, height: 14, color: "var(--muted-foreground)", strokeWidth: 1.5, flexShrink: 0 }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "block", marginBottom: 8,
      fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)",
      fontWeight: "var(--font-weight-semibold)", color: "var(--muted-foreground)",
      textTransform: "uppercase", letterSpacing: "1px",
    }}>{children}</span>
  );
}

export function Component() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const referrals = useReferrals();
  const [notifications, setNotifications] = useState(true);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [isLandscape, setIsLandscape] = useState(
    () => window.innerWidth > window.innerHeight && window.innerWidth >= 600
  );

  useEffect(() => {
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 600);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const getThemeLabel = () => {
    return theme === "dark" ? "Dark" : "Light";
  };

  return (
    <div className="flex flex-col" style={{ fontFamily: "var(--font-family-inter)" }}>
      {/* Header */}
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center" style={{ height: 52, padding: "0 20px" }}>
          <span style={typo.pageTitleStyle}>Profile</span>
        </div>
      </GlassHeader>

      <div className="w-full max-w-4xl mx-auto">
        <StaggerList className="flex flex-col pb-8">

          {/* ─── Profile Header ─── */}
          <StaggerItem style={{ padding: "24px 20px 0" }}>
            {/* Mobile: centered stack. Desktop: horizontal row */}
            <div className="flex flex-col items-center md:flex-row md:items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 80, height: 80, borderRadius: "var(--radius-full)",
                    background: "var(--gradient-primary-btn)", boxShadow: "var(--glow-primary-subtle)",
                  }}
                >
                  <span style={{
                    fontFamily: "var(--font-family-inter)", fontSize: "var(--text-2xl)",
                    fontWeight: "var(--font-weight-semibold)", color: "var(--white)",
                  }}>R</span>
                </div>
              </div>

              {/* Name & details — centered on mobile, left-aligned on desktop */}
              <div className="flex flex-col items-center md:items-start flex-1 gap-1 min-w-0">
                <span style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-lg)", fontWeight: "var(--font-weight-semibold)",
                  color: "var(--foreground)",
                }}>Rahul Sharma</span>
                <span style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-normal)",
                  color: "var(--muted-foreground)",
                }}>JEE Main 2027 · NEET 2027</span>
              </div>

            </div>
          </StaggerItem>

          {/* ─── GYD Max upgrade ─── */}
          <StaggerItem style={{ marginTop: 20, padding: "0 20px" }}>
            <motion.button
              type="button"
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate("/paywall-v2")}
              className="w-full flex items-center"
              style={{
                padding: 16, borderRadius: "var(--radius-card)", gap: 12, cursor: "pointer", textAlign: "left",
                border: "0.5px solid color-mix(in srgb, var(--purple-500) 40%, var(--border))",
                background: "linear-gradient(135deg, color-mix(in srgb, var(--purple-500) 26%, var(--card)) 0%, var(--card) 70%)",
              }}
            >
              <div className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
                <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--purple-400)" }}>Upgrade to GYD Max</span>
                <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", color: "var(--muted-foreground)" }}>
                  <b style={{ color: "var(--foreground)", fontSize: "var(--text-lg)", fontWeight: 800 }}>₹259</b> /month
                </span>
              </div>
              <Crown style={{ width: 28, height: 28, color: "var(--purple-400)", strokeWidth: 1.5 }} />
              <ChevronTrailing />
            </motion.button>
          </StaggerItem>

          {/* ─── My Institute ─── */}
          <StaggerItem style={{ marginTop: 20, padding: "0 20px" }}>
            <SectionLabel>My Institute</SectionLabel>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <motion.button
                type="button" whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/profile/my-institute")}
                className="w-full flex items-center"
                style={{ minHeight: 64, padding: "12px 16px", gap: 12, cursor: "pointer", background: "transparent", border: "none", textAlign: "left" }}
              >
                <div className="flex items-center justify-center shrink-0" style={{ width: 44, height: 44, borderRadius: "var(--radius-full)", backgroundColor: "color-mix(in srgb, var(--primary-500) 16%, transparent)" }}>
                  <SchoolIcon style={{ width: 22, height: 22, color: "var(--primary-400)" }} />
                </div>
                <div className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
                  <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--foreground)" }}>
                    Demo Inst <span style={{ color: "var(--primary-400)", fontWeight: "var(--font-weight-medium)" }}>+4 more</span>
                  </span>
                  <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>AY 2024–25</span>
                </div>
                <ChevronTrailing />
              </motion.button>
            </Card>
          </StaggerItem>

          {/* ─── Menu Sections ─── */}
          <StaggerItem style={{ marginTop: 20, padding: "0 20px" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left column */}
              <div className="flex flex-col gap-5">
                {/* Learning = progress + materials (was Study & Progress + My Drive) */}
                <div>
                  <SectionLabel>Learning</SectionLabel>
                  <Card style={{ padding: 0, overflow: "hidden" }}>
                    <MenuRow icon={BarChartIcon} label="Analytics & Progress" onClick={() => navigate("/analytics")} trailing={<ChevronTrailing />} />
                    <Divider />
                    <MenuRow icon={WorkspacePremiumIcon} label="My Certificates" onClick={() => navigate("/my-certificates")} trailing={<ChevronTrailing />} />
                    <Divider />
                    <MenuRow icon={MenuBookIcon} label="Books" onClick={() => navigate("/profile/books")} trailing={<ChevronTrailing />} />
                    <Divider />
                    <MenuRow icon={Inventory2Icon} label="Archived Classroom" onClick={() => navigate("/profile/archived")} trailing={<ChevronTrailing />} />
                  </Card>
                </div>

                <div>
                  <SectionLabel>Rewards</SectionLabel>
                  <Card style={{ padding: 0, overflow: "hidden" }}>
                    <MenuRow
                      icon={CardGiftcardIcon}
                      label="Refer & Earn"
                      onClick={() => navigate("/refer-and-earn")}
                      trailing={
                        <div className="flex items-center" style={{ gap: 8 }}>
                          {referrals.unredeemedUnlocked > 0 && (
                            <span style={{
                              display: "inline-flex", alignItems: "center",
                              height: 22,
                              padding: "0 8px",
                              fontSize: "var(--text-2xs)", fontWeight: 700,
                              color: "var(--success-500)",
                              backgroundColor: "var(--success-d2)",
                              border: "1px solid var(--success-d4)",
                              borderRadius: 4,
                              letterSpacing: 0.4, textTransform: "uppercase",
                              whiteSpace: "nowrap",
                            }}>
                              {referrals.unredeemedUnlocked} to claim
                            </span>
                          )}
                          {referrals.total > 0 && referrals.unredeemedUnlocked === 0 && (
                            <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", color: "var(--muted-foreground)" }}>
                              {referrals.total} invited
                            </span>
                          )}
                          <ChevronTrailing />
                        </div>
                      }
                    />
                  </Card>
                </div>

                {/* Shopping = marketplace + your owned device (was Shopping + My Devices) */}
                <div>
                  <SectionLabel>Shopping</SectionLabel>
                  <Card style={{ padding: 0, overflow: "hidden" }}>
                    <MenuRow icon={ShoppingBagIcon} label="My Orders" onClick={() => navigate("/marketplace/orders")} trailing={<ChevronTrailing />} />
                    <Divider />
                    <MenuRow icon={LocationOnIcon} label="My Addresses" onClick={() => navigate("/marketplace/addresses")} trailing={<ChevronTrailing />} />
                    <Divider />
                    <MenuRow icon={FavoriteIcon} label="Wishlist" onClick={() => navigate("/marketplace/wishlist")} trailing={<ChevronTrailing />} />
                    <Divider />
                    <MenuRow icon={SettingsRemoteIcon} label="Click X" onClick={() => navigate("/profile/devices")} trailing={<ChevronTrailing />} />
                  </Card>
                </div>

              </div>

              {/* Right column */}
              <div className="flex flex-col gap-5">
                <div>
                  <SectionLabel>Help & Support</SectionLabel>
                  <Card style={{ padding: 0, overflow: "hidden" }}>
                    <MenuRow icon={SupportAgentIcon} label="Contact Support" onClick={() => navigate("/profile/contact-support")} trailing={<ChevronTrailing />} />
                    <Divider />
                    <MenuRow icon={GroupsIcon} label="Teachmint Community" onClick={() => navigate("/profile/community")} trailing={<ChevronTrailing />} />
                  </Card>
                </div>

                {/* Settings = preferences + account (was Preferences + Account) */}
                <div>
                  <SectionLabel>Settings</SectionLabel>
                  <Card style={{ padding: 0, overflow: "hidden" }}>
                    <MenuRow icon={CalendarMonthIcon} label="Study Schedule" onClick={() => navigate("/study-schedule")} trailing={<ChevronTrailing />} />
                    <Divider />
                    <MenuRow icon={LanguageIcon} label="Language" onClick={() => navigate("/language")} trailing={
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>English</span>
                        <ChevronTrailing />
                      </div>
                    } />
                    <Divider />
                    <MenuRow
                      icon={theme === "dark" ? DarkModeIcon : LightModeIcon}
                      label="Appearance"
                      onClick={() => setShowAppearanceModal(true)}
                      trailing={
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-normal)", color: "var(--muted-foreground)" }}>{getThemeLabel()}</span>
                          <ChevronTrailing />
                        </div>
                      }
                    />
                    <Divider />
                    <MenuRow icon={NotificationsIcon} label="Notifications" trailing={<Toggle on={notifications} onToggle={() => setNotifications(!notifications)} />} />
                    <Divider />
                    <MenuRow icon={LockIcon} label="Password & Security" onClick={() => navigate("/profile/password-security")} trailing={<ChevronTrailing />} />
                    <Divider />
                    <MenuRow icon={ManageAccountsIcon} label="Account Settings" onClick={() => navigate("/profile/account-settings")} trailing={<ChevronTrailing />} />
                  </Card>
                </div>

                <div>
                  <SectionLabel>App Info & Legal</SectionLabel>
                  <Card style={{ padding: 0, overflow: "hidden" }}>
                    <MenuRow icon={SyncIcon} label="App Version" trailing={
                      <span style={{ fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-medium)", color: "var(--muted-foreground)", backgroundColor: "var(--secondary)", padding: "2px 8px", borderRadius: 4 }}>1.2.0</span>
                    } />
                    <Divider />
                    <MenuRow icon={ShieldIcon} label="Privacy Policy" onClick={() => navigate("/profile/privacy-policy")} trailing={<ChevronTrailing />} />
                    <Divider />
                    <MenuRow icon={DescriptionIcon} label="Terms & Conditions" onClick={() => navigate("/profile/terms")} trailing={<ChevronTrailing />} />
                    <Divider />
                    <MenuRow icon={BookmarkIcon} label="NCERT License" onClick={() => navigate("/profile/ncert-license")} trailing={<ChevronTrailing />} />
                  </Card>
                </div>

              </div>
            </div>
          </StaggerItem>

          {/* ─── Log out ─── */}
          <StaggerItem style={{ marginTop: 20, padding: "0 20px" }}>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {/* TODO(api): clear session + route to login */}
              <MenuRow icon={LogoutIcon} label="Log out" danger onClick={() => {}} />
            </Card>
          </StaggerItem>

          {/* App version footer */}
          <StaggerItem>
            <div className="flex items-center justify-center" style={{ padding: "24px 20px 0" }}>
              <span style={{
                fontFamily: "var(--font-family-inter)", fontSize: "var(--text-xs)",
                fontWeight: "var(--font-weight-normal)", color: "var(--gray-600)",
              }}>PrepMaster v1.2.0</span>
            </div>
          </StaggerItem>
        </StaggerList>
      </div>

      {/* Appearance Modal */}
      <AnimatePresence>
        {showAppearanceModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAppearanceModal(false)}
              className="fixed inset-0"
              style={{
                backgroundColor: "var(--overlay-dark)",
                zIndex: 999,
              }}
            />

            {/* Bottom Sheet / Center Modal */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="appearance-title"
              initial={isLandscape ? { opacity: 0, scale: 0.95 } : { y: "100%" }}
              animate={isLandscape ? { opacity: 1, scale: 1 } : { y: 0 }}
              exit={isLandscape ? { opacity: 0, scale: 0.95 } : { y: "100%" }}
              transition={isLandscape
                ? { duration: 0.18, ease: "easeOut" }
                : { type: "spring", damping: 30, stiffness: 300 }
              }
              className="overflow-auto"
              style={isLandscape ? {
                position: "fixed",
                top: "50%",
                left: "50%",
                x: "-50%",
                y: "-50%",
                width: "calc(100% - 32px)",
                maxWidth: 480,
                maxHeight: "85vh",
                zIndex: 1000,
              } : {
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                maxHeight: "80vh",
              }}
            >
              <div style={{
                backgroundColor: "var(--card-bg)",
                borderTopLeftRadius: "var(--radius-card)",
                borderTopRightRadius: "var(--radius-card)",
                padding: 24,
                boxShadow: "var(--elevation-xl)",
              }}>
                {/* Drag Handle */}
                <div style={{
                  width: 32,
                  height: 4,
                  backgroundColor: "var(--gray-600)",
                  borderRadius: "var(--radius-full)",
                  margin: "0 auto 20px auto",
                }} />

                {/* Header */}
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <span id="appearance-title" style={{
                    fontFamily: "var(--font-family-inter)",
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--font-weight-semibold)",
                    color: "var(--foreground)",
                  }}>Appearance</span>
                  <motion.button
                    type="button"
                    aria-label="Close appearance settings"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAppearanceModal(false)}
                    className="flex items-center justify-center cursor-pointer"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "var(--radius)",
                      color: "var(--gray-400)",
                      backgroundColor: "transparent",
                      border: "none",
                    }}
                  >
                    <XIcon style={{ width: 16, height: 16 }} />
                  </motion.button>
                </div>

                {/* Description */}
                <p style={{
                  fontFamily: "var(--font-family-inter)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--font-weight-normal)",
                  color: "var(--gray-400)",
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}>
                  Choose how PrepMaster looks for you
                </p>

                {/* Theme Options */}
                <div className="flex flex-col gap-3">
                  {/* Light Option */}
                  <motion.button
                    type="button"
                    aria-pressed={theme === "light"}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setTheme("light"); setShowAppearanceModal(false); }}
                    className="flex items-center gap-3 cursor-pointer w-full"
                    style={{
                      padding: 16,
                      borderRadius: "var(--radius-card)",
                      border: `2px solid ${theme === "light" ? "var(--primary-600)" : "var(--border)"}`,
                      backgroundColor: theme === "light" ? "var(--primary-alpha-8)" : "transparent",
                    }}
                  >
                    <div className="flex items-center justify-center" style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--radius)",
                      backgroundColor: "var(--primary-alpha-15)",
                    }}>
                      <Sun style={{ width: 20, height: 20, color: "var(--primary-600)", strokeWidth: 2 }} />
                    </div>
                    <div className="flex-1 text-left">
                      <div style={{
                        fontFamily: "var(--font-family-inter)",
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-weight-semibold)",
                        color: "var(--foreground)",
                      }}>Light</div>
                      <div style={{
                        fontFamily: "var(--font-family-inter)",
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--font-weight-normal)",
                        color: "var(--gray-500)",
                        marginTop: 2,
                      }}>Easy on the eyes during the day</div>
                    </div>
                    {theme === "light" && (
                      <div className="flex items-center justify-center" style={{
                        width: 20,
                        height: 20,
                        borderRadius: "var(--radius-full)",
                        backgroundColor: "var(--primary-600)",
                      }}>
                        <CheckCircle2 style={{ width: 12, height: 12, color: "var(--white)", strokeWidth: 3 }} />
                      </div>
                    )}
                  </motion.button>

                  {/* Dark Option */}
                  <motion.button
                    type="button"
                    aria-pressed={theme === "dark"}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setTheme("dark"); setShowAppearanceModal(false); }}
                    className="flex items-center gap-3 cursor-pointer w-full"
                    style={{
                      padding: 16,
                      borderRadius: "var(--radius-card)",
                      border: `2px solid ${theme === "dark" ? "var(--primary-600)" : "var(--border)"}`,
                      backgroundColor: theme === "dark" ? "var(--primary-alpha-8)" : "transparent",
                    }}
                  >
                    <div className="flex items-center justify-center" style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--radius)",
                      backgroundColor: "var(--primary-alpha-15)",
                    }}>
                      <Moon style={{ width: 20, height: 20, color: "var(--primary-600)", strokeWidth: 2 }} />
                    </div>
                    <div className="flex-1 text-left">
                      <div style={{
                        fontFamily: "var(--font-family-inter)",
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-weight-semibold)",
                        color: "var(--foreground)",
                      }}>Dark</div>
                      <div style={{
                        fontFamily: "var(--font-family-inter)",
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--font-weight-normal)",
                        color: "var(--gray-500)",
                        marginTop: 2,
                      }}>Perfect for late night studying</div>
                    </div>
                    {theme === "dark" && (
                      <div className="flex items-center justify-center" style={{
                        width: 20,
                        height: 20,
                        borderRadius: "var(--radius-full)",
                        backgroundColor: "var(--primary-600)",
                      }}>
                        <CheckCircle2 style={{ width: 12, height: 12, color: "var(--white)", strokeWidth: 3 }} />
                      </div>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
