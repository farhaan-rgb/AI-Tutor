# Referral & Share — PRD

**Product:** PrepMaster
**Author:** Sagar (Design) · Buddy-assisted
**Status:** Discovery / pre-build

---

## 1. Overview

Customer calls with Crash Course + CAT Test Prep buyers showed they're ready to recommend. We have no path to capture it.

**The design — one screen:** four entry points feed one share sheet. The sheet auto-rises at the high-positive moment (rating ≥ 4, course completion, mock 90%ile) and is always accessible from three manual surfaces (in-course 3-dot menu, Profile referral dashboard, product detail page).

---

## 2. The reward decision

A good incentive does two jobs:

> **(1)** Motivate the referrer to actually share.
> **(2)** Help us — by keeping spend on-platform, deepening engagement, or graduating them to the next paid tier.

### Incentive options — ranked

| # | Incentive | Motivates user | Helps us? | Persona fit | Eng cost | Verdict |
|---|---|---|---|---|---|---|
| 1 | In-app wallet credit | High (agency) | ✅ Locks spend on-platform | ✅ Universal | High (4–6 wks: balance, expiry, reconciliation) | Defer to v3 — infra not built |
| 2 | Coupon code on courses | High | ✅ Drives a purchase | ✅ Universal | Med (2–3 wks: generation, validation, redemption) | Defer to v2 — engine not built |
| 3 | **Persona-adaptive entitlement** (free next-tier product, tailored to segment) | Med-High | ✅ Bridges to next tier · LTV uplift · zero cash leak | ✅ Universal across segments | Low (1–2 wks) | ✅ **V1 pick** |
| 4 | Status / leaderboard / badges | Low alone | ⚠️ Indirect — brand affinity only | Universal | Very low (UI) | v1.5 overlay |
| 5 | Social proof feed ("3 friends from your group joined") | Passive — creates FOMO, not action | ⚠️ Indirect — peer pressure | Universal | Low | v1.5 add-on |
| 6 | No incentive — pure goodwill | Low (~30% of incentivised baseline) | Neutral — share happens or doesn't | Universal | Zero | Fallback if eng slips |

### What "persona-adaptive" looks like

| Referrer's primary engagement | Reward they unlock (30–90 days) |
|---|---|
| Practice user (Class 6–10) | 1 month unlimited practice + NCERT premium |
| JEE/NEET Crash Course | 1 free mock pack matching their exam |
| CAT Test Prep | 1 free crash-course module (e.g., DI/LR intensive week) |
| Mock Test buyer | 1 free month of new mock series OR 1 doubt-clearing session |
| UPSC course buyer | 1 month current-affairs monthly |
| Skill course buyer | 1 free skill course of similar level |
| No clear segment (low engagement, new account) | ₹99 OFF auto-applied next purchase (token, catch-all) |

---

## 3. Success metrics

| Metric | Definition | v1 target |
|---|---|---|
| **Share-sheet conversion** | Of users who see the sheet, % who send to ≥1 contact | 25–35% from post-feedback trigger · 8–12% cold |
| **Invite → install** | Of unique referral-link taps, % that install | 20–35% |
| **Referred user paid conversion** | Of installs from referral, % who purchase | 2–3× cold-cohort baseline |
| **Referral revenue %** | Referral-attributed GMV / total GMV | 8–15% by 90 days post-launch |
| **Reward redemption rate** | Of unlocked rewards, % actually used by referrer | ≥ 70% |
| **Referrer repeat behaviour** | % of referrers who refer ≥ 2 friends in 60 days | 30%+ |

---

## 4. Triggers

### When the sheet auto-rises

| Trigger | Fires on (product) | Threshold | Cooldown |
|---|---|---|---|
| **Post-positive-feedback** | Crash Course, Test Prep | Feedback rating ≥ 4 | 14 days |
| **Course completion** | Crash Course, Test Prep | Last lesson watched OR cohort end | One-time per course |
| **Mock score milestone** | Mock Test packs | 90%ile OR percentile jump ≥ 5 | One-time per pack |

The post-feedback flow is **two sheets sequenced** — submit feedback → success state → 600ms → share rises. Never merged.

### Global rules

- Max 1 share sheet per 14 days · Suppress 90 days post-share · Never twice in one session
- Suppress if user has unredeemed rewards
- Suppress mid-checkout / mid-purchase
- **Suppress entirely** for users who rated ≤ 3 in the last 14 days

### Conflict resolution

Two triggers fire same session → strongest signal wins: **mock 90%ile > course completion > feedback ≥ 4**. Trigger fires while another modal is open → queue, raise after dismiss + 600ms. User taps "Not now" → 30-day cooldown. User taps "Don't show again" → 1-year cooldown.

### Manual entry points (always available)

- **In-course 3-dot menu** — three items: *About this course · Give feedback · Share with a friend*
- **Profile → "Refer & Earn"** — full dashboard with unclaimed-reward badge, status pills (Invited / Installed / Purchased / Reward unlocked), history list
- **Product detail page** — small share icon next to wishlist heart. Organic intent, no incentive, no referral code in the link

---

## 5. Edge cases

### A. Identity & fraud

| Case | Mitigation |
|---|---|
| Same user creates fake account, refers self | Device fingerprint (1 attributed install per device); phone differs; payment instrument differs |
| Multiple accounts on same device | Block reward if device already received one |
| Refund-and-rebuy to game referrals | Reward unlocks only after 10-business-day refund window; held "pending" until then |
| Family circles (dad → son → daughter) | Allowed but capped: max 3 referrals per household |
| Bot accounts inflating count | Email + phone verification before attribution; rate-limit installs per IP |
| Friend buys ₹199 pack to trigger reward | Min spend ₹499 to qualify |

### B. Attribution

| Case | Behaviour |
|---|---|
| Friend installs but doesn't tap the link first | Deferred deep link — code stored on install, attached on signup |
| Friend installs from Play Store search later | Outside attribution window (7 days from link tap) — no reward |
| Friend purchases 30 days after install | Attribution holds 30 days from install |
| Same friend referred by 2 users | **First-touch wins** — whoever's link they tapped first |
| Friend already had the app | No reward; "Already a user" toast |

### C. Timing & state

| Case | Behaviour |
|---|---|
| Trigger fires within 24h of friend's purchase | OK — fire |
| User has 0 referrals (Profile empty) | Hero illustration + "Invite your first friend" + how-it-works |
| User has pending referrals | List with status pills: Invited → Installed → Purchased → Reward unlocked |
| User has unredeemed reward but no eligible content | Profile nudge routes to relevant marketplace section |
| User churned (no login 60+ days) | Reward expires 180 days after unlock; email/push at 30/60/90 days remaining |
| User refunds own purchase after referring | Pending reward clawed back; if already used, loss accepted |
| Friend refunds within 10 days | Referrer's pending reward cancelled |
| Friend refunds after 10 days | Reward stands |
| Auto-rise on weak connection | Sheet loads with skeleton + retry — never blocks underlying screen |

### D. Reward calculation

| Case | Rule |
|---|---|
| Reward eligible on first friend purchase only | Subsequent purchases by same friend don't multiply |
| Reward cap per referrer per FY | 10 successful referrals (keeps TDS exposure under ₹20K — Section 194R safe) |
| Friend's renewal / upgrade purchase | Doesn't count — only first purchase |
| Friend buys 2 products in same checkout | Counts as 1 referral event |
| Referrer's segment changes mid-flow | Reward type locked at trigger fire — uses segment at moment of qualifying purchase |

---

**End of PRD.**
