/**
 * Learning Path V3 Screen
 * Same as V2 but topics expand to show 5 top-level actions: Quick Learn, Live Class, Practice, Test, Analytics.
 * Quick Learn opens an inline tabbed view: Concept Cards, Notes, Formulas, Examples, PYQs.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useTheme } from '../app/contexts/theme-context';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ChevronDown, Languages, Check, CheckCircle2, Play, Lock, X,
  BookOpen, Video, FileText, Calculator, Lightbulb,
  Zap, Award, ClipboardCheck, BarChart3, GraduationCap,
  Calendar, Clock, RefreshCw,
  Atom, Dna, Building2, FlaskConical, Calculator as CalcIcon, type LucideIcon,
} from 'lucide-react';
import { StickySectionHeader } from '../shared/sticky-section-header';
import { BottomSheet } from '../shared/bottom-sheet';
import { StatusBar } from '../shared/premium-ui';
import { JumpNavigator } from '../shared/jump-navigator';
import { getExamConfig, getExamChapters, EXAM_CONFIGS } from '../app/data/exam-config';
import { NextLiveClassCard } from '../shared/next-live-class-card';
import type { Chapter } from '../app/data/exam-config';
import { CourseOverflowMenu } from './course-overflow-menu';
import { getCompletedSubjectIds } from '../shared/certificates';
import { setCurrentCourseId } from '../shared/feedback-storage';

/* ─────────── Topic Types & Data ─────────── */

type TopicStatus = 'completed' | 'in-progress' | 'not-started' | 'locked';

interface TopicData {
  id: string;
  title: string;
  description: string;
  status: TopicStatus;
  progress: number;
  stars: number;
  importanceTag?: 'High weightage' | 'Frequently asked';
}

interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  progress?: number;
  xp?: number;
  isTest?: boolean;
  size?: 'small' | 'medium' | 'large';
  prepScore?: number;
}

interface Unit {
  id: string;
  number: number;
  sectionNumber: number;
  title: string;
  description: string;
  subjectColor: string;
  lessons: Lesson[];
  progress: string;
}

interface IconCardItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { style?: React.CSSProperties }>;
  bg: string;
  lightBg: string;
  border: string;        // solid border color (full opacity)
  borderAlpha: string;   // semi-transparent border color CSS var
  shadowAlpha: string;   // bottom shadow color CSS var
  iconColor: string;
  lightIconColor: string;
  highlightBg?: string;      // vivid bg for highlighted state (dark mode)
  lightHighlightBg?: string; // vivid bg for highlighted state (light mode)
  done?: boolean;
  highlight?: boolean;
  free?: boolean;
  upcoming?: boolean;
}

/* ─────────── Chapter Topics Map ─────────── */

const CHAPTER_TOPICS: Record<string, string[]> = {
  // JEE Main Physics
  'kinematics':          ['Position, Velocity & Acceleration', 'Equations of Motion', 'Projectile Motion', 'Relative Motion', 'Motion in a Plane'],
  'newtons-laws':        ["Newton's First Law & Inertia", "Newton's Second Law (F=ma)", "Newton's Third Law", 'Friction & Applications', 'Dynamics of Circular Motion'],
  'energy-work':         ['Work & Work-Energy Theorem', 'Kinetic & Potential Energy', 'Conservation of Energy', 'Power', 'Collisions & Impulse'],
  'circular-motion':     ['Uniform Circular Motion', 'Angular Velocity & Acceleration', 'Centripetal Force', 'Moment of Inertia', 'Torque & Angular Momentum'],
  'gravitation':         ["Newton's Law of Gravitation", 'Gravitational Field & Potential', 'Satellite Motion', 'Orbital & Escape Velocity', "Kepler's Laws"],
  'thermodynamics':      ['Thermal Expansion & Specific Heat', 'Laws of Thermodynamics', 'Carnot Engine & Efficiency', 'Kinetic Theory of Gases', 'Heat Transfer'],
  'waves':               ['Wave Properties & Types', 'Speed of Sound', 'Superposition & Interference', 'Resonance & Standing Waves', 'Doppler Effect'],
  'electrostatics':      ["Electric Charge & Coulomb's Law", 'Electric Field & Field Lines', 'Electric Potential & Potential Energy', "Gauss's Law", 'Capacitors & Dielectrics'],
  'current-electricity': ["Ohm's Law & Resistance", "Kirchhoff's Laws", 'Wheatstone Bridge', 'Electric Power & Energy', 'Combination of Cells'],
  'magnetism':           ['Magnetic Field & Biot-Savart Law', "Ampere's Law", 'Moving Charges in Magnetic Field', 'Electromagnetic Induction', 'AC Circuits & Transformers'],
  // JEE Main Chemistry
  'atomic-structure':    ["Bohr's Model & Atomic Spectra", 'Quantum Numbers', 'Electronic Configuration', 'Periodic Trends', 'Periodic Properties of Elements'],
  'chemical-bonding':    ['Ionic Bonding & Crystal Lattice', 'Covalent Bonding & VSEPR', 'Molecular Orbital Theory', 'Hybridization', 'Intermolecular Forces'],
  'states-of-matter':    ['Kinetic Theory of Gases', "Boyle's & Charles's Laws", 'Ideal Gas Equation', 'Real Gases & van der Waals', 'Liquid & Solid State'],
  'thermochemistry':     ["Enthalpy & Hess's Law", 'Bond Enthalpy', 'Entropy & Spontaneity', 'Gibbs Free Energy', 'Standard Heats of Formation'],
  'equilibrium':         ['Law of Mass Action', 'Equilibrium Constant (Kc & Kp)', "Le Chatelier's Principle", 'Ionic Equilibrium', 'Solubility Product'],
  'acids-bases':         ['Arrhenius & Brønsted-Lowry Theories', 'Lewis Acids & Bases', 'pH Scale & Calculations', 'Buffer Solutions', 'Salt Hydrolysis'],
  'redox-reactions':     ['Oxidation States', 'Balancing Redox Equations', 'Electrochemical Cells', "Faraday's Laws of Electrolysis", 'Corrosion & Electroplating'],
  'periodic-table':      ['Modern Periodic Law', 'Atomic & Ionic Radii', 'Ionization Energy', 'Electron Affinity & Electronegativity', 'Block Elements Overview'],
  'organic-basics':      ['IUPAC Nomenclature', 'Functional Groups', 'Isomerism', 'Reaction Mechanisms', 'Inductive & Resonance Effects'],
  'hydrocarbons':        ['Alkanes & Properties', 'Alkenes & Addition Reactions', 'Alkynes & Reactions', 'Aromatic Compounds (Benzene)', 'Substitution & Elimination'],
  // JEE Main Mathematics
  'sets-relations':      ['Sets & Set Operations', 'Venn Diagrams', 'Types of Relations', 'Functions & Mappings', 'Equivalence Relations'],
  'complex-numbers':     ['Introduction to Complex Numbers', 'Argand Plane & Modulus', "Polar Form & De Moivre's Theorem", 'Roots of Unity', 'Complex Equations'],
  'quadratic-equations': ['Solving Quadratic Equations', 'Nature of Roots (Discriminant)', "Vieta's Formulas", 'Quadratic Inequalities', 'Graphing Parabolas'],
  'sequences-series':    ['Arithmetic Progression (AP)', 'Geometric Progression (GP)', 'Harmonic Progression (HP)', 'Sum of Special Series', 'Infinite Series & Convergence'],
  'trigonometry':        ['Trigonometric Ratios & Identities', 'Graphs of Trig Functions', 'Inverse Trigonometric Functions', 'Trigonometric Equations', 'Height & Distance Problems'],
  'calculus':            ['Limits & Continuity', 'Differentiation Rules', 'Applications of Derivatives', 'Integration Techniques', 'Definite Integrals & Area'],
  'coordinate-geometry': ['Straight Lines', 'Circles', 'Parabola', 'Ellipse', 'Hyperbola'],
  'vectors':             ['Vector Algebra & Operations', 'Dot & Cross Products', '3D Coordinate System', 'Planes & Lines in 3D', 'Distance & Angle Formulas'],
  'probability':         ['Basic Probability Concepts', 'Conditional Probability', "Bayes' Theorem", 'Binomial Distribution', 'Random Variables & Expectation'],
  'matrices':            ['Matrix Operations', 'Types of Matrices', 'Determinants & Properties', 'Inverse of a Matrix', 'System of Linear Equations'],
  // JEE Advanced Physics
  'advanced-mechanics':  ['Rigid Body Mechanics', 'Variable Mass Systems', 'Constraint Motion', 'Non-inertial Frames', 'Advanced Problem Solving'],
  'rotational-dynamics': ['Moment of Inertia & Theorems', 'Torque & Angular Momentum', 'Rolling Motion', 'Angular Impulse', 'Gyroscopic Motion'],
  'fluid-mechanics':     ['Pressure & Buoyancy', "Bernoulli's Equation", 'Viscosity & Poiseuille Flow', 'Surface Tension', 'Fluid Dynamics Applications'],
  'thermal-physics':     ['Kinetic Theory & Maxwell Distribution', 'Laws of Thermodynamics', 'Entropy', 'Cyclic Processes', 'Heat Engines & Refrigerators'],
  'electrodynamics':     ['Electric & Magnetic Fields in Motion', 'Electromagnetic Waves', "Maxwell's Equations", 'Radiation & Energy', 'Advanced EMI Problems'],
  'optics-advanced':     ['Wave Optics & Interference', 'Diffraction', 'Polarization', 'Optical Instruments', 'Resolving Power'],
  'quantum-physics':     ['Photoelectric Effect', 'Wave-Particle Duality', "Bohr's Model & Spectra", 'de Broglie Wavelength', 'Uncertainty Principle'],
  'nuclear-physics':     ['Nuclear Structure & Binding Energy', 'Radioactive Decay', 'Nuclear Reactions', 'Fission & Fusion', 'Radiation & Safety'],
  // JEE Advanced Chemistry
  'chemical-thermodynamics': ['Enthalpy & Internal Energy', 'Entropy & Gibbs Energy', 'Spontaneity of Reactions', 'Thermochemical Cycles', 'Phase Transitions'],
  'chemical-kinetics':   ['Rate of Reaction', 'Rate Law & Order', 'Arrhenius Equation', 'Reaction Mechanisms', 'Catalysis'],
  'electrochemistry':    ['Electrochemical Cells', 'Electrode Potentials', 'Nernst Equation', 'Electrolysis', 'Corrosion & Protection'],
  'coordination-chemistry': ['Complex Compounds & Nomenclature', 'Crystal Field Theory', 'Magnetic Properties', 'Isomerism in Complexes', 'Organometallics'],
  'organic-reactions':   ['Nucleophilic Substitution (SN1/SN2)', 'Elimination Reactions', 'Electrophilic Addition', 'Oxidation & Reduction', 'Named Reactions'],
  'aromatic-chemistry':  ['Aromaticity & Hückel Rule', 'Electrophilic Aromatic Substitution', 'Nucleophilic Aromatic Substitution', 'Polycyclic Aromatics', 'Phenols & Anilines'],
  'biomolecules':        ['Carbohydrates & Sugars', 'Proteins & Amino Acids', 'Enzymes & Catalysis', 'Nucleic Acids (DNA/RNA)', 'Lipids & Vitamins'],
  'polymers':            ['Addition Polymerization', 'Condensation Polymerization', 'Natural Polymers', 'Synthetic Polymers & Uses', 'Biodegradable Polymers'],
  // JEE Advanced Mathematics
  'complex-numbers-adv': ['Complex Algebra & Geometry', 'Roots & Polynomials', 'Transformations in Complex Plane', 'Summation using Complex Numbers', 'Advanced Applications'],
  'functions':           ['Types of Functions', 'Domain & Range', 'Composite & Inverse Functions', 'Graphs & Transformations', 'Functional Equations'],
  'limits-continuity':   ['Epsilon-Delta Definition', 'Standard Limits', 'Continuity & Discontinuity', "L'Hôpital's Rule", 'Continuity Theorems'],
  'differential-calculus': ['Differentiability', 'Higher Order Derivatives', 'Rolle\'s & MVT', 'Maxima & Minima', 'Curve Sketching'],
  'integral-calculus':   ['Integration by Parts', 'Partial Fractions', 'Reduction Formulas', 'Definite Integrals', 'Area & Volume Applications'],
  'differential-equations': ['First Order ODEs', 'Separable Equations', 'Linear Equations', 'Exact Equations', 'Higher Order ODEs'],
  'vector-algebra':      ['Vector Operations', 'Dot Product & Projections', 'Cross Product & Torque', 'Scalar & Vector Triple Products', 'Applications in Geometry'],
  'analytical-geometry': ['Conic Sections (Advanced)', 'Polar Coordinates', 'Parametric Equations', 'Asymptotes & Tangents', '3D Geometry Problems'],
  // NEET Physics
  'mechanics-neet':      ['Laws of Motion', 'Work, Energy & Power', 'Rotational Motion', 'Gravitation', 'Properties of Matter'],
  'thermodynamics-neet': ['Thermal Properties of Matter', 'Laws of Thermodynamics', 'Heat Transfer', 'Kinetic Theory', 'Thermodynamic Processes'],
  'waves-optics':        ['Wave Motion & Sound', 'Reflection & Refraction', 'Optical Instruments', 'Wave Optics', 'Diffraction & Polarization'],
  'electricity-magnetism': ['Electric Charges & Fields', 'Current Electricity', 'Magnetic Effects of Current', 'Electromagnetic Induction', 'Alternating Current'],
  'modern-physics':      ['Dual Nature of Matter', 'Atoms & Nuclei', 'Nuclear Physics', 'Semiconductors', 'Communication Systems'],
  'oscillations':        ['Simple Harmonic Motion', 'Spring-Mass Systems', 'Simple Pendulum', 'Damped Oscillations', 'Resonance'],
  'semiconductors':      ['Band Theory', 'P-N Junction Diode', 'Transistors & Amplifiers', 'Logic Gates', 'Semiconductor Devices'],
  // NEET Chemistry
  'physical-chemistry':  ['Solutions & Colligative Properties', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'Nuclear Chemistry'],
  'chemical-equilibrium-neet': ['Equilibrium Concepts', 'Equilibrium Constants', "Le Chatelier's Principle", 'Ionic Equilibrium', 'Solubility & pH'],
  'inorganic-chemistry': ['Periodic Table & Trends', 'Chemical Bonding', 'p-Block Elements', 'd & f-Block Elements', 'Coordination Compounds'],
  'organic-chemistry':   ['Basic Organic Concepts', 'Hydrocarbons', 'Alcohol, Phenol & Ether', 'Aldehydes & Ketones', 'Biomolecules & Polymers'],
  'environmental-chemistry': ['Environmental Pollution', 'Green Chemistry', 'Smog & Acid Rain', 'Ozone Depletion', 'Waste Management'],
  'chemistry-everyday':  ['Drugs & Medicines', 'Chemicals in Food', 'Cleansing Agents', 'Dyes & Pigments', 'Polymers in Daily Life'],
  'solid-state':         ['Crystal Structures', 'Unit Cells & Packing', 'Crystal Defects', 'Electrical Properties', 'Magnetic & Dielectric Properties'],
  // CAT Verbal Ability
  'reading-comprehension': ['Identifying Central Idea', 'Inference & Tone Questions', 'Vocabulary in Context', 'Passage Structure & Flow', 'Author\'s Argument & Purpose'],
  'para-jumbles':          ['Sentence Connectors & Transitions', 'Identifying Opening & Closing Sentences', 'Theme-based Ordering', 'Pronoun & Antecedent Links', 'Logical Sequence Building'],
  'sentence-correction':   ['Subject-Verb Agreement', 'Tense Consistency', 'Pronoun Usage', 'Modifiers & Parallelism', 'Idioms & Prepositions'],
  'para-summary':          ['Identifying the Main Point', 'Eliminating Peripheral Information', 'Summary vs Inference', 'Concise Paraphrasing', 'Evaluating Answer Choices'],
  'critical-reasoning':    ['Strengthening & Weakening Arguments', 'Assumption-based Questions', 'Conclusion Drawing', 'Logical Flaw Identification', 'Cause-and-Effect Reasoning'],
  'vocabulary':            ['Root Words & Affixes', 'Synonyms & Antonyms', 'Contextual Word Usage', 'Confusing Word Pairs', 'Idioms & Phrases'],
  // CAT Data Interpretation & Logical Reasoning
  'data-interpretation':   ['Bar & Line Charts', 'Pie Charts & Donut Graphs', 'Tables & Caselets', 'Combination Charts', 'Data Calculation Techniques'],
  'logical-reasoning':     ['Arrangements & Groupings', 'Scheduling & Sequencing', 'Grid-based Puzzles', 'Constraint-based Reasoning', 'Deductive Logic Sets'],
  'data-sufficiency':      ['Two-statement Sufficiency', 'Algebraic Sufficiency', 'Geometric Sufficiency', 'Numerical Sufficiency Tricks', 'Common Trap Avoidance'],
  'seating-arrangements':  ['Linear Arrangements', 'Circular Arrangements', 'Double Row Arrangements', 'Complex Multi-variable Sets', 'Direction-based Problems'],
  'blood-relations':       ['Family Tree Representation', 'Three-generation Problems', 'Coded Blood Relations', 'Network & Connectivity Problems', 'Mixed Relationship Puzzles'],
  'visual-reasoning':      ['Series Completion', 'Mirror & Water Images', 'Embedded Figures', 'Paper Folding & Cutting', 'Analogy & Classification'],
  // CAT Quantitative Aptitude
  'arithmetic':            ['Percentages & Applications', 'Profit, Loss & Discount', 'Ratio, Proportion & Mixtures', 'Time, Speed & Distance', 'Time & Work'],
  'algebra-cat':           ['Linear & Quadratic Equations', 'Inequalities & Modulus', 'Functions & Graphs', 'Polynomials & Remainder Theorem', 'Logarithms & Exponents'],
  'geometry':              ['Lines, Angles & Triangles', 'Circles & Quadrilaterals', 'Mensuration (2D & 3D)', 'Coordinate Geometry Basics', 'Similarity & Congruence'],
  'number-systems':        ['Divisibility & Factors', 'LCM, HCF & Applications', 'Remainders & Modular Arithmetic', 'Base Conversions', 'Unit Digit & Last Two Digits'],
  'trigonometry-cat':      ['Basic Ratios & Identities', 'Heights & Distances', 'Sine & Cosine Rules', 'Max & Min of Trig Expressions', 'Inverse Trigonometric Values'],
  'permutation-combination': ['Fundamental Counting Principle', 'Permutations & Arrangements', 'Combinations & Selections', 'Circular Permutations', 'Restricted Cases & Distributions'],
  'probability-cat':       ['Classical Probability', 'Conditional Probability', 'Bayes\' Theorem Applications', 'Probability Distributions', 'Expected Value & Odds'],
  // NEET Biology
  'cell-biology':        ['Cell Structure & Organelles', 'Cell Membrane & Transport', 'Cell Division (Mitosis)', 'Cell Division (Meiosis)', 'Cell Signaling'],
  'biomolecules-bio':    ['Carbohydrates & Sugars', 'Proteins & Enzymes', 'Lipids & Fats', 'Nucleic Acids (DNA/RNA)', 'Vitamins & Hormones'],
  'genetics':            ['Mendelian Genetics', 'DNA Structure & Replication', 'Transcription & Translation', 'Gene Expression & Regulation', 'Mutation & Genetic Disorders'],
  'evolution':           ['Origin of Life', 'Theories of Evolution', 'Evidence of Evolution', 'Natural Selection', 'Human Evolution & Classification'],
  'human-physiology':    ['Digestion & Absorption', 'Circulation & Blood', 'Respiration & Gas Exchange', 'Nervous System', 'Endocrine System'],
  'plant-biology':       ['Photosynthesis', 'Respiration in Plants', 'Plant Anatomy & Morphology', 'Plant Growth & Development', 'Plant Hormones'],
  'reproduction':        ['Asexual Reproduction', 'Sexual Reproduction in Plants', 'Human Reproduction', 'Reproductive Health', 'Embryonic Development'],
};

const getChapterTopics = (chapterId: string): string[] =>
  CHAPTER_TOPICS[chapterId] ?? ['Fundamentals', 'Core Concepts', 'Advanced Topics', 'Problem Solving', 'Practice & Review'];

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  physics: Atom,
  chemistry: FlaskConical,
  mathematics: CalcIcon,
  biology: Dna,
  verbal: BookOpen,
  dilr: BarChart3,
  quant: CalcIcon,
};

const getSubjectIcon = (subjectId: string): LucideIcon => SUBJECT_ICONS[subjectId] ?? GraduationCap;

/* ─────────── Component Prop Interfaces ─────────── */

interface GridIconProps {
  item: IconCardItem;
  index: number;
}

interface StatusCircleProps {
  status: TopicStatus;
  index: number;
}

interface LiveClassCardProps {
  session: LiveClassSession;
  onTap: () => void;
}

interface ExpandedContentProps {
  topicTitle?: string;
  topicStatus?: TopicStatus;
  liveClass?: LiveClassSession;
  onLiveClassTap?: () => void;
}

interface TopicRowProps {
  topic: TopicData;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
  liveClass?: LiveClassSession;
  onLiveClassTap?: () => void;
  onLockedTap?: () => void;
}

interface LiveClassDetailSheetProps {
  session: LiveClassSession | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: () => void;
  onJoin: () => void;
}

interface RescheduleSheetProps {
  session: LiveClassSession | null;
  allSessions: LiveClassSession[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (session: LiveClassSession, newDate: Date) => void;
}

/* ─────────── V3: Top-level action icons ─────────── */
const TOP_ACTIONS: IconCardItem[] = [
  { id: 'live-class', label: 'Live Class', icon: Video,          bg: 'color-mix(in srgb, var(--warning) 20%, transparent)',    lightBg: 'color-mix(in srgb, var(--warning) 16%, transparent)',    border: 'var(--warning-700)', borderAlpha: 'var(--warning-alpha-30)',                                shadowAlpha: 'var(--warning-alpha-25)',                                iconColor: 'var(--warning-500)',  lightIconColor: 'var(--warning-700)', highlightBg: 'var(--warning)',     lightHighlightBg: 'var(--warning)' },
  { id: 'practice',   label: 'Practice',   icon: Zap,            bg: 'color-mix(in srgb, var(--primary) 22%, transparent)',    lightBg: 'color-mix(in srgb, var(--primary) 16%, transparent)',    border: 'var(--primary-600)', borderAlpha: 'var(--primary-alpha-30)',                                shadowAlpha: 'var(--primary-alpha-25)',                                iconColor: 'var(--primary-300)',  lightIconColor: 'var(--primary-600)', highlightBg: 'var(--primary)',     lightHighlightBg: 'var(--primary)' },
  { id: 'pyqs',       label: 'PYQs',       icon: ClipboardCheck, bg: 'color-mix(in srgb, var(--purple-500) 20%, transparent)', lightBg: 'color-mix(in srgb, var(--purple-500) 16%, transparent)', border: 'var(--purple-500)', borderAlpha: 'color-mix(in srgb, var(--purple-500) 30%, transparent)', shadowAlpha: 'color-mix(in srgb, var(--purple-500) 25%, transparent)', iconColor: 'var(--purple-400)', lightIconColor: 'var(--purple-600)', highlightBg: 'var(--purple-500)', lightHighlightBg: 'var(--purple-500)', free: true },
  { id: 'analytics',  label: 'Analytics',  icon: BarChart3,      bg: 'color-mix(in srgb, var(--cyan-500) 28%, transparent)',   lightBg: 'color-mix(in srgb, var(--cyan-500) 16%, transparent)',   border: 'var(--cyan-500)',    borderAlpha: 'color-mix(in srgb, var(--cyan-500) 30%, transparent)',   shadowAlpha: 'color-mix(in srgb, var(--cyan-500) 25%, transparent)',   iconColor: 'var(--cyan-400)',     lightIconColor: 'var(--cyan-600)',    highlightBg: 'var(--cyan-500)',    lightHighlightBg: 'var(--cyan-500)' },
];


const EXAM_ICON_MAP: Record<string, { Icon: LucideIcon; color: string }> = {
  'cat':          { Icon: GraduationCap, color: 'var(--primary)' },
  'jee-main':     { Icon: Atom,      color: 'var(--physics)'    },
  'neet':         { Icon: Dna,       color: 'var(--biology)'    },
  'upsc':         { Icon: Building2, color: 'var(--warning-500)' },
};

const SHOWN_EXAM_IDS = ['cat', 'jee-main', 'neet', 'upsc'];

const mockPrepScores: Record<string, number> = {
  'lesson-1-1': 92,
  'lesson-1-2': 78,
  'lesson-1-3': 88,
  'lesson-1-4': 45,
};

/* ─────────── Live Class Scheduling ─────────── */

type LiveClassStatus = 'scheduled' | 'live' | 'recording-available';

interface LiveClassSession {
  id: string;
  lessonId: string;
  lessonTitle: string;
  chapterTitle: string;
  instructor: string;
  scheduledDate: Date;
  durationMinutes: number;
  status: LiveClassStatus;
  enrolledCount: number;
  rescheduled?: boolean;
}

const LC_INSTRUCTORS = ['Dr. Amit Kumar', 'Prof. Priya Sharma', 'Dr. Rajesh Verma', 'Ms. Kavita Singh', 'Dr. Suresh Nair'];
const LC_SLOTS = [{ hour: 10, minute: 0 }, { hour: 16, minute: 0 }];

function computeLiveStatus(classDate: Date, durationMinutes: number): LiveClassStatus {
  const now = new Date();
  const classEnd = new Date(classDate.getTime() + durationMinutes * 60 * 1000);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const classDay = new Date(classDate); classDay.setHours(0, 0, 0, 0);
  if (now > classEnd) return 'recording-available';
  if (classDay.getTime() === today.getTime()) return 'live';
  if (now >= classDate) return 'live';
  return 'scheduled';
}

// TODO: Replace with API call — fetch live class schedule for the user's enrolled lessons
function generateLiveSchedule(
  lessons: Array<{ id: string; title: string; chapterTitle: string }>
): LiveClassSession[] {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return lessons.map((lesson, i) => {
    let classDate: Date;
    let status: LiveClassStatus;

    if (i < 3) {
      // First three lessons → recording-available (yesterday)
      classDate = new Date(today);
      classDate.setDate(classDate.getDate() - 1);
      classDate.setHours(i === 1 ? 16 : 10, 0, 0, 0);
      status = 'recording-available';
    } else if (i === 3) {
      // Fourth lesson → live now (ongoing, started 10 min ago)
      classDate = new Date();
      classDate.setMinutes(classDate.getMinutes() - 10, 0, 0);
      status = 'live';
    } else {
      // Everything else → scheduled in future
      const futureSlot = LC_SLOTS[(i - 3) % 2];
      classDate = new Date(today);
      classDate.setDate(classDate.getDate() + Math.floor((i - 3) / 2) + 1);
      classDate.setHours(futureSlot.hour, futureSlot.minute, 0, 0);
      status = 'scheduled';
    }

    return {
      id: `lc-${lesson.id}`,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      chapterTitle: lesson.chapterTitle,
      instructor: LC_INSTRUCTORS[i % LC_INSTRUCTORS.length],
      scheduledDate: classDate,
      durationMinutes: 60,
      status,
      enrolledCount: 200 + ((i * 137) % 300),
    };
  });
}

function fmtLCDate(date: Date): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtLCTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getAvailableRescheduleSlots(session: LiveClassSession, allSessions: LiveClassSession[]): Date[] {
  const now = new Date();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const slotDefs = [
    { hour: 9, minute: 0 }, { hour: 11, minute: 0 },
    { hour: 14, minute: 0 }, { hour: 16, minute: 0 }, { hour: 19, minute: 0 },
  ];
  const occupied = new Set(
    allSessions
      .filter(s => s.id !== session.id)
      .map(s => `${s.scheduledDate.toDateString()}-${s.scheduledDate.getHours()}`)
  );
  const available: Date[] = [];
  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    for (const slot of slotDefs) {
      const slotDate = new Date(date);
      slotDate.setHours(slot.hour, slot.minute, 0, 0);
      if (slotDate <= now) continue;
      const key = `${date.toDateString()}-${slot.hour}`;
      if (!occupied.has(key)) available.push(slotDate);
    }
  }
  return available;
}

/* ─────────── Accordion Sub-components ─────────── */

/** Small grid icon — 44px, 3D raised, theme-aware */
function GridIcon({ item, index }: GridIconProps) {
  const Icon = item.icon;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bg = isDark ? item.bg : item.lightBg;
  const ic = isDark ? item.iconColor : item.lightIconColor;
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: 'easeOut' }}
      whileTap={{ scale: 0.92 }}
      aria-label={item.label}
      className="flex flex-col items-center gap-2 w-full shrink-0 cursor-pointer"
      style={{
        border: 'none', background: 'none', padding: '4px 0',
        transition: 'all 0.15s ease',
      }}
    >
      <div className="relative overflow-visible" style={{ width: 60, height: 60 }}>
        {/* Glowing ring animation */}
        {item.highlight && (
          <motion.div
            animate={{ opacity: [0.1, 0.75, 0.1], scale: [0.98, 1.06, 0.98] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute pointer-events-none"
            style={{
              inset: -5, borderRadius: 24,
              border: `2px solid ${item.border}`,
              boxShadow: `0 0 10px ${item.borderAlpha}`,
              zIndex: 0,
            }}
          />
        )}
        <motion.div
          animate={item.highlight ? { scale: [1, 1.05, 1] } : {}}
          transition={item.highlight ? {
            duration: 1.8, repeat: Infinity, ease: 'easeInOut',
          } : {}}
          className="relative overflow-hidden flex items-center justify-center"
          style={{
            width: 60, height: 60, borderRadius: 18,
            background: item.highlight
              ? (isDark ? (item.highlightBg ?? bg) : (item.lightHighlightBg ?? bg))
              : bg,
            border: item.highlight ? 'none' : `1.5px solid ${item.borderAlpha}`,
            boxShadow: item.highlight
              ? `0 4px 0 0 ${item.shadowAlpha}, inset 0 1px 0 var(--white-alpha-12), inset 0 -1px 0 var(--black-alpha-15)`
              : `0 3px 0 0 ${item.shadowAlpha}, inset 0 1px 0 ${isDark ? 'var(--white-alpha-8)' : 'var(--white-alpha-50)'}, inset 0 -1px 0 ${isDark ? 'var(--black-alpha-15)' : 'var(--black-alpha-6)'}`,
          }}>
          <Icon style={{ width: 24, height: 24, strokeWidth: 2, color: item.highlight ? 'var(--white)' : ic, position: 'relative', zIndex: 1 }} />
        </motion.div>
        {item.done && (
          <div className="absolute flex items-center justify-center" style={{
            top: -2, right: -2, width: 16, height: 16,
            borderRadius: 8, backgroundColor: 'var(--success-600)',
            border: `1.5px solid ${isDark ? 'var(--black)' : 'var(--white)'}`, zIndex: 2,
          }}>
            <Check style={{ width: 8, height: 8, color: 'var(--white)', strokeWidth: 3 }} />
          </div>
        )}
        {item.free && !item.done && (
          <div className="absolute flex items-center justify-center" style={{
            top: -4, right: -4, zIndex: 2,
            background: 'linear-gradient(135deg, var(--purple-600), var(--purple-500))',
            borderRadius: 8, padding: '4px 6px',
            border: `1px solid ${isDark ? 'var(--black)' : 'var(--white)'}`,
          }}>
            <span style={{
              fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--white)', letterSpacing: '0.03em',
              lineHeight: 1,
            }}>FREE</span>
          </div>
        )}

      </div>
      <span style={{
        fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: item.highlight ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
        color: item.highlight ? ic : item.upcoming ? 'var(--warning-500)' : 'var(--muted-foreground)', textAlign: 'center', lineHeight: '1.2',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
      }}>{item.label}</span>
    </motion.button>
  );
}

/** Section divider label */
function InlineLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2" style={{ padding: '2px 0' }}>
      <span style={{
        fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)',
        letterSpacing: 1.3, textTransform: 'uppercase', color,
      }}>{label}</span>
      <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--border)' }} />
    </div>
  );
}

function StatusCircle({ status, index }: StatusCircleProps) {
  const base: React.CSSProperties = {
    width: 44, height: 44, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };
  if (status === 'completed') return (
    <div className="flex items-center justify-center shrink-0" style={{
      ...base, background: 'var(--success)',
      boxShadow: '0 4px 0 0 var(--success-700), inset 0 -2px 0 var(--black-alpha-20), inset 0 2px 0 var(--white-alpha-25)',
    }}>
      <Check style={{ width: 20, height: 20, color: 'var(--white)', strokeWidth: 3 }} />
    </div>
  );
  if (status === 'in-progress') return (
    <div className="flex items-center justify-center shrink-0" style={{
      ...base, background: 'var(--primary)',
      boxShadow: '0 4px 0 0 var(--primary-700), inset 0 -2px 0 var(--black-alpha-20), inset 0 2px 0 var(--white-alpha-25)',
    }}>
      <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--white)' }}>{index}</span>
    </div>
  );
  if (status === 'not-started') return (
    <div className="flex items-center justify-center shrink-0" style={{
      ...base,
      background: 'var(--secondary)',
      border: '2px solid var(--border)',
      boxShadow: '0 3px 0 0 var(--border), inset 0 1px 0 var(--white-alpha-8)',
    }}>
    <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)' }}>{index}</span>
    </div>
  );
  return (
    <div className="flex items-center justify-center shrink-0" style={{ ...base, background: 'var(--muted)', border: '1.5px solid var(--border)', boxShadow: '0 2px 0 0 var(--border)' }}>
      <Lock style={{ width: 18, height: 18, color: 'var(--muted-foreground)', strokeWidth: 2.5 }} />
    </div>
  );
}

/* ─────────── Paywall Bottom Sheet ─────────── */

const CONFETTI_PARTICLES = [
  { x: -90,  y: -110, color: 'var(--primary)',    size: 8,  delay: 0    },
  { x:  90,  y: -110, color: 'var(--warning)',    size: 6,  delay: 0.04 },
  { x: -130, y: -30,  color: 'var(--warning)',    size: 10, delay: 0.08 },
  { x:  130, y: -30,  color: 'var(--primary)',    size: 7,  delay: 0.04 },
  { x: -110, y:  70,  color: 'var(--warning)',    size: 8,  delay: 0.1  },
  { x:  110, y:  70,  color: 'var(--primary)',    size: 6,  delay: 0.06 },
  { x:    0, y: -140, color: 'var(--primary)',    size: 9,  delay: 0.02 },
  { x:  -55, y:  120, color: 'var(--warning)',    size: 7,  delay: 0.12 },
  { x:   55, y:  120, color: 'var(--primary)',    size: 8,  delay: 0.07 },
  { x:  150, y:   10, color: 'var(--warning)',    size: 6,  delay: 0.03 },
  { x: -150, y:   10, color: 'var(--primary)',    size: 9,  delay: 0.05 },
  { x:   35, y: -130, color: 'var(--warning)',    size: 7,  delay: 0.09 },
];

function PaywallSheet({ isOpen, onClose, onUnlock, subjectName }: { isOpen: boolean; onClose: () => void; onUnlock: () => void; subjectName?: string }) {
  const [phase, setPhase] = useState<'idle' | 'processing' | 'success'>('idle');
  const [isLandscape, setIsLandscape] = useState(
    () => window.innerWidth > window.innerHeight && window.innerWidth >= 600
  );

  useEffect(() => {
    if (!isOpen) setPhase('idle');
  }, [isOpen]);

  useEffect(() => {
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 600);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handlePurchase = () => {
    setPhase('processing');
    setTimeout(() => {
      setPhase('success');
      setTimeout(() => onUnlock(), 2400);
    }, 800);
  };

  const examLabel = subjectName ?? 'Exam';
  const features: { label: string; sub: string }[] = [
    { label: `1,200+ ${examLabel} Practice Questions`,  sub: 'Exam-level problems for every topic'       },
    { label: `10 Years of Real ${examLabel} PYQs`,      sub: 'Actual past-year questions, fully solved'  },
    { label: 'Weakness Radar',                          sub: 'Know exactly where to focus next'          },
    { label: 'Progress Tracking',                       sub: 'See your improvement week by week'         },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0"
            style={{ backgroundColor: 'var(--overlay-heavy)', zIndex: 999 }}
            onClick={phase === 'idle' ? onClose : undefined}
          />
          <motion.div
            initial={isLandscape ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            animate={isLandscape ? { opacity: 1, scale: 1 } : { y: 0 }}
            exit={isLandscape ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            transition={isLandscape
              ? { duration: 0.18, ease: 'easeOut' }
              : { type: 'spring', stiffness: 360, damping: 34 }
            }
            className="fixed overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paywall-title"
            style={isLandscape ? {
              top: '50%', left: '50%',
              x: '-50%', y: '-50%',
              width: 'calc(100% - 32px)',
              maxWidth: 480,
              maxHeight: '85vh',
              overflowY: 'auto',
              backgroundColor: 'var(--card)',
              borderRadius: 24,
              boxShadow: '0 -12px 48px var(--black-alpha-50)',
              zIndex: 1000,
            } : {
              bottom: 0, left: 0, right: 0,
              maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
              backgroundColor: 'var(--card)',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              boxShadow: '0 -12px 48px var(--black-alpha-50)',
              zIndex: 1000,
            }}
          >

            <AnimatePresence mode="wait">
              {phase === 'success' ? (

                /* ── Success phase ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative flex flex-col items-center overflow-hidden"
                  style={{
                    padding: '48px 24px 56px',
                  }}
                >
                  {/* Confetti burst — originates from checkmark center */}
                  <div className="relative" style={{ marginBottom: 24 }}>
                    <div className="absolute pointer-events-none" style={{ top: '50%', left: '50%' }}>
                      {CONFETTI_PARTICLES.map((p, i) => (
                        <motion.div
                          key={i}
                          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                          animate={{ x: p.x, y: p.y, opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
                          transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
                          style={{
                            position: 'absolute',
                            width: p.size, height: p.size,
                            borderRadius: '50%',
                            background: p.color,
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      ))}
                    </div>

                    {/* Checkmark circle */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
                      className="flex items-center justify-center"
                      style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'var(--purple-alpha-12)',
                        border: '3px solid var(--purple-500)',
                      }}
                    >
                      <Check style={{ width: 36, height: 36, color: 'var(--purple-400)', strokeWidth: 2.5 }} />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    style={{ textAlign: 'center' }}
                  >
                    <h2 style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', margin: '0 0 8px', lineHeight: 1.2 }}>
                      Payment Successful!
                    </h2>
                    <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', margin: '0 0 20px', lineHeight: 1.5 }}>
                      Full access to <strong style={{ color: 'var(--foreground)' }}>{subjectName ?? 'your course'}</strong> is now unlocked.
                    </p>
                    <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>₹499</div>
                  </motion.div>
                </motion.div>

              ) : (

                /* ── Normal / processing phase ── */
                <motion.div key="paywall" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {/* Close button */}
                  <div className="flex items-center justify-end" style={{ padding: '12px 16px 0' }}>
                    <button
                      onClick={onClose}
                      aria-label="Close"
                      className="flex items-center justify-center cursor-pointer"
                      style={{ width: 32, height: 32, background: 'transparent', border: 'none', padding: 0 }}
                    >
                      <X style={{ width: 24, height: 24, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
                    </button>
                  </div>

                  <div style={{ padding: '0 16px 28px' }}>
                    {/* Heading */}
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <div className="flex justify-center" style={{ marginBottom: 12 }}>
                        <span style={{
                          fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)',
                          color: 'var(--purple-400)', letterSpacing: '0.06em', textTransform: 'uppercase',
                          background: 'var(--purple-alpha-12)', border: '1px solid var(--purple-alpha-20)',
                          borderRadius: 20, padding: '4px 16px',
                        }}>
                          {subjectName ?? 'Full Course'}
                        </span>
                      </div>
                      <h2 id="paywall-title" style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', margin: '0 0 4px', lineHeight: 1.2 }}>
                        Unlock Full Access
                      </h2>
                      <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.4 }}>
                        You've started strong — don't stop now
                      </p>
                    </div>

                    {/* Pricing card */}
                    <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
                      <div style={{
                        background: 'color-mix(in srgb, var(--warning) 10%, var(--card))',
                        padding: '8px 16px', textAlign: 'center',
                        fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--warning)', letterSpacing: '0.02em',
                      }}>
                        Special launch price · 67% off
                      </div>
                      <div style={{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--purple-500) 12%, var(--card)) 0%, var(--card) 100%)', padding: '16px', textAlign: 'center' }}>
                        <div className="inline-flex items-baseline gap-2" style={{ marginBottom: 8 }}>
                          <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', lineHeight: 1 }}>₹499</span>
                          <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', textDecoration: 'line-through' }}>₹1,499</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {['All topics', '3 months', 'Unlimited practice'].map(t => (
                            <span key={t} style={{
                              fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--muted-foreground)', background: 'var(--muted)', borderRadius: 20, padding: '4px 8px',
                              whiteSpace: 'nowrap',
                            }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* "What you unlock" divider */}
                    <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                      <div className="flex-1" style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--purple-500))' }} />
                      <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--purple-400)', letterSpacing: '0.02em' }}>What you unlock</span>
                      <div className="flex-1" style={{ height: 1, background: 'linear-gradient(to left, transparent, var(--purple-500))' }} />
                    </div>

                    {/* Feature rows */}
                    <ul style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 20, background: 'var(--muted)', listStyle: 'none', padding: 0 }}>
                      {features.map((f, i) => (
                        <li key={i}>
                          <div className="flex items-center gap-3" style={{ padding: '16px' }}>
                            <div className="flex items-center justify-center shrink-0" style={{
                              width: 20, height: 20, borderRadius: '50%',
                              background: 'var(--purple-alpha-12)',
                              border: '1px solid var(--purple-500)',
                            }}>
                              <Check style={{ width: 12, height: 12, color: 'var(--purple-400)', strokeWidth: 2.5 }} />
                            </div>
                            <div>
                              <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', lineHeight: 1.3 }}>{f.label}</div>
                              <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginTop: 2, lineHeight: 1.4 }}>{f.sub}</div>
                            </div>
                          </div>
                          {i < features.length - 1 && <div style={{ marginLeft: 48, height: 1, background: 'var(--border)' }} />}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handlePurchase}
                      disabled={phase === 'processing'}
                      className="flex items-center justify-center"
                      style={{
                        width: '100%', height: 44,
                        background: phase === 'processing'
                          ? 'color-mix(in srgb, var(--primary) 70%, var(--card))'
                          : 'var(--primary)',
                        border: 'none', borderRadius: 12, cursor: phase === 'processing' ? 'default' : 'pointer',
                        fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--white)', letterSpacing: '-0.01em',
                        marginBottom: 8,
                        transition: 'background 0.2s',
                      }}
                    >
                      {phase === 'processing' ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            style={{ width: 16, height: 16, border: '2px solid var(--white-alpha-30)', borderTopColor: 'var(--white)', borderRadius: '50%', marginRight: 8 }}
                          />
                          Processing…
                        </>
                      ) : (
                        'Unlock Full Access · ₹499'
                      )}
                    </motion.button>
                    <p style={{ textAlign: 'center', fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', margin: 0 }}>
                      Secure payment · No subscription · Instant access
                    </p>
                  </div>
                </motion.div>

              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────── My Plan Sheet (badge tap, post-purchase) ─────────── */

function PurchaseConfirmSheet({ isOpen, onClose, subjectName }: { isOpen: boolean; onClose: () => void; subjectName?: string }) {
  const [isLandscape, setIsLandscape] = useState(
    () => window.innerWidth > window.innerHeight && window.innerWidth >= 600
  );
  useEffect(() => {
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 600);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const features = [
    { label: '1,200+ Practice Questions',  sub: 'Exam-level problems for every topic'  },
    { label: '10 Years of Real PYQs',      sub: 'Actual past-paper questions, solved'  },
    { label: 'Weakness Radar',             sub: 'Know exactly where you need to focus' },
    { label: 'Progress Tracking',          sub: 'See improvement week over week'       },
  ];
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 cursor-pointer"
            style={{ backgroundColor: 'var(--overlay-heavy)', zIndex: 999 }}
            onClick={onClose}
          />
          <motion.div
            initial={isLandscape ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            animate={isLandscape ? { opacity: 1, scale: 1 } : { y: 0 }}
            exit={isLandscape ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            transition={isLandscape
              ? { duration: 0.18, ease: 'easeOut' }
              : { type: 'spring', stiffness: 360, damping: 34 }
            }
            className="fixed overflow-hidden"
            style={isLandscape ? {
              top: '50%', left: '50%',
              x: '-50%', y: '-50%',
              width: 'calc(100% - 32px)',
              maxWidth: 480,
              maxHeight: '85vh',
              overflowY: 'auto',
              backgroundColor: 'var(--card)',
              borderRadius: 24,
              boxShadow: '0 -12px 48px var(--black-alpha-50)',
              zIndex: 1000,
            } : {
              bottom: 0, left: 0, right: 0,
              backgroundColor: 'var(--card)',
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              boxShadow: '0 -12px 48px var(--black-alpha-50)',
              zIndex: 1000,
            }}
          >
            <div style={{ padding: '20px 16px 36px' }}>

              {/* Header row: title + close */}
              <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', margin: 0, lineHeight: 1.2 }}>
                    My Plan
                  </h2>
                  <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                    {subjectName ?? 'Full Course'} · Pro
                  </p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="flex items-center justify-center cursor-pointer shrink-0"
                  style={{ background: 'none', border: 'none', padding: 4 }}
                >
                  <X style={{ width: 20, height: 20, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
                </button>
              </div>

              {/* Order summary card */}
              <div className="flex justify-between items-center" style={{
                border: '1px solid color-mix(in srgb, var(--border) 50%, transparent)', borderRadius: 12,
                padding: '12px 16px', marginBottom: 20,
                background: 'var(--muted)',
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: 2 }}>Order date</div>
                  <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>{today}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', marginBottom: 2 }}>Amount paid</div>
                  <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>₹499</div>
                </div>
              </div>

              {/* Included features */}
              <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                What's included
              </div>
              <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 0, background: 'var(--muted)' }}>
                {features.map((f, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-3" style={{ padding: '16px' }}>
                      <div className="flex items-center justify-center shrink-0" style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--purple-alpha-12)', border: '1.5px solid var(--purple-500)' }}>
                        <Check style={{ width: 12, height: 12, color: 'var(--purple-400)', strokeWidth: 2.5 }} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: 1.3 }}>{f.label}</div>
                    </div>
                    {i < features.length - 1 && <div style={{ height: 1, background: 'var(--white-alpha-8)' }} />}
                  </div>
                ))}
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────── LiveClassCard (inline in expanded topic) ─────────── */
function LiveClassCard({ session, onTap }: LiveClassCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isLive = session.status === 'live';
  const isRec = session.status === 'recording-available';
  const isSched = session.status === 'scheduled';
  const [, setTick] = useState(0);

  // Tick countdown for scheduled classes within 30 min
  useEffect(() => {
    if (!isSched) return;
    const diff = session.scheduledDate.getTime() - Date.now();
    if (diff > 30 * 60 * 1000) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isSched, session.scheduledDate]);

  const schedTimeLabel = (() => {
    if (!isSched) return '';
    const diff = session.scheduledDate.getTime() - Date.now();
    if (diff <= 0) return 'Starting now';
    const totalSecs = Math.floor(diff / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hours > 0) return `Starts in ${hours}h ${mins}m`;
    return `Starts in ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  })();

  const accent = isLive ? 'var(--green-500)' : isRec ? 'var(--purple-500)' : 'var(--muted-foreground)';
  const accentAlpha = isLive ? 'var(--green-alpha-12)' : isRec ? 'var(--purple-alpha-12)' : 'var(--white-alpha-6)';
  const accentBorder = isLive ? 'var(--green-alpha-30)' : isRec ? 'var(--purple-alpha-25)' : 'var(--border)';
  const cardBg = isLive
    ? (isDark ? 'var(--gradient-success-live)' : 'var(--gradient-success-light)')
    : isRec
      ? (isDark ? 'var(--purple-alpha-6)' : 'var(--purple-alpha-4)')
      : (isDark ? 'var(--white-alpha-4)' : 'var(--black-alpha-2)');

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className="w-full flex items-center gap-2 cursor-pointer"
      style={{
        border: 'none', textAlign: 'left',
        background: cardBg,
        borderTop: `1px solid ${accentBorder}`,
        borderRight: `1px solid ${accentBorder}`,
        borderBottom: `1px solid ${accentBorder}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 12, padding: '12px',
        marginTop: 8,
        minHeight: 64,
        boxShadow: isLive ? `0 0 12px var(--green-alpha-12)` : 'none',
      }}
    >
      {/* Status icon */}
      <div className="flex items-center justify-center shrink-0" style={{
        width: 32, height: 32, borderRadius: 8,
        background: accentAlpha, border: `1px solid ${accentBorder}`,
      }}>
        {isLive && (
          <motion.div
            animate={{ opacity: [1, 0.25, 1], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green-500)' }}
          />
        )}
        {isRec && <Play style={{ width: 13, height: 13, color: 'var(--purple-500)', strokeWidth: 2.5, marginLeft: 1 }} />}
        {isSched && <Calendar style={{ width: 13, height: 13, color: 'var(--muted-foreground)', strokeWidth: 2 }} />}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', letterSpacing: 0.6, textTransform: 'uppercase', color: accent, marginBottom: 2 }}>
          {isLive ? 'Live Now' : isRec ? 'Recording' : 'Scheduled'}
          {session.rescheduled && <span style={{ marginLeft: 5, color: 'var(--warning-500)' }}>· Rescheduled</span>}
        </div>
        <div style={{
          fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)', lineHeight: 1.3, marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {session.lessonTitle}
        </div>
        <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
          {isLive && `Today · ${fmtLCTime(session.scheduledDate)} · ${session.enrolledCount} enrolled`}
          {isRec && `Recording ready · ${session.durationMinutes} min`}
          {isSched && schedTimeLabel}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', flexShrink: 0, padding: '6px 11px', borderRadius: 8,
        background: isLive ? 'var(--green-500)' : isRec ? 'var(--purple-alpha-15)' : 'var(--white-alpha-8)',
        color: isLive ? 'var(--white)' : isRec ? 'var(--purple-500)' : 'var(--muted-foreground)',
        border: isLive ? 'none' : `1px solid ${isRec ? 'var(--purple-alpha-30)' : 'var(--border)'}`,
        boxShadow: isLive ? '0 2px 8px var(--green-alpha-30)' : 'none',
        whiteSpace: 'nowrap',
      }}>
        {isLive ? 'Join Now' : isRec ? 'Watch' : 'View Details'}
      </div>
    </motion.button>
  );
}

/** Quick Learn inner view with tabs */

function ExpandedContent({ topicTitle, topicStatus, liveClass, onLiveClassTap }: ExpandedContentProps) {
  const navigate = useNavigate();
  const isRecorded = liveClass?.status === 'recording-available';

  const handleAction = (id: string) => {
    if (id === 'live-class') {
      onLiveClassTap?.();
    } else if (id === 'pyqs') {
      navigate(`/practice/pyq?topic=${encodeURIComponent(topicTitle || '')}`);
    } else if (id === 'analytics') {
      navigate(`/learning-path/topic-analytics?topic=${encodeURIComponent(topicTitle || '')}`);
    }
  };

  const isTopicCompleted = topicStatus === 'completed';
  const isLive = liveClass?.status === 'live';
  const actions = TOP_ACTIONS.map(item => {
    if (item.id === 'live-class') {
      if (isRecorded) return { ...item, label: 'Recording', done: true, highlight: false, upcoming: false };
      if (isLive) return { ...item, highlight: true, done: false, upcoming: false };
      return { ...item, label: 'Upcoming', highlight: false, done: false, upcoming: true };
    }
    if (item.id === 'practice') {
      // Done badge when topic completed; highlighted as next step after recording
      return { ...item, highlight: isRecorded && !isTopicCompleted, done: isTopicCompleted };
    }
    if (item.id === 'pyqs') {
      // Done badge when topic completed
      return { ...item, done: isTopicCompleted, highlight: false };
    }
    // analytics: never done, never highlighted — always just available
    return { ...item, done: false, highlight: false };
  });

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
      className="overflow-hidden"
    >
      <div className="overflow-visible" style={{ paddingTop: 4, paddingBottom: 4 }}>
        <div className="overflow-visible" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 8px' }}>
          {actions.map((item, i) => (
            <div key={item.id} onClick={() => handleAction(item.id)} className="cursor-pointer overflow-visible">
              <GridIcon item={item} index={i} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TopicRow({ topic, index, isExpanded, onToggle, isLast, liveClass, onLiveClassTap, onLockedTap }: TopicRowProps) {
  const isLocked = topic.status === 'locked';
  const lineColor = topic.status === 'completed' ? 'var(--success-600)' : topic.status === 'in-progress' ? 'var(--primary)' : 'var(--border)';

  const handleTap = isLocked ? onLockedTap : onToggle;

  return (
    <div className="flex gap-3">
      {/* Left: circle + dotted line */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 44 }}>
        <div style={{ opacity: isLocked ? 0.5 : 1 }}>
          <StatusCircle status={topic.status} index={index} />
        </div>
        {!isLast && (
          <div style={{
            flex: 1, width: 2, minHeight: 20,
            backgroundImage: `repeating-linear-gradient(to bottom, ${lineColor} 0px, ${lineColor} 4px, transparent 4px, transparent 10px)`,
            marginTop: 6,
          }} />
        )}
      </div>

      {/* Right: content */}
      <div className="flex-1 min-w-0" style={{ paddingBottom: isLast ? 0 : 12 }}>
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={handleTap}
          aria-label={topic.title}
          aria-expanded={!isLocked && isExpanded}
          className="w-full flex items-center gap-2 cursor-pointer"
          style={{
            padding: '12px 0', border: 'none', background: 'none',
            textAlign: 'left', transition: 'all 0.15s ease',
          }}
        >
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-1">
              <div style={{
                fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)',
                color: isLocked ? 'var(--muted-foreground)' : 'var(--foreground)', lineHeight: '1.3',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{topic.title}</div>
              {isLocked && (
                <Lock style={{ width: 13, height: 13, color: 'var(--border)', strokeWidth: 2.5, flexShrink: 0 }} />
              )}
            </div>

          </div>

          {/* Mastery pill — between content and chevron */}
          {!isLocked && topic.progress > 0 && (() => {
            const isStrong = topic.progress >= 80;
            const isOk = topic.progress >= 50;
            const label = isStrong ? 'Strong' : isOk ? 'Revise' : 'Weak';
            const color = isStrong ? 'var(--success)' : isOk ? 'var(--warning)' : 'var(--error)';
            const bg = isStrong
              ? 'color-mix(in srgb, var(--success) 14%, transparent)'
              : isOk
              ? 'color-mix(in srgb, var(--warning) 14%, transparent)'
              : 'color-mix(in srgb, var(--error) 14%, transparent)';
            return (
              <span style={{
                fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color, backgroundColor: bg,
                padding: '2px 6px', borderRadius: 8,
                lineHeight: '1.4', letterSpacing: '0.01em', flexShrink: 0,
              }}>
                {label}
              </span>
            );
          })()}

          <motion.div
            animate={{ rotate: !isLocked && isExpanded ? 180 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="shrink-0"
          >
            <ChevronDown style={{
              width: 18, height: 18, strokeWidth: 2,
              color: 'var(--muted-foreground)',
            }} />
          </motion.div>
        </motion.button>

        <AnimatePresence initial={false}>
          {isExpanded && !isLocked && (
            <ExpandedContent topicTitle={topic.title} topicStatus={topic.status} liveClass={liveClass} onLiveClassTap={onLiveClassTap} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────── Live Class Detail Sheet ─────────── */

function LiveClassDetailSheet({
  session,
  isOpen,
  onClose,
  onReschedule,
  onJoin,
}: LiveClassDetailSheetProps) {
  const [isLandscape, setIsLandscape] = useState(
    () => window.innerWidth > window.innerHeight && window.innerWidth >= 600
  );
  useEffect(() => {
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 600);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (!session) return null;

  const isLive = session.status === 'live';
  const isScheduled = session.status === 'scheduled';

  // Days until class (for upcoming tag)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const classDay = new Date(session.scheduledDate); classDay.setHours(0, 0, 0, 0);
  const daysAway = Math.round((classDay.getTime() - today.getTime()) / 86400000);

  const stateColor = isLive ? 'var(--warning)' : 'var(--muted-foreground)';
  const stateLabel = isLive ? 'Live' : isScheduled ? 'Upcoming' : 'Recorded';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0"
            style={{ backgroundColor: 'var(--overlay-heavy)', zIndex: 200 }}
          />
          <motion.div
            initial={isLandscape ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            animate={isLandscape ? { opacity: 1, scale: 1 } : { y: 0 }}
            exit={isLandscape ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            transition={isLandscape
              ? { duration: 0.18, ease: 'easeOut' }
              : { type: 'spring', stiffness: 380, damping: 36 }
            }
            className="fixed"
            style={isLandscape ? {
              top: '50%', left: '50%',
              x: '-50%', y: '-50%',
              width: 'calc(100% - 32px)',
              maxWidth: 480,
              maxHeight: '85vh',
              overflowY: 'auto',
              backgroundColor: 'var(--card)',
              borderRadius: 20,
              padding: '20px 20px 36px',
              zIndex: 201,
              boxShadow: '0 -8px 40px var(--black-alpha-40)',
            } : {
              bottom: 0, left: 0, right: 0,
              backgroundColor: 'var(--card)',
              borderRadius: '20px 20px 0 0',
              padding: '20px 20px 36px',
              zIndex: 201,
              boxShadow: '0 -8px 40px var(--black-alpha-40)',
            }}
          >

            {/* Header — state badge + topic title + chapter + close */}
            <div className="flex items-start justify-between" style={{ marginBottom: 16 }}>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1" style={{
                  backgroundColor: isLive ? 'color-mix(in srgb, var(--warning) 15%, transparent)' : 'var(--white-alpha-6)',
                  border: `1px solid ${isLive ? 'color-mix(in srgb, var(--warning) 35%, transparent)' : 'var(--border)'}`,
                  borderRadius: 999, padding: '4px 8px', marginBottom: 8,
                }}>
                  {isLive ? (
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: stateColor }}
                    />
                  ) : (
                    <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: stateColor }} />
                  )}
                  <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', color: stateColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {stateLabel}
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', margin: '0 0 4px' }}>
                  {session.lessonTitle}
                </h2>
                <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 'var(--font-weight-semibold)', margin: 0 }}>
                  {session.chapterTitle}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center cursor-pointer shrink-0"
                style={{ background: 'var(--secondary)', border: 'none', borderRadius: 999, width: 32, height: 32, marginLeft: 12 }}
              >
                <ChevronDown style={{ width: 16, height: 16, color: 'var(--muted-foreground)', strokeWidth: 2.5 }} />
              </motion.button>
            </div>

            {/* Upcoming tag (scheduled only) */}
            {isScheduled && daysAway > 0 && (
              <div className="inline-flex items-center gap-2" style={{ padding: '4px 12px', borderRadius: 20, backgroundColor: 'var(--primary-alpha-12)', border: '1px solid var(--primary-alpha-30)', marginBottom: 12 }}>
                <Calendar style={{ width: 12, height: 12, color: 'var(--primary)' }} />
                <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--primary)', letterSpacing: '0.04em' }}>
                  UPCOMING IN {daysAway} DAY{daysAway !== 1 ? 'S' : ''}
                </span>
              </div>
            )}

            {/* Date + Time grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)', marginBottom: 6 }}>DATE</div>
                <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>{fmtLCDate(session.scheduledDate)}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)', marginBottom: 6 }}>TIME</div>
                <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>{fmtLCTime(session.scheduledDate)}</div>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-2" style={{ padding: '12px', backgroundColor: 'var(--secondary)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20 }}>
              <Clock style={{ width: 16, height: 16, color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-medium)', marginBottom: 2 }}>DURATION</div>
                <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)' }}>{session.durationMinutes} minutes</div>
              </div>
            </div>

            {/* Join button (live only) */}
            {isLive && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={onJoin} className="w-full flex items-center justify-center gap-2 cursor-pointer" style={{
                padding: '14px', borderRadius: 12, border: 'none',
                backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)',
                fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)',
                marginBottom: 10, boxShadow: 'var(--glow-primary)',
              }}>
                <Video style={{ width: 16, height: 16, strokeWidth: 2.5 }} /> Join Live Class
              </motion.button>
            )}

            {/* Reschedule (live or scheduled) */}
            {(isLive || isScheduled) && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={onReschedule} className="w-full flex items-center justify-center gap-2 cursor-pointer" style={{
                padding: '12px', borderRadius: 12, border: '1.5px solid var(--border)',
                backgroundColor: 'transparent', color: 'var(--foreground)',
                fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)',
              }}>
                <RefreshCw style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                Reschedule Class
              </motion.button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────── Reschedule Sheet ─────────── */

function RescheduleSheet({
  session,
  allSessions,
  isOpen,
  onClose,
  onConfirm,
}: RescheduleSheetProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);

  const slots = useMemo(() => {
    if (!session) return [];
    return getAvailableRescheduleSlots(session, allSessions);
  }, [session, allSessions]);

  // Group by day label
  const grouped = useMemo(() => {
    const map: Record<string, Date[]> = {};
    for (const slot of slots) {
      const key = fmtLCDate(slot);
      if (!map[key]) map[key] = [];
      map[key].push(slot);
    }
    return Object.entries(map);
  }, [slots]);

  // Auto-select first day when sheet opens
  useEffect(() => {
    if (isOpen && grouped.length > 0 && !selectedDay) {
      setSelectedDay(grouped[0][0]);
    }
    if (!isOpen) {
      setSelectedDay(null);
      setSelectedSlot(null);
    }
  }, [isOpen, grouped]);

  const activeSlots = useMemo(
    () => grouped.find(([label]) => label === selectedDay)?.[1] ?? [],
    [grouped, selectedDay]
  );

  // When day changes, clear slot selection
  const handleDaySelect = (label: string) => {
    setSelectedDay(label);
    setSelectedSlot(null);
  };

  const handleConfirm = () => {
    if (!session || !selectedSlot) return;
    onConfirm(session, selectedSlot);
    setSelectedSlot(null);
  };

  if (!session) return null;

  const fmtSlotRange = (start: Date) => {
    const end = new Date(start.getTime() + session.durationMinutes * 60 * 1000);
    return `${fmtLCTime(start)} – ${fmtLCTime(end)}`;
  };

  const triggerStyle = (hasValue: boolean, disabled = false): React.CSSProperties => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: 'var(--secondary)',
    border: `1.5px solid ${hasValue ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-family-inter)',
    fontSize: 'var(--text-sm)',
    fontWeight: hasValue ? 600 : 400,
    color: hasValue ? 'var(--foreground)' : 'var(--muted-foreground)',
    opacity: disabled ? 0.45 : 1,
    outline: 'none',
    background: 'var(--secondary)',
  });

  const dropdownListStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 50,
    boxShadow: '0 8px 32px var(--black-alpha-40)',
  };

  const optionStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '12px 14px',
    fontFamily: 'var(--font-family-inter)',
    fontSize: 'var(--text-sm)',
    fontWeight: isSelected ? 700 : 400,
    color: isSelected ? 'var(--primary)' : 'var(--foreground)',
    backgroundColor: isSelected ? 'var(--primary-alpha-10)' : 'transparent',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  });

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Reschedule Class">
      <div style={{ padding: '16px 16px 28px' }}>
        {/* Subtitle */}
        <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)', marginBottom: 24 }}>
          Pick a new day and time for{' '}
          <strong style={{ color: 'var(--foreground)' }}>{session.lessonTitle}</strong>
        </div>

        {/* Date dropdown */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Select Date
          </div>
          <div className="relative">
            <button
              onClick={() => { setDateOpen(p => !p); setSlotOpen(false); }}
              aria-label="Select date"
              aria-expanded={dateOpen}
              aria-haspopup="listbox"
              style={triggerStyle(!!selectedDay)}
            >
              <span>{selectedDay ?? 'Choose a date…'}</span>
              <motion.div animate={{ rotate: dateOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                <ChevronDown style={{ width: 16, height: 16, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
              </motion.div>
            </button>
            <AnimatePresence>
              {dateOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{ ...dropdownListStyle, transformOrigin: 'top' }}
                >
                  {grouped.map(([dayLabel]) => (
                    <div
                      key={dayLabel}
                      role="option"
                      aria-selected={selectedDay === dayLabel}
                      onClick={() => { handleDaySelect(dayLabel); setDateOpen(false); }}
                      style={optionStyle(selectedDay === dayLabel)}
                    >
                      <span>{dayLabel}</span>
                      {selectedDay === dayLabel && (
                        <Check style={{ width: 14, height: 14, color: 'var(--primary)', strokeWidth: 2.5 }} />
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Time slot dropdown */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            Select Time Slot
          </div>
          <div className="relative">
            <button
              onClick={() => { if (selectedDay) { setSlotOpen(p => !p); setDateOpen(false); } }}
              aria-label="Select time slot"
              aria-expanded={slotOpen}
              aria-haspopup="listbox"
              style={triggerStyle(!!selectedSlot, !selectedDay)}
            >
              <span>{selectedSlot ? fmtSlotRange(selectedSlot) : (selectedDay ? 'Choose a time slot…' : 'Select a date first')}</span>
              <motion.div animate={{ rotate: slotOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
                <ChevronDown style={{ width: 16, height: 16, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
              </motion.div>
            </button>
            <AnimatePresence>
              {slotOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{ ...dropdownListStyle, transformOrigin: 'top' }}
                >
                  {activeSlots.map((slot, i) => {
                    const isSelected = selectedSlot?.getTime() === slot.getTime();
                    return (
                      <div
                        key={i}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => { setSelectedSlot(slot); setSlotOpen(false); }}
                        style={optionStyle(isSelected)}
                      >
                        <span>{fmtSlotRange(slot)}</span>
                        {isSelected && (
                          <Check style={{ width: 14, height: 14, color: 'var(--primary)', strokeWidth: 2.5 }} />
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConfirm}
          disabled={!selectedSlot}
          style={{
            width: '100%', padding: '16px', borderRadius: 12, border: 'none',
            cursor: selectedSlot ? 'pointer' : 'not-allowed',
            backgroundColor: selectedSlot ? 'var(--primary)' : 'var(--secondary)',
            color: selectedSlot ? 'var(--white)' : 'var(--muted-foreground)',
            fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)',
            opacity: selectedSlot ? 1 : 0.5,
            transition: 'opacity 0.2s, background-color 0.2s',
          }}
        >
          Confirm Reschedule
        </motion.button>
      </div>
    </BottomSheet>
  );
}

/* ─────────── Main Component ─────────── */

export function LearningPathScreen() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const initialSubject = searchParams.get('subject') || 'verbal';
  const initialExam = searchParams.get('exam') || null;

  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject);
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [showExamSelector, setShowExamSelector] = useState(false);
  const [showSubjectSelector, setShowSubjectSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showJumpNavigator, setShowJumpNavigator] = useState(false);
  const [userExams, setUserExams] = useState<string[]>(['cat']);
  const [currentExamId, setCurrentExamId] = useState<string>(initialExam || 'cat');
  const [currentSubjectId, setCurrentSubjectId] = useState<string>(initialSubject);
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const hasAutoExpanded = useRef(false);
  const [showConfetti, setShowConfetti] = useState(() =>
    new URLSearchParams(window.location.search).get('celebrate') === '1'
  );
  const [liveClasses, setLiveClasses] = useState<LiveClassSession[]>([]);
  const [selectedLiveClass, setSelectedLiveClass] = useState<LiveClassSession | null>(null);
  const [showLiveDetail, setShowLiveDetail] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);


  // TODO: Replace ?celebrate=1 URL param with a server-driven trigger (e.g. onboarding completion flag from user session)
  // Celebration on arrival from onboarding flow
  useEffect(() => {
    if (!showConfetti) return;
    // TODO: Replace AudioContext chime with a proper sound asset (e.g. /public/sounds/success.mp3)
    // Play 3-note chime
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const play = (freq: number, start: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + 0.4);
        osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + 0.5);
      };
      const t = setTimeout(() => { play(523.25, 0); play(659.25, 0.15); play(783.99, 0.3); }, 300);
      return () => clearTimeout(t);
    } catch {}
  }, [showConfetti]);

  useEffect(() => {
    if (!showConfetti) return;
    const t = setTimeout(() => setShowConfetti(false), 2800);
    return () => clearTimeout(t);
  }, [showConfetti]);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedExams = localStorage.getItem('user-exams');
      let exams: string[] = ['cat'];
      if (savedExams) {
        const parsed = JSON.parse(savedExams);
        if (Array.isArray(parsed) && parsed.length > 0) exams = parsed;
      }
      setUserExams(exams);

      const savedExam = localStorage.getItem('selected-exam');
      if (savedExam && exams.includes(savedExam)) {
        setCurrentExamId(savedExam);
      } else {
        setCurrentExamId(exams[0]);
        localStorage.setItem('selected-exam', exams[0]);
      }

      const savedLanguage = localStorage.getItem('selected-language');
      if (savedLanguage) setCurrentLanguage(savedLanguage);

      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  }, []);

  // Update subject when exam changes
  useEffect(() => {
    const examConfig = getExamConfig(currentExamId);
    if (examConfig && examConfig.subjects.length > 0) {
      const subjectExists = examConfig.subjects.find(s => s.id === currentSubjectId);
      if (!subjectExists) setCurrentSubjectId(examConfig.subjects[0].id);
    }
  }, [currentExamId, currentSubjectId]);

  // Stash current courseId so live-class / recording-player can attribute
  // their class-exit signal to the right course when recording exits.
  useEffect(() => {
    setCurrentCourseId(currentExamId);
  }, [currentExamId]);

  const examConfig = getExamConfig(currentExamId);
  const currentSubject = examConfig?.subjects.find(s => s.id === currentSubjectId);
  const currentLang = examConfig?.languages.find(l => l.code === currentLanguage);
  const supportsMultipleLanguages = examConfig ? examConfig.languages.length > 1 : false;

  // Generate units (same as v1 for section header)
  const generateUnits = (): Unit[] => {
    if (!examConfig || !currentSubjectId) return [];
    const chapters = getExamChapters(currentExamId, currentSubjectId);

    // Freemium access: ch1 fully unlocked, ch2 first topic only, ch3+ fully locked
    // After purchase: everything unlocked
    const getLessonStatus = (chIdx: number, topicIdx: number): Lesson['status'] => {
      if (isPurchased) {
        if (chIdx === 0) {
          if (topicIdx < 2) return 'completed';
          if (topicIdx < 4) return 'in-progress';
          return 'not-started';
        }
        return 'not-started';
      }
      if (chIdx === 0) {
        if (topicIdx < 2) return 'completed';
        if (topicIdx < 4) return 'in-progress';
        return 'not-started';
      }
      if (chIdx === 1) return topicIdx === 0 ? 'not-started' : 'locked';
      return 'locked';
    };

    return chapters.map((chapter, index) => {
      const topicNames = getChapterTopics(chapter.id);
      const lessons: Lesson[] = [
        { id: `${chapter.id}-1`, title: topicNames[0], subtitle: 'Foundation concepts', status: getLessonStatus(index, 0), xp: 50, size: 'medium', prepScore: index === 0 ? mockPrepScores['lesson-1-1'] : undefined },
        { id: `${chapter.id}-2`, title: topicNames[1], subtitle: 'Build understanding', status: getLessonStatus(index, 1), xp: 50, size: 'medium', prepScore: index === 0 ? mockPrepScores['lesson-1-2'] : undefined },
        { id: `${chapter.id}-3`, title: topicNames[2], subtitle: 'Core applications', status: getLessonStatus(index, 2), size: 'medium', prepScore: index === 0 ? mockPrepScores['lesson-1-4'] : undefined },
        { id: `${chapter.id}-4`, title: topicNames[3], subtitle: 'Advanced problems', status: getLessonStatus(index, 3), size: 'medium' },
        { id: `${chapter.id}-5`, title: topicNames[4], subtitle: 'Exam-level practice', status: getLessonStatus(index, 4), size: 'medium' },
        { id: `${chapter.id}-test`, title: `${chapter.title} Test`, subtitle: 'Chapter assessment', status: getLessonStatus(index, 5), isTest: true, size: 'large' },
      ];
      return {
        id: chapter.id, number: index + 1, sectionNumber: Math.floor(index / 3) + 1,
        title: chapter.title, description: chapter.description,
        subjectColor: currentSubject?.color || 'var(--physics)', lessons, progress: index === 0 ? '3/6' : index === 1 ? '1/6' : '0/6',
      };
    });
  };

  const units = generateUnits();
  const currentUnit = units[currentUnitIndex] || units[0];
  const chapterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Track which chapter is in view using IntersectionObserver
  useEffect(() => {
    if (units.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = units.findIndex(u => u.id === entry.target.getAttribute('data-unit-id'));
            if (idx !== -1) setCurrentUnitIndex(idx);
          }
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    );
    Object.values(chapterRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [units]);

  // TODO: Replace with API-derived prep score per chapter (weighted by topic difficulty)
  const calculateChapterPrepScore = (unit: Unit): number | undefined => {
    const practicedLessons = unit.lessons.filter(l => l.prepScore !== undefined && !l.isTest);
    if (practicedLessons.length === 0) return undefined;
    return Math.round(practicedLessons.reduce((sum, l) => sum + (l.prepScore || 0), 0) / practicedLessons.length);
  };
  const currentChapterPrepScore = currentUnit ? calculateChapterPrepScore(currentUnit) : undefined;

  // Build topic data for accordion
  const topics: TopicData[] = useMemo(() => {
    if (!examConfig || !currentSubjectId) return [];
    const chapters = getExamChapters(currentExamId, currentSubjectId);
    return chapters.map((ch, i) => {
      if (i === 0) return { id: ch.id, title: ch.title, description: ch.description, status: 'completed' as const, progress: 92, stars: 3 };
      if (i === 1) return { id: ch.id, title: ch.title, description: ch.description, status: 'completed' as const, progress: 78, stars: 2 };
      if (i === 2) return { id: ch.id, title: ch.title, description: ch.description, status: 'in-progress' as const, progress: 45, stars: 1 };
      return { id: ch.id, title: ch.title, description: ch.description, status: 'locked' as const, progress: 0, stars: 0 };
    });
  }, [examConfig, currentExamId, currentSubjectId]);

  // Build live lesson list (non-test lessons) for schedule generation
  const liveLessons = useMemo(() => {
    if (!examConfig) return [];
    const chapters = getExamChapters(currentExamId, currentSubjectId);
    const result: Array<{ id: string; title: string; chapterTitle: string }> = [];
    chapters.forEach(ch => {
      getChapterTopics(ch.id).forEach((title, j) => {
        result.push({ id: `${ch.id}-${j + 1}`, title, chapterTitle: ch.title });
      });
    });
    return result;
  }, [examConfig, currentExamId, currentSubjectId]);

  useEffect(() => {
    if (liveLessons.length > 0) setLiveClasses(generateLiveSchedule(liveLessons));
  }, [liveLessons]);

  const liveClassMap = useMemo<Record<string, LiveClassSession>>(() =>
    Object.fromEntries(liveClasses.map(lc => [lc.lessonId, lc]))
  , [liveClasses]);

  // TODO: Call reschedule API endpoint with session.id + newDate; update local state on success
  const handleReschedule = (session: LiveClassSession, newDate: Date) => {
    setLiveClasses(prev => prev.map(lc =>
      lc.id === session.id
        ? { ...lc, scheduledDate: newDate, status: computeLiveStatus(newDate, lc.durationMinutes), rescheduled: true }
        : lc
    ));
    setShowReschedule(false);
    setShowLiveDetail(false);
  };

  // Auto-expand the current in-progress topic (or first non-locked) — runs once
  useEffect(() => {
    if (hasAutoExpanded.current || units.length === 0) return;
    hasAutoExpanded.current = true;
    for (const unit of units) {
      const inProgress = unit.lessons.find(l => l.status === 'in-progress');
      if (inProgress) { setExpandedTopicId(inProgress.id); return; }
    }
    // Fallback: first available lesson
    for (const unit of units) {
      const available = unit.lessons.find(l => l.status !== 'locked');
      if (available) { setExpandedTopicId(available.id); return; }
    }
  }, [units]);

  const exams = SHOWN_EXAM_IDS
    .map(id => EXAM_CONFIGS[id])
    .filter(Boolean)
    .map(config => ({ id: config.id, name: config.name }));

  const handleExamChange = (examId: string) => {
    setCurrentExamId(examId);
    localStorage.setItem('selected-exam', examId);
    setShowExamSelector(false);
    setExpandedTopicId(null);
  };

  const handleSubjectChange = (subjectId: string) => {
    setCurrentSubjectId(subjectId);
    setShowSubjectSelector(false);
    setCurrentUnitIndex(0);
    setExpandedTopicId(null);
  };

  const handleLanguageChange = (langCode: string) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('selected-language', langCode);
    setShowLanguageSelector(false);
  };

  if (isLoading || !examConfig) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)', fontFamily: 'var(--font-family-inter)' }}>
        <div style={{ fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col" style={{ height: '100dvh', backgroundColor: 'var(--background)', overflow: 'hidden' }}>
      {/* ── Celebration confetti overlay ── */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            key="confetti"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: 9999 }}
          >
            {[...Array(30)].map((_, i) => (
              <motion.div key={i}
                initial={{ x: `${30 + Math.random() * 40}vw`, y: '60vh', scale: 0, rotate: 0 }}
                animate={{ x: `${Math.random() * 100}vw`, y: '-20vh', scale: [0, 1, 0.8], rotate: Math.random() * 360, opacity: [0, 1, 0] }}
                transition={{ duration: 1.8 + Math.random() * 0.8, delay: Math.random() * 0.4, ease: 'easeOut' }}
                style={{
                  position: 'absolute', width: 8, height: 8,
                  borderRadius: i % 3 === 0 ? '50%' : 0,
                  backgroundColor: ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--error)', 'var(--info)'][i % 5],
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── Fixed Header ── */}
      <div style={{
        flexShrink: 0, zIndex: 50,
        backgroundColor: 'var(--card)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)',
      }}>
        <StatusBar />
        <div className="flex items-center justify-between gap-2" style={{
          minHeight: 52, padding: '8px 16px', maxWidth: 1280, margin: '0 auto',
        }}>
          {/* Left: back button + subject + exam */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => navigate(-1)}
              className="flex items-center justify-center shrink-0"
              aria-label="Go back"
              style={{ width: 44, height: 44, margin: -8, borderRadius: 8, border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
            >
              <ArrowLeft style={{ width: 20, height: 20, color: 'var(--foreground)', strokeWidth: 2 }} />
            </motion.button>
            <div className="flex flex-col min-w-0" style={{ gap: 2 }}>
              <span className="truncate" style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                {currentSubject?.name || 'Subject'}
              </span>
              <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', color: 'var(--muted-foreground)' }}>
                {examConfig?.name || 'Exam'}
              </span>
            </div>
          </div>

          {/* Right: 3-dot course overflow menu — About / Feedback / Share.
              Replaces the standalone review icon. Also still hosts the
              review auto-rise carried over from RateThisCourseBanner. */}
          <div className="shrink-0">
            <CourseOverflowMenu
              courseId={currentExamId}
              courseTitle={examConfig?.name ?? currentExamId.toUpperCase()}
              productKind="test-prep"
              aboutHref={`/marketplace/product/${currentExamId}?enrolled=1`}
              certificate={{
                courseId: currentExamId,
                subjects: (examConfig?.subjects ?? []).map((s) => ({ id: s.id, name: s.name })),
                completedSubjectIds: getCompletedSubjectIds(currentExamId),
              }}
            />
          </div>

        </div>
      </div>

      {/* ── Main Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto">
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '12px 20px 120px' }}>
        {/* Next Live Class */}
        <motion.div initial={{ opacity: 1, y: 0 }} style={{ marginBottom: 12 }}>
          <NextLiveClassCard classes={[
            {
              topic: units[0]?.lessons?.[0]?.title || 'Percentages & Applications',
              subject: currentSubject?.name || 'Quantitative Aptitude',
              subjectColor: currentSubject?.color || 'var(--primary)',
              scheduledTime: new Date(Date.now() + 2 * 60 * 1000),
              durationMinutes: 60,

            },
            {
              topic: units[0]?.lessons?.[1]?.title || 'Profit, Loss & Discount',
              subject: currentSubject?.name || 'Quantitative Aptitude',
              subjectColor: currentSubject?.color || 'var(--primary)',
              scheduledTime: new Date(Date.now() + 18 * 60 * 1000),
              durationMinutes: 90,

            },
            {
              topic: units[0]?.lessons?.[2]?.title || 'Ratio, Proportion & Mixtures',
              subject: currentSubject?.name || 'Quantitative Aptitude',
              subjectColor: currentSubject?.color || 'var(--primary)',
              scheduledTime: new Date(Date.now() + 180 * 60 * 1000),
              durationMinutes: 60,

            },
          ]} />
        </motion.div>

        {/* Sticky Section Header */}
        {currentUnit && (
          <div style={{ position: 'sticky', top: 8, zIndex: 30, marginBottom: 16 }}>
            <StickySectionHeader
              unitNumber={currentUnit.number}
              title={currentUnit.title}
              totalTopics={currentUnit.lessons.length}
              onJumpClick={() => setShowJumpNavigator(true)}
            />
          </div>
        )}

        {/* ── V2: Chapter-grouped topic list ── */}
        {units.length > 0 ? (
          <div className="w-full">
            {units.map((unit, unitIndex) => {
              // Build topic data for each lesson in this unit
              const IMPORTANCE_TAGS: Record<string, Record<number, 'High weightage' | 'Frequently asked'>> = {
                '0': { 1: 'High weightage', 3: 'Frequently asked' },
                '1': { 0: 'High weightage', 2: 'Frequently asked' },
                '2': { 1: 'Frequently asked', 4: 'High weightage' },
                '3': { 0: 'High weightage' },
              };
              const unitTopics: TopicData[] = unit.lessons.map((lesson, lessonIdx) => ({
                id: lesson.id,
                title: lesson.title,
                description: lesson.subtitle,
                status: (lesson.status === 'completed' ? 'completed' : lesson.status === 'in-progress' || lesson.status === 'available' ? 'in-progress' : lesson.status === 'not-started' ? 'not-started' : 'locked') as TopicStatus,
                progress: lesson.prepScore || 0,
                stars: lesson.prepScore ? (lesson.prepScore >= 85 ? 3 : lesson.prepScore >= 60 ? 2 : 1) : 0,
                importanceTag: IMPORTANCE_TAGS[String(unitIndex)]?.[lessonIdx],
              }));

              return (
                <div
                  key={unit.id}
                  data-unit-id={unit.id}
                  ref={(el) => { chapterRefs.current[unit.id] = el; }}
                >
                  {/* Chapter divider — skip for first chapter since sticky header shows it */}
                  {unitIndex > 0 && (
                    <div className="flex items-center gap-4" style={{ padding: '32px 0 20px' }}>
                      <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--border)' }} />
                      <span style={{
                        fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--muted-foreground)', whiteSpace: 'nowrap',
                      }}>{unit.title}</span>
                      <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--border)' }} />
                    </div>
                  )}

                  {/* Topics under this chapter */}
                  {unitTopics.map((topic, topicIndex) => {
                    const isLastInUnit = topicIndex === unitTopics.length - 1;
                    const isLastOverall = unitIndex === units.length - 1 && isLastInUnit;
                    return (
                      <TopicRow
                        key={topic.id}
                        topic={topic}
                        index={topicIndex + 1}
                        isExpanded={expandedTopicId === topic.id}
                        onToggle={() => setExpandedTopicId(prev => prev === topic.id ? null : topic.id)}
                        isLast={isLastInUnit}
                        liveClass={liveClassMap[topic.id]}
                        onLiveClassTap={() => {
                          const lc = liveClassMap[topic.id];
                          if (lc) {
                            if (lc.status === 'recording-available') {
                              navigate(`/recording?topic=${encodeURIComponent(lc.lessonTitle)}`);
                            } else {
                              setSelectedLiveClass(lc);
                              setShowLiveDetail(true);
                            }
                          }
                        }}
                        onLockedTap={() => setShowPaywall(true)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
            No chapters available for this subject
          </div>
        )}
      </div>
      </div>

      {/* ── Bottom Sheets (identical to V1) ── */}
      <BottomSheet isOpen={showExamSelector} onClose={() => setShowExamSelector(false)} title="Select Exam">
        <div style={{ padding: '16px' }}>
          {exams.map((exam: any) => {
            const isSelected = currentExamId === exam.id;
            return (
              <motion.button key={exam.id} whileTap={{ scale: 0.98 }} onClick={() => handleExamChange(exam.id)} className="w-full flex items-center gap-3 cursor-pointer" style={{
                padding: '14px 16px', marginBottom: 8,
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--secondary)',
                border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)',
                color: isSelected ? 'var(--white)' : 'var(--foreground)', textAlign: 'left',
              }}>
                {(() => {
                  const entry = EXAM_ICON_MAP[exam.id];
                  if (!entry) return null;
                  const { Icon, color } = entry;
                  return (
                    <div className="flex items-center justify-center shrink-0" style={{
                      width: 36, height: 36, borderRadius: 8,
                      backgroundColor: isSelected ? 'var(--white-alpha-20)' : `color-mix(in srgb, ${color} 13%, transparent)`,
                      border: `1px solid ${isSelected ? 'var(--white-alpha-30)' : `color-mix(in srgb, ${color} 27%, transparent)`}`,
                    }}>
                      <Icon style={{ width: 18, height: 18, color: isSelected ? 'var(--white)' : color, strokeWidth: 2 }} />
                    </div>
                  );
                })()}
                <span className="flex-1">{exam.name}</span>
                {isSelected && <Check style={{ width: 20, height: 20, color: 'var(--white)', strokeWidth: 2.5 }} />}
              </motion.button>
            );
          })}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showSubjectSelector} onClose={() => setShowSubjectSelector(false)} title="Select Subject">
        <div style={{ padding: '16px' }}>
          {examConfig.subjects.map((subject) => {
            const isSelected = subject.id === currentSubjectId;
            return (
              <motion.button key={subject.id} whileTap={{ scale: 0.98 }} onClick={() => handleSubjectChange(subject.id)} className="w-full flex items-center gap-3 cursor-pointer" style={{
                padding: '14px 16px', marginBottom: 8,
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--secondary)',
                border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)',
                color: isSelected ? 'var(--white)' : 'var(--foreground)', textAlign: 'left',
              }}>
                {(() => { const Icon = getSubjectIcon(subject.id); return <Icon style={{ width: 22, height: 22, color: isSelected ? 'var(--white)' : subject.color, strokeWidth: 2 }} />; })()}
                <span className="flex-1">{subject.name}</span>
                {isSelected && <Check style={{ width: 20, height: 20, color: 'var(--white)', strokeWidth: 2.5 }} />}
              </motion.button>
            );
          })}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showLanguageSelector} onClose={() => setShowLanguageSelector(false)} title="Select Language">
        <div style={{ padding: '16px' }}>
          {examConfig.languages.map((language) => {
            const isSelected = language.code === currentLanguage;
            return (
              <motion.button key={language.code} whileTap={{ scale: 0.98 }} onClick={() => handleLanguageChange(language.code)} className="w-full flex items-center justify-between cursor-pointer" style={{
                padding: '14px 16px', marginBottom: 8,
                backgroundColor: isSelected ? 'var(--primary)' : 'var(--secondary)',
                border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)',
                color: isSelected ? 'var(--white)' : 'var(--foreground)', textAlign: 'left',
              }}>
                <div>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 2, color: isSelected ? 'var(--white)' : 'var(--foreground)' }}>{language.nativeName}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: isSelected ? 'var(--white-alpha-80)' : 'var(--muted-foreground)' }}>{language.name}</div>
                </div>
                {isSelected && <Check style={{ width: 20, height: 20, color: 'var(--white)', strokeWidth: 2.5 }} />}
              </motion.button>
            );
          })}
        </div>
      </BottomSheet>


      <JumpNavigator
        isOpen={showJumpNavigator}
        onClose={() => setShowJumpNavigator(false)}
        examId={currentExamId}
        currentSubjectId={currentSubjectId}
        onNavigate={() => { navigate('/learning-path/lesson'); }}
      />

      <LiveClassDetailSheet
        session={selectedLiveClass}
        isOpen={showLiveDetail}
        onClose={() => setShowLiveDetail(false)}
        onReschedule={() => { setShowLiveDetail(false); setShowReschedule(true); }}
        onJoin={() => { setShowLiveDetail(false); navigate('/live-class'); }}
      />

      <RescheduleSheet
        session={selectedLiveClass}
        allSessions={liveClasses}
        isOpen={showReschedule}
        onClose={() => setShowReschedule(false)}
        onConfirm={handleReschedule}
      />

      <PaywallSheet
        isOpen={showPaywall}
        subjectName={examConfig?.name ?? currentExamId.toUpperCase()}
        onClose={() => setShowPaywall(false)}
        onUnlock={() => {
          setIsPurchased(true);
          setShowPaywall(false);
        }}
      />

      <PurchaseConfirmSheet
        isOpen={showPurchaseConfirm}
        subjectName={examConfig?.name ?? currentExamId.toUpperCase()}
        onClose={() => setShowPurchaseConfirm(false)}
      />
    </div>
  );
}

export const Component = LearningPathScreen;
