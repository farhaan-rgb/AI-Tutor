# Arena — Competitive Learning Platform

## 1. The idea

**A place in the app where any student — Class 1 to a JEE/NEET aspirant — can compete, climb, win, and pull their friends in.**

Studying becomes an event: you enter, compete against people at your level, win real rewards, and share the moment.

*Pitch: "Tournaments for your brain."*

---

## 2. Two formats, one platform

Competition can be packaged two ways — and students want both, for different moments. Both run on the **same engine** (§5) and serve **every segment** (school, JEE/NEET, UPSC, skills).

| | 🏆 **Championships** | ⚔️ **Leagues** |
|---|---|---|
| **Shape** | A scheduled event | An always-on ladder |
| **Cadence** | Occasional, high-stakes (e.g. a 2-day weekend event, monthly, seasonal) | Daily sprints + recurring events, forever |
| **You face** | The whole nation, same paper, same time | A small group at your level |
| **The hook** | "Where do I rank in India? Did I earn a certificate?" | "Can I get promoted this week? Keep my streak?" |
| **Job** | Credibility & prestige | Habit & momentum |
| **Feels like** | NTA mock · Unacademy Combat | Duolingo Leagues · a ranked game ladder |

*Example:* a NEET aspirant plays a **League** ladder nightly for daily practice **and** sits a monthly **Championship** for the all-India rank that impresses a parent. Same wallet, same friends — two front doors.

---

## 3. What we optimise for

Priority order (founder decision) — when two good ideas conflict, the higher one wins:

| # | Goal | North-star |
|---|------|-----------|
| 1 | **Growth & virality** | K-factor (invites → active players) |
| 2 | **Engagement & retention** | D7 / D30 retention, streaks |
| 3 | **Learning outcomes** | Accuracy lift over time |
| 4 | **Revenue** (without selling rank) | Revenue / active user |

> **The one rule:** nothing you can buy may ever change your rank. A leaderboard that feels pay-to-win kills both virality and parent trust.

Reality check: real referral K-factors land at **0.2–0.8**, not above 1. Virality amplifies retention — it isn't a standalone engine. Fix retention first.

---

## 4. Who it's for

- **School learners (Class 1–12)** — biggest volume, most viral (friend groups).
- **Exam aspirants (JEE, NEET, UPSC, Foundation)** — highest intent, strongest reward-seekers.
- **Skill learners (coding, GK, aptitude, vocabulary)** — lowest barrier, best top-of-funnel.
- **Parents** (decide & pay); later **teachers/schools** and **reward sponsors**.

**India realities:** WhatsApp sharing (images/status, not links), multi-language, low-end Android, deep exam culture — and **every student is legally a minor** (§14).

> **The head start:** the app already sees **~3 lakh students/month.** Cold-start — empty leagues and thin leaderboards — is the #1 thing that kills competitive products, and we largely skip it: popular divisions are dense from day one. (Only long-tail divisions/subjects need to fill first.)

---

## 5. The shared loop — ENTER → COMPETE → REWARDS

```
  ENTER  ──▶  COMPETE  ──▶  REWARDS  ──▶  (come back)
  pick a      answer,       rank, win,
  contest     climb, score  certificate + SHARE
```

- **Enter** — free is always the default door; some contests are gated or sponsored. *We never charge a minor an entry fee to win a prize (§14).*
- **Compete** — a timed paper (Championship) or a ladder climb with live rank + energy (League).
- **Rewards** — rank/percentile, certificate or rank-card, gems/vouchers/badges, and a one-tap shareable card.

---

## 6. 🏆 Championships

A **scheduled, one-shot event.** Everyone sits the same paper in the same window; when results publish you get an all-India rank, percentile, certificate, and a performance report.

- **Entry:** free or subscription-gated (a subscription, never a staked fee).
- **One common window** so it's fair.
- **Results gate:** during the window you see *your own* score immediately; **rank, leaderboard, certificate and rewards unlock only when the window closes** — this is what keeps it credible.
- **The result is the moment:** rank reveal → percentile → deep report → reward claim.
- **Concluded events lead with the winners** (national podium first).

*References:* NTA exams · Unacademy Combat (free entry, national leaderboard, scholarship/gadget prizes, referral-to-enter) · PW Champions League (qualifier → live-streamed final).

*Best for:* prestige moments — JEE/NEET mocks, board mega-tests, branded Olympiads.

---

## 7. ⚔️ Leagues

An **always-on ladder.** You're placed in a small group of similarly-skilled players and climb. Each week the top promote and the bottom relegate — there's always a next season.

**Two play modes:**
- **Daily Sprint** — short (~10 min), free, habit-forming → retention.
- **Weekend / Season Event** — longer window, bigger rewards, more shareable → virality.

**The format:** a ladder climb of questions that start easy and get harder ("Level 4/10"), with a **live rank** chip, an **energy meter**, and a countdown that rewards speed.

*References:* Duolingo Leagues (Bronze→Diamond, weekly cohorts) · Clash Royale Ranked (season ladder + anti-churn floors) · Chess.com Puzzle Rush (speed-vs-accuracy) · Sololearn/Mimo (leagues + streaks).

*Best for:* daily habit across all classes and subjects.

---

## 8. The fairness structure — Divisions × Subjects × Leagues

How it stays fair when a Class-2 kid and a JEE aspirant share one platform:

1. **Divisions** (grouped by level): `Class 1–5` · `6–8` · `9–10` · `11–12` · `JEE` · `NEET` · `Foundation/UPSC` · `Skills`. You only compete inside your division.
2. **Subject tracks** within a division — Maths, Physics, GK, Coding…
3. **Leagues** within division+subject: `Bronze → Silver → Gold → Platinum → Diamond → Champion`, with weekly promotion/relegation.

```
       GLOBAL EVENTS (normalised percentile)        ← the viral meta-layer
       School vs School · City vs City · Seasonal      (built on after the core loop)
                        ▲
 DIVISION:  1–5 · 6–8 · 9–10 · 11–12 · JEE · NEET · …
              │
 SUBJECT:  Maths · Physics · GK · Coding …
              │
 LEAGUE:  Bronze → Silver → Gold → Platinum → Diamond → Champion
          (weekly promotion / relegation)
```

Strong students rise to Diamond/Champion; everyone else fights a *winnable* battle and feels progress. No one is locked out — they're matched fairly.

> **Global events = the viral meta-layer.** Layered on top of the divisioned ladders once the core loop is working — School-vs-School, City-vs-City, and festival championships ("Diwali Dhamaka Arena") are the strongest sharing triggers in India. Our ~3 lakh base keeps the percentiles fair, so this is a confident headline feature, not a gamble.

---

## 9. Scoring & fairness

- **Rank on quality, not time.** A focused 40-minute run should beat a 12-hour grind — fairer, and healthier for minors.
- **The score:** accuracy-gated, speed-rewarded, with difficulty that escalates automatically. (Not a naive "speed × accuracy × difficulty" multiply — that double-counts and gets gamed.)
- **Energy / lives** bound each session (anticipation + healthy session limits).
- **Soften relegation:** leaderboards are opt-out-able; league "floors" prevent demotion spirals; low tiers promote generously so beginners win early.

> **🟡 Open decision — can energy be bought? (to discuss)**
> | Option | Pros | Cons |
> |---|---|---|
> | **A · Energy never purchasable in ranked** *(leaning)* | Stays a pure fairness + healthy-play guardrail; no pay-to-win optics; safe with parents & regulators | One fewer revenue lever; keen players hit a wall |
> | **B · Energy buyable / ad-refill in ranked** | Direct revenue; lets eager players keep going | Reads as pay-to-win → hurts fairness, parent trust & virality; Duolingo's 2025 switch triggered heavy backlash; risky for a minors product |

---

## 10. Rewards — everyone who climbs wins something

- **Top rankers:** vouchers, gems, badges, flair.
- **Promotion:** a celebrated, shareable moment.
- **Participation:** small XP/gems for everyone who finishes.
- **Sponsor-funded:** brands fund prizes for branded arenas — rewards become revenue-positive (Combat/PW do this with scholarships).

Tiered and frequent beats winner-take-all. *Big prizes are framed as scholarships, not contest winnings (§14).*

---

## 11. Virality (Priority #1)

- **Shareable rank cards** — the single most important growth surface. A clean image after every contest, one-tap to WhatsApp.
- **Challenge-a-friend** — deep link drops them into the same arena.
- **Squads** — invite friends, combined score.
- **School vs School / City vs City** — a reason to recruit classmates.
- **Referral rewards** — cosmetic/XP only, never rank.

> Make the card **image-native, glanceable, brag-safe, and free** (Wordle model) — not a link. Links get throttled on WhatsApp and feel spammy; never gate it (Strava paywalled its share-card and killed the loop).

---

## 12. Engagement & retention (Priority #2)

- **Streaks** with a gentle, non-punitive freeze.
- **Leagues** — always a next season to fight for.
- **Energy** — anticipation + natural session ends.
- **Notifications** — event-based ("your league ends in 2h, you're 1 spot from promotion"), rate-limited, quiet hours.
- **Comeback** boosted arena for lapsed players.
- **Mastery map** — see progress even when you don't win.

> Keep notifications **event-based, not profile-based** — profiling minors is restricted (§14).

---

## 13. Learning integrity (Priority #3)

- **Post-contest review** of missed questions (rewarded) → competition becomes learning.
- **Weak-area detection** feeds targeted practice in the main app.
- **Spaced repetition** resurfaces past misses.
- **Quality bar:** expert-reviewed bank, tagged by concept + difficulty.
- **Anti-cheat from day one of real rewards:** randomised order, time limits, leak detection.

---

## 14. Responsible design & India rules *(non-negotiable — users are minors)*

- **Everyone is a "child" (under 18)** under the DPDP Act. Two things even parental consent can't unlock: **no behavioural profiling of minors**, **no targeted ads to minors**. Sponsor rewards shown the same to everyone, never as personalised offers.
- **Verifiable parental consent** at onboarding (DigiLocker-style), with audit logs.
- **No paid-entry-for-cash, ever.** India's 2025 gaming law bans money games *regardless of skill*, and minors can't be bound to pay. Paid tournaments are off the table for this audience (adults-only, post legal review, at most).
- **Rank is never purchasable.**
- **Healthy play:** energy caps, anti-grind scoring, session nudges + quiet hours for younger divisions.
- **Prizes** above ₹1,000/month total need state licensing — so high-value prizes are framed as **scholarships**.
- **Store choice:** general-audience app with strong age-gating, *or* a kids-category app (no third-party ad/analytics SDKs) — not both.

---

## 15. The screens

| Screen | Purpose |
|---|---|
| **Lobby / Entry** | Joinable contests, tagged Free / Gated / Sponsored, Sprint / Championship |
| **Play — Championship** | Timed paper: sections, palette, timer, submit |
| **Play — League** | Question card + level + lives + live-rank + speed countdown |
| **Leaderboard / League** | Promotion & relegation zones, your row highlighted, season timer |
| **Result / Rank card** | The shareable brag moment + share + challenge + play-again |
| **Rewards** | Tiered, claimable rewards |
| **Profile / Mastery map** | Streak, league history, per-subject progress |

---

## 16. Reference products

**Closest overall**
| Product | What to learn |
|---|---|
| **Unacademy Combat** (India) | Free-entry national contest, referral-to-enter, scholarship/gadget prizes, monetises via subscription funnel |
| **Duolingo Leagues** | The promotion/relegation ladder + weekly cohorts; generous-low / scarce-top promotion |
| **PW Champions League** (India) | School-age bracket tournament with live-streamed finals |

**Mechanics to borrow**
| Product | What to learn |
|---|---|
| **Clash Royale Ranked** | "Floor" protection that stops demotion spirals |
| **Chess.com Puzzle Rush** | Speed-vs-accuracy scoring done structurally |
| **Wordle** | The perfect shareable card: scarce, spoiler-free, link-free |
| **Spotify Wrapped / Strava** | Data-as-a-story sharing — and don't paywall the share-card |

**Feel & younger kids**
| Product | What to learn |
|---|---|
| **Kahoot! / Quizizz** | Live, time-pressured quiz feel |
| **Prodigy / Blooket / SplashLearn** | Reward loops + parent trust for young kids |
| **Sololearn / Mimo** | Leagues + streaks in a non-game subject |

**Cautionary**
| Product | The lesson |
|---|---|
| **Dream11 / MPL / WinZO** | Great UX, but real-money is now illegal in India — copy mechanics, never monetisation |

---

*Highest-leverage sections to debate: §2 (two formats), §8–9 (structure & scoring), §14 (compliance).*
