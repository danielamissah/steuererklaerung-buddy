'use client';

import React from 'react';

interface Props {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

// Consistent form field wrapper — label, hint, error message.
// Used throughout the wizard to keep layout consistent across all steps.
export function FormField({ label, hint, error, required, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-[#374151] flex gap-1 items-center">
        {label}
        {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-[#9CA3AF] leading-relaxed">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-600">{error}</p>
      )}
    </div>
  );
}