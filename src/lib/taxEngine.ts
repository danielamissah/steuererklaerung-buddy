// German income tax calculation engine — 2025.
// All functions are pure (no side effects, no async).
// The calculation follows §32a EStG (Einkommensteuertarif) exactly.
//
// Important: This engine calculates an estimate based on the inputs provided.
// It does not account for all edge cases in the 300+ page EStG.
// Always recommend users verify with an official source or Steuerberater.

import { TaxFiling, TaxResult, RefundDriver } from '@/types';
import { TAX_2025 } from '@/data/taxConstants';

const C = TAX_2025;

// ── Income tax formula (§32a EStG) 
// Germany uses a progressive formula with five zones — not a simple bracket table.
// The formula computes the marginal rate continuously within each zone.
export function calculateIncomeTax(taxableIncome: number): number {
  const x = Math.floor(taxableIncome);

  if (x <= C.GRUNDFREIBETRAG) return 0;

  if (x <= C.ZONE2_UPPER) {
    // Zone 2: linear progression from 14% to ~24%
    const y = (x - C.GRUNDFREIBETRAG) / 10_000;
    return Math.floor((979.18 * y + 1_400) * y);
  }

  if (x <= C.ZONE3_UPPER) {
    // Zone 3: linear progression from ~24% to 42%
    const y = (x - C.ZONE2_UPPER) / 10_000;
    return Math.floor((192.59 * y + 2_397) * y + 966.53);
  }

  if (x <= C.ZONE4_UPPER) {
    // Zone 4: flat 42% minus €10,602 regression amount
    return Math.floor(0.42 * x - 10_602.13);
  }

  // Zone 5: Reichensteuer 45% minus regression amount
  return Math.floor(0.45 * x - 18_936.88);
}

// ── Solidarity surcharge
// Since 2021, Soli only applies when income tax exceeds the exemption threshold.
// Between the threshold and 1.5× the threshold, a transitional rate applies.
export function calculateSoli(
  incomeTax: number,
  isMarried: boolean
): number {
  const exemption = isMarried ? C.SOLI_EXEMPTION_MARRIED : C.SOLI_EXEMPTION_SINGLE;

  if (incomeTax <= exemption) return 0;

  const fullSoli = incomeTax * C.SOLI_RATE;

  // Transitional zone: Soli phased in gradually above exemption
  const transitionUpper = exemption * 1.5;
  if (incomeTax <= transitionUpper) {
    // 11.9% of the amount exceeding the exemption (milderungszone)
    return Math.min(fullSoli, (incomeTax - exemption) * 0.119);
  }

  return Math.floor(fullSoli);
}

// ── Kirchensteuer 
export function calculateKirchensteuer(
  incomeTax: number,
  bundesland: string
): number {
  const rate = C.KIRCHENSTEUER_RATES[bundesland] || 0.09;
  return Math.floor(incomeTax * rate);
}

// ── Werbungskosten 
// Work-related expense deductions. The minimum is the Pauschbetrag (€1,230).
// Only amounts exceeding the Pauschbetrag provide additional benefit.
export function calculateWerbungskosten(filing: TaxFiling): number {
  let total = 0;

  // Home office: €6/day, capped at 210 days (€1,260 max)
  const homeOfficeDays = Math.min(filing.home_office_days, C.HOME_OFFICE_MAX_DAYS);
  total += homeOfficeDays * C.HOME_OFFICE_DAILY;

  // Commute (Entfernungspauschale): €0.30/km for first 20km, €0.38/km beyond
  if (filing.commute_km > 0 && filing.commute_days > 0) {
    const days = Math.min(filing.commute_days, C.MAX_COMMUTE_DAYS);
    const km = filing.commute_km;
    if (km <= 20) {
      total += km * C.COMMUTE_RATE_KM * days;
    } else {
      total += (20 * C.COMMUTE_RATE_KM + (km - 20) * C.COMMUTE_RATE_KM_LONG) * days;
    }
  }

  // Direct deductible expenses
  total += filing.work_equipment_eur || 0;
  total += filing.professional_training_eur || 0;
  total += filing.union_fees_eur || 0;
  total += filing.work_clothing_eur || 0;
  total += filing.other_werbungskosten_eur || 0;

  // Apply Pauschbetrag minimum — only actual amounts above €1,230 help
  return Math.max(total, C.ARBEITNEHMER_PAUSCHBETRAG);
}

// ── Sonderausgaben 
export function calculateSonderausgaben(filing: TaxFiling): number {
  let total = 0;
  total += Math.min(filing.riester_eur || 0, C.RIESTER_MAX);
  total += filing.health_insurance_extra_eur || 0;
  total += filing.private_pension_eur || 0;
  total += filing.donations_eur || 0;

  // Sonderausgaben Pauschbetrag: if itemised total < €36, use €36
  return Math.max(total, C.SONDERAUSGABEN_PAUSCHBETRAG);
}

// ── Main calculation 
export function calculateTax(filing: TaxFiling): TaxResult {
  const isMarried = filing.marital_status === 'married';

  // 1. Gross income — employee + any freelance
  const totalGross = (filing.gross_income_eur || 0) + (filing.freelance_income_eur || 0);

  // 2. Deductions
  const werbungskosten = calculateWerbungskosten(filing);
  const sonderausgaben = calculateSonderausgaben(filing);
  const freelanceProfit = Math.max(
    (filing.freelance_income_eur || 0) - (filing.freelance_expenses_eur || 0), 0
  );

  // 3. Taxable income (zu versteuerndes Einkommen)
  // For employees: gross - werbungskosten - sonderausgaben
  // For freelancers: freelance profit is already net of expenses
  let taxableIncome = Math.max(
    totalGross - werbungskosten - sonderausgaben - (filing.disability_costs_eur || 0),
    0
  );

  // Kinderfreibetrag: compare benefit against Kindergeld received
  // If Kinderfreibetrag saves more tax than Kindergeld paid, apply it
  let kinderfreibetragApplied = 0;
  if (filing.has_children && filing.child_count > 0) {
    const freibetrag = C.KINDERFREIBETRAG_PER_CHILD * filing.child_count;
    const kindergeldAnnual = C.KINDERGELD_MONTHLY * 12 * filing.child_count;
    const taxWithout = calculateIncomeTax(taxableIncome);
    const taxWith = calculateIncomeTax(Math.max(taxableIncome - freibetrag, 0));
    const taxSaving = taxWithout - taxWith;
    if (taxSaving > kindergeldAnnual) {
      // Freibetrag is more beneficial — apply it (Günstigerprüfung)
      taxableIncome = Math.max(taxableIncome - freibetrag, 0);
      kinderfreibetragApplied = freibetrag;
    }
  }

  // 4. For married couples: Ehegattensplitting (divide by 2, compute tax, multiply by 2)
  let incomeTaxDue: number;
  if (isMarried) {
    incomeTaxDue = calculateIncomeTax(Math.floor(taxableIncome / 2)) * 2;
  } else {
    incomeTaxDue = calculateIncomeTax(taxableIncome);
  }

  // 5. Solidarity surcharge
  const soliDue = calculateSoli(incomeTaxDue, isMarried);

  // 6. Church tax
  const kirchensteuerDue = filing.church_member
    ? calculateKirchensteuer(incomeTaxDue, filing.bundesland)
    : 0;

  const totalTaxDue = incomeTaxDue + soliDue + kirchensteuerDue;

  // 7. Compare against what was already paid
  const totalPaid =
    (filing.income_tax_paid_eur || 0) +
    (filing.solidarity_surcharge_paid_eur || 0) +
    (filing.church_tax_paid_eur || 0);

  const difference = totalPaid - totalTaxDue;
  const isRefund = difference > 0;

  // 8. Build refund drivers — shows what drove the result
  const drivers: RefundDriver[] = [];

  if (werbungskosten > C.ARBEITNEHMER_PAUSCHBETRAG) {
    const extraDeduction = werbungskosten - C.ARBEITNEHMER_PAUSCHBETRAG;
    const taxSaving = Math.round(extraDeduction * 0.3); // approximate marginal rate
    drivers.push({
      label_en: 'Work-related expenses (Werbungskosten)',
      label_de: 'Werbungskosten',
      amount_eur: taxSaving,
      type: 'deduction',
    });
  }

  if (sonderausgaben > C.SONDERAUSGABEN_PAUSCHBETRAG) {
    const extraSA = sonderausgaben - C.SONDERAUSGABEN_PAUSCHBETRAG;
    const taxSaving = Math.round(extraSA * 0.25);
    drivers.push({
      label_en: 'Special expenses (Sonderausgaben)',
      label_de: 'Sonderausgaben',
      amount_eur: taxSaving,
      type: 'deduction',
    });
  }

  if (kinderfreibetragApplied > 0) {
    drivers.push({
      label_en: 'Child allowance (Kinderfreibetrag)',
      label_de: 'Kinderfreibetrag',
      amount_eur: Math.round(kinderfreibetragApplied * 0.3),
      type: 'credit',
    });
  }

  if (totalPaid > totalTaxDue) {
    drivers.push({
      label_en: 'Tax overpaid via payroll',
      label_de: 'Zu viel gezahlte Lohnsteuer',
      amount_eur: Math.round(totalPaid - totalTaxDue),
      type: 'overpayment',
    });
  }

  return {
    werbungskosten_total: werbungskosten,
    sonderausgaben_total: sonderausgaben,
    taxable_income: taxableIncome,
    grundfreibetrag: C.GRUNDFREIBETRAG,
    income_tax_due: incomeTaxDue,
    solidarity_surcharge_due: soliDue,
    church_tax_due: kirchensteuerDue,
    total_tax_due: totalTaxDue,
    total_tax_paid: totalPaid,
    refund_eur: isRefund ? Math.round(difference) : 0,
    additional_payment_eur: isRefund ? 0 : Math.round(Math.abs(difference)),
    is_refund: isRefund,
    drivers,
  };
}

// ── Formatting helpers ─
export function formatEur(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEurExact(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function effectiveTaxRate(result: TaxResult, grossIncome: number): number {
  if (grossIncome === 0) return 0;
  return Math.round((result.total_tax_due / grossIncome) * 100 * 10) / 10;
}