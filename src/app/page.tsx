'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useTaxForm } from '@/hooks/useTaxForm';
import { LanguageToggle } from '@/components/LanguageToggle';
import { StepIndicator } from '@/components/StepIndicator';
import { RefundMeter } from '@/components/RefundMeter';
import { ResultBreakdown } from '@/components/ResultBreakdown';
import { WerbungskostenSuggestions } from '@/components/WerbungskostenSuggestions';
import { LohnsteuerUpload } from '@/components/LohnsteuerUpload';
import { TaxChat } from '@/components/TaxChat';
import { FormField } from '@/components/FormField';
import { BUNDESLAENDER, TAX_CLASSES } from '@/data/taxConstants';
import { LohnsteuerOCRResult, TaxFiling } from '@/types';
import { formatEur } from '@/lib/taxEngine';

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#0D5C63', textDecoration: 'underline' }}>
      {label}
    </a>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '10px',
  border: '1.5px solid #E5E7EB', fontSize: '14px',
  color: '#1A1A1A', background: 'white',
  fontFamily: 'var(--font-inter)',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
  cursor: 'pointer',
};

export default function Home() {
  const { t, lang, toggleLang } = useTranslation();
  const [started, setStarted] = useState(false);
  const {
    filing, result, currentStep,
    updateField, applyOCRResult, addWerbungskosten,
    nextStep, prevStep, goToStep,
  } = useTaxForm();

  const stepLabels = [t.step1Title, t.step2Title, t.step3Title, t.step4Title, t.step5Title];

  function handleOCR(ocr: LohnsteuerOCRResult) {
    applyOCRResult({
      gross_income_eur: ocr.gross_income || filing.gross_income_eur,
      income_tax_paid_eur: ocr.income_tax_paid || filing.income_tax_paid_eur,
      solidarity_surcharge_paid_eur: ocr.solidarity_surcharge_paid || filing.solidarity_surcharge_paid_eur,
      church_tax_paid_eur: ocr.church_tax_paid || filing.church_tax_paid_eur,
    });
  }

  async function handleExport() {
    if (!result) return;
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filing, result }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steuererklaerung-2025.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-surface font-inter">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-2xl mx-auto px-5 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2.5 transition-opacity hover:opacity-80 cursor-pointer">
            <span className="font-extrabold text-[15px] text-primary">
              {t.appName}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent-light text-accent">
              {t.updatedFor}
            </span>
          </div>
          <LanguageToggle lang={lang} onToggle={toggleLang} label={t.langToggle} />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-5 pt-6 pb-20 flex flex-col gap-6 animate-in fade-in duration-700">

        {/* Hero — shown only before starting */}
        {!started && (
          <div className="bg-linear-to-br from-primary to-[#0A4A50] rounded-3xl p-6 sm:p-10 text-white shadow-[0_4px_24px_rgba(13,92,99,0.18)]">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">
              {t.heroSubtitle}
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-3.5 whitespace-pre-line">
              {t.heroTitle}
            </h1>
            <p className="text-sm leading-relaxed opacity-80 max-w-lg mb-6">
              {t.heroDesc}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
              {[
                [t.heroStat1, t.heroStat1Label],
                [t.heroStat2, t.heroStat2Label],
                [t.heroStat3, t.heroStat3Label],
              ].map(([stat, label]) => (
                <div key={stat} className="bg-white/10 rounded-xl p-3 border border-white/15">
                  <p className="text-lg sm:text-xl font-extrabold mb-1">{stat}</p>
                  <p className="text-[11px] opacity-75 leading-tight">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <button
                onClick={() => setStarted(true)}
                className="px-6 py-3.5 rounded-xl border-none bg-accent text-white text-sm font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                {t.heroStart}
              </button>
            </div>
          </div>
        )}

        {started && (
          <>
            {/* Live refund meter — shown from step 2 onwards */}
            {currentStep > 1 && (
              <RefundMeter result={result} t={t} />
            )}

            {/* Step indicator */}
            <div className="bg-white rounded-2xl p-5 border border-border shadow-xs overflow-x-auto">
              <StepIndicator
                currentStep={currentStep}
                totalSteps={5}
                labels={stepLabels}
                onStepClick={goToStep}
              />
            </div>

        {/* ── Step 1 — Your situation ─────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="bg-white rounded-[20px] p-6 sm:p-7 border border-border shadow-sm animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-primary mb-5">{t.step1Title}</h2>
            <div className="flex flex-col gap-4.5">

              <FormField label={t.employmentType} required>
                <select
                  value={filing.employment_type}
                  onChange={(e) => updateField('employment_type', e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2212%22_height=%2212%22_viewBox=%220_0_12_12%22%3E%3Cpath_fill=%22%236B7280%22_d=%22M6_8L1_3h10z%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8"
                >
                  <option value="employee">{t.employee}</option>
                  <option value="freelancer">{t.freelancer}</option>
                  <option value="both">{t.both}</option>
                  <option value="unemployed">{t.unemployed}</option>
                </select>
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={t.maritalStatus} required>
                  <select
                    value={filing.marital_status}
                    onChange={(e) => updateField('marital_status', e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2212%22_height=%2212%22_viewBox=%220_0_12_12%22%3E%3Cpath_fill=%22%236B7280%22_d=%22M6_8L1_3h10z%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8"
                  >
                    <option value="single">{t.single}</option>
                    <option value="married">{t.married}</option>
                    <option value="divorced">{t.divorced}</option>
                    <option value="widowed">{t.widowed}</option>
                  </select>
                </FormField>

                <FormField label={t.taxClass} hint={t.taxClassHint} required>
                  <select
                    value={filing.tax_class}
                    onChange={(e) => updateField('tax_class', e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2212%22_height=%2212%22_viewBox=%220_0_12_12%22%3E%3Cpath_fill=%22%236B7280%22_d=%22M6_8L1_3h10z%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8"
                  >
                    {TAX_CLASSES.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {lang === 'de' ? tc.label_de : tc.label_en}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label={t.bundesland} required>
                <select
                  value={filing.bundesland}
                  onChange={(e) => updateField('bundesland', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2212%22_height=%2212%22_viewBox=%220_0_12_12%22%3E%3Cpath_fill=%22%236B7280%22_d=%22M6_8L1_3h10z%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8"
                >
                  {BUNDESLAENDER.map((bl) => (
                    <option key={bl.id} value={bl.id}>{bl.name}</option>
                  ))}
                </select>
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={t.hasChildren}>
                  <div className="flex gap-2">
                    {[false, true].map((val) => (
                      <button
                        key={String(val)}
                        onClick={() => updateField('has_children', val)}
                        className={`flex-1 p-2.5 rounded-xl border-1.5 font-semibold text-sm cursor-pointer transition-colors ${
                          filing.has_children === val 
                            ? 'border-primary bg-primary-light text-primary' 
                            : 'border-border bg-white text-[#6B7280]'
                        }`}
                      >
                        {val ? t.yes : t.no}
                      </button>
                    ))}
                  </div>
                </FormField>

                {filing.has_children && (
                  <FormField label={t.childCount}>
                    <input
                      type="number"
                      min={1} max={10}
                      value={filing.child_count}
                      onChange={(e) => updateField('child_count', Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                    />
                  </FormField>
                )}
              </div>

              <FormField label={t.churchMember} hint={t.churchMemberHint}>
                <div className="flex gap-2">
                  {[false, true].map((val) => (
                    <button
                      key={String(val)}
                      onClick={() => updateField('church_member', val)}
                      className={`flex-1 p-2.5 rounded-xl border-1.5 font-semibold text-sm cursor-pointer transition-colors ${
                        filing.church_member === val 
                          ? 'border-primary bg-primary-light text-primary' 
                          : 'border-border bg-white text-[#6B7280]'
                      }`}
                    >
                      {val ? t.yes : t.no}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          </div>
        )}

        {/* ── Step 2 — Income ─────────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="bg-white rounded-[20px] p-6 sm:p-7 border border-border shadow-sm flex flex-col gap-5 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-primary">{t.step2Title}</h2>

            {/* OCR upload */}
            <LohnsteuerUpload t={t} onSuccess={handleOCR} />

            <div className="h-px bg-[#F3F4F6]" />
            <p className="text-[13px] text-[#9CA3AF] text-center">or enter manually</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t.grossIncome} hint={t.grossIncomeHint} required>
                <input
                  type="number" min={0} step={100}
                  value={filing.gross_income_eur || ''}
                  onChange={(e) => updateField('gross_income_eur', Number(e.target.value))}
                  placeholder="e.g. 45000"
                  className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                />
              </FormField>

              <FormField label={t.incomeTaxPaid} hint={t.incomeTaxPaidHint}>
                <input
                  type="number" min={0} step={10}
                  value={filing.income_tax_paid_eur || ''}
                  onChange={(e) => updateField('income_tax_paid_eur', Number(e.target.value))}
                  placeholder="e.g. 8000"
                  className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                />
              </FormField>

              <FormField label={t.soliPaid} hint={t.soliPaidHint}>
                <input
                  type="number" min={0} step={10}
                  value={filing.solidarity_surcharge_paid_eur || ''}
                  onChange={(e) => updateField('solidarity_surcharge_paid_eur', Number(e.target.value))}
                  placeholder="e.g. 0"
                  className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                />
              </FormField>

              {filing.church_member && (
                <FormField label={t.kirchensteuerPaid} hint={t.kirchensteuerPaidHint}>
                  <input
                    type="number" min={0} step={10}
                    value={filing.church_tax_paid_eur || ''}
                    onChange={(e) => updateField('church_tax_paid_eur', Number(e.target.value))}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                  />
                </FormField>
              )}
            </div>

            {/* Freelance fields */}
            {(filing.employment_type === 'freelancer' || filing.employment_type === 'both') && (
              <>
                <div className="h-px bg-[#F3F4F6]" />
                <p className="text-[13px] font-semibold text-[#374151]">Freelance / Self-employment</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label={t.freelanceIncome}>
                    <input
                      type="number" min={0}
                      value={filing.freelance_income_eur || ''}
                      onChange={(e) => updateField('freelance_income_eur', Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                    />
                  </FormField>
                  <FormField label={t.freelanceExpenses}>
                    <input
                      type="number" min={0}
                      value={filing.freelance_expenses_eur || ''}
                      onChange={(e) => updateField('freelance_expenses_eur', Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                    />
                  </FormField>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step 3 — Werbungskosten ─────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[20px] p-6 sm:p-7 border border-border shadow-sm">
              <h2 className="text-lg font-bold text-primary mb-2">{t.werbungskostenTitle}</h2>
              <p className="text-[13px] text-[#6B7280] leading-relaxed mb-5">{t.werbungskostenDesc}</p>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                  <FormField label={t.homeOfficeDays} hint={t.homeOfficeDaysHint}>
                    <input
                      type="number" min={0} max={210}
                      value={filing.home_office_days || ''}
                      onChange={(e) => updateField('home_office_days', Number(e.target.value))}
                      placeholder="e.g. 120"
                      className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                    />
                  </FormField>
                  <FormField label={t.commuteKm}>
                    <input
                      type="number" min={0}
                      value={filing.commute_km || ''}
                      onChange={(e) => updateField('commute_km', Number(e.target.value))}
                      placeholder="e.g. 15"
                      className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                    />
                  </FormField>
                  <FormField label={t.commuteDays}>
                    <input
                      type="number" min={0} max={220}
                      value={filing.commute_days || ''}
                      onChange={(e) => updateField('commute_days', Number(e.target.value))}
                      placeholder="e.g. 200"
                      className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                    />
                  </FormField>
                  <FormField label={t.workEquipment}>
                    <input
                      type="number" min={0}
                      value={filing.work_equipment_eur || ''}
                      onChange={(e) => updateField('work_equipment_eur', Number(e.target.value))}
                      placeholder="e.g. 800"
                      className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                    />
                  </FormField>
                  <FormField label={t.professionalTraining}>
                    <input
                      type="number" min={0}
                      value={filing.professional_training_eur || ''}
                      onChange={(e) => updateField('professional_training_eur', Number(e.target.value))}
                      placeholder="e.g. 300"
                      className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                    />
                  </FormField>
                  <FormField label={t.unionFees}>
                    <input
                      type="number" min={0}
                      value={filing.union_fees_eur || ''}
                      onChange={(e) => updateField('union_fees_eur', Number(e.target.value))}
                      placeholder="e.g. 200"
                      className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                    />
                  </FormField>
                  <FormField label={t.workClothing}>
                    <input
                      type="number" min={0}
                      value={filing.work_clothing_eur || ''}
                      onChange={(e) => updateField('work_clothing_eur', Number(e.target.value))}
                      placeholder="e.g. 150"
                      className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                    />
                  </FormField>
                  <FormField label={t.otherWerbungskosten}>
                    <input
                      type="number" min={0}
                      value={filing.other_werbungskosten_eur || ''}
                      onChange={(e) => updateField('other_werbungskosten_eur', Number(e.target.value))}
                      placeholder="e.g. 0"
                      className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white"
                    />
                  </FormField>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <WerbungskostenSuggestions
              filing={filing}
              t={t}
              lang={lang}
              onAdd={addWerbungskosten}
            />
          </div>
        )}

        {/* ── Step 4 — Other deductions ───────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="bg-white rounded-[20px] p-6 sm:p-7 border border-border shadow-sm animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-primary mb-5">{t.step4Title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t.riester} hint={t.riesterHint}>
                <input type="number" min={0} max={2100}
                  value={filing.riester_eur || ''}
                  onChange={(e) => updateField('riester_eur', Number(e.target.value))}
                  placeholder="e.g. 1200" className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white" />
              </FormField>
              <FormField label={t.healthInsuranceExtra}>
                <input type="number" min={0}
                  value={filing.health_insurance_extra_eur || ''}
                  onChange={(e) => updateField('health_insurance_extra_eur', Number(e.target.value))}
                  placeholder="e.g. 0" className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white" />
              </FormField>
              <FormField label={t.donations}>
                <input type="number" min={0}
                  value={filing.donations_eur || ''}
                  onChange={(e) => updateField('donations_eur', Number(e.target.value))}
                  placeholder="e.g. 500" className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white" />
              </FormField>
              <FormField label={t.privatePension}>
                <input type="number" min={0}
                  value={filing.private_pension_eur || ''}
                  onChange={(e) => updateField('private_pension_eur', Number(e.target.value))}
                  placeholder="e.g. 0" className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white" />
              </FormField>
              <FormField label={t.medicalCosts}>
                <input type="number" min={0}
                  value={filing.medical_costs_eur || ''}
                  onChange={(e) => updateField('medical_costs_eur', Number(e.target.value))}
                  placeholder="e.g. 0" className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white" />
              </FormField>
              <FormField label={t.disabilityCosts}>
                <input type="number" min={0}
                  value={filing.disability_costs_eur || ''}
                  onChange={(e) => updateField('disability_costs_eur', Number(e.target.value))}
                  placeholder="e.g. 0" className="w-full px-3 py-2.5 rounded-xl border-1.5 border-border text-sm text-text bg-white" />
              </FormField>
            </div>
          </div>
        )}

        {/* ── Step 5 — Results ────────────────────────────────────────────── */}
        {currentStep === 5 && result && (
          <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
            <ResultBreakdown result={result} filing={filing} t={t} lang={lang} />

            {/* Action buttons */}
            <div className="flex gap-2.5 flex-wrap">
              <button
                onClick={handleExport}
                className="flex-1 min-w-[160px] p-3.5 rounded-xl border-none bg-primary text-white text-sm font-bold cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {t.exportXml}
              </button>
            </div>

            {/* AI chat about results */}
            <TaxChat filing={filing} result={result} t={t} />

            <p className="text-[11px] text-[#9CA3AF] leading-relaxed text-center">
              {t.disclaimer}
            </p>
          </div>
        )}

        {currentStep === 5 && !result && (
          <div className="bg-white rounded-2xl p-10 text-center border border-border">
            <p className="text-[15px] text-[#9CA3AF]">
              Please go back and enter your income to see results.
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between gap-3">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="px-6 py-3 rounded-xl border-1.5 border-border bg-white text-[#374151] text-sm font-semibold cursor-pointer transition-colors hover:bg-[#F9FAFB]"
            >
              ← {t.back}
            </button>
          )}
          {currentStep < 5 && (
            <button
              onClick={nextStep}
              className="ml-auto px-8 py-3 rounded-xl border-none bg-primary text-white text-sm font-bold cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.next} →
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center flex flex-col gap-2 pt-2">
          <p className="text-[11px] text-[#9CA3AF] leading-relaxed max-w-[560px] mx-auto">
            Calculations based on official 2025 rates. This tool provides guidance only — not tax advice.
          </p>
          <p className="text-[11px] text-[#9CA3AF]">
            <FooterLink href="https://www.bundesfinanzministerium.de" label="BMF" />
            {' · '}
            <FooterLink href="https://www.elster.de" label="ELSTER" />
            {' · '}
            <FooterLink href="https://www.bzst.de" label="BZSt" />
          </p>
        </div>
        </>
        )}
      </main>
    </div>
  );
}
