// Core types for the Steuererklärung Buddy.
// The filing wizard is the central flow — everything feeds into TaxFiling.

export type Language = 'en' | 'de';
export type EmploymentType = 'employee' | 'freelancer' | 'both' | 'unemployed';
export type TaxClass = '1' | '2' | '3' | '4' | '5' | '6';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';
export type FilingStatus = 'draft' | 'complete' | 'exported';

// main filing object
export interface TaxFiling {
  id?: string;
  tax_year: number;
  employment_type: EmploymentType;
  marital_status: MaritalStatus;
  tax_class: TaxClass;
  has_children: boolean;
  child_count: number;
  bundesland: string;
  church_member: boolean;

  // Income
  gross_income_eur: number;
  income_tax_paid_eur: number;
  solidarity_surcharge_paid_eur: number;
  church_tax_paid_eur: number;

  // Freelancer fields
  freelance_income_eur: number;
  freelance_expenses_eur: number;

  // Werbungskosten (work-related deductions)
  home_office_days: number;
  commute_km: number;
  commute_days: number;
  work_equipment_eur: number;
  professional_training_eur: number;
  union_fees_eur: number;
  work_clothing_eur: number;
  other_werbungskosten_eur: number;

  // Sonderausgaben (special expenses)
  private_pension_eur: number;
  health_insurance_extra_eur: number;
  donations_eur: number;
  riester_eur: number;

  // Außergewöhnliche Belastungen (extraordinary expenses)
  disability_costs_eur: number;
  medical_costs_eur: number;

  // Computed result
  result?: TaxResult;
  status: FilingStatus;
  created_at?: string;
  updated_at?: string;
}

// The calculated result returned by the tax engine
export interface TaxResult {
  // Deductions
  werbungskosten_total: number;       // at least Pauschbetrag of €1,230
  sonderausgaben_total: number;
  taxable_income: number;
  grundfreibetrag: number;

  // Tax computed
  income_tax_due: number;
  solidarity_surcharge_due: number;
  church_tax_due: number;
  total_tax_due: number;

  // What was already paid
  total_tax_paid: number;

  // The refund or additional payment
  refund_eur: number;
  additional_payment_eur: number;
  is_refund: boolean;

  // Breakdown by driver — shown in the results chart
  drivers: RefundDriver[];
}

// Each factor that contributed to the refund / additional payment
export interface RefundDriver {
  label_en: string;
  label_de: string;
  amount_eur: number;
  type: 'deduction' | 'credit' | 'overpayment';
}

// A suggested Werbungskosten item the user may have missed
export interface WerbungskostenSuggestion {
  id: string;
  category: string;
  label_en: string;
  label_de: string;
  description_en: string;
  description_de: string;
  typical_amount_eur: number;
  legal_basis: string;
  requires_receipts: boolean;
}

// OCR result from a Lohnsteuerbescheinigung photo
export interface LohnsteuerOCRResult {
  gross_income?: number;
  income_tax_paid?: number;
  solidarity_surcharge_paid?: number;
  church_tax_paid?: number;
  tax_class?: string;
  confidence: number;
  raw_text: string;
}

// Steuerberater advisor in the marketplace
export interface TaxAdvisor {
  id: string;
  name: string;
  firm: string;
  city: string;
  specialisations: string[];
  languages: string[];
  fee_eur_per_hour: number;
  rating: number;
  review_count: number;
  stripe_price_id: string;
}