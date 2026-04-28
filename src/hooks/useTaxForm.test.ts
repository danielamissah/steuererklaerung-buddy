import { renderHook, act } from '@testing-library/react';
import { useTaxForm } from './useTaxForm';

describe('useTaxForm Hook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTaxForm());
    
    expect(result.current.currentStep).toBe(1);
    expect(result.current.filing.employment_type).toBe('employee');
    expect(result.current.filing.gross_income_eur).toBe(0);
    expect(result.current.result).toBeNull();
  });

  it('should update a field and calculate tax if income is > 0', () => {
    const { result } = renderHook(() => useTaxForm());

    act(() => {
      result.current.updateField('gross_income_eur', 50000);
    });

    expect(result.current.filing.gross_income_eur).toBe(50000);
    expect(result.current.result).not.toBeNull();
    expect(result.current.result?.taxable_income).toBeGreaterThan(0);
  });

  it('should not calculate tax if income is 0', () => {
    const { result } = renderHook(() => useTaxForm());

    act(() => {
      result.current.updateField('home_office_days', 10);
    });

    expect(result.current.filing.home_office_days).toBe(10);
    expect(result.current.result).toBeNull();
  });

  it('should handle step navigation correctly', () => {
    const { result } = renderHook(() => useTaxForm());

    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(2);

    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(3);

    act(() => {
      result.current.prevStep();
    });
    expect(result.current.currentStep).toBe(2);

    act(() => {
      result.current.goToStep(5);
    });
    expect(result.current.currentStep).toBe(5);

    // Should not exceed bounds
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(5);
  });

  it('should apply OCR results', () => {
    const { result } = renderHook(() => useTaxForm());

    act(() => {
      result.current.applyOCRResult({
        gross_income_eur: 60000,
        income_tax_paid_eur: 12000,
      });
    });

    expect(result.current.filing.gross_income_eur).toBe(60000);
    expect(result.current.filing.income_tax_paid_eur).toBe(12000);
    expect(result.current.result).not.toBeNull();
  });

  it('should add werbungskosten correctly', () => {
    const { result } = renderHook(() => useTaxForm());

    act(() => {
      result.current.addWerbungskosten('work_equipment_eur', 500);
    });

    expect(result.current.filing.work_equipment_eur).toBe(500);

    act(() => {
      result.current.addWerbungskosten('work_equipment_eur', 200);
    });

    expect(result.current.filing.work_equipment_eur).toBe(700);
  });

  it('should reset to default state', () => {
    const { result } = renderHook(() => useTaxForm());

    act(() => {
      result.current.updateField('gross_income_eur', 50000);
      result.current.nextStep();
    });

    expect(result.current.filing.gross_income_eur).toBe(50000);
    expect(result.current.currentStep).toBe(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.filing.gross_income_eur).toBe(0);
    expect(result.current.currentStep).toBe(1);
    expect(result.current.result).toBeNull();
  });
});
