/**
 * Exam Configuration System
 * Defines exam-specific content, subjects, and language options
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  subjectId: string;
}

export interface ExamConfig {
  id: string;
  name: string;
  fullName: string;
  languages: Language[];
  subjects: Subject[];
  chapters: Chapter[];
}

// Language definitions
export const LANGUAGES: Record<string, Language> = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
};

// Exam configurations
export const EXAM_CONFIGS: Record<string, ExamConfig> = {
  'jee-main': {
    id: 'jee-main',
    name: 'JEE Main',
    fullName: 'Joint Entrance Examination Main',
    languages: [LANGUAGES.en, LANGUAGES.hi],
    subjects: [
      { id: 'physics', name: 'Physics', color: 'var(--physics)', icon: '⚛️' },
      { id: 'chemistry', name: 'Chemistry', color: 'var(--chemistry)', icon: '🧪' },
      { id: 'mathematics', name: 'Mathematics', color: 'var(--mathematics)', icon: '📐' },
    ],
    chapters: [
      // Physics - 10 chapters
      { id: 'kinematics', title: 'Kinematics', description: 'Motion in one and two dimensions', subjectId: 'physics' },
      { id: 'newtons-laws', title: "Newton's Laws", description: 'Master the fundamental laws of motion', subjectId: 'physics' },
      { id: 'energy-work', title: 'Energy & Work', description: 'Understand energy transformation and conservation', subjectId: 'physics' },
      { id: 'circular-motion', title: 'Circular Motion', description: 'Motion in circular paths and rotation', subjectId: 'physics' },
      { id: 'gravitation', title: 'Gravitation', description: 'Universal law and planetary motion', subjectId: 'physics' },
      { id: 'thermodynamics', title: 'Thermodynamics', description: 'Heat, temperature, and energy transfer', subjectId: 'physics' },
      { id: 'waves', title: 'Waves & Sound', description: 'Wave properties and sound phenomena', subjectId: 'physics' },
      { id: 'electrostatics', title: 'Electrostatics', description: 'Electric charge, field, and potential', subjectId: 'physics' },
      { id: 'current-electricity', title: 'Current Electricity', description: 'Electric circuits and Ohm\'s law', subjectId: 'physics' },
      { id: 'magnetism', title: 'Magnetism & EMI', description: 'Magnetic fields and electromagnetic induction', subjectId: 'physics' },
      
      // Chemistry - 10 chapters
      { id: 'atomic-structure', title: 'Atomic Structure', description: 'Electronic configuration and quantum numbers', subjectId: 'chemistry' },
      { id: 'chemical-bonding', title: 'Chemical Bonding', description: 'Ionic, covalent, and metallic bonds', subjectId: 'chemistry' },
      { id: 'states-of-matter', title: 'States of Matter', description: 'Gases, liquids, and solids', subjectId: 'chemistry' },
      { id: 'thermochemistry', title: 'Thermochemistry', description: 'Energy changes in chemical reactions', subjectId: 'chemistry' },
      { id: 'equilibrium', title: 'Chemical Equilibrium', description: 'Reversible reactions and Le Chatelier', subjectId: 'chemistry' },
      { id: 'acids-bases', title: 'Acids, Bases & Salts', description: 'pH, buffers, and salt hydrolysis', subjectId: 'chemistry' },
      { id: 'redox-reactions', title: 'Redox Reactions', description: 'Oxidation, reduction, and electrochemistry', subjectId: 'chemistry' },
      { id: 'periodic-table', title: 'Periodic Table', description: 'Trends and element properties', subjectId: 'chemistry' },
      { id: 'organic-basics', title: 'Organic Chemistry Basics', description: 'Nomenclature and functional groups', subjectId: 'chemistry' },
      { id: 'hydrocarbons', title: 'Hydrocarbons', description: 'Alkanes, alkenes, and aromatic compounds', subjectId: 'chemistry' },
      
      // Mathematics - 10 chapters
      { id: 'sets-relations', title: 'Sets & Relations', description: 'Set theory and types of relations', subjectId: 'mathematics' },
      { id: 'complex-numbers', title: 'Complex Numbers', description: 'Imaginary numbers and operations', subjectId: 'mathematics' },
      { id: 'quadratic-equations', title: 'Quadratic Equations', description: 'Solving and graphing quadratics', subjectId: 'mathematics' },
      { id: 'sequences-series', title: 'Sequences & Series', description: 'AP, GP, and HP progressions', subjectId: 'mathematics' },
      { id: 'trigonometry', title: 'Trigonometry', description: 'Angles, ratios, and identities', subjectId: 'mathematics' },
      { id: 'calculus', title: 'Calculus', description: 'Limits, derivatives, and integration', subjectId: 'mathematics' },
      { id: 'coordinate-geometry', title: 'Coordinate Geometry', description: 'Lines, circles, and conic sections', subjectId: 'mathematics' },
      { id: 'vectors', title: 'Vectors & 3D Geometry', description: 'Vector algebra and 3D coordinate systems', subjectId: 'mathematics' },
      { id: 'probability', title: 'Probability', description: 'Events, distributions, and expectations', subjectId: 'mathematics' },
      { id: 'matrices', title: 'Matrices & Determinants', description: 'Matrix operations and properties', subjectId: 'mathematics' },
    ],
  },
  'jee-advanced': {
    id: 'jee-advanced',
    name: 'JEE Advanced',
    fullName: 'Joint Entrance Examination Advanced',
    languages: [LANGUAGES.en, LANGUAGES.hi],
    subjects: [
      { id: 'physics', name: 'Physics', color: 'var(--physics)', icon: '⚛️' },
      { id: 'chemistry', name: 'Chemistry', color: 'var(--chemistry)', icon: '🧪' },
      { id: 'mathematics', name: 'Mathematics', color: 'var(--mathematics)', icon: '📐' },
    ],
    chapters: [
      // Physics - 8 chapters
      { id: 'advanced-mechanics', title: 'Advanced Mechanics', description: 'Complex problem-solving in classical mechanics', subjectId: 'physics' },
      { id: 'rotational-dynamics', title: 'Rotational Dynamics', description: 'Rigid body motion and angular momentum', subjectId: 'physics' },
      { id: 'fluid-mechanics', title: 'Fluid Mechanics', description: 'Pressure, buoyancy, and fluid flow', subjectId: 'physics' },
      { id: 'thermal-physics', title: 'Thermal Physics', description: 'Kinetic theory and thermodynamics', subjectId: 'physics' },
      { id: 'electrodynamics', title: 'Electrodynamics', description: 'Electric and magnetic fields in motion', subjectId: 'physics' },
      { id: 'optics-advanced', title: 'Advanced Optics', description: 'Wave optics and optical instruments', subjectId: 'physics' },
      { id: 'quantum-physics', title: 'Quantum Physics', description: 'Photoelectric effect and wave-particle duality', subjectId: 'physics' },
      { id: 'nuclear-physics', title: 'Nuclear Physics', description: 'Radioactivity and nuclear reactions', subjectId: 'physics' },
      
      // Chemistry - 8 chapters
      { id: 'chemical-thermodynamics', title: 'Chemical Thermodynamics', description: 'Enthalpy, entropy, and Gibbs energy', subjectId: 'chemistry' },
      { id: 'chemical-kinetics', title: 'Chemical Kinetics', description: 'Reaction rates and mechanisms', subjectId: 'chemistry' },
      { id: 'electrochemistry', title: 'Electrochemistry', description: 'Cells, electrolysis, and Nernst equation', subjectId: 'chemistry' },
      { id: 'coordination-chemistry', title: 'Coordination Chemistry', description: 'Complex compounds and theories', subjectId: 'chemistry' },
      { id: 'organic-reactions', title: 'Organic Reactions', description: 'Reaction mechanisms and synthesis', subjectId: 'chemistry' },
      { id: 'aromatic-chemistry', title: 'Aromatic Chemistry', description: 'Benzene and aromatic compounds', subjectId: 'chemistry' },
      { id: 'biomolecules', title: 'Biomolecules', description: 'Carbohydrates, proteins, and nucleic acids', subjectId: 'chemistry' },
      { id: 'polymers', title: 'Polymers & Chemistry in Action', description: 'Synthetic polymers and applications', subjectId: 'chemistry' },
      
      // Mathematics - 8 chapters
      { id: 'complex-numbers-adv', title: 'Complex Numbers', description: 'Advanced algebra with imaginary numbers', subjectId: 'mathematics' },
      { id: 'functions', title: 'Functions', description: 'Types of functions and transformations', subjectId: 'mathematics' },
      { id: 'limits-continuity', title: 'Limits & Continuity', description: 'Epsilon-delta and continuity theorems', subjectId: 'mathematics' },
      { id: 'differential-calculus', title: 'Differential Calculus', description: 'Advanced differentiation techniques', subjectId: 'mathematics' },
      { id: 'integral-calculus', title: 'Integral Calculus', description: 'Integration methods and applications', subjectId: 'mathematics' },
      { id: 'differential-equations', title: 'Differential Equations', description: 'Solving ODEs and PDEs', subjectId: 'mathematics' },
      { id: 'vector-algebra', title: 'Vector Algebra', description: 'Dot product, cross product, and applications', subjectId: 'mathematics' },
      { id: 'analytical-geometry', title: 'Analytical Geometry', description: 'Advanced coordinate geometry', subjectId: 'mathematics' },
    ],
  },
  'neet': {
    id: 'neet',
    name: 'NEET',
    fullName: 'National Eligibility cum Entrance Test',
    languages: [LANGUAGES.en, LANGUAGES.hi],
    subjects: [
      { id: 'physics', name: 'Physics', color: 'var(--physics)', icon: '⚛️' },
      { id: 'chemistry', name: 'Chemistry', color: 'var(--chemistry)', icon: '🧪' },
      { id: 'biology', name: 'Biology', color: 'var(--biology)', icon: '🧬' },
    ],
    chapters: [
      // Physics - 7 chapters
      { id: 'mechanics-neet', title: 'Mechanics', description: 'Laws of motion and forces', subjectId: 'physics' },
      { id: 'thermodynamics-neet', title: 'Thermodynamics', description: 'Heat and energy transfer', subjectId: 'physics' },
      { id: 'waves-optics', title: 'Waves & Optics', description: 'Light, reflection, and refraction', subjectId: 'physics' },
      { id: 'electricity-magnetism', title: 'Electricity & Magnetism', description: 'Electric and magnetic phenomena', subjectId: 'physics' },
      { id: 'modern-physics', title: 'Modern Physics', description: 'Atoms, nuclei, and radiation', subjectId: 'physics' },
      { id: 'oscillations', title: 'Oscillations & SHM', description: 'Simple harmonic motion and waves', subjectId: 'physics' },
      { id: 'semiconductors', title: 'Semiconductors & Devices', description: 'Diodes, transistors, and applications', subjectId: 'physics' },
      
      // Chemistry - 7 chapters
      { id: 'physical-chemistry', title: 'Physical Chemistry', description: 'Solutions, electrochemistry, kinetics', subjectId: 'chemistry' },
      { id: 'chemical-equilibrium-neet', title: 'Chemical Equilibrium', description: 'Equilibrium constants and applications', subjectId: 'chemistry' },
      { id: 'inorganic-chemistry', title: 'Inorganic Chemistry', description: 'Periodic table and coordination compounds', subjectId: 'chemistry' },
      { id: 'organic-chemistry', title: 'Organic Chemistry', description: 'Biomolecules and polymers', subjectId: 'chemistry' },
      { id: 'environmental-chemistry', title: 'Environmental Chemistry', description: 'Pollution and green chemistry', subjectId: 'chemistry' },
      { id: 'chemistry-everyday', title: 'Chemistry in Everyday Life', description: 'Drugs, medicines, and chemicals', subjectId: 'chemistry' },
      { id: 'solid-state', title: 'Solid State', description: 'Crystal structures and properties', subjectId: 'chemistry' },
      
      // Biology - 10 chapters
      { id: 'cell-biology', title: 'Cell Biology', description: 'Cell structure and function', subjectId: 'biology' },
      { id: 'biomolecules-bio', title: 'Biomolecules', description: 'Carbohydrates, proteins, lipids, and nucleic acids', subjectId: 'biology' },
      { id: 'genetics', title: 'Genetics', description: 'DNA, RNA, and heredity', subjectId: 'biology' },
      { id: 'evolution', title: 'Evolution & Diversity', description: 'Origin of life and classification', subjectId: 'biology' },
      { id: 'human-physiology', title: 'Human Physiology', description: 'Body systems and functions', subjectId: 'biology' },
      { id: 'plant-biology', title: 'Plant Biology', description: 'Photosynthesis and plant anatomy', subjectId: 'biology' },
      { id: 'reproduction', title: 'Reproduction', description: 'Human and plant reproduction', subjectId: 'biology' },
      { id: 'ecology', title: 'Ecology', description: 'Ecosystems and environmental biology', subjectId: 'biology' },
      { id: 'biotechnology', title: 'Biotechnology', description: 'Genetic engineering and applications', subjectId: 'biology' },
      { id: 'animal-kingdom', title: 'Animal Kingdom', description: 'Classification and diversity', subjectId: 'biology' },
    ],
  },
  'cat': {
    id: 'cat',
    name: 'CAT',
    fullName: 'Common Admission Test',
    languages: [LANGUAGES.en], // Only English
    subjects: [
      { id: 'verbal', name: 'Verbal Ability', color: 'var(--primary)', icon: '📖' },
      { id: 'dilr', name: 'Data Interpretation & LR', color: 'var(--chemistry)', icon: '📊' },
      { id: 'quant', name: 'Quantitative Aptitude', color: 'var(--mathematics)', icon: '🔢' },
    ],
    chapters: [
      // Verbal - 6 chapters
      { id: 'reading-comprehension', title: 'Reading Comprehension', description: 'Understand and analyze passages', subjectId: 'verbal' },
      { id: 'para-jumbles', title: 'Para Jumbles', description: 'Arrange sentences logically', subjectId: 'verbal' },
      { id: 'sentence-correction', title: 'Sentence Correction', description: 'Grammar and syntax', subjectId: 'verbal' },
      { id: 'para-summary', title: 'Para Summary', description: 'Summarize paragraphs concisely', subjectId: 'verbal' },
      { id: 'critical-reasoning', title: 'Critical Reasoning', description: 'Analyze arguments and assumptions', subjectId: 'verbal' },
      { id: 'vocabulary', title: 'Vocabulary & Usage', description: 'Word usage and contextual meanings', subjectId: 'verbal' },
      
      // DILR - 6 chapters
      { id: 'data-interpretation', title: 'Data Interpretation', description: 'Charts, graphs, and tables', subjectId: 'dilr' },
      { id: 'logical-reasoning', title: 'Logical Reasoning', description: 'Puzzles and arrangements', subjectId: 'dilr' },
      { id: 'data-sufficiency', title: 'Data Sufficiency', description: 'Determine if data is sufficient', subjectId: 'dilr' },
      { id: 'seating-arrangements', title: 'Seating Arrangements', description: 'Linear and circular arrangements', subjectId: 'dilr' },
      { id: 'blood-relations', title: 'Blood Relations & Networks', description: 'Family trees and relationships', subjectId: 'dilr' },
      { id: 'visual-reasoning', title: 'Visual Reasoning', description: 'Pattern recognition and analysis', subjectId: 'dilr' },
      
      // Quant - 7 chapters
      { id: 'arithmetic', title: 'Arithmetic', description: 'Percentages, ratios, and averages', subjectId: 'quant' },
      { id: 'algebra-cat', title: 'Algebra', description: 'Equations and inequalities', subjectId: 'quant' },
      { id: 'geometry', title: 'Geometry', description: 'Shapes, angles, and measurements', subjectId: 'quant' },
      { id: 'number-systems', title: 'Number Systems', description: 'Properties and operations', subjectId: 'quant' },
      { id: 'trigonometry-cat', title: 'Trigonometry', description: 'Angles and triangles', subjectId: 'quant' },
      { id: 'permutation-combination', title: 'Permutation & Combination', description: 'Counting principles and arrangements', subjectId: 'quant' },
      { id: 'probability-cat', title: 'Probability', description: 'Events and outcomes', subjectId: 'quant' },
    ],
  },
  'gate': {
    id: 'gate',
    name: 'GATE',
    fullName: 'Graduate Aptitude Test in Engineering',
    languages: [LANGUAGES.en], // Only English
    subjects: [
      { id: 'general-aptitude', name: 'General Aptitude', color: 'var(--primary)', icon: '🧠' },
      { id: 'engineering-math', name: 'Engineering Mathematics', color: 'var(--mathematics)', icon: '📐' },
      { id: 'core-subject', name: 'Core Subject', color: 'var(--physics)', icon: '⚙️' },
    ],
    chapters: [
      // General Aptitude - 5 chapters
      { id: 'verbal-aptitude', title: 'Verbal Aptitude', description: 'Grammar and comprehension', subjectId: 'general-aptitude' },
      { id: 'numerical-ability', title: 'Numerical Ability', description: 'Numbers and calculations', subjectId: 'general-aptitude' },
      { id: 'spatial-reasoning', title: 'Spatial Reasoning', description: 'Visual and spatial ability', subjectId: 'general-aptitude' },
      { id: 'logical-reasoning-gate', title: 'Logical Reasoning', description: 'Analytical and deductive reasoning', subjectId: 'general-aptitude' },
      { id: 'data-analysis', title: 'Data Analysis', description: 'Interpreting charts and graphs', subjectId: 'general-aptitude' },
      
      // Engineering Math - 6 chapters
      { id: 'linear-algebra', title: 'Linear Algebra', description: 'Matrices and vector spaces', subjectId: 'engineering-math' },
      { id: 'calculus-gate', title: 'Calculus', description: 'Differentiation and integration', subjectId: 'engineering-math' },
      { id: 'differential-equations-gate', title: 'Differential Equations', description: 'Ordinary and partial differential equations', subjectId: 'engineering-math' },
      { id: 'probability-gate', title: 'Probability & Statistics', description: 'Random variables and distributions', subjectId: 'engineering-math' },
      { id: 'numerical-methods', title: 'Numerical Methods', description: 'Computational mathematics', subjectId: 'engineering-math' },
      { id: 'transforms', title: 'Transforms & Series', description: 'Fourier and Laplace transforms', subjectId: 'engineering-math' },
      
      // Core Subject - 7 chapters (Generic engineering topics)
      { id: 'digital-logic', title: 'Digital Logic', description: 'Boolean algebra and circuits', subjectId: 'core-subject' },
      { id: 'networks', title: 'Networks & Circuits', description: 'Circuit analysis and theorems', subjectId: 'core-subject' },
      { id: 'signals-systems', title: 'Signals & Systems', description: 'Signal processing fundamentals', subjectId: 'core-subject' },
      { id: 'control-systems', title: 'Control Systems', description: 'Feedback and stability', subjectId: 'core-subject' },
      { id: 'engineering-mechanics', title: 'Engineering Mechanics', description: 'Statics and dynamics', subjectId: 'core-subject' },
      { id: 'data-structures', title: 'Data Structures', description: 'Arrays, trees, and graphs', subjectId: 'core-subject' },
      { id: 'algorithms', title: 'Algorithms', description: 'Sorting, searching, and complexity', subjectId: 'core-subject' },
    ],
  },
  'upsc': {
    id: 'upsc',
    name: 'UPSC CSE',
    fullName: 'Union Public Service Commission Civil Services Examination',
    languages: [LANGUAGES.en, LANGUAGES.hi],
    subjects: [
      { id: 'history', name: 'History', color: 'var(--history)', icon: '🏛️' },
      { id: 'geography', name: 'Geography', color: 'var(--geography)', icon: '🌍' },
      { id: 'polity', name: 'Polity', color: 'var(--polity)', icon: '⚖️' },
      { id: 'economy', name: 'Economy', color: 'var(--economy)', icon: '💰' },
      { id: 'science', name: 'Science & Technology', color: 'var(--physics)', icon: '🔬' },
    ],
    chapters: [
      // History - 6 chapters
      { id: 'ancient-history', title: 'Ancient History', description: 'Indus Valley to Gupta period', subjectId: 'history' },
      { id: 'medieval-history', title: 'Medieval History', description: 'Delhi Sultanate to Mughal Empire', subjectId: 'history' },
      { id: 'modern-history', title: 'Modern History', description: 'British rule and freedom struggle', subjectId: 'history' },
      { id: 'world-history', title: 'World History', description: 'Major world events and revolutions', subjectId: 'history' },
      { id: 'art-culture', title: 'Art & Culture', description: 'Indian heritage and traditions', subjectId: 'history' },
      { id: 'post-independence', title: 'Post-Independence India', description: 'Nation building and developments', subjectId: 'history' },
      
      // Geography - 7 chapters
      { id: 'physical-geography', title: 'Physical Geography', description: 'Earth systems and processes', subjectId: 'geography' },
      { id: 'indian-geography', title: 'Indian Geography', description: 'Physical and human geography', subjectId: 'geography' },
      { id: 'world-geography', title: 'World Geography', description: 'Continents and regions', subjectId: 'geography' },
      { id: 'economic-geography', title: 'Economic Geography', description: 'Resources and industries', subjectId: 'geography' },
      { id: 'environmental-geography', title: 'Environmental Geography', description: 'Climate change and conservation', subjectId: 'geography' },
      { id: 'human-geography', title: 'Human Geography', description: 'Population and settlements', subjectId: 'geography' },
      { id: 'disaster-management', title: 'Disaster Management', description: 'Natural disasters and mitigation', subjectId: 'geography' },
      
      // Polity - 7 chapters
      { id: 'constitution', title: 'Indian Constitution', description: 'Fundamental rights and duties', subjectId: 'polity' },
      { id: 'governance', title: 'Governance', description: 'Administrative framework', subjectId: 'polity' },
      { id: 'political-system', title: 'Political System', description: 'Parliament and state legislatures', subjectId: 'polity' },
      { id: 'judiciary', title: 'Judiciary', description: 'Supreme Court and legal system', subjectId: 'polity' },
      { id: 'panchayati-raj', title: 'Panchayati Raj', description: 'Local governance and institutions', subjectId: 'polity' },
      { id: 'social-justice', title: 'Social Justice', description: 'Policies and welfare schemes', subjectId: 'polity' },
      { id: 'international-relations', title: 'International Relations', description: 'Foreign policy and diplomacy', subjectId: 'polity' },
      
      // Economy - 7 chapters
      { id: 'indian-economy', title: 'Indian Economy', description: 'Economic development and planning', subjectId: 'economy' },
      { id: 'economic-planning', title: 'Economic Planning', description: 'Five-year plans and reforms', subjectId: 'economy' },
      { id: 'agriculture', title: 'Agriculture', description: 'Farming and rural economy', subjectId: 'economy' },
      { id: 'industry-infrastructure', title: 'Industry & Infrastructure', description: 'Manufacturing and development', subjectId: 'economy' },
      { id: 'banking-finance', title: 'Banking & Finance', description: 'Monetary policy and institutions', subjectId: 'economy' },
      { id: 'international-trade', title: 'International Trade', description: 'Trade policy and WTO', subjectId: 'economy' },
      { id: 'poverty-unemployment', title: 'Poverty & Unemployment', description: 'Social issues and solutions', subjectId: 'economy' },
      
      // Science & Technology - 6 chapters
      { id: 'basic-science', title: 'Basic Science', description: 'Physics, chemistry, and biology fundamentals', subjectId: 'science' },
      { id: 'information-technology', title: 'Information Technology', description: 'IT and digital revolution', subjectId: 'science' },
      { id: 'space-technology', title: 'Space Technology', description: 'ISRO and space missions', subjectId: 'science' },
      { id: 'biotechnology', title: 'Biotechnology', description: 'Genetic engineering and applications', subjectId: 'science' },
      { id: 'defence-security', title: 'Defence & Security', description: 'Military technology and cybersecurity', subjectId: 'science' },
      { id: 'current-affairs', title: 'Current Affairs', description: 'Recent developments and issues', subjectId: 'science' },
    ],
  },
};

// Helper functions
export function getExamConfig(examId: string): ExamConfig | undefined {
  return EXAM_CONFIGS[examId];
}

export function hasMultipleLanguages(examId: string): boolean {
  const config = getExamConfig(examId);
  return config ? config.languages.length > 1 : false;
}

export function getExamSubjects(examId: string): Subject[] {
  const config = getExamConfig(examId);
  return config ? config.subjects : [];
}

export function getExamChapters(examId: string, subjectId?: string): Chapter[] {
  const config = getExamConfig(examId);
  if (!config) return [];
  
  if (subjectId) {
    return config.chapters.filter(ch => ch.subjectId === subjectId);
  }
  
  return config.chapters;
}

export function getExamLanguages(examId: string): Language[] {
  const config = getExamConfig(examId);
  return config ? config.languages : [LANGUAGES.en];
}

// Get exam ID from name (case-insensitive, handles spaces/hyphens)
export function getExamIdFromName(examName: string): string {
  const normalized = examName.toLowerCase().replace(/\s+/g, '-');
  
  // Try direct match first
  if (EXAM_CONFIGS[normalized]) {
    return normalized;
  }
  
  // Try fuzzy match
  for (const [id, config] of Object.entries(EXAM_CONFIGS)) {
    if (config.name.toLowerCase() === examName.toLowerCase() ||
        config.fullName.toLowerCase() === examName.toLowerCase()) {
      return id;
    }
  }
  
  return 'cat'; // Default fallback
}