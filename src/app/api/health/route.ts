import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'steuererklaerung-buddy',
    timestamp: new Date().toISOString(),
    tax_year: 2025,
  });
}