import React from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { User } from "lucide-react";

/* Classes icon — exact Figma paths */
function ClassesIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          fill="currentColor"
          d="M20 3C21.1046 3 22 3.89543 22 5V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5C2 3.89543 2.89543 3 4 3H20ZM14 19H19V18H14V19ZM7.625 13.0322C6.75013 13.0322 5.00053 13.4704 5 14.3428V15H7.91699V14.125C7.91699 13.7261 8.09155 13.3738 8.32715 13.0996C8.09543 13.057 7.86057 13.0354 7.625 13.0322ZM12 12.375C10.8322 12.375 8.5 12.9607 8.5 14.125V15H15.5V14.125C15.5 12.9607 13.1678 12.375 12 12.375ZM16.375 13.0322C16.1767 13.0322 15.9318 13.0553 15.6729 13.0996C15.9096 13.3738 16.083 13.7261 16.083 14.125V15H19V14.3428C18.9995 13.4704 17.2499 13.0322 16.375 13.0322ZM7.625 9.75C7.2769 9.75 6.94341 9.88862 6.69727 10.1348C6.45112 10.3809 6.3125 10.7144 6.3125 11.0625C6.3125 11.4106 6.45112 11.7441 6.69727 11.9902C6.94341 12.2364 7.2769 12.375 7.625 12.375C7.9731 12.375 8.30659 12.2364 8.55273 11.9902C8.79888 11.7441 8.9375 11.4106 8.9375 11.0625C8.9375 10.7144 8.79888 10.3809 8.55273 10.1348C8.30659 9.88862 7.9731 9.75 7.625 9.75ZM16.375 9.75C16.0269 9.75 15.6934 9.88862 15.4473 10.1348C15.2011 10.3809 15.0625 10.7144 15.0625 11.0625C15.0625 11.4106 15.2011 11.7441 15.4473 11.9902C15.6934 12.2364 16.0269 12.375 16.375 12.375C16.7231 12.375 17.0566 12.2364 17.3027 11.9902C17.5489 11.7441 17.6875 11.4106 17.6875 11.0625C17.6875 10.7144 17.5489 10.3809 17.3027 10.1348C17.0566 9.88862 16.7231 9.75 16.375 9.75ZM12 8C11.5359 8 11.0909 8.18451 10.7627 8.5127C10.4345 8.84088 10.25 9.28587 10.25 9.75C10.25 10.2141 10.4345 10.6591 10.7627 10.9873C11.0909 11.3155 11.5359 11.5 12 11.5C12.4641 11.5 12.9091 11.3155 13.2373 10.9873C13.5655 10.6591 13.75 10.2141 13.75 9.75C13.75 9.28587 13.5655 8.84088 13.2373 8.5127C12.9091 8.18451 12.4641 8 12 8Z"
        />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path stroke="currentColor" strokeWidth="2" d="M3 5V19C3 19.1313 3.02587 19.2614 3.07612 19.3827C3.12638 19.504 3.20003 19.6142 3.29289 19.7071C3.38575 19.8 3.49599 19.8736 3.61732 19.9239C3.73864 19.9741 3.86868 20 4 20H20C20.1313 20 20.2614 19.9741 20.3827 19.9239C20.504 19.8736 20.6142 19.8 20.7071 19.7071C20.8 19.6142 20.8736 19.504 20.9239 19.3827C20.9741 19.2614 21 19.1313 21 19V5C21 4.73478 20.8946 4.48043 20.7071 4.29289C20.5196 4.10536 20.2652 4 20 4H4C3.73478 4 3.48043 4.10536 3.29289 4.29289C3.10536 4.48043 3 4.73478 3 5Z"/>
      <path fill="currentColor" d="M14 18H18V20H14V18Z"/>
      <path fill="currentColor" d="M12 12C12.3978 12 12.7794 11.842 13.0607 11.5607C13.342 11.2794 13.5 10.8978 13.5 10.5C13.5 10.1022 13.342 9.72064 13.0607 9.43934C12.7794 9.15804 12.3978 9 12 9C11.6022 9 11.2206 9.15804 10.9393 9.43934C10.658 9.72064 10.5 10.1022 10.5 10.5C10.5 10.8978 10.658 11.2794 10.9393 11.5607C11.2206 11.842 11.6022 12 12 12ZM12 12.75C10.999 12.75 9 13.252 9 14.25V15H15V14.25C15 13.252 13.001 12.75 12 12.75Z"/>
      <path fill="currentColor" d="M15.75 10.5C15.4516 10.5 15.1655 10.6185 14.9545 10.8295C14.7435 11.0405 14.625 11.3266 14.625 11.625C14.625 11.9234 14.7435 12.2095 14.9545 12.4205C15.1655 12.6315 15.4516 12.75 15.75 12.75C16.0484 12.75 16.3345 12.6315 16.5455 12.4205C16.7565 12.2095 16.875 11.9234 16.875 11.625C16.875 11.3266 16.7565 11.0405 16.5455 10.8295C16.3345 10.6185 16.0484 10.5 15.75 10.5ZM15.75 13.313C15.58 13.313 15.37 13.333 15.148 13.371C15.351 13.606 15.5 13.908 15.5 14.25V15H18V14.437C18 13.689 16.5 13.313 15.75 13.313ZM14.02 13.748C13.713 13.924 13.5 14.155 13.5 14.438V14.5H14.5V14.25C14.5 14.168 14.468 14.088 14.332 13.963C14.2364 13.8798 14.1318 13.8077 14.02 13.748ZM8.25 10.5C7.95163 10.5 7.66548 10.6185 7.4545 10.8295C7.24353 11.0405 7.125 11.3266 7.125 11.625C7.125 11.9234 7.24353 12.2095 7.4545 12.4205C7.66548 12.6315 7.95163 12.75 8.25 12.75C8.54837 12.75 8.83452 12.6315 9.0455 12.4205C9.25647 12.2095 9.375 11.9234 9.375 11.625C9.375 11.3266 9.25647 11.0405 9.0455 10.8295C8.83452 10.6185 8.54837 10.5 8.25 10.5ZM8.25 13.313C7.5 13.313 6 13.689 6 14.437V15H8.5V14.25C8.5 13.908 8.65 13.606 8.852 13.371C8.65334 13.3345 8.45197 13.3158 8.25 13.313ZM9.98 13.748C9.86822 13.8077 9.76356 13.8798 9.668 13.963C9.532 14.088 9.5 14.168 9.5 14.25V14.5H10.5V14.437C10.5 14.155 10.287 13.924 9.98 13.748Z"/>
    </svg>
  );
}

/* Practice icon — exact Figma paths */
function PracticeIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="prac-sel-grad" x1="13.3428" y1="1.61579" x2="21.0374" y2="6.69688" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F8DF8B"/>
            <stop offset="1" stopColor="#E8B339"/>
          </linearGradient>
          <clipPath id="prac-sel-clip">
            <rect width="22" height="22" fill="white" transform="translate(1 1)"/>
          </clipPath>
        </defs>
        <g clipPath="url(#prac-sel-clip)">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            fill="currentColor"
            d="M12.8801 1.51857C12.6871 1.46718 12.4816 1.49441 12.3087 1.59427C12.1358 1.69413 12.0096 1.85848 11.9576 2.05128L8.29148 15.7353C8.24016 15.9284 8.26759 16.1341 8.36777 16.307C8.46795 16.48 8.63267 16.6061 8.82577 16.6577L18.3848 19.2191C18.5779 19.2705 18.7836 19.243 18.9565 19.1429C19.1295 19.0427 19.2556 18.8779 19.3072 18.6849L22.9765 5.00242C23.0021 4.90667 23.0087 4.8068 22.9957 4.70852C22.9827 4.61025 22.9505 4.51549 22.9009 4.42968C22.8512 4.34386 22.7852 4.26867 22.7065 4.2084C22.6278 4.14813 22.538 4.10396 22.4422 4.07842L12.8801 1.51857ZM6.39477 15.2261L8.90277 5.86828L1.55949 7.83414C1.4637 7.85967 1.37389 7.90384 1.29519 7.96411C1.21649 8.02438 1.15044 8.09958 1.10082 8.18539C1.05119 8.27121 1.01898 8.36596 1.006 8.46424C0.993026 8.56251 0.99955 8.66238 1.0252 8.75814L4.69449 22.4406C4.74608 22.6337 4.8722 22.7984 5.04515 22.8986C5.2181 22.9987 5.42375 23.0262 5.61691 22.9749L15.1775 20.4134L15.2136 20.4024L8.31506 18.5544C7.61898 18.3677 7.02554 17.9122 6.66515 17.2881C6.30478 16.664 6.20696 15.9223 6.3932 15.2261"
          />
          <path
            fill="url(#prac-sel-grad)"
            d="M16.2261 7.07997C16.3524 6.90599 16.627 6.98298 16.6444 7.19725L16.8161 9.31166C16.8215 9.37903 16.8562 9.44064 16.9109 9.48034L18.6277 10.7263C18.8017 10.8526 18.7247 11.1272 18.5105 11.1446L16.3961 11.3163C16.3287 11.3218 16.2671 11.3564 16.2274 11.4111L14.9814 13.128C14.8551 13.3019 14.5805 13.225 14.5631 13.0107L14.3914 10.8963C14.386 10.8289 14.3513 10.7673 14.2966 10.7276L12.5798 9.48158C12.4058 9.35531 12.4828 9.08074 12.697 9.06334L14.8114 8.89165C14.8788 8.88618 14.9404 8.85155 14.9801 8.79685L16.2261 7.07997Z"
          />
        </g>
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="prac-unsel-grad" x1="12.9651" y1="0.671591" x2="21.3593" y2="6.2146" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E9F9BD"/>
          <stop offset="1" stopColor="#F7AE42"/>
        </linearGradient>
      </defs>
      {/* Front card */}
      <path
        d="M11.2257 1.469C11.2819 1.26096 11.4183 1.0837 11.605 0.976052C11.7917 0.868406 12.0135 0.839157 12.2217 0.894714L22.5417 3.65814C22.7504 3.71364 22.9285 3.84974 23.0368 4.03652C23.1451 4.2233 23.1748 4.44546 23.1194 4.65414L19.1594 19.4279C19.1032 19.6363 18.9665 19.8138 18.7794 19.9215C18.5923 20.0292 18.3701 20.0582 18.1617 20.0021L7.84169 17.2387C7.63334 17.1828 7.45566 17.0466 7.34767 16.8599C7.23968 16.6731 7.2102 16.4512 7.26569 16.2427L11.2257 1.469Z"
        stroke="currentColor"
        strokeWidth="1.71429"
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
      {/* Back card */}
      <path
        d="M10.4731 4.3457L1.46279 6.76113C1.25443 6.81699 1.07676 6.95325 0.968765 7.13999C0.860773 7.32672 0.83129 7.54868 0.886787 7.75713L4.84336 22.5308C4.89957 22.7393 5.03624 22.9168 5.22333 23.0245C5.41042 23.1322 5.63261 23.1612 5.84107 23.1051L11.0011 21.7234"
        stroke="currentColor"
        strokeWidth="1.71429"
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
      {/* Gradient star */}
      <path
        d="M16.1106 6.63252C16.2483 6.44272 16.5479 6.52671 16.5669 6.76046L16.7542 9.06709C16.7601 9.14058 16.7979 9.20779 16.8576 9.2511L18.7305 10.6104C18.9203 10.7481 18.8363 11.0477 18.6026 11.0666L16.296 11.254C16.2225 11.2599 16.1553 11.2977 16.112 11.3574L14.7527 13.2303C14.6149 13.4201 14.3154 13.3361 14.2964 13.1024L14.1091 10.7958C14.1031 10.7223 14.0654 10.655 14.0057 10.6117L12.1327 9.25246C11.9429 9.11471 12.0269 8.81517 12.2607 8.79619L14.5673 8.60889C14.6408 8.60292 14.708 8.56515 14.7513 8.50547L16.1106 6.63252Z"
        fill="url(#prac-unsel-grad)"
      />
    </svg>
  );
}


// TODO(api): GET /api/user/profile — replace with real user avatar
const DUMMY_AVATAR_URL = "/avatar.svg";

function ProfileAvatar({ active }: { active: boolean }) {
  const [imgFailed, setImgFailed] = React.useState(false);
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 9999,
        overflow: "hidden",
        border: active ? "2px solid var(--primary-600)" : "2px solid var(--border)",
        flexShrink: 0,
        backgroundColor: "var(--card)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {imgFailed ? (
        <User style={{ width: 16, height: 16, color: active ? "var(--primary-400)" : "var(--muted-foreground)", strokeWidth: 1.5 }} />
      ) : (
        <img
          src={DUMMY_AVATAR_URL}
          alt="Profile"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={() => setImgFailed(true)}
        />
      )}
    </div>
  );
}

function DiscoverIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          fill="currentColor"
          d="M2 7l4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7H2z M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7H22z M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4z M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4z"
        />
        <path
          fill="none"
          stroke="var(--background)"
          strokeWidth="2.5"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          d="M22 10a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2"
        />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter">
      <path strokeLinecap="butt" d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path strokeLinecap="butt" d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path strokeLinecap="butt" d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path strokeLinecap="butt" d="M2 7h20" />
      <path strokeLinecap="butt" d="M22 7v3a2 2 0 0 1-4 0a2 2 0 0 1-4 0a2 2 0 0 1-4 0a2 2 0 0 1-4 0a2 2 0 0 1-4 0V7" />
    </svg>
  );
}

const tabs = [
  { path: '/classes-v1', label: 'Classes', id: 'classes' },
  { path: '/practice', label: 'Practice', id: 'practice' },
  { path: '/marketplace-v1', label: 'Discover', id: 'marketplace' },
  { path: '/profile', label: 'Profile', id: 'profile' },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = (() => {
    const p = location.pathname;
    if (p === "/classes" || p.startsWith("/classes/") || p === "/classes-v1" || p.startsWith("/classes-v1/")) return "classes";
    if (p === "/practice" || p.startsWith("/practice/")) return "practice";
    if (p === "/marketplace" || p.startsWith("/marketplace/") || p === "/marketplace-home-v1" || p.startsWith("/marketplace-home-v1/") || p === "/marketplace-v1" || p.startsWith("/marketplace-v1/") || p === "/marketplace-v2" || p.startsWith("/marketplace-v2/")) return "marketplace";
    const profilePaths = ["/profile"];
    if (profilePaths.some(pp => p === pp || p.startsWith(pp + "/"))) return "profile";
    return "classes";
  })();

  return (
    <nav
      className="flex items-center justify-around shrink-0"
      style={{
        height: 64,
        paddingBottom: 8,
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        backgroundColor: "var(--glass-bg)",
        borderTop: "1px solid var(--border)",
        position: "relative",
        boxShadow: "var(--elevation-lg)",
      }}
    >
      <div className="absolute top-0 left-0 right-0" style={{ height: 1, background: "var(--header-edge)" }} />
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? "var(--primary-600)" : "var(--muted-foreground)";

        let icon: React.ReactNode;
        if (tab.id === "classes") icon = <ClassesIcon filled={isActive} />;
        else if (tab.id === "practice") icon = <PracticeIcon filled={isActive} />;
        else if (tab.id === "marketplace") icon = <DiscoverIcon filled={isActive} />;
        else icon = <ProfileAvatar active={isActive} />;

        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.1 }}
            onClick={() => navigate(`${tab.path}${location.search}`)}
            className="flex flex-col items-center justify-center flex-1 cursor-pointer gap-[2px]"
            style={{ height: "100%", color, border: "none", background: "none", transition: "all 0.15s ease" }}
            aria-label={tab.label}
          >
            {icon}
            <span style={{
              fontFamily: "var(--font-family-inter)",
              fontSize: "var(--text-xs)",
              fontWeight: isActive ? "var(--font-weight-semibold)" : "var(--font-weight-normal)",
              lineHeight: "1",
              marginTop: 2,
            }}>{tab.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
