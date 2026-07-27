// TODO(api): GET /api/courses/available — purchasable test prep courses grouped by exam
export const DUMMY_OTHER_COURSES = [
  {
    exam: "CAT",
    examKey: "cat",
    shortLabel: "CAT",
    accentColor: "#ffc53d",
    examBadgeBg: "#2b1d11",
    examBadgeBorder: "#593815",
    examAccent: "#d87a16",
    gradientBg: "linear-gradient(135deg, #2b1600 0%, #614700 50%, #874d00 100%)",
    subjects: ["QA", "VARC", "DILR"],
    courses: [
      { id: "cat-3m", title: "CAT Complete Prep", plan: "3 Months", topics: 120, price: 2999, originalPrice: 5999 },
      { id: "cat-6m", title: "CAT Complete Prep", plan: "6 Months", topics: 180, price: 4999, originalPrice: 8999 },
      { id: "cat-12m", title: "CAT Complete Prep", plan: "12 Months", topics: 280, price: 7999, originalPrice: 14999 },
    ],
  },
  {
    exam: "JEE Mains",
    examKey: "jee-mains",
    shortLabel: "JEE M",
    accentColor: "#4096ff",
    examBadgeBg: "#001d66",
    examBadgeBorder: "#0050b3",
    examAccent: "#4096ff",
    gradientBg: "linear-gradient(135deg, #001d66 0%, #002c8c 50%, #0958d9 100%)",
    subjects: ["PHY", "CHEM", "MATH"],
    courses: [
      { id: "jee-main-3m", title: "JEE Mains 2025 Crash Course", plan: "3 Months", topics: 140, price: 3499, originalPrice: 6999 },
      { id: "jee-main-12m", title: "JEE Mains 2025 Full Course", plan: "12 Months", topics: 320, price: 8999, originalPrice: 17999 },
    ],
  },
  {
    exam: "JEE Advanced",
    examKey: "jee-advanced",
    shortLabel: "JEE Adv",
    accentColor: "#9254de",
    examBadgeBg: "#120338",
    examBadgeBorder: "#391085",
    examAccent: "#9254de",
    gradientBg: "linear-gradient(135deg, #120338 0%, #22075e 50%, #531dab 100%)",
    subjects: ["PHY", "CHEM", "MATH"],
    courses: [
      { id: "jee-adv-12m", title: "JEE Advanced 2025 Elite Prep", plan: "12 Months", topics: 380, price: 11999, originalPrice: 22999 },
    ],
  },
];

// TODO(api): GET /api/courses/ai-summer-camp — AI foundations summer camp batch info
export const DUMMY_SUMMER_CAMP_SHARED = {
  daysLabel: "10 Hours",
  dateRange: "19 – 25 May",
  price: 1999,
  originalPrice: 6999,
};

export const DUMMY_SUMMER_CAMP_BATCHES = [
  {
    track: "explorer" as const,
    trackLabel: "Explorer",
    grade: "Grade 6–8",
    title: "AI Summer Camp - Explorer",
    totalSeats: 25,
    seatsLeft: 15,
    gradientBg: "linear-gradient(135deg, #001a1a 0%, #003040 50%, #00474f 100%)",
    accentColor: "#5cdbd3",
    badgeBg: "#001f1f",
    badgeBorder: "#005f5f",
  },
  {
    track: "creator" as const,
    trackLabel: "Creator",
    grade: "Grade 9–12",
    title: "AI Summer Camp - Creator",
    totalSeats: 20,
    seatsLeft: 8,
    gradientBg: "linear-gradient(150.94deg, rgb(41,19,33) 0%, rgb(85,28,59) 50%, rgb(117,32,79) 100%)",
    accentColor: "#cb2b83",
    badgeBg: "#291321",
    badgeBorder: "#551c3b",
  },
];

export type ExamCourseGroup = (typeof DUMMY_OTHER_COURSES)[number];
export type ExamCourse = ExamCourseGroup["courses"][number];
export type SummerCampBatch = (typeof DUMMY_SUMMER_CAMP_BATCHES)[number];

export interface OtherCourse {
  id: string;
  title: string;
  subtitle?: string;
  thumbImage?: string;
  thumbBg?: string;
  thumbBgLight?: string;
  thumbLabel?: string;
  thumbLogo?: string;
  thumbBrand?: string;
  thumbTag?: string;
  thumbAccent?: string;
  thumbAccentLight?: string;
  thumbMeta?: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice: number;
}

// TODO(api): GET /api/crash-courses/info — school crash courses (Class 6–10), included in platform plan
export const DUMMY_CRASH_COURSE_INFO = {
  title: "Maths & Science Crash Course",
  subtitle: "Maths & Science · Class 6–10",
  description: "Focused, syllabus-aligned crash courses for Classes 6–10. Covers Maths and Science chapter by chapter. Included in your platform subscription — no extra payment.",
  classes: [6, 7, 8, 9, 10] as const,
  accentColor: "#52c41a",       // AntD green-6 (--success-500)
  accentColorLight: "#389e0d",  // AntD green-7 (--success-600)
  // Dark gradient now uses AntD dark-green palette (--success-d2 / --success-d4)
  // so the warm/yellow hue family of #52c41a sits cleanly on top.
  gradientBg: "linear-gradient(135deg, #0d2010 0%, #1d3712 55%, #306317 100%)",
  gradientBgLight: "linear-gradient(135deg, #d9f7be 0%, #95de64 55%, #52c41a 100%)",
  subjects: [
    { id: "maths" as const, title: "Mathematics", chapters: 12, topics: 48, accent: "#60a5fa", gradientBg: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 55%, #1a3050 100%)" },
    { id: "science" as const, title: "Science", chapters: 10, topics: 40, accent: "#34d399", gradientBg: "linear-gradient(135deg, #021710 0%, #052e1c 55%, #073d24 100%)" },
  ],
  howItWorks: [
    { step: 1, label: "Pick your class", detail: "Choose Class 6 through 10" },
    { step: 2, label: "Select a subject", detail: "Maths or Science" },
    { step: 3, label: "Learn & practise", detail: "Chapter-wise lessons + quizzes" },
  ],
};

export type CrashCourseSubjectId = (typeof DUMMY_CRASH_COURSE_INFO.subjects)[number]["id"];

// TODO(api): GET /api/crash-courses/progress?class=X&userId=Y
export const DUMMY_CRASH_COURSE_PROGRESS: Record<number, Record<CrashCourseSubjectId, { chaptersCompleted: number; totalChapters: number }>> = {
  8: {
    maths: { chaptersCompleted: 4, totalChapters: 12 },
    science: { chaptersCompleted: 2, totalChapters: 10 },
  },
};

// ─── Class 11–12 Crash Courses · PCM / PCB ───────────────────────────────────
// Distinct product line from Class 6–10 crash. Two streams (PCM = JEE-track,
// PCB = NEET-track), 3 subjects each, real NCERT chapter coverage (post-2024
// syllabus rationalization). 4 SKUs total. Shares the same 15-day / ₹999
// pricing shape as 6–10 by product decision (see SESSION 2026-05-25).

export type CrashStreamId = "pcm" | "pcb" | "maths";
export type CrashClassLevel = 10 | 11 | 12;
export type CrashCourse1112SubjectId = "physics" | "chemistry" | "maths" | "biology" | "science" | "history";

export interface CrashCourse1112Subject {
  id: CrashCourse1112SubjectId;
  title: string;
  shortLabel: string;
  chapters: number;
  topics: number;
  chapterList: string[];
  accent: string;
  gradientBg: string;
}

export interface CrashCourse1112Info {
  sku: string;
  classLevel: CrashClassLevel;
  stream: CrashStreamId;
  streamLabel: string;
  examTarget: string;
  title: string;
  subtitleShort: string;
  description: string;
  accentColor: string;
  accentColorLight: string;
  gradientBg: string;
  gradientBgLight: string;
  subjects: CrashCourse1112Subject[];
}

// Per-subject accents — kept consistent across all 4 SKUs so a student who
// switches from Class 11 to Class 12 sees the same colour for Physics, etc.
const SUBJ_ACCENT = {
  physics:   { accent: "#fa8c16", gradientBg: "linear-gradient(135deg, #1f0e02 0%, #3d1a05 55%, #66290a 100%)" }, // AntD orange-6
  chemistry: { accent: "#13c2c2", gradientBg: "linear-gradient(135deg, #002626 0%, #003a3a 55%, #006d75 100%)" }, // AntD cyan-6
  maths:     { accent: "#597ef7", gradientBg: "linear-gradient(135deg, #050a1f 0%, #0a153d 55%, #1d2f7a 100%)" }, // AntD geekblue-5
  biology:   { accent: "#73d13d", gradientBg: "linear-gradient(135deg, #051a02 0%, #103d0a 55%, #226814 100%)" }, // AntD green-5
  science:   { accent: "#9254de", gradientBg: "linear-gradient(135deg, #12071f 0%, #22103d 55%, #391a6d 100%)" }, // AntD purple-5
  history:   { accent: "#d48806", gradientBg: "linear-gradient(135deg, #1f1502 0%, #3d2b05 55%, #6d4a0a 100%)" }, // AntD gold-6
} as const;

// NCERT chapter lists — current syllabus, post-2024 rationalization.
// TODO(api): GET /api/crash-courses/11-12/curriculum?sku=...
const CHAPTERS_11_PHY = [
  "Units and Measurements",
  "Motion in a Straight Line",
  "Motion in a Plane",
  "Laws of Motion",
  "Work, Energy and Power",
  "System of Particles and Rotational Motion",
  "Gravitation",
  "Mechanical Properties of Solids",
  "Mechanical Properties of Fluids",
  "Thermal Properties of Matter",
  "Thermodynamics",
  "Kinetic Theory",
  "Oscillations",
  "Waves",
];
const CHAPTERS_12_PHY = [
  "Electric Charges and Fields",
  "Electrostatic Potential and Capacitance",
  "Current Electricity",
  "Moving Charges and Magnetism",
  "Magnetism and Matter",
  "Electromagnetic Induction",
  "Alternating Current",
  "Electromagnetic Waves",
  "Ray Optics and Optical Instruments",
  "Wave Optics",
  "Dual Nature of Radiation and Matter",
  "Atoms",
  "Nuclei",
  "Semiconductor Electronics",
];
const CHAPTERS_11_CHEM = [
  "Some Basic Concepts of Chemistry",
  "Structure of Atom",
  "Classification of Elements and Periodicity",
  "Chemical Bonding and Molecular Structure",
  "Thermodynamics",
  "Equilibrium",
  "Redox Reactions",
  "Organic Chemistry: Basic Principles",
  "Hydrocarbons",
];
const CHAPTERS_12_CHEM = [
  "Solutions",
  "Electrochemistry",
  "Chemical Kinetics",
  "The d- and f-Block Elements",
  "Coordination Compounds",
  "Haloalkanes and Haloarenes",
  "Alcohols, Phenols and Ethers",
  "Aldehydes, Ketones and Carboxylic Acids",
  "Amines",
  "Biomolecules",
];
// NCERT Class 10 Maths — the AI-tutor vision-memo case study chapter set.
const CHAPTERS_10_MATH = [
  "Real Numbers",
  "Polynomials",
  "Pair of Linear Equations in Two Variables",
  "Quadratic Equations",
  "Arithmetic Progressions",
  "Triangles",
  "Coordinate Geometry",
  "Introduction to Trigonometry",
  "Some Applications of Trigonometry",
  "Circles",
  "Areas Related to Circles",
  "Surface Areas and Volumes",
  "Statistics",
  "Probability",
];
// NCERT Class 10 Science — real chapter titles, verified against jesc101-113.pdf.
const CHAPTERS_10_SCIENCE = [
  "Chemical Reactions and Equations",
  "Acids, Bases and Salts",
  "Metals and Non-metals",
  "Carbon and its Compounds",
  "Life Processes",
  "Control and Coordination",
  "How do Organisms Reproduce?",
  "Heredity",
  "Light – Reflection and Refraction",
  "The Human Eye and the Colourful World",
  "Electricity",
  "Magnetic Effects of Electric Current",
  "Our Environment",
];
// NCERT Class 10 History ("India and the Contemporary World II") — real
// chapter titles, verified against jess301-305.pdf (downloaded and
// page-1-of-each checked directly, not from memory).
const CHAPTERS_10_HISTORY = [
  "The Rise of Nationalism in Europe",
  "Nationalism in India",
  "The Making of a Global World",
  "The Age of Industrialisation",
  "Print Culture and the Modern World",
];
const CHAPTERS_11_MATH = [
  "Sets",
  "Relations and Functions",
  "Trigonometric Functions",
  "Complex Numbers and Quadratic Equations",
  "Linear Inequalities",
  "Permutations and Combinations",
  "Binomial Theorem",
  "Sequences and Series",
  "Straight Lines",
  "Conic Sections",
  "Introduction to 3D Geometry",
  "Limits and Derivatives",
  "Statistics",
  "Probability",
];
const CHAPTERS_12_MATH = [
  "Relations and Functions",
  "Inverse Trigonometric Functions",
  "Matrices",
  "Determinants",
  "Continuity and Differentiability",
  "Application of Derivatives",
  "Integrals",
  "Application of Integrals",
  "Differential Equations",
  "Vector Algebra",
  "Three-Dimensional Geometry",
  "Linear Programming",
  "Probability",
];
const CHAPTERS_11_BIO = [
  "The Living World",
  "Biological Classification",
  "Plant Kingdom",
  "Animal Kingdom",
  "Morphology of Flowering Plants",
  "Anatomy of Flowering Plants",
  "Cell: The Unit of Life",
  "Biomolecules",
  "Cell Cycle and Cell Division",
  "Photosynthesis in Higher Plants",
  "Respiration in Plants",
  "Plant Growth and Development",
  "Breathing and Exchange of Gases",
];
const CHAPTERS_12_BIO = [
  "Sexual Reproduction in Flowering Plants",
  "Human Reproduction",
  "Reproductive Health",
  "Principles of Inheritance and Variation",
  "Molecular Basis of Inheritance",
  "Evolution",
  "Human Health and Disease",
  "Microbes in Human Welfare",
  "Biotechnology: Principles and Processes",
  "Biotechnology and its Applications",
  "Organisms and Populations",
  "Ecosystem",
  "Biodiversity and Conservation",
];

function mkSubject(
  id: CrashCourse1112SubjectId,
  title: string,
  shortLabel: string,
  chapterList: string[],
  topicsPerChapter = 4,
): CrashCourse1112Subject {
  return {
    id,
    title,
    shortLabel,
    chapters: chapterList.length,
    topics: chapterList.length * topicsPerChapter,
    chapterList,
    accent: SUBJ_ACCENT[id].accent,
    gradientBg: SUBJ_ACCENT[id].gradientBg,
  };
}

// All 11–12 SKUs share the 6–10 crash-course visual identity (same green
// accents + gradient) so the marketplace rail reads as one product family.
// Class number on the hero numeral + stream chip (PCM/PCB) + subject strip
// are what differentiate the cards visually.
const CRASH_1112_ACCENT       = DUMMY_CRASH_COURSE_INFO.accentColor;
const CRASH_1112_ACCENT_LIGHT = DUMMY_CRASH_COURSE_INFO.accentColorLight;
const CRASH_1112_GRADIENT     = DUMMY_CRASH_COURSE_INFO.gradientBg;
const CRASH_1112_GRADIENT_L   = DUMMY_CRASH_COURSE_INFO.gradientBgLight;

// TODO(api): GET /api/crash-courses/11-12/info
export const DUMMY_CRASH_COURSES_1112: Record<string, CrashCourse1112Info> = {
  // AI-tutor vision-memo demo course — single-subject, NCERT-labeled (unlike the
  // combined Maths+Science 6-10 legacy track), used by the /ai-tutor/* prototype flow.
  "ncert-10-maths": {
    sku: "ncert-10-maths",
    classLevel: 10,
    stream: "maths",
    streamLabel: "Mathematics",
    examTarget: "CBSE Class 10 Boards",
    title: "Class 10 NCERT Maths",
    subtitleShort: "Mathematics · Full NCERT Syllabus",
    description: "Class 10 NCERT Mathematics, chapter by chapter — every section of the real textbook, every exercise, with an AI tutor that explains any concept on request, solves any problem step by step, and answers doubts anytime. Built as a complete Maths-only course, not bundled with Science.",
    accentColor: CRASH_1112_ACCENT,
    accentColorLight: CRASH_1112_ACCENT_LIGHT,
    gradientBg: CRASH_1112_GRADIENT,
    gradientBgLight: CRASH_1112_GRADIENT_L,
    subjects: [
      mkSubject("maths", "Mathematics", "MATH", CHAPTERS_10_MATH),
    ],
  },
  // Second AI-tutor demo course — same shape as ncert-10-maths, added once the
  // Maths-only journey had a real second sample chapter to point at.
  "ncert-10-science": {
    sku: "ncert-10-science",
    classLevel: 10,
    stream: "pcb",
    streamLabel: "Science",
    examTarget: "CBSE Class 10 Boards",
    title: "Class 10 NCERT Science",
    subtitleShort: "Science · Full NCERT Syllabus",
    description: "Class 10 NCERT Science, chapter by chapter — every section of the real textbook, every exercise, with an AI tutor that explains any concept on request, solves any problem step by step, and answers doubts anytime.",
    accentColor: CRASH_1112_ACCENT,
    accentColorLight: CRASH_1112_ACCENT_LIGHT,
    gradientBg: CRASH_1112_GRADIENT,
    gradientBgLight: CRASH_1112_GRADIENT_L,
    subjects: [
      mkSubject("science", "Science", "SCI", CHAPTERS_10_SCIENCE),
    ],
  },
  // Third AI-tutor demo course — same shape again, first non-Maths/Science
  // subject (History, one of Social Science's four real books — see the AI
  // Tutor conversation for why History specifically, and why Social Science
  // isn't one combined course).
  "ncert-10-history": {
    sku: "ncert-10-history",
    classLevel: 10,
    stream: "pcb",
    streamLabel: "Social Science",
    examTarget: "CBSE Class 10 Boards",
    title: "Class 10 NCERT History",
    subtitleShort: "History · Full NCERT Syllabus",
    description: "Class 10 NCERT History (India and the Contemporary World II), chapter by chapter — every section of the real textbook, every discussion question, with an AI tutor that explains any concept on request, discusses any question with real feedback, and answers doubts anytime.",
    accentColor: CRASH_1112_ACCENT,
    accentColorLight: CRASH_1112_ACCENT_LIGHT,
    gradientBg: CRASH_1112_GRADIENT,
    gradientBgLight: CRASH_1112_GRADIENT_L,
    subjects: [
      mkSubject("history", "History", "HIST", CHAPTERS_10_HISTORY),
    ],
  },
  "crash-11-pcm": {
    sku: "crash-11-pcm",
    classLevel: 11,
    stream: "pcm",
    streamLabel: "PCM",
    examTarget: "JEE Foundation",
    title: "Class 11 PCM Crash Course",
    subtitleShort: "Phy · Chem · Maths · 15 Days",
    description: "Class 11 PCM Crash Course covers Physics, Chemistry and Maths chapter by chapter — built on the latest NCERT syllabus. Each chapter has a live session plus full recordings to watch anytime. 15 days, 3 subjects — one-time payment, lifetime access. Strong Class 11 foundations are the difference between an AIR 50,000 and an AIR 5,000 in JEE Main.",
    accentColor: CRASH_1112_ACCENT,
    accentColorLight: CRASH_1112_ACCENT_LIGHT,
    gradientBg: CRASH_1112_GRADIENT,
    gradientBgLight: CRASH_1112_GRADIENT_L,
    subjects: [
      mkSubject("physics",   "Physics",   "PHY",  CHAPTERS_11_PHY),
      mkSubject("chemistry", "Chemistry", "CHEM", CHAPTERS_11_CHEM),
      mkSubject("maths",     "Mathematics", "MATH", CHAPTERS_11_MATH),
    ],
  },
  "crash-11-pcb": {
    sku: "crash-11-pcb",
    classLevel: 11,
    stream: "pcb",
    streamLabel: "PCB",
    examTarget: "NEET Foundation",
    title: "Class 11 PCB Crash Course",
    subtitleShort: "Phy · Chem · Bio · 15 Days",
    description: "Class 11 PCB Crash Course covers Physics, Chemistry and Biology chapter by chapter — built on the latest NCERT syllabus. NEET is ~90% NCERT-aligned, so we teach line by line. Each chapter has a live session plus full recordings. 15 days, 3 subjects — one-time payment, lifetime access.",
    accentColor: CRASH_1112_ACCENT,
    accentColorLight: CRASH_1112_ACCENT_LIGHT,
    gradientBg: CRASH_1112_GRADIENT,
    gradientBgLight: CRASH_1112_GRADIENT_L,
    subjects: [
      mkSubject("physics",   "Physics",   "PHY",  CHAPTERS_11_PHY),
      mkSubject("chemistry", "Chemistry", "CHEM", CHAPTERS_11_CHEM),
      mkSubject("biology",   "Biology",   "BIO",  CHAPTERS_11_BIO),
    ],
  },
  "crash-12-pcm": {
    sku: "crash-12-pcm",
    classLevel: 12,
    stream: "pcm",
    streamLabel: "PCM",
    examTarget: "JEE Main · CBSE Boards",
    title: "Class 12 PCM Crash Course",
    subtitleShort: "Phy · Chem · Maths · 15 Days",
    description: "Class 12 PCM Crash Course covers Physics, Chemistry and Maths chapter by chapter — board-aligned and JEE-Main-aligned. Each chapter has a live session plus full recordings to watch anytime. 15 days, 3 subjects — one-time payment, lifetime access. Built for the last-mile push when boards and JEE Main collide.",
    accentColor: CRASH_1112_ACCENT,
    accentColorLight: CRASH_1112_ACCENT_LIGHT,
    gradientBg: CRASH_1112_GRADIENT,
    gradientBgLight: CRASH_1112_GRADIENT_L,
    subjects: [
      mkSubject("physics",   "Physics",   "PHY",  CHAPTERS_12_PHY),
      mkSubject("chemistry", "Chemistry", "CHEM", CHAPTERS_12_CHEM),
      mkSubject("maths",     "Mathematics", "MATH", CHAPTERS_12_MATH),
    ],
  },
  "crash-12-pcb": {
    sku: "crash-12-pcb",
    classLevel: 12,
    stream: "pcb",
    streamLabel: "PCB",
    examTarget: "NEET UG · CBSE Boards",
    title: "Class 12 PCB Crash Course",
    subtitleShort: "Phy · Chem · Bio · 15 Days",
    description: "Class 12 PCB Crash Course covers Physics, Chemistry and Biology chapter by chapter — board-aligned and NEET-aligned. Biology is taught NCERT line by line because that's what NEET tests. Each chapter has a live session plus full recordings. 15 days, 3 subjects — one-time payment, lifetime access.",
    accentColor: CRASH_1112_ACCENT,
    accentColorLight: CRASH_1112_ACCENT_LIGHT,
    gradientBg: CRASH_1112_GRADIENT,
    gradientBgLight: CRASH_1112_GRADIENT_L,
    subjects: [
      mkSubject("physics",   "Physics",   "PHY",  CHAPTERS_12_PHY),
      mkSubject("chemistry", "Chemistry", "CHEM", CHAPTERS_12_CHEM),
      mkSubject("biology",   "Biology",   "BIO",  CHAPTERS_12_BIO),
    ],
  },
};

export const CRASH_1112_SKUS = ["ncert-10-maths", "ncert-10-science", "ncert-10-history", "crash-11-pcm", "crash-11-pcb", "crash-12-pcm", "crash-12-pcb"] as const;
export type Crash1112Sku = (typeof CRASH_1112_SKUS)[number];

export function isCrash1112Sku(sku: string | null | undefined): sku is Crash1112Sku {
  return !!sku && (CRASH_1112_SKUS as readonly string[]).includes(sku);
}

export function getCrash1112Info(sku: string | null | undefined): CrashCourse1112Info | null {
  if (!isCrash1112Sku(sku)) return null;
  return DUMMY_CRASH_COURSES_1112[sku];
}

// Which 11-12/crash skus have the real /ai-tutor/* experience built (vs. the
// generic crash-course-hub placeholder the other skus still use). Update this
// alongside chapter-home's per-sku chapter data whenever a new course is added.
export const AI_TUTOR_SKUS = ["ncert-10-maths", "ncert-10-science", "ncert-10-history"] as const;
export function isAiTutorSku(sku: string | null | undefined): boolean {
  return !!sku && (AI_TUTOR_SKUS as readonly string[]).includes(sku);
}

// TODO(api): GET /api/crash-courses/11-12/progress?sku=X&userId=Y
export const DUMMY_CRASH_COURSE_1112_PROGRESS: Record<string, Partial<Record<CrashCourse1112SubjectId, { chaptersCompleted: number; totalChapters: number }>>> = {
  "crash-12-pcm": {
    physics:   { chaptersCompleted: 3, totalChapters: 14 },
    chemistry: { chaptersCompleted: 2, totalChapters: 10 },
    maths:     { chaptersCompleted: 5, totalChapters: 13 },
  },
};

// TODO(api): GET /api/music-courses/available
export const DUMMY_MUSIC_COURSES: OtherCourse[] = [
  // ── Group Classes (teacher-led) ──
  {
    id: "piano-group",
    title: "Piano / Keyboard",
    subtitle: "Live Group Class · 4–12 Sessions",
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg",
    rating: 4.8,
    reviewCount: 312,
    price: 1499,
    originalPrice: 2499,
  },
  {
    id: "guitar-group",
    title: "Guitar Learning",
    subtitle: "Live Group Class · 4–12 Sessions",
    thumbImage: "/guitar-course.webp",
    rating: 4.7,
    reviewCount: 184,
    price: 1499,
    originalPrice: 2499,
  },
  {
    id: "western-vocals-group",
    title: "Western Vocals",
    subtitle: "Live Group Class · 4–12 Sessions",
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg",
    rating: 4.9,
    reviewCount: 468,
    price: 1499,
    originalPrice: 2499,
  },
  {
    id: "hindustani-vocals-group",
    title: "Hindustani Vocals",
    subtitle: "Live Group Class · 4–12 Sessions",
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218922565_475x285.jpg",
    rating: 4.8,
    reviewCount: 211,
    price: 1499,
    originalPrice: 2499,
  },
  // ── Self-Paced (video-led) ──
  {
    id: "piano-self",
    title: "Piano / Keyboard",
    subtitle: "Self-Paced Video · 10 Songs",
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218610802_475x285.jpg",
    rating: 4.7,
    reviewCount: 256,
    price: 999,
    originalPrice: 1999,
  },
  {
    id: "guitar-self",
    title: "Guitar Learning",
    subtitle: "Self-Paced Video · 10 Songs",
    thumbImage: "/guitar-course.webp",
    rating: 4.6,
    reviewCount: 143,
    price: 999,
    originalPrice: 1999,
  },
  {
    id: "western-vocals-self",
    title: "Western Vocals",
    subtitle: "Self-Paced Video · 10 Songs",
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1611913451229_475x285.jpg",
    rating: 4.8,
    reviewCount: 389,
    price: 999,
    originalPrice: 1999,
  },
  {
    id: "hindustani-vocals-self",
    title: "Hindustani Vocals",
    subtitle: "Self-Paced Video · 10 Songs",
    thumbImage: "https://dpxj62pj1f2st.cloudfront.net/production/product/images/1634218922565_475x285.jpg",
    rating: 4.7,
    reviewCount: 178,
    price: 999,
    originalPrice: 1999,
  },
];

// ─── VocabularyFast Integration ───────────────────────────────────────────────
// Third-party partner: vocabularyfast.com. Solo-founder (Jackson Kailath,
// Bangalore). 12 packs total — Grade 6–12 (mapped to PrepMaster K-12 personas),
// CAT (mapped to S6 Ravi-style competitive-exam aspirants), General English
// (universal), GRE + SAT (study-abroad), IELTS + TOEFL (coming soon).
//
// Pedagogy: mnemonic keyword method + spaced repetition + AI-generated
// imagery + audio. Each word = meaning + keyword + memory link + visual +
// examples + Still learning / Got it (SRS routing).
//
// Pricing model: ₹499/pack flat (one-time payment), strikethrough ₹999.
// Bundle "Unlock All Packs" at ₹2,499 (deferred to V1.5).
//
// Integration: Teachmint takes payment + provisions account on VocabFast side
// via POST /api/teachmint/launch. Auto-account hand-off so student is dropped
// straight into the pack with no sign-in flow. Webview wraps their /learn/<id>
// route under PrepMaster chrome.

import type { AgeFilterId } from "../screens/marketplace-premium-cards";

export type VocabFastPackId =
  | "vf-grade-6" | "vf-grade-7" | "vf-grade-8" | "vf-grade-9" | "vf-grade-10"
  | "vf-grade-11" | "vf-grade-12"
  | "vf-cat" | "vf-general-english"
  | "vf-gre" | "vf-sat"
  | "vf-ielts" | "vf-toefl";

export type VocabFastAvailability = "live" | "coming-soon";

export type VocabFastGroup = "school" | "competitive" | "study-abroad" | "universal";

export interface VocabFastSampleWord {
  word: string;
  meanings: string[];
  keyword: string;
  memoryLink: string;
  examples: string[];
  imageBg: string;
}

export interface VocabFastPack {
  id: VocabFastPackId;
  title: string;
  shortLabel: string;
  audience: string;
  group: VocabFastGroup;
  examTarget?: string;
  availability: VocabFastAvailability;
  wordsCount: number;
  daysToMaster: number;
  visibleOnFilters: AgeFilterId[];
  sampleWords: VocabFastSampleWord[];
  description: string;
}

// Shared brand identity for the partner. One source of truth.
export const VOCABFAST_BRAND = {
  name: "VocabularyFast",
  tagline: "Master vocabulary with mnemonics + spaced repetition",
  url: "vocabularyfast.com",
  accentColor: "#597ef7",       // AntD geekblue-5 — distinct from crash green + GYD purple
  accentColorLight: "#4096ff",  // AntD blue-5
  accentSoft: "rgba(89, 126, 247, 0.14)",
  accentBorder: "rgba(89, 126, 247, 0.35)",
  partnerLabel: "Powered by VocabularyFast",
  partnerPill: "VERIFIED PARTNER",
  hostName: "vocabularyfast.com",
} as const;

// Pricing — single source of truth so V1.5 bundle work is a 1-line change.
export const VOCABFAST_PRICING = {
  packPrice: 499,
  packOriginalPrice: 999,
  bundlePrice: 2499,
  bundleOriginalPrice: 5988,
} as const;

// Per-word image placeholder backgrounds — gradients keyed to the word's
// thematic colour. We can't download VocabularyFast's AI-generated images,
// so the sample shows a tinted gradient with the word's first letter as the
// hero visual. Production swap-out is a 1-prop change once they share the
// real `imageUrl`.
const IMG_BG = {
  warm:    "linear-gradient(135deg, #4a2818 0%, #6b3d1f 50%, #8c5028 100%)",
  cool:    "linear-gradient(135deg, #1a2848 0%, #1f3d6b 50%, #28508c 100%)",
  forest:  "linear-gradient(135deg, #1a3a2c 0%, #2d5742 50%, #3f7a5c 100%)",
  sunset:  "linear-gradient(135deg, #4a1828 0%, #6b2839 50%, #8c3850 100%)",
  ash:     "linear-gradient(135deg, #2a2a2e 0%, #3a3a40 50%, #4f4f56 100%)",
  amber:   "linear-gradient(135deg, #3d2a08 0%, #5f4112 50%, #8c5f1a 100%)",
} as const;

function mkSampleWord(
  word: string,
  meanings: string[],
  keyword: string,
  memoryLink: string,
  examples: string[],
  imageBg: string,
): VocabFastSampleWord {
  return { word, meanings, keyword, memoryLink, examples, imageBg };
}

// TODO(api): GET /api/vocabfast/packs — all packs with metadata
// TODO(api): GET /api/vocabfast/sample-words?pack=<id>&limit=3
export const DUMMY_VOCABFAST_PACKS: Record<VocabFastPackId, VocabFastPack> = {
  "vf-grade-6": {
    id: "vf-grade-6",
    title: "Grade 6 Vocabulary",
    shortLabel: "Grade 6",
    audience: "For Class 6 students",
    group: "school",
    examTarget: "CBSE Class 6 · School Vocabulary",
    availability: "live",
    wordsCount: 280,
    daysToMaster: 28,
    visibleOnFilters: ["all", "primary", "secondary"],
    sampleWords: [
      mkSampleWord("vibrant", ["full of life and energy", "bright and colourful"], "VIB RANT", "A VIB(rating) RANT — when someone rants about colours, their face becomes vibrant with energy.", ["The market was vibrant with colours during Diwali.", "She has a vibrant personality."], IMG_BG.warm),
      mkSampleWord("valiant", ["showing courage and determination"], "VAL IANT", "A VAL(uable) IANT (giant) — only a valiant warrior can lift the valuable giant sword.", ["The valiant soldier saved the village.", "She made a valiant attempt to win the race."], IMG_BG.cool),
      mkSampleWord("gleam", ["to shine softly", "a soft glow"], "GLE AM", "GLE AM — Gleaming Lights Everyone Admires in the Morning.", ["The lake gleamed in the moonlight.", "I saw a gleam of hope in his eyes."], IMG_BG.amber),
    ],
    description: "A curated set of words for Class 6 students. Each word comes with a keyword mnemonic, a memory-link scene, audio pronunciation, and usage examples. Suited for school vocabulary and early standardised-test exposure.",
  },
  "vf-grade-7": {
    id: "vf-grade-7",
    title: "Grade 7 Vocabulary",
    shortLabel: "Grade 7",
    audience: "For Class 7 students",
    group: "school",
    examTarget: "CBSE Class 7 · School Vocabulary",
    availability: "live",
    wordsCount: 320,
    daysToMaster: 32,
    visibleOnFilters: ["all", "secondary"],
    sampleWords: [
      mkSampleWord("perplex", ["to confuse someone"], "PER PLEX", "PER(fume) PLEX(us) — when too many perfumes hit your nose plexus at once, you're perplexed about which to choose.", ["The riddle perplexed even the smartest student.", "Her sudden silence perplexed everyone."], IMG_BG.cool),
      mkSampleWord("diligent", ["hardworking and careful"], "DIL IGENT", "DIL (heart) + IGENT — a diligent worker puts their whole DIL into the work.", ["Diligent students always finish their homework.", "She is diligent about saving money."], IMG_BG.forest),
      mkSampleWord("anonymous", ["unknown by name", "not identified"], "A NON MOUSE", "A NON MOUSE in the lab — nobody knows whose mouse this is, so it stays anonymous.", ["The donation came from an anonymous person.", "Anonymous feedback helps teachers improve."], IMG_BG.ash),
    ],
    description: "A curated set of words for Class 7 students. Each word comes with a keyword mnemonic, a memory-link scene, audio pronunciation, and usage examples. Suited for school vocabulary and reading-section practice.",
  },
  "vf-grade-8": {
    id: "vf-grade-8",
    title: "Grade 8 Vocabulary",
    shortLabel: "Grade 8",
    audience: "For Class 8 students",
    group: "school",
    examTarget: "CBSE Class 8 · School Vocabulary",
    availability: "live",
    wordsCount: 360,
    daysToMaster: 36,
    visibleOnFilters: ["all", "secondary"],
    sampleWords: [
      mkSampleWord("abundant", ["existing in large quantity"], "A BUNDLE", "A BUNDLE of mangoes from a farm — when you've got bundles of something, it's abundant.", ["Monsoon brings abundant rainfall to Kerala.", "The library has abundant resources for projects."], IMG_BG.forest),
      mkSampleWord("concur", ["to agree with someone"], "CON CUR", "CON(ference) CUR(rent) — at a conference, everyone runs the current opinion. To go with the current is to concur.", ["I concur with your decision.", "The doctors concurred on the treatment plan."], IMG_BG.cool),
      mkSampleWord("vivid", ["very bright", "extremely clear"], "VIV ID", "VIV(acious) ID — your ID photo is so vivacious and clear it feels alive.", ["She had a vivid memory of her grandmother.", "The painting uses vivid colours."], IMG_BG.sunset),
    ],
    description: "A curated set of words for Class 8 students. Each word comes with a keyword mnemonic, a memory-link scene, audio pronunciation, and usage examples. Suited for school vocabulary and reading-section practice.",
  },
  "vf-grade-9": {
    id: "vf-grade-9",
    title: "Grade 9 Vocabulary",
    shortLabel: "Grade 9",
    audience: "For Class 9 students · Board prep",
    group: "school",
    examTarget: "CBSE Class 9 · Board Foundation",
    availability: "live",
    wordsCount: 400,
    daysToMaster: 40,
    visibleOnFilters: ["all", "secondary"],
    sampleWords: [
      mkSampleWord("ambiguous", ["having more than one possible meaning", "unclear"], "AMBI GUOUS", "AMBI(dextrous) — someone who can use both hands is unclear which hand they'll use. Ambiguous.", ["Her answer was ambiguous — neither yes nor no.", "The contract had ambiguous terms."], IMG_BG.ash),
      mkSampleWord("candid", ["honest and direct", "frank"], "CAN DID", "CAN DID — if you CAN say what you DID, you're being candid.", ["He gave a candid review of the movie.", "I appreciate your candid feedback."], IMG_BG.warm),
      mkSampleWord("meticulous", ["showing great attention to detail"], "MET ICU LOUS", "MET in the ICU — doctors in the ICU are meticulous about every reading.", ["The detective was meticulous in collecting evidence.", "She is meticulous about her notes."], IMG_BG.cool),
    ],
    description: "A curated set of words for Class 9 students. Each word comes with a keyword mnemonic, a memory-link scene, audio pronunciation, and usage examples. Builds vocabulary for board prep and entrance-exam reading sections.",
  },
  "vf-grade-10": {
    id: "vf-grade-10",
    title: "Grade 10 Vocabulary",
    shortLabel: "Grade 10",
    audience: "For Class 10 students · Board prep",
    group: "school",
    examTarget: "CBSE Class 10 · Boards",
    availability: "live",
    wordsCount: 450,
    daysToMaster: 45,
    visibleOnFilters: ["all", "secondary"],
    sampleWords: [
      mkSampleWord("benevolent", ["kind and generous"], "BENE VOLENT", "BENE(fit) VOLENT(eer) — a volunteer who gives benefits is benevolent.", ["The benevolent donor funded the school.", "She is known for her benevolent nature."], IMG_BG.forest),
      mkSampleWord("concise", ["short and clear", "brief"], "CON CISE", "CON(densed) CISE — a condensed slice of text is concise.", ["Give a concise summary of the chapter.", "His writing is always concise."], IMG_BG.amber),
      mkSampleWord("lucid", ["clear and easy to understand", "rational"], "LU CID", "LU(cy) CID — Lucy's CID detective work is so clear, everyone follows it. Lucid.", ["The teacher gave a lucid explanation of trigonometry.", "She wrote a lucid essay on democracy."], IMG_BG.cool),
    ],
    description: "A curated set of words for Class 10 students preparing for board exams. Each word comes with a keyword mnemonic, a memory-link scene, audio pronunciation, and usage examples.",
  },
  "vf-grade-11": {
    id: "vf-grade-11",
    title: "Grade 11 Vocabulary",
    shortLabel: "Grade 11",
    audience: "For Class 11 students · JEE/NEET foundation",
    group: "school",
    examTarget: "CBSE Class 11 · JEE/NEET Foundation",
    availability: "live",
    wordsCount: 500,
    daysToMaster: 50,
    visibleOnFilters: ["all", "class_1112"],
    sampleWords: [
      mkSampleWord("abstruse", ["difficult to understand"], "ABS TRUCE", "ABS TRUCE — Two professors call a TRUCE over an argument about ABSurdly complex equations on a blackboard that are difficult to understand for everyone watching.", ["The abstruse theory baffled the undergraduates.", "His abstruse arguments lost the audience."], IMG_BG.ash),
      mkSampleWord("ephemeral", ["lasting for a very short time"], "EFF EMERAL", "EFF (eff-it) EMERAL(d) — an emerald that you toss away with an 'eff it' lasts only a moment. Ephemeral.", ["Social media fame is often ephemeral.", "The cherry blossom's beauty is ephemeral."], IMG_BG.sunset),
      mkSampleWord("ubiquitous", ["existing everywhere at the same time"], "U BIQUI TOUS", "U(niverse) + BIQUI(twin) + TOUS — twins in the universe seem to be everywhere at once. Ubiquitous.", ["Smartphones are ubiquitous in urban India.", "Coffee shops are now ubiquitous."], IMG_BG.cool),
    ],
    description: "A curated set of words for Class 11 students. Each word comes with a keyword mnemonic, a memory-link scene, audio pronunciation, and usage examples. Supports school vocabulary and reading-comprehension practice for entrance exams.",
  },
  "vf-grade-12": {
    id: "vf-grade-12",
    title: "Grade 12 Vocabulary",
    shortLabel: "Grade 12",
    audience: "For Class 12 students · JEE/NEET/Boards",
    group: "school",
    examTarget: "CBSE Class 12 · JEE/NEET",
    availability: "live",
    wordsCount: 550,
    daysToMaster: 55,
    visibleOnFilters: ["all", "class_1112"],
    sampleWords: [
      mkSampleWord("didactic", ["intended to teach", "morally instructive"], "DID ACTIC", "DID ACTIC — a teacher who DID act-ically (literally) teaches in every action is didactic.", ["The didactic novel taught readers about ethics.", "His tone was didactic, almost preachy."], IMG_BG.amber),
      mkSampleWord("pragmatic", ["dealing with things sensibly and realistically"], "PRA GMATIC", "PRA(ctical) GMATIC — practical thinking applied to GMAT-ic real problems is pragmatic.", ["She took a pragmatic approach to the budget cut.", "Pragmatic leaders solve problems quickly."], IMG_BG.forest),
      mkSampleWord("rhetoric", ["language designed to persuade or impress"], "RET ORIC", "RET(urn) ORIC — when a politician keeps RET(urning) to ORIC(inal) talking points to persuade you, that's rhetoric.", ["Political rhetoric is everywhere on social media.", "She studied the rhetoric of famous speeches."], IMG_BG.warm),
    ],
    description: "A curated set of words for Class 12 students. Each word comes with a keyword mnemonic, a memory-link scene, audio pronunciation, and usage examples. Supports board prep and reading-comprehension sections of competitive entrances.",
  },
  "vf-cat": {
    id: "vf-cat",
    title: "CAT Vocabulary",
    shortLabel: "CAT",
    audience: "For CAT 2026 aspirants",
    group: "competitive",
    examTarget: "CAT 2026 · VARC Section",
    availability: "live",
    wordsCount: 750,
    daysToMaster: 75,
    visibleOnFilters: ["all", "college", "exam_prep"],
    sampleWords: [
      mkSampleWord("audacious", ["showing willingness to take bold risks"], "AU DACIOUS", "AU(dacious!) DACIOUS — a boxer named Dacious shouts 'AU!' before every bold punch. Audacious.", ["His audacious plan to cross the desert succeeded.", "The audacious robbery shocked the city."], IMG_BG.sunset),
      mkSampleWord("succinct", ["expressed briefly and clearly"], "SUC CINCT", "SUC(cessful) CINCT(belt) — a successful belt cinches the waist short and tight. Succinct.", ["Give a succinct summary in three lines.", "Her succinct response impressed the panel."], IMG_BG.cool),
      mkSampleWord("ambivalent", ["having mixed feelings"], "AMBI VALENT", "AMBI(dextrous) VALENT(ine) — on Valentine's day you use both hands to hold two different bouquets — you're ambivalent about which to give.", ["I'm ambivalent about the new policy.", "She felt ambivalent about leaving her job."], IMG_BG.warm),
    ],
    description: "A curated vocabulary pack for CAT aspirants. Each word comes with a keyword mnemonic, a memory-link scene, audio pronunciation, and usage examples. Built around words that appear in the VARC section.",
  },
  "vf-general-english": {
    id: "vf-general-english",
    title: "General English",
    shortLabel: "General English",
    audience: "For all English learners",
    group: "universal",
    examTarget: "Everyday English · All-purpose",
    availability: "live",
    wordsCount: 600,
    daysToMaster: 60,
    visibleOnFilters: ["all", "secondary", "class_1112", "college", "exam_prep"],
    sampleWords: [
      mkSampleWord("abate", ["to lessen or reduce in intensity"], "A BATE", "A BATE — a fisherman lowers his BATE (bait) into water — the splash abates the calm.", ["The rain abated after sunset.", "The teacher's anger abated when the student apologised."], IMG_BG.cool),
      mkSampleWord("ample", ["more than enough"], "AM PLE", "AM PLE(nty) — there is AM(ple) PLE(nty) of food on the table.", ["We have ample time before the train leaves.", "There's ample parking near the mall."], IMG_BG.forest),
      mkSampleWord("frugal", ["careful with money", "sparing"], "FRU GAL", "FRU(it) GAL — the fruit girl is so frugal she eats only the bruised ones to save the rest for selling.", ["She lives a frugal life and saves half her salary.", "The family had to be frugal during the pandemic."], IMG_BG.amber),
    ],
    description: "A general English vocabulary pack — not tied to a specific exam. Each word comes with a keyword mnemonic, a memory-link scene, audio pronunciation, and usage examples. Useful for everyday reading, writing, and standardised-test prep.",
  },
  "vf-gre": {
    id: "vf-gre",
    title: "GRE Vocabulary",
    shortLabel: "GRE",
    audience: "For GRE aspirants",
    group: "study-abroad",
    examTarget: "GRE Verbal · Grad School Abroad",
    availability: "live",
    wordsCount: 1200,
    daysToMaster: 100,
    visibleOnFilters: ["all", "college"],
    sampleWords: [
      mkSampleWord("occlude", ["to block or obstruct"], "OAK CLOUD", "OAK CLOUD — a giant OAK tree's branches form a CLOUD that occludes the sun.", ["I use thick curtains to occlude my windows.", "Plaque can occlude arteries over time."], IMG_BG.forest),
      mkSampleWord("cacophony", ["a harsh mixture of loud sounds"], "CACO PHONY", "CACO(rrupt) PHONY — a corrupt fake orchestra phones in their performance — pure cacophony.", ["The cacophony of car horns in traffic was unbearable.", "Children's laughter became a beautiful cacophony."], IMG_BG.ash),
      mkSampleWord("dogmatic", ["asserting opinions as if they were facts"], "DOG MATIC", "DOG MATIC — a DOG that is auto-MATIC in its barking, no matter the situation, is dogmatic.", ["His dogmatic views shut down all discussion.", "Avoid dogmatic statements in academic essays."], IMG_BG.warm),
    ],
    description: "A high-frequency GRE Verbal vocabulary pack. Each word comes with a keyword mnemonic, a memory-link scene, audio pronunciation, and usage examples.",
  },
  "vf-sat": {
    id: "vf-sat",
    title: "SAT Vocabulary",
    shortLabel: "SAT",
    audience: "For SAT aspirants · US college prep",
    group: "study-abroad",
    examTarget: "SAT · US College Admissions",
    availability: "live",
    wordsCount: 800,
    daysToMaster: 80,
    visibleOnFilters: ["all", "class_1112", "college"],
    sampleWords: [
      mkSampleWord("advocate", ["to publicly support", "a supporter"], "AD VOCATE", "AD (advertise) VOCATE (vocal) — to be vocal in an advertisement is to advocate.", ["She advocates for clean air policies.", "He is an advocate of meditation."], IMG_BG.cool),
      mkSampleWord("deride", ["to mock or ridicule"], "DE RIDE", "DE RIDE — to take DE RIDE out of someone is to mock them.", ["Critics derided the new film's plot.", "Don't deride others for trying."], IMG_BG.sunset),
      mkSampleWord("pragmatic", ["practical", "sensible"], "PRA GMATIC", "PRA(ctical) GMATIC — applying practical thinking to GMAT-ic problems.", ["A pragmatic leader weighs cost vs benefit.", "Her pragmatic approach saved the project."], IMG_BG.forest),
    ],
    description: "A high-frequency SAT vocabulary pack covering Reading and Writing & Language sections. Each word comes with a keyword mnemonic, a memory-link scene, audio pronunciation, and usage examples.",
  },
  "vf-ielts": {
    id: "vf-ielts",
    title: "IELTS Vocabulary",
    shortLabel: "IELTS",
    audience: "For IELTS aspirants",
    group: "study-abroad",
    examTarget: "IELTS Academic + General",
    availability: "coming-soon",
    wordsCount: 1000,
    daysToMaster: 90,
    visibleOnFilters: ["all", "class_1112", "college"],
    sampleWords: [],
    description: "IELTS-specific vocabulary covering both Academic and General Training modules. Coming soon — get notified when it launches.",
  },
  "vf-toefl": {
    id: "vf-toefl",
    title: "TOEFL Vocabulary",
    shortLabel: "TOEFL",
    audience: "For TOEFL aspirants",
    group: "study-abroad",
    examTarget: "TOEFL iBT · US Universities",
    availability: "coming-soon",
    wordsCount: 950,
    daysToMaster: 85,
    visibleOnFilters: ["all", "college"],
    sampleWords: [],
    description: "TOEFL iBT vocabulary covering Reading, Listening, Speaking, and Writing sections. Coming soon — get notified when it launches.",
  },
};

// Ordered list — controls rail order in marketplace. Interleaved so the first
// ~5 visible cards show category variety (school + competitive + study-abroad
// + universal). Previously grades-first caused users to think the rail was
// K-12 only because the first few visible cards were Grade 6/7/8.
export const VOCABFAST_PACK_IDS: readonly VocabFastPackId[] = [
  "vf-general-english",  // 1. universal
  "vf-grade-10",         // 2. school (board-year anchor)
  "vf-cat",              // 3. competitive
  "vf-grade-12",         // 4. senior school
  "vf-gre",              // 5. study-abroad
  "vf-grade-6",          // 6. early school
  "vf-sat",              // 7. study-abroad
  "vf-grade-11",         // 8. senior school
  "vf-grade-9",          // 9. school
  "vf-grade-7",          // 10. school
  "vf-grade-8",          // 11. school
  "vf-ielts", "vf-toefl", // coming-soon (hidden in rail, deep-link only)
] as const;

export function getVocabFastPack(id: string | null | undefined): VocabFastPack | null {
  if (!id) return null;
  return DUMMY_VOCABFAST_PACKS[id as VocabFastPackId] ?? null;
}

export function isVocabFastPackId(id: string | null | undefined): id is VocabFastPackId {
  if (!id) return false;
  return id in DUMMY_VOCABFAST_PACKS;
}

export function getVocabFastPacksForFilter(filterId: AgeFilterId): VocabFastPack[] {
  return VOCABFAST_PACK_IDS
    .map((id) => DUMMY_VOCABFAST_PACKS[id])
    .filter((p) => p.visibleOnFilters.includes(filterId));
}

