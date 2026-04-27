import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { TaxResult, TaxFiling } from '@/types';
import { formatEur } from '@/lib/taxEngine';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// System prompt grounded in German tax law.
// The model acts as a tax assistant explaining the user's specific result —
// not giving general advice but explaining why their numbers look the way they do.
function buildSystemPrompt(filing: TaxFiling, result: TaxResult): string {
  return `You are a helpful German tax assistant explaining a specific tax return estimate to a user.

The user's 2025 tax return shows:
- Gross income: ${formatEur(filing.gross_income_eur)}
- Tax class: ${filing.tax_class}
- Marital status: ${filing.marital_status}
- Taxable income: ${formatEur(result.taxable_income)}
- Income tax due: ${formatEur(result.income_tax_due)}
- Total tax paid: ${formatEur(result.total_tax_paid)}
- ${result.is_refund ? `Estimated refund: ${formatEur(result.refund_eur)}` : `Estimated additional payment: ${formatEur(result.additional_payment_eur)}`}
- Werbungskosten deducted: ${formatEur(result.werbungskosten_total)}

Your role:
- Explain WHY the refund or additional payment is this amount in plain language
- Explain what each deduction did to reduce their tax
- Suggest what they could do differently next year
- Cite specific BGB/EStG paragraphs when relevant
- Be encouraging — German taxes are confusing and the user is doing the right thing
- Respond in the same language the user writes in (English or German)
- Keep responses concise — 2-4 sentences per answer
- Always end with: "Remember this is an estimate — a Steuerberater can give you a binding calculation."`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, filing, result } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Chat service not configured' },
        { status: 500 }
      );
    }

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: buildSystemPrompt(filing, result) },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.4,
    });

    const reply = response.choices[0]?.message?.content;
    if (!reply) throw new Error('Empty response from model');

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat failed:', error);
    return NextResponse.json(
      { error: error.message || 'Chat failed' },
      { status: 500 }
    );
  }
}