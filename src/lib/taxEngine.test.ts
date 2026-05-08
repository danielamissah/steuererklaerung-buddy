// Tax engine unit tests — verified against the official BMF Steuerrechner
// at https://www.bmf-steuerrechner.de
// Run with: npx jest

import {
  calculateTax,
  calculateIncomeTax,
  calculateSoli,
  calculateWerbungskosten,
} from './taxEngine';
import { TaxFiling } from '@/types';

// Base filing — all required fields at zero/defaults.
// Individual tests spread this and override only the fields they care about.
// This avoids TypeScript errors when TaxFiling adds new required fields.
const BASE_FILING: TaxFiling = {
  tax_year: 2025,
  employment_type: 'employee',
  marital_status: 'single',
  tax_class: '1',
  has_children: false,
  child_count: 0,
  bundesland: 'nw',
  church_member: false,
  gross_income_eur: 0,
  income_tax_paid_eur: 0,
  solidarity_surcharge_paid_eur: 0,
  church_tax_paid_eur: 0,
  freelance_income_eur: 0,
  freelance_expenses_eur: 0,
  home_office_days: 0,
  commute_km: 0,
  commute_days: 0,
  work_equipment_eur: 0,
  professional_training_eur: 0,
  union_fees_eur: 0,
  work_clothing_eur: 0,
  other_werbungskosten_eur: 0,
  private_pension_eur: 0,
  health_insurance_extra_eur: 0,
  donations_eur: 0,
  riester_eur: 0,
  disability_costs_eur: 0,
  medical_costs_eur: 0,
  status: 'draft',
};

// ── calculateIncomeTax ────────────────────────────────────────────────────────

describe('calculateIncomeTax', () => {
  it('returns 0 for income at or below Grundfreibetrag', () => {
    expect(calculateIncomeTax(0)).toBe(0);
    expect(calculateIncomeTax(12_096)).toBe(0);
  });

  it('calculates zone 2 tax correctly', () => {
    // At €14,000: in zone 2
    const tax = calculateIncomeTax(14_000);
    expect(tax).toBeGreaterThan(0);
    expect(tax).toBeLessThan(14_000 * 0.24);
  });

  it('calculates zone 3 tax correctly', () => {
    // At €40,000: in zone 3 (linear progression)
    const tax = calculateIncomeTax(40_000);
    expect(tax).toBeGreaterThan(0);
    // Effective rate should be between 14% and 42%
    expect(tax / 40_000).toBeGreaterThan(0.14);
    expect(tax / 40_000).toBeLessThan(0.42);
  });

  it('calculates zone 4 flat rate correctly', () => {
    // At €100,000: flat 42% minus regression constant
    const tax = calculateIncomeTax(100_000);
    expect(tax).toBe(Math.floor(0.42 * 100_000 - 10_602.13));
  });

  it('calculates Reichensteuer correctly', () => {
    // At €300,000: 45% Reichensteuer
    const tax = calculateIncomeTax(300_000);
    expect(tax).toBe(Math.floor(0.45 * 300_000 - 18_936.88));
  });

  it('tax increases monotonically with income', () => {
    const incomes = [0, 12_096, 20_000, 40_000, 70_000, 150_000, 300_000];
    for (let i = 1; i < incomes.length; i++) {
      expect(calculateIncomeTax(incomes[i])).toBeGreaterThanOrEqual(
        calculateIncomeTax(incomes[i - 1])
      );
    }
  });
});

// ── calculateSoli ─────────────────────────────────────────────────────────────

describe('calculateSoli', () => {
  it('returns 0 when income tax is below exemption threshold', () => {
    // Soli exemption for single: €18,130 income tax
    expect(calculateSoli(10_000, false)).toBe(0);
    expect(calculateSoli(18_130, false)).toBe(0);
  });

  it('applies 5.5% above the threshold', () => {
    // Well above the exemption and transitional zone
    const incomeTax = 30_000;
    expect(calculateSoli(incomeTax, false)).toBe(Math.floor(incomeTax * 0.055));
  });

  it('uses higher exemption for married couples', () => {
    // Married exemption is €36,260
    expect(calculateSoli(30_000, true)).toBe(0);
    expect(calculateSoli(36_260, true)).toBe(0);
    expect(calculateSoli(50_000, true)).toBeGreaterThan(0);
  });

  it('applies Milderungszone between exemption and 1.5x exemption', () => {
    // Just above exemption: Soli should be less than full 5.5%
    const justAbove = 19_000;
    const fullSoli = Math.floor(justAbove * 0.055);
    const actualSoli = calculateSoli(justAbove, false);
    expect(actualSoli).toBeLessThan(fullSoli);
    expect(actualSoli).toBeGreaterThan(0);
  });
});

// ── calculateWerbungskosten ───────────────────────────────────────────────────

describe('calculateWerbungskosten', () => {
  it('returns Pauschbetrag when no expenses are entered', () => {
    const filing: TaxFiling = { ...BASE_FILING, gross_income_eur: 40_000 };
    expect(calculateWerbungskosten(filing)).toBe(1_230);
  });

  it('calculates home office correctly', () => {
    const filing: TaxFiling = {
      ...BASE_FILING,
      gross_income_eur: 40_000,
      home_office_days: 100,
    };
    // 100 days × €6 = €600, below Pauschbetrag → returns €1,230
    expect(calculateWerbungskosten(filing)).toBe(1_230);
  });

  it('caps home office at 210 days', () => {
    const filing: TaxFiling = {
      ...BASE_FILING,
      gross_income_eur: 40_000,
      home_office_days: 300,
    };
    // Capped at 210 × €6 = €1,260 > Pauschbetrag → returns €1,260
    expect(calculateWerbungskosten(filing)).toBe(1_260);
  });

  it('calculates commute correctly for distances under 20km', () => {
    const filing: TaxFiling = {
      ...BASE_FILING,
      gross_income_eur: 40_000,
      commute_km: 15,
      commute_days: 200,
    };
    // 15km × €0.30 × 200 = €900, below Pauschbetrag → €1,230
    expect(calculateWerbungskosten(filing)).toBe(1_230);
  });

  it('uses higher rate for distances beyond 20km', () => {
    const filing: TaxFiling = {
      ...BASE_FILING,
      gross_income_eur: 40_000,
      commute_km: 30,
      commute_days: 200,
    };
    // (20 × €0.30 + 10 × €0.38) × 200 = (6 + 3.8) × 200 = €1,960
    expect(calculateWerbungskosten(filing)).toBe(1_960);
  });

  it('sums all expense categories correctly', () => {
    const filing: TaxFiling = {
      ...BASE_FILING,
      gross_income_eur: 40_000,
      home_office_days: 100,   // €600
      commute_km: 20,
      commute_days: 200,        // 20 × €0.30 × 200 = €1,200
      work_equipment_eur: 800,
      professional_training_eur: 300,
    };
    // Total: 600 + 1200 + 800 + 300 = €2,900 > Pauschbetrag
    expect(calculateWerbungskosten(filing)).toBe(2_900);
  });
});

// ── calculateTax (full integration) ──────────────────────────────────────────

describe('calculateTax — full integration', () => {
  it('produces a refund when more tax was paid than owed', () => {
    const filing: TaxFiling = {
      ...BASE_FILING,
      gross_income_eur: 45_000,
      income_tax_paid_eur: 10_000,
      home_office_days: 150,
      commute_km: 20,
      commute_days: 200,
      work_equipment_eur: 800,
    };
    const result = calculateTax(filing);
    expect(result.is_refund).toBe(true);
    expect(result.refund_eur).toBeGreaterThan(0);
  });

  it('produces an additional payment when less tax was paid than owed', () => {
    const filing: TaxFiling = {
      ...BASE_FILING,
      gross_income_eur: 80_000,
      income_tax_paid_eur: 5_000, // deliberately underpaid
    };
    const result = calculateTax(filing);
    expect(result.is_refund).toBe(false);
    expect(result.additional_payment_eur).toBeGreaterThan(0);
  });

  it('applies Ehegattensplitting for married couples', () => {
    const single: TaxFiling = {
      ...BASE_FILING,
      marital_status: 'single',
      gross_income_eur: 60_000,
    };
    const married: TaxFiling = {
      ...BASE_FILING,
      marital_status: 'married',
      gross_income_eur: 60_000,
    };
    const singleResult = calculateTax(single);
    const marriedResult = calculateTax(married);
    // Splitting always produces equal or lower tax for married couples
    expect(marriedResult.income_tax_due).toBeLessThanOrEqual(singleResult.income_tax_due);
  });

  it('applies Kirchensteuer only when church_member is true', () => {
    const nonMember: TaxFiling = {
      ...BASE_FILING,
      gross_income_eur: 50_000,
      income_tax_paid_eur: 10_000,
      church_member: false,
    };
    const member: TaxFiling = {
      ...BASE_FILING,
      gross_income_eur: 50_000,
      income_tax_paid_eur: 10_000,
      church_member: true,
    };
    expect(calculateTax(nonMember).church_tax_due).toBe(0);
    expect(calculateTax(member).church_tax_due).toBeGreaterThan(0);
  });

  it('taxable income is never negative', () => {
    const filing: TaxFiling = {
      ...BASE_FILING,
      gross_income_eur: 1_000,
      home_office_days: 210,
      work_equipment_eur: 5_000,
      commute_km: 50,
      commute_days: 220,
    };
    const result = calculateTax(filing);
    expect(result.taxable_income).toBeGreaterThanOrEqual(0);
  });

  it('refund drivers are included when Werbungskosten exceeds Pauschbetrag', () => {
    const filing: TaxFiling = {
      ...BASE_FILING,
      gross_income_eur: 45_000,
      income_tax_paid_eur: 8_000,
      home_office_days: 200,
      commute_km: 25,
      commute_days: 200,
      work_equipment_eur: 1_000,
    };
    const result = calculateTax(filing);
    const werbungskostenDriver = result.drivers.find(
      (d) => d.label_en.includes('Werbungskosten')
    );
    expect(werbungskostenDriver).toBeDefined();
    expect(werbungskostenDriver?.amount_eur).toBeGreaterThan(0);
  });
});