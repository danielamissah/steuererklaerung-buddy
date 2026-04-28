'use client';

import { useState } from 'react';
import { WERBUNGSKOSTEN_SUGGESTIONS } from '@/data/werbungskosten';
import { TaxFiling } from '@/types';
import { T } from '@/data/translations';
import { formatEur } from '@/lib/taxEngine';

interface Props {
  filing: TaxFiling;
  t: T;
  lang: string;
  onAdd: (field: keyof TaxFiling, amount: number) => void;
}

// Shows deductions the user may have missed, with one-click adding.
// Each suggestion shows the legal basis so users can verify independently.
// Items already added are marked as done and cannot be double-added.
export function WerbungskostenSuggestions({ filing, t, lang, onAdd }: Props) {
  const [added, setAdded] = useState<Set<string>>(new Set());

  // Filter out suggestions for things the user already has entered
  const relevant = WERBUNGSKOSTEN_SUGGESTIONS.filter((s) => {
    if (s.id === 'home_office' && filing.home_office_days > 0) return false;
    if (s.id === 'commute' && filing.commute_km > 0) return false;
    if (s.id === 'work_equipment' && filing.work_equipment_eur > 0) return false;
    if (s.id === 'professional_training' && filing.professional_training_eur > 0) return false;
    if (s.id === 'union_fees' && filing.union_fees_eur > 0) return false;
    if (s.id === 'riester' && filing.riester_eur > 0) return false;
    return true;
  });

  if (relevant.length === 0) return null;

  function handleAdd(suggestion: typeof WERBUNGSKOSTEN_SUGGESTIONS[0]) {
    // Map suggestion ID to the correct TaxFiling field
    const fieldMap: Record<string, keyof TaxFiling> = {
      work_equipment: 'work_equipment_eur',
      professional_training: 'professional_training_eur',
      professional_books: 'professional_training_eur',
      union_fees: 'union_fees_eur',
      work_clothing: 'work_clothing_eur',
      job_application: 'other_werbungskosten_eur',
      double_household: 'other_werbungskosten_eur',
      riester: 'riester_eur',
    };

    const field = fieldMap[suggestion.id] || 'other_werbungskosten_eur';
    onAdd(field, suggestion.typical_amount_eur);
    setAdded((prev) => new Set([...prev, suggestion.id]));
  }

  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-[15px] font-bold text-primary">
        {t.suggestionsTitle}
      </h3>
      {relevant.map((suggestion) => {
        const isAdded = added.has(suggestion.id);
        const label = lang === 'de' ? suggestion.label_de : suggestion.label_en;
        const description = lang === 'de' ? suggestion.description_de : suggestion.description_en;

        return (
          <div key={suggestion.id} className={`rounded-2xl p-4 border-1.5 flex flex-col sm:flex-row justify-between items-start gap-4 transition-all duration-200 ${
            isAdded 
              ? 'bg-primary-light border-primary' 
              : 'bg-white border-border'
          }`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-bold text-text">
                  {label}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-[#6B7280] font-medium">
                  {suggestion.legal_basis}
                </span>
              </div>
              <p className="text-[12px] text-[#6B7280] leading-relaxed mb-1">
                {description}
              </p>
              <p className="text-[12px] text-primary font-semibold">
                Typical: {formatEur(suggestion.typical_amount_eur)}/year
                {suggestion.requires_receipts && ' · Receipts recommended'}
              </p>
            </div>

            <button
              onClick={() => !isAdded && handleAdd(suggestion)}
              disabled={isAdded}
              className={`px-4 py-2 rounded-xl border-none text-[12px] font-bold transition-colors whitespace-nowrap self-end sm:self-start ${
                isAdded 
                  ? 'bg-primary text-white cursor-default' 
                  : 'bg-accent text-white cursor-pointer hover:bg-opacity-90'
              }`}
            >
              {isAdded ? '✓ Added' : t.addSuggestion}
            </button>
          </div>
        );
      })}
    </div>
  );
}