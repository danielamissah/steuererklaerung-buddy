'use client';

import { useState, useCallback } from 'react';
import { TaxFiling, TaxResult } from '@/types';
import { calculateTax } from '@/lib/taxEngine';

// Default filing — all fields at zero, sensible defaults for a
// first-time filer who has not entered any data yet
const DEFAULT_FILING: TaxFiling = {
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

export function useTaxForm() {
  const [filing, setFiling] = useState<TaxFiling>(DEFAULT_FILING);
  const [result, setResult] = useState<TaxResult | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Update a single field and immediately recalculate the estimate.
  // This gives users real-time feedback as they type.
  const updateField = useCallback(<K extends keyof TaxFiling>(
    key: K,
    value: TaxFiling[K]
  ) => {
    setFiling((prev) => {
      const updated = { ...prev, [key]: value };
      // Recalculate on every change so the refund estimate stays live
      if (updated.gross_income_eur > 0 || updated.income_tax_paid_eur > 0) {
        setResult(calculateTax(updated));
      }
      return updated;
    });
  }, []);

  // Apply OCR results from a Lohnsteuerbescheinigung scan
  const applyOCRResult = useCallback((ocr: Partial<TaxFiling>) => {
    setFiling((prev) => {
      const updated = { ...prev, ...ocr };
      setResult(calculateTax(updated));
      return updated;
    });
  }, []);

  // Add a Werbungskosten suggestion to the filing
  const addWerbungskosten = useCallback((field: keyof TaxFiling, amount: number) => {
    setFiling((prev) => {
      const current = (prev[field] as number) || 0;
      const updated = { ...prev, [field]: current + amount };
      setResult(calculateTax(updated));
      return updated;
    });
  }, []);

  function nextStep() {
    setCurrentStep((s) => Math.min(s + 1, 5));
  }

  function prevStep() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  function goToStep(step: number) {
    setCurrentStep(step);
  }

  function reset() {
    setFiling(DEFAULT_FILING);
    setResult(null);
    setCurrentStep(1);
  }

  return {
    filing,
    result,
    currentStep,
    updateField,
    applyOCRResult,
    addWerbungskosten,
    nextStep,
    prevStep,
    goToStep,
    reset,
  };
}