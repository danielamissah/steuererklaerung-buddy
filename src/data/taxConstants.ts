// Official German tax constants for 2025.
// Sources: Bundesministerium der Finanzen, Bundeszentralamt für Steuern.
// Update this file each January — it is the single source of truth
// for all calculations in the tax engine.

export const TAX_2025 = {
  year: 2025,

  // §32a EStG — Einkommensteuertarif
  // The German income tax formula has five zones
  GRUNDFREIBETRAG: 12_096,           // tax-free allowance
  ZONE2_UPPER: 17_005,               // upper bound of zone 2
  ZONE3_UPPER: 66_760,               // upper bound of zone 3 (linear progression)
  ZONE4_UPPER: 277_825,              // upper bound of zone 4 (flat 42%)
  // Above 277,825: Reichensteuer 45%

  ZONE2_FACTOR: 0.14,                // marginal rate at start of zone 2
  ZONE3_MAX_RATE: 0.42,              // rate at top of zone 3
  ZONE4_RATE: 0.42,                  // flat rate zone 4
  REICHENSTEUER_RATE: 0.45,          // top rate zone 5

  // Solidarity surcharge (Solidaritätszuschlag)
  // Only applies above threshold since 2021 reform
  SOLI_EXEMPTION_SINGLE: 18_130,     // no Soli below this income tax amount
  SOLI_EXEMPTION_MARRIED: 36_260,
  SOLI_RATE: 0.055,                  // 5.5% of income tax

  // Kirchensteuer (church tax) — varies by Bundesland
  // 8% in Bavaria and Baden-Württemberg, 9% everywhere else
  KIRCHENSTEUER_RATES: {
    by: 0.08, bw: 0.08,              // Bayern, Baden-Württemberg
    be: 0.09, bb: 0.09, hb: 0.09, hh: 0.09,
    he: 0.09, mv: 0.09, ni: 0.09, nw: 0.09,
    rp: 0.09, sl: 0.09, sn: 0.09, st: 0.09,
    sh: 0.09, th: 0.09,
  } as Record<string, number>,

  // Werbungskosten (work-related expenses)
  ARBEITNEHMER_PAUSCHBETRAG: 1_230,  // flat deduction for employees (§9a EStG)
  HOME_OFFICE_DAILY: 6,              // €6/day, max 210 days = €1,260/year
  HOME_OFFICE_MAX_DAYS: 210,
  HOME_OFFICE_MAX_EUR: 1_260,
  COMMUTE_RATE_KM: 0.30,             // €0.30/km one way (first 20km)
  COMMUTE_RATE_KM_LONG: 0.38,        // €0.38/km beyond 20km
  MAX_COMMUTE_DAYS: 220,             // typical working days per year

  // Sonderausgaben (special expenses)
  SONDERAUSGABEN_PAUSCHBETRAG: 36,   // flat deduction if no itemised Sonderausgaben
  RIESTER_MAX: 2_100,                // max Riester pension deduction

  // Kinderfreibetrag (child allowance)
  KINDERFREIBETRAG_PER_CHILD: 6_612, // per child for married couples (3,306 each)
  KINDERGELD_MONTHLY: 250,           // Kindergeld 2025 (€250/month per child)

  // Außergewöhnliche Belastungen
  // Zumutbare Belastung (reasonable burden threshold) — complex calculation
  // Simplified: we use 1–7% of income depending on income and family status
  DISABILITY_FLAT_RATES: {
    25: 310, 30: 430, 35: 500, 40: 620, 45: 740,
    50: 900, 55: 1_060, 60: 1_230, 65: 1_390, 70: 1_550,
    75: 1_780, 80: 2_120, 85: 2_460, 90: 2_840, 95: 3_700, 100: 7_400,
  } as Record<number, number>,

  // Minimum wage 2025
  MIN_WAGE: 12.82,
} as const;

export const BUNDESLAENDER = [
  { id: 'bw', name: 'Baden-Württemberg' },
  { id: 'by', name: 'Bayern' },
  { id: 'be', name: 'Berlin' },
  { id: 'bb', name: 'Brandenburg' },
  { id: 'hb', name: 'Bremen' },
  { id: 'hh', name: 'Hamburg' },
  { id: 'he', name: 'Hessen' },
  { id: 'mv', name: 'Mecklenburg-Vorpommern' },
  { id: 'ni', name: 'Niedersachsen' },
  { id: 'nw', name: 'Nordrhein-Westfalen' },
  { id: 'rp', name: 'Rheinland-Pfalz' },
  { id: 'sl', name: 'Saarland' },
  { id: 'sn', name: 'Sachsen' },
  { id: 'st', name: 'Sachsen-Anhalt' },
  { id: 'sh', name: 'Schleswig-Holstein' },
  { id: 'th', name: 'Thüringen' },
];

export const TAX_CLASSES = [
  { id: '1', label_en: 'Class I — Single, divorced, or widowed', label_de: 'Klasse I — Ledig, geschieden oder verwitwet' },
  { id: '2', label_en: 'Class II — Single parent with child allowance', label_de: 'Klasse II — Alleinerziehend mit Kinderfreibetrag' },
  { id: '3', label_en: 'Class III — Married, higher earner', label_de: 'Klasse III — Verheiratet, höheres Einkommen' },
  { id: '4', label_en: 'Class IV — Married, similar earnings', label_de: 'Klasse IV — Verheiratet, ähnliche Einkommen' },
  { id: '5', label_en: 'Class V — Married, lower earner', label_de: 'Klasse V — Verheiratet, geringeres Einkommen' },
  { id: '6', label_en: 'Class VI — Second job', label_de: 'Klasse VI — Zweite Beschäftigung' },
];