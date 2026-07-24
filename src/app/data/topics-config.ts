/**
 * Topic Configuration System
 * Maps each chapter to its specific topics/lessons
 */

export interface TopicConfig {
  id: string;
  title: string;
  chapterId: string;
}

// Topics for each chapter - organized by exam and subject
export const TOPICS_BY_CHAPTER: Record<string, TopicConfig[]> = {
  // JEE Main - Physics
  'kinematics': [
    { id: 'kinematics-1', title: 'Distance and Displacement', chapterId: 'kinematics' },
    { id: 'kinematics-2', title: 'Velocity and Acceleration', chapterId: 'kinematics' },
    { id: 'kinematics-3', title: 'Equations of Motion', chapterId: 'kinematics' },
    { id: 'kinematics-4', title: 'Projectile Motion', chapterId: 'kinematics' },
  ],
  'newtons-laws': [
    { id: 'newtons-1', title: 'First Law of Motion', chapterId: 'newtons-laws' },
    { id: 'newtons-2', title: 'Second Law of Motion', chapterId: 'newtons-laws' },
    { id: 'newtons-3', title: 'Third Law of Motion', chapterId: 'newtons-laws' },
    { id: 'newtons-4', title: 'Free Body Diagrams', chapterId: 'newtons-laws' },
  ],
  'energy-work': [
    { id: 'energy-1', title: 'Work and Power', chapterId: 'energy-work' },
    { id: 'energy-2', title: 'Kinetic Energy', chapterId: 'energy-work' },
    { id: 'energy-3', title: 'Potential Energy', chapterId: 'energy-work' },
    { id: 'energy-4', title: 'Conservation of Energy', chapterId: 'energy-work' },
  ],
  'circular-motion': [
    { id: 'circular-1', title: 'Uniform Circular Motion', chapterId: 'circular-motion' },
    { id: 'circular-2', title: 'Centripetal Force', chapterId: 'circular-motion' },
    { id: 'circular-3', title: 'Banking of Roads', chapterId: 'circular-motion' },
    { id: 'circular-4', title: 'Vertical Circular Motion', chapterId: 'circular-motion' },
  ],
  'gravitation': [
    { id: 'gravitation-1', title: 'Universal Law of Gravitation', chapterId: 'gravitation' },
    { id: 'gravitation-2', title: 'Gravitational Field', chapterId: 'gravitation' },
    { id: 'gravitation-3', title: 'Kepler\'s Laws', chapterId: 'gravitation' },
    { id: 'gravitation-4', title: 'Satellites', chapterId: 'gravitation' },
  ],
  'thermodynamics': [
    { id: 'thermo-1', title: 'Heat and Temperature', chapterId: 'thermodynamics' },
    { id: 'thermo-2', title: 'First Law of Thermodynamics', chapterId: 'thermodynamics' },
    { id: 'thermo-3', title: 'Second Law of Thermodynamics', chapterId: 'thermodynamics' },
    { id: 'thermo-4', title: 'Heat Engines', chapterId: 'thermodynamics' },
  ],
  'waves': [
    { id: 'waves-1', title: 'Wave Motion', chapterId: 'waves' },
    { id: 'waves-2', title: 'Sound Waves', chapterId: 'waves' },
    { id: 'waves-3', title: 'Doppler Effect', chapterId: 'waves' },
    { id: 'waves-4', title: 'Superposition of Waves', chapterId: 'waves' },
  ],
  'electrostatics': [
    { id: 'electro-1', title: 'Electric Charge', chapterId: 'electrostatics' },
    { id: 'electro-2', title: 'Coulomb\'s Law', chapterId: 'electrostatics' },
    { id: 'electro-3', title: 'Electric Field', chapterId: 'electrostatics' },
    { id: 'electro-4', title: 'Electric Potential', chapterId: 'electrostatics' },
  ],
  'current-electricity': [
    { id: 'current-1', title: 'Ohm\'s Law', chapterId: 'current-electricity' },
    { id: 'current-2', title: 'Series and Parallel Circuits', chapterId: 'current-electricity' },
    { id: 'current-3', title: 'Kirchhoff\'s Laws', chapterId: 'current-electricity' },
    { id: 'current-4', title: 'Wheatstone Bridge', chapterId: 'current-electricity' },
  ],
  'magnetism': [
    { id: 'mag-1', title: 'Magnetic Field', chapterId: 'magnetism' },
    { id: 'mag-2', title: 'Faraday\'s Law', chapterId: 'magnetism' },
    { id: 'mag-3', title: 'Lenz\'s Law', chapterId: 'magnetism' },
    { id: 'mag-4', title: 'Electromagnetic Induction', chapterId: 'magnetism' },
  ],

  // JEE Main - Chemistry
  'atomic-structure': [
    { id: 'atomic-1', title: 'Subatomic Particles', chapterId: 'atomic-structure' },
    { id: 'atomic-2', title: 'Atomic Models', chapterId: 'atomic-structure' },
    { id: 'atomic-3', title: 'Quantum Numbers', chapterId: 'atomic-structure' },
    { id: 'atomic-4', title: 'Electronic Configuration', chapterId: 'atomic-structure' },
  ],
  'chemical-bonding': [
    { id: 'bonding-1', title: 'Ionic Bonding', chapterId: 'chemical-bonding' },
    { id: 'bonding-2', title: 'Covalent Bonding', chapterId: 'chemical-bonding' },
    { id: 'bonding-3', title: 'Metallic Bonding', chapterId: 'chemical-bonding' },
    { id: 'bonding-4', title: 'VSEPR Theory', chapterId: 'chemical-bonding' },
  ],
  'states-of-matter': [
    { id: 'states-1', title: 'Gaseous State', chapterId: 'states-of-matter' },
    { id: 'states-2', title: 'Liquid State', chapterId: 'states-of-matter' },
    { id: 'states-3', title: 'Solid State', chapterId: 'states-of-matter' },
    { id: 'states-4', title: 'Phase Transitions', chapterId: 'states-of-matter' },
  ],
  'thermochemistry': [
    { id: 'thermochem-1', title: 'Enthalpy', chapterId: 'thermochemistry' },
    { id: 'thermochem-2', title: 'Hess\'s Law', chapterId: 'thermochemistry' },
    { id: 'thermochem-3', title: 'Bond Energy', chapterId: 'thermochemistry' },
    { id: 'thermochem-4', title: 'Spontaneity', chapterId: 'thermochemistry' },
  ],
  'equilibrium': [
    { id: 'equilibrium-1', title: 'Chemical Equilibrium Basics', chapterId: 'equilibrium' },
    { id: 'equilibrium-2', title: 'Le Chatelier\'s Principle', chapterId: 'equilibrium' },
    { id: 'equilibrium-3', title: 'Equilibrium Constant', chapterId: 'equilibrium' },
    { id: 'equilibrium-4', title: 'Ionic Equilibrium', chapterId: 'equilibrium' },
  ],
  'acids-bases': [
    { id: 'acids-1', title: 'Arrhenius Theory', chapterId: 'acids-bases' },
    { id: 'acids-2', title: 'Bronsted-Lowry Theory', chapterId: 'acids-bases' },
    { id: 'acids-3', title: 'pH Scale', chapterId: 'acids-bases' },
    { id: 'acids-4', title: 'Buffer Solutions', chapterId: 'acids-bases' },
  ],
  'redox-reactions': [
    { id: 'redox-1', title: 'Oxidation and Reduction', chapterId: 'redox-reactions' },
    { id: 'redox-2', title: 'Balancing Redox Equations', chapterId: 'redox-reactions' },
    { id: 'redox-3', title: 'Electrochemical Cells', chapterId: 'redox-reactions' },
    { id: 'redox-4', title: 'Nernst Equation', chapterId: 'redox-reactions' },
  ],
  'periodic-table': [
    { id: 'periodic-1', title: 'Periodic Trends', chapterId: 'periodic-table' },
    { id: 'periodic-2', title: 'Ionization Energy', chapterId: 'periodic-table' },
    { id: 'periodic-3', title: 'Electronegativity', chapterId: 'periodic-table' },
    { id: 'periodic-4', title: 'Atomic Radius', chapterId: 'periodic-table' },
  ],
  'organic-basics': [
    { id: 'organic-1', title: 'IUPAC Nomenclature', chapterId: 'organic-basics' },
    { id: 'organic-2', title: 'Functional Groups', chapterId: 'organic-basics' },
    { id: 'organic-3', title: 'Isomerism', chapterId: 'organic-basics' },
    { id: 'organic-4', title: 'Reaction Mechanisms', chapterId: 'organic-basics' },
  ],
  'hydrocarbons': [
    { id: 'hydro-1', title: 'Alkanes', chapterId: 'hydrocarbons' },
    { id: 'hydro-2', title: 'Alkenes', chapterId: 'hydrocarbons' },
    { id: 'hydro-3', title: 'Alkynes', chapterId: 'hydrocarbons' },
    { id: 'hydro-4', title: 'Aromatic Compounds', chapterId: 'hydrocarbons' },
  ],

  // JEE Main - Mathematics
  'sets-relations': [
    { id: 'sets-1', title: 'Set Theory Basics', chapterId: 'sets-relations' },
    { id: 'sets-2', title: 'Operations on Sets', chapterId: 'sets-relations' },
    { id: 'sets-3', title: 'Types of Relations', chapterId: 'sets-relations' },
    { id: 'sets-4', title: 'Functions', chapterId: 'sets-relations' },
  ],
  'complex-numbers': [
    { id: 'complex-1', title: 'Introduction to Complex Numbers', chapterId: 'complex-numbers' },
    { id: 'complex-2', title: 'Argand Plane', chapterId: 'complex-numbers' },
    { id: 'complex-3', title: 'De Moivre\'s Theorem', chapterId: 'complex-numbers' },
    { id: 'complex-4', title: 'Roots of Unity', chapterId: 'complex-numbers' },
  ],
  'quadratic-equations': [
    { id: 'quad-1', title: 'Solving Quadratic Equations', chapterId: 'quadratic-equations' },
    { id: 'quad-2', title: 'Nature of Roots', chapterId: 'quadratic-equations' },
    { id: 'quad-3', title: 'Sum and Product of Roots', chapterId: 'quadratic-equations' },
    { id: 'quad-4', title: 'Graphing Parabolas', chapterId: 'quadratic-equations' },
  ],
  'sequences-series': [
    { id: 'seq-1', title: 'Arithmetic Progression', chapterId: 'sequences-series' },
    { id: 'seq-2', title: 'Geometric Progression', chapterId: 'sequences-series' },
    { id: 'seq-3', title: 'Harmonic Progression', chapterId: 'sequences-series' },
    { id: 'seq-4', title: 'Special Series', chapterId: 'sequences-series' },
  ],
  'trigonometry': [
    { id: 'trig-1', title: 'Trigonometric Ratios', chapterId: 'trigonometry' },
    { id: 'trig-2', title: 'Trigonometric Identities', chapterId: 'trigonometry' },
    { id: 'trig-3', title: 'Heights and Distances', chapterId: 'trigonometry' },
    { id: 'trig-4', title: 'Inverse Trigonometry', chapterId: 'trigonometry' },
  ],
  'calculus': [
    { id: 'calc-1', title: 'Limits', chapterId: 'calculus' },
    { id: 'calc-2', title: 'Continuity', chapterId: 'calculus' },
    { id: 'calc-3', title: 'Derivatives', chapterId: 'calculus' },
    { id: 'calc-4', title: 'Integration', chapterId: 'calculus' },
  ],
  'coordinate-geometry': [
    { id: 'coord-1', title: 'Straight Lines', chapterId: 'coordinate-geometry' },
    { id: 'coord-2', title: 'Circles', chapterId: 'coordinate-geometry' },
    { id: 'coord-3', title: 'Parabola', chapterId: 'coordinate-geometry' },
    { id: 'coord-4', title: 'Ellipse and Hyperbola', chapterId: 'coordinate-geometry' },
  ],
  'vectors': [
    { id: 'vector-1', title: 'Vector Basics', chapterId: 'vectors' },
    { id: 'vector-2', title: 'Dot Product', chapterId: 'vectors' },
    { id: 'vector-3', title: 'Cross Product', chapterId: 'vectors' },
    { id: 'vector-4', title: '3D Geometry', chapterId: 'vectors' },
  ],
  'probability': [
    { id: 'prob-1', title: 'Basic Probability', chapterId: 'probability' },
    { id: 'prob-2', title: 'Conditional Probability', chapterId: 'probability' },
    { id: 'prob-3', title: 'Bayes\' Theorem', chapterId: 'probability' },
    { id: 'prob-4', title: 'Random Variables', chapterId: 'probability' },
  ],
  'matrices': [
    { id: 'matrix-1', title: 'Matrix Operations', chapterId: 'matrices' },
    { id: 'matrix-2', title: 'Determinants', chapterId: 'matrices' },
    { id: 'matrix-3', title: 'Inverse of a Matrix', chapterId: 'matrices' },
    { id: 'matrix-4', title: 'Systems of Equations', chapterId: 'matrices' },
  ],
};

// Helper function to get topics for a chapter
export function getTopicsForChapter(chapterId: string): TopicConfig[] {
  return TOPICS_BY_CHAPTER[chapterId] || [];
}

// Helper function to get all topics for multiple chapters
export function getTopicsForChapters(chapterIds: string[]): Record<string, TopicConfig[]> {
  const result: Record<string, TopicConfig[]> = {};
  chapterIds.forEach(chapterId => {
    result[chapterId] = getTopicsForChapter(chapterId);
  });
  return result;
}
