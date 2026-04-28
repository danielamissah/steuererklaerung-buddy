'use client';

import { TaxResult } from '@/types';
import { formatEur } from '@/lib/taxEngine';

interface Props {
  result: TaxResult | null;
  t: any;
}

// Live refund meter — updates in real time as the user fills in the form.
// The large number is the most important element on the page — it is
// the primary motivator for completing the return accurately.
export function RefundMeter({ result, t }: Props) {
  if (!result) {
    return (
      <div className="bg-linear-to-br from-primary to-[#0A4A50] rounded-[20px] p-7 text-center text-white">
        <p className="text-[13px] opacity-70 mb-2">
          {t.refundLabel}
        </p>
        <p className="text-[42px] font-extrabold opacity-30">€ —</p>
        <p className="text-[12px] opacity-50 mt-2">
          Enter your income to see your estimate
        </p>
      </div>
    );
  }

  const isRefund = result.is_refund;
  const amount = isRefund ? result.refund_eur : result.additional_payment_eur;

  return (
    <div className={`rounded-[20px] p-7 text-center text-white transition-colors duration-400 shadow-xl ${
      isRefund 
        ? 'bg-linear-to-br from-primary to-[#0A4A50]' 
        : 'bg-linear-to-br from-amber-600 to-amber-800'
    }`}>
      <p className="text-[13px] opacity-75 mb-1.5 font-semibold">
        {isRefund ? t.refundLabel : t.additionalLabel}
      </p>
      <p className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-none mb-1 transition-all duration-300">
        {isRefund ? '+' : '-'}{formatEur(amount)}
      </p>
      <p className="text-[11px] opacity-60 mt-2">
        {t.disclaimer}
      </p>
    </div>
  );
}