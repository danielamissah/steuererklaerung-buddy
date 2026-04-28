'use client';

import { TaxResult } from '@/types';
import { formatEur, effectiveTaxRate } from '@/lib/taxEngine';
import { TaxFiling } from '@/types';
import { T } from '@/data/translations';

interface Props {
  result: TaxResult;
  filing: TaxFiling;
  t: T;
  lang: string;
}

// Full tax breakdown — shown on the results step.
// Every line item is labelled with its German name so users
// can cross-reference with their official Steuerbescheid.
export function ResultBreakdown({ result, filing, t, lang }: Props) {
  const fmt = formatEur;
  const rate = effectiveTaxRate(result, filing.gross_income_eur);

  const rows = [
    { label: t.taxableIncome, value: fmt(result.taxable_income), highlight: false },
    { label: t.incomeTaxDue, value: fmt(result.income_tax_due), highlight: false },
    { label: t.soliDue, value: fmt(result.solidarity_surcharge_due), highlight: false },
    ...(filing.church_member
      ? [{ label: t.kirchensteuerDue, value: fmt(result.church_tax_due), highlight: false }]
      : []),
    { label: t.totalTaxDue, value: fmt(result.total_tax_due), highlight: true },
    { label: t.totalTaxPaid, value: fmt(result.total_tax_paid), highlight: false },
    { label: t.effectiveRate, value: `${rate}%`, highlight: false },
  ];

  return (
    <div className="flex flex-col gap-4">

      {/* Refund drivers */}
      {result.drivers.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-xs">
          <h3 className="text-sm font-bold text-primary mb-3">
            {t.whatDroveit}
          </h3>
          {result.drivers.map((driver, i) => (
            <div key={i} className={`flex justify-between items-center py-2.5 ${
              i < result.drivers.length - 1 ? 'border-b border-gray-100' : ''
            }`}>
              <span className="text-[13px] text-[#4B5563]">
                {lang === 'de' ? driver.label_de : driver.label_en}
              </span>
              <span className={`text-sm font-bold ${
                driver.type === 'deduction' ? 'text-primary' : 'text-green-700'
              }`}>
                +{fmt(driver.amount_eur)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Full calculation table */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-xs">
        <h3 className="text-sm font-bold text-primary mb-3">
          Calculation details
        </h3>
        <div className="flex flex-col gap-0.5">
          {rows.map(({ label, value, highlight }) => (
            <div key={label} className={`flex justify-between items-center px-2.5 py-2 rounded-lg ${
              highlight ? 'bg-primary-light' : 'bg-transparent'
            }`}>
              <span className={`text-[13px] ${
                highlight ? 'text-primary font-bold' : 'text-[#4B5563] font-normal'
              }`}>
                {label}
              </span>
              <span className={`text-[13px] font-bold tabular-nums ${
                highlight ? 'text-primary' : 'text-text'
              }`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}