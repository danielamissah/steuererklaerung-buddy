import { NextRequest, NextResponse } from 'next/server';
import { calculateTax } from '@/lib/taxEngine';
import { TaxFiling } from '@/types';

// POST /api/estimate — server-side tax calculation.
// The client also runs calculateTax() directly for instant feedback,
// but this endpoint provides a verified server-side result for
// saving and exporting.
export async function POST(req: NextRequest) {
  try {
    const filing: TaxFiling = await req.json();

    if (!filing.gross_income_eur && !filing.freelance_income_eur) {
      return NextResponse.json(
        { error: 'At least one income field is required' },
        { status: 400 }
      );
    }

    const result = calculateTax(filing);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Estimate calculation failed:', error);
    return NextResponse.json(
      { error: 'Calculation failed' },
      { status: 500 }
    );
  }
}