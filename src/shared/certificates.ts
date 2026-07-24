/**
 * Certificate model + dummy store.
 * A certificate is the verifiable credential a student earns on completing a
 * learning product (music course, crash course, AI camp, etc.). The canonical
 * store lives in the profile ("My Certificates"); each course's completion
 * screen surfaces the earn-moment and deep-links here.
 */

export type CertificateCategory = "music" | "course" | "camp" | "test-series" | "olympiad";

export interface Certificate {
  id: string;
  courseId: string;        // links back to the My Learning item that issued it
  courseTitle: string;
  organization: string;    // issuing body printed on the cert
  recipientName: string;   // student's name as it appears on the cert
  issuedOn: string;        // ISO date the cert was issued
  credentialId: string;    // unique, verifiable ID printed on the cert
  category: CertificateCategory;
  detail?: string;         // optional one-line achievement summary
  thumbImage?: string;     // square course image shown in the wallet list (falls back to a category tile)
}

// TODO(api): GET /api/certificates — list of credentials earned by the signed-in user
export const DUMMY_CERTIFICATES: Certificate[] = [
  {
    id: "piano-beginner-solo",
    courseId: "piano-beginner-solo",
    courseTitle: "Piano Beginner Solo",
    organization: "Furtados School of Music",
    recipientName: "Rahul Sharma",
    issuedOn: "2026-06-02",
    credentialId: "FSM-PBS-2026-04821",
    category: "music",
    detail: "Completed all 12 lessons with a graded recital",
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg",
  },
  {
    id: "oll-ai-foundations",
    courseId: "ai-summer-camp",
    courseTitle: "AI Foundations",
    organization: "OLL · AI Summer Camp",
    recipientName: "Rahul Sharma",
    issuedOn: "2026-05-18",
    credentialId: "OLL-AIF-2026-01177",
    category: "camp",
    detail: "Built and presented a capstone AI project",
    thumbImage: "/summer-camp-explorer-dark.png",
  },
  {
    id: "jee-crash-physics",
    courseId: "crash-course",
    courseTitle: "JEE Physics Crash Course",
    organization: "PrepMaster",
    recipientName: "Rahul Sharma",
    issuedOn: "2026-04-29",
    credentialId: "PM-JEEP-2026-09340",
    category: "course",
    detail: "Finished the 30-day intensive within the cohort window",
  },
];

/**
 * Per-course subject-completion state — drives the certificate-eligibility
 * gate shown in the course overflow menu. A multi-subject course's certificate
 * unlocks only once EVERY subject is completed.
 */
// TODO(api): GET /api/courses/:courseId/subject-progress
export const DUMMY_COMPLETED_SUBJECTS: Record<string, string[]> = {
  // CAT: Quantitative Aptitude done; Verbal Ability + DILR still pending.
  cat: ["quant"],
};

export function getCompletedSubjectIds(courseId: string): string[] {
  return DUMMY_COMPLETED_SUBJECTS[courseId] ?? [];
}

export function getCertificate(idOrCourseId: string): Certificate | undefined {
  return DUMMY_CERTIFICATES.find(
    (c) => c.id === idOrCourseId || c.courseId === idOrCourseId,
  );
}

/** "2026-06-02" → "2 June 2026" */
export function formatIssuedDate(iso: string): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
}
