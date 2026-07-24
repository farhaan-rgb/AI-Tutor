/**
 * Referral copy library — share message templates by product kind.
 * Rules: first name + specific course + one concrete benefit if possible.
 * No emojis. No "!". No "use my code" framing.
 */

export type ProductKind =
  | "crash-course"
  | "test-prep"
  | "mock-pack"
  | "skill-course"
  | "generic";

interface CopyArgs {
  kind: ProductKind;
  productName?: string;
  code: string;
  baseUrl?: string;
}

const TEMPLATES: Record<ProductKind, (a: CopyArgs) => string> = {
  "crash-course": ({ productName = "Crash Course", code, baseUrl = "prepmaster.app" }) =>
    `Hey, just wrapped up the ${productName} on PrepMaster — the live sessions were actually useful, not the usual recorded stuff. If you're prepping, try the first week free: ${baseUrl}/r/${code}`,

  "test-prep": ({ productName = "CAT prep", code, baseUrl = "prepmaster.app" }) =>
    `Trying out PrepMaster for ${productName} — the mock analytics are sharper than what I was using before. Sharing in case you want to try: ${baseUrl}/r/${code}`,

  "mock-pack": ({ productName = "mock pack", code, baseUrl = "prepmaster.app" }) =>
    `Did the ${productName} on PrepMaster — the question quality is closer to the real paper than most apps. Here if you want to try: ${baseUrl}/r/${code}`,

  "skill-course": ({ productName = "skill course", code, baseUrl = "prepmaster.app" }) =>
    `Picked up a ${productName} on PrepMaster recently. Sharing in case it's useful: ${baseUrl}/r/${code}`,

  "generic": ({ code, baseUrl = "prepmaster.app" }) =>
    `Been using PrepMaster for my prep — sharing in case you want to check it out: ${baseUrl}/r/${code}`,
};

export function buildShareMessage(args: CopyArgs): string {
  return TEMPLATES[args.kind](args);
}

// Sheet headlines by trigger source — different framing per moment.
export const SHEET_HEADLINES = {
  "post-feedback":    "Glad it clicked. Want to invite a friend?",
  "course-complete":  "Pass it on?",
  "mock-milestone":   "That score is share-worthy",
  "profile":          "Invite friends, earn rewards",
  "manual":           "Share with a friend",
} as const;

export type TriggerSource = keyof typeof SHEET_HEADLINES;

// Subtitle by trigger source — provides context for the ask.
export const SHEET_SUBTITLES: Record<TriggerSource, string> = {
  "post-feedback":    "Pass it to a friend who's also prepping.",
  "course-complete":  "Help a friend get the same head start.",
  "mock-milestone":   "Tell your prep group how you got here.",
  "profile":          "Refer one friend to unlock your next reward.",
  "manual":           "Send a link to a friend who'd find this useful.",
};
