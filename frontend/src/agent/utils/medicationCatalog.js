/**
 * Centralized Enterprise Medication Catalog & Schema
 * Supports Preventive and Curative Treatments for Field Technicians & Incharges
 * Extensible for future Admin Master Management
 */

export const MEDICATION_TYPES = [
  { id: 'Preventive', label: 'Preventive', description: 'Routine biosecurity, pond conditioning & health maintenance' },
  { id: 'Curative', label: 'Curative', description: 'Targeted disease remediation, water toxicity & stress cure' },
];

export const MEDICINE_CATEGORIES = [
  { id: 'Probiotics', label: 'Probiotics', icon: '🦠' },
  { id: 'Minerals', label: 'Minerals', icon: '💎' },
  { id: 'Feed Supplements', label: 'Feed Supplements', icon: '🌾' },
  { id: 'Sanitizers', label: 'Sanitizers', icon: '🧼' },
  { id: 'Toxic Gas Controllers', label: 'Toxic Gas Controllers', icon: '💨' },
];

export const DOSAGE_UNITS = [
  'kg/acre',
  'kg/hectare',
  'g/kg feed',
  'ml/acre',
  'ml/hectare',
  'litre/acre',
  'ppm',
  'Other',
];

export const APPLICATION_METHODS = [
  { id: 'Feed', label: 'Feed (Oral)', icon: '🌾' },
  { id: 'Water', label: 'Water (Pond Application)', icon: '💧' },
  { id: 'Both', label: 'Both (Feed + Water)', icon: '🔄' },
];

export const PURPOSE_REASONS = [
  'Disease Prevention',
  'Routine Health Management',
  'Water Quality Maintenance',
  'White Gut',
  'Vibrio',
  'High Ammonia',
  'High Nitrite',
  'H₂S',
  'Low Dissolved Oxygen',
  'Stress',
  'Molting Issue',
  'Poor Feed Intake',
  'Weak Growth',
  'Other',
];

export const PHOTO_TYPES = [
  'Medicine Packet',
  'Pond Condition',
  'Shrimp Condition',
];

// Product master catalog indexed by Medication Type and Medicine Category
export const MEDICINES_CATALOG = {
  Preventive: {
    'Probiotics': [
      { name: 'Soil & Water Probiotic (Bacillus Blend)', defaultDosage: '1', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Water Quality Maintenance' },
      { name: 'Gut Probiotic (Lactobacillus & Yeast)', defaultDosage: '10', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Routine Health Management' },
      { name: 'Photosynthetic Bacteria (PSB Liquid)', defaultDosage: '2', defaultUnit: 'litre/acre', defaultMethod: 'Water', defaultPurpose: 'Water Quality Maintenance' },
      { name: 'Multi-Strain Pond Bio-Stabilizer', defaultDosage: '500', defaultUnit: 'g/kg feed', defaultMethod: 'Water', defaultPurpose: 'Disease Prevention' },
      { name: 'Royals Aqua-Pro Gut Shield', defaultDosage: '5', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Routine Health Management' },
      { name: 'Other', defaultDosage: '', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Routine Health Management' },
    ],
    'Minerals': [
      { name: 'Ionic Mineral Mix (Ca, Mg, K Complete)', defaultDosage: '10', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Routine Health Management' },
      { name: 'Magnesium Booster Forte', defaultDosage: '5', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Routine Health Management' },
      { name: 'Calcium Carbonate & Dolomite Blend', defaultDosage: '25', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Water Quality Maintenance' },
      { name: 'Chelated Trace Minerals Powder', defaultDosage: '5', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Routine Health Management' },
      { name: 'Royals Shell-Hard Fortifier', defaultDosage: '8', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Routine Health Management' },
      { name: 'Other', defaultDosage: '', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Routine Health Management' },
    ],
    'Feed Supplements': [
      { name: 'Coated Vitamin C (50% Active)', defaultDosage: '5', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Routine Health Management' },
      { name: 'Beta-Glucan Immunity Booster', defaultDosage: '5', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Disease Prevention' },
      { name: 'Multi-Vitamin & Amino Acid Liquid Tonic', defaultDosage: '10', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Routine Health Management' },
      { name: 'Hepatopancreas Protective Liquid', defaultDosage: '10', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Routine Health Management' },
      { name: 'Squid Oil & Feed Attractant Binder', defaultDosage: '15', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Routine Health Management' },
      { name: 'Other', defaultDosage: '', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Routine Health Management' },
    ],
    'Sanitizers': [
      { name: 'BKC 50% (Benzalkonium Chloride)', defaultDosage: '1', defaultUnit: 'litre/acre', defaultMethod: 'Water', defaultPurpose: 'Disease Prevention' },
      { name: 'Povidone Iodine 20% Complex', defaultDosage: '500', defaultUnit: 'ml/acre', defaultMethod: 'Water', defaultPurpose: 'Disease Prevention' },
      { name: 'Potassium Monopersulfate (KMPS Powder)', defaultDosage: '1', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Disease Prevention' },
      { name: 'Micro-Shield Bio-Sanitizer', defaultDosage: '1', defaultUnit: 'litre/acre', defaultMethod: 'Water', defaultPurpose: 'Water Quality Maintenance' },
      { name: 'Other', defaultDosage: '', defaultUnit: 'litre/acre', defaultMethod: 'Water', defaultPurpose: 'Disease Prevention' },
    ],
    'Toxic Gas Controllers': [
      { name: 'Yucca Schidigera Ammonia Neutralizer', defaultDosage: '500', defaultUnit: 'ml/acre', defaultMethod: 'Water', defaultPurpose: 'Water Quality Maintenance' },
      { name: 'Ammonia & Nitrite Bio-Reducer', defaultDosage: '1', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Water Quality Maintenance' },
      { name: 'Activated Zeolite + Oxygen Granules', defaultDosage: '20', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Water Quality Maintenance' },
      { name: 'Gas-Free Granules (H₂S Binder)', defaultDosage: '5', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Water Quality Maintenance' },
      { name: 'Other', defaultDosage: '', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Water Quality Maintenance' },
    ],
  },
  Curative: {
    'Probiotics': [
      { name: 'High-CFU Gut Recovery Probiotic (Emergency)', defaultDosage: '15', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'White Gut' },
      { name: 'Sludge & Vibrio Antagonist Bacteria Forte', defaultDosage: '2', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Vibrio' },
      { name: 'Competitive Exclusion Bio-Remediator', defaultDosage: '1.5', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Vibrio' },
      { name: 'Gut Healing & Microflora Paste', defaultDosage: '10', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'White Gut' },
      { name: 'Other', defaultDosage: '', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'White Gut' },
    ],
    'Minerals': [
      { name: 'Emergency Molting Electrolyte Infusion', defaultDosage: '15', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Molting Issue' },
      { name: 'Rapid Hardening Chelated Calcium Infusion', defaultDosage: '10', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Molting Issue' },
      { name: 'Muscle Cramp & Necrosis Relief Minerals', defaultDosage: '10', defaultUnit: 'g/kg feed', defaultMethod: 'Both', defaultPurpose: 'Stress' },
      { name: 'Other', defaultDosage: '', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Molting Issue' },
    ],
    'Feed Supplements': [
      { name: 'Hepatopancreas Intensive Repair Complex', defaultDosage: '15', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Weak Growth' },
      { name: 'Herbal Anti-Microbial & Gut Cleanser', defaultDosage: '10', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'White Gut' },
      { name: 'Stress Relief Electrolyte + Betaine', defaultDosage: '10', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Stress' },
      { name: 'Immunostimulant Nucleotides Extra', defaultDosage: '8', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Poor Feed Intake' },
      { name: 'Other', defaultDosage: '', defaultUnit: 'g/kg feed', defaultMethod: 'Feed', defaultPurpose: 'Poor Feed Intake' },
    ],
    'Sanitizers': [
      { name: 'Glutaraldehyde + BKC Broad Spectrum Sanitizer', defaultDosage: '1.5', defaultUnit: 'litre/acre', defaultMethod: 'Water', defaultPurpose: 'Vibrio' },
      { name: 'Stabilized Bio-Oxidizer (Hydrogen Peroxide 50%)', defaultDosage: '2', defaultUnit: 'litre/acre', defaultMethod: 'Water', defaultPurpose: 'Low Dissolved Oxygen' },
      { name: 'Iodophore Active 10% Antimicrobial', defaultDosage: '1', defaultUnit: 'litre/acre', defaultMethod: 'Water', defaultPurpose: 'Vibrio' },
      { name: 'Vibrio-Clean Targeted Pond Disinfectant', defaultDosage: '1.2', defaultUnit: 'litre/acre', defaultMethod: 'Water', defaultPurpose: 'Vibrio' },
      { name: 'Other', defaultDosage: '', defaultUnit: 'litre/acre', defaultMethod: 'Water', defaultPurpose: 'Vibrio' },
    ],
    'Toxic Gas Controllers': [
      { name: 'Emergency Ammonia Scavenger Compound', defaultDosage: '2', defaultUnit: 'litre/acre', defaultMethod: 'Water', defaultPurpose: 'High Ammonia' },
      { name: 'Instant H₂S Neutralizer (Fast-Dissolve)', defaultDosage: '10', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'H₂S' },
      { name: 'Nitrite Buster Liquid (Bio-Catalytic)', defaultDosage: '1.5', defaultUnit: 'litre/acre', defaultMethod: 'Water', defaultPurpose: 'High Nitrite' },
      { name: 'Emergency Oxygen Generating Tablets', defaultDosage: '3', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Low Dissolved Oxygen' },
      { name: 'Other', defaultDosage: '', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'High Ammonia' },
    ],
  },
};

/**
 * Get available medicines list based on Medication Type and Category
 */
export const getMedicines = (type = 'Preventive', category = 'Probiotics') => {
  const typeCatalog = MEDICINES_CATALOG[type] || MEDICINES_CATALOG['Preventive'];
  return typeCatalog[category] || [
    { name: 'Standard Treatment Mix', defaultDosage: '1', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Routine Health Management' },
    { name: 'Other', defaultDosage: '', defaultUnit: 'kg/acre', defaultMethod: 'Water', defaultPurpose: 'Other' },
  ];
};
