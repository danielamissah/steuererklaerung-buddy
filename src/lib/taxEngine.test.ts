import {
  calculateIncomeTax,
  calculateSoli,
  calculateWerbungskosten,
  calculateSonderausgaben,
  calculateTax,
  formatEur,
  formatEurExact,
  effectiveTaxRate
} from './taxEngine';
import { TaxFiling } from '@/types';
import { TAX_2025 } from '@/data/taxConstants';

const C = TAX_2025;

describe('Tax Engine - Income Tax (§32a EStG)', () => {
  it('should return 0 for income below Grundfreibetrag (Zone 1)', () => {
    expect(calculateIncomeTax(10000)).toBe(0);
    expect(calculateIncomeTax(C.GRUNDFREIBETRAG)).toBe(0);
  });

  it('should calculate correct tax for Zone 2', () => {
    const income = C.GRUNDFREIBETRAG + 5000;
    const tax = calculateIncomeTax(income);
    expect(tax).toBeGreaterThan(0);
    expect(tax).toBeLessThan(1500); // Rough sanity check
  });

  it('should calculate correct tax for Zone 3', () => {
    const income = C.ZONE2_UPPER + 10000;
    const tax = calculateIncomeTax(income);
    expect(tax).toBeGreaterThan(0);
  });

  it('should calculate flat 42% minus regression for Zone 4', () => {
    const income = 100000;
    const expectedTax = Math.floor(0.42 * income - 10602.13);
    expect(calculateIncomeTax(income)).toBe(expectedTax);
  });

  it('should calculate flat 45% minus regression for Zone 5 (Reichensteuer)', () => {
    const income = 300000;
    const expectedTax = Math.floor(0.45 * income - 18936.88);
    expect(calculateIncomeTax(income)).toBe(expectedTax);
  });
});

describe('Tax Engine - Solidarity Surcharge', () => {
  it('should be 0 if income tax is below exemption (Single)', () => {
    expect(calculateSoli(C.SOLI_EXEMPTION_SINGLE - 100, false)).toBe(0);
  });

  it('should be 0 if income tax is below exemption (Married)', () => {
    expect(calculateSoli(C.SOLI_EXEMPTION_MARRIED - 100, true)).toBe(0);
  });

  it('should calculate transitional Soli correctly', () => {
    const tax = C.SOLI_EXEMPTION_SINGLE + 1000;
    const expectedSoli = Math.min(tax * C.SOLI_RATE, (tax - C.SOLI_EXEMPTION_SINGLE) * 0.119);
    expect(calculateSoli(tax, false)).toBe(expectedSoli);
  });

  it('should calculate full 5.5% Soli for high taxes', () => {
    const tax = C.SOLI_EXEMPTION_SINGLE * 2;
    const expectedSoli = Math.floor(tax * C.SOLI_RATE);
    expect(calculateSoli(tax, false)).toBe(expectedSoli);
  });
});

describe('Tax Engine - Werbungskosten', () => {
  const baseFiling: TaxFiling = {
    employment_type: 'employee',
    marital_status: 'single',
    tax_class: '1',
    bundesland: 'BE',
    church_member: false,
    has_children: false,
    child_count: 0,
    gross_income_eur: 50000,
    home_office_days: 0,
    commute_km: 0,
    commute_days: 0,
  };

  it('should return Arbeitnehmer-Pauschbetrag if expenses are lower', () => {
    expect(calculateWerbungskosten(baseFiling)).toBe(C.ARBEITNEHMER_PAUSCHBETRAG);
  });

  it('should cap home office days at max allowed', () => {
    const filing = { ...baseFiling, home_office_days: 300 };
    const wk = calculateWerbungskosten(filing);
    expect(wk).toBe(C.HOME_OFFICE_MAX_DAYS * C.HOME_OFFICE_DAILY);
  });

  it('should calculate commute correctly for < 20km', () => {
    const filing = { ...baseFiling, commute_km: 10, commute_days: 100 };
    const wk = calculateWerbungskosten(filing);
    expect(wk).toBe(Math.max(C.ARBEITNEHMER_PAUSCHBETRAG, 10 * 0.3 * 100));
  });

  it('should calculate commute correctly for > 20km', () => {
    const filing = { ...baseFiling, commute_km: 30, commute_days: 100 };
    const expectedCommute = (20 * 0.3 + 10 * 0.38) * 100;
    const wk = calculateWerbungskosten(filing);
    expect(wk).toBe(Math.max(C.ARBEITNEHMER_PAUSCHBETRAG, expectedCommute));
  });

  it('should sum all direct expenses', () => {
    const filing = {
      ...baseFiling,
      work_equipment_eur: 500,
      professional_training_eur: 300,
      union_fees_eur: 200,
      work_clothing_eur: 150,
      other_werbungskosten_eur: 200, // Total = 1350
    };
    expect(calculateWerbungskosten(filing)).toBe(1350);
  });
});

describe('Tax Engine - Sonderausgaben', () => {
  const baseFiling: TaxFiling = {
    employment_type: 'employee',
    marital_status: 'single',
    tax_class: '1',
    bundesland: 'BE',
    church_member: false,
    has_children: false,
    child_count: 0,
    gross_income_eur: 50000,
    home_office_days: 0,
    commute_km: 0,
    commute_days: 0,
  };

  it('should return default Pauschbetrag if expenses are zero', () => {
    expect(calculateSonderausgaben(baseFiling)).toBe(C.SONDERAUSGABEN_PAUSCHBETRAG);
  });

  it('should sum sonderausgaben and cap Riester', () => {
    const filing = {
      ...baseFiling,
      riester_eur: 3000, // Should cap at RIESTER_MAX
      donations_eur: 500
    };
    const expected = C.RIESTER_MAX + 500;
    expect(calculateSonderausgaben(filing)).toBe(expected);
  });
});

describe('Tax Engine - calculateTax Pipeline', () => {
  it('should calculate refund if tax paid is higher than tax due', () => {
    const filing: TaxFiling = {
      employment_type: 'employee',
      marital_status: 'single',
      tax_class: '1',
      bundesland: 'BE',
      church_member: false,
      has_children: false,
      child_count: 0,
      gross_income_eur: 50000,
      income_tax_paid_eur: 15000, // High prepay
      home_office_days: 100, // 600€
      work_equipment_eur: 1000, // Total WK = 1600 (above pauschbetrag)
      commute_km: 0,
      commute_days: 0,
    };

    const result = calculateTax(filing);
    expect(result.werbungskosten_total).toBe(1600);
    expect(result.is_refund).toBe(true);
    expect(result.refund_eur).toBeGreaterThan(0);
    expect(result.additional_payment_eur).toBe(0);
    expect(result.drivers.length).toBeGreaterThan(0);
  });

  it('should calculate additional payment if tax paid is lower than tax due', () => {
    const filing: TaxFiling = {
      employment_type: 'employee',
      marital_status: 'single',
      tax_class: '1',
      bundesland: 'BE',
      church_member: false,
      has_children: false,
      child_count: 0,
      gross_income_eur: 50000,
      income_tax_paid_eur: 2000, // Very low prepay
      home_office_days: 0,
      commute_km: 0,
      commute_days: 0,
    };

    const result = calculateTax(filing);
    expect(result.is_refund).toBe(false);
    expect(result.additional_payment_eur).toBeGreaterThan(0);
    expect(result.refund_eur).toBe(0);
  });
});

describe('Tax Engine - Formatters', () => {
  it('should format EUR without cents', () => {
    expect(formatEur(1000)).toContain('1.000');
    expect(formatEur(1000.5)).toContain('1.001'); // Rounds up
  });

  it('should format EUR with cents', () => {
    expect(formatEurExact(1000)).toContain('1.000,00');
    expect(formatEurExact(1000.5)).toContain('1.000,50');
  });

  it('should calculate effective tax rate', () => {
    const mockResult = { total_tax_due: 10000 } as any;
    expect(effectiveTaxRate(mockResult, 50000)).toBe(20.0);
  });
});
