import { NextRequest, NextResponse } from 'next/server';
import { LohnsteuerOCRResult } from '@/types';

// POST /api/ocr — extracts figures from a Lohnsteuerbescheinigung image.
// Uses Google Cloud Vision API for text detection, then applies
// regex patterns to find the specific numbered fields on the form.
//
// Lohnsteuerbescheinigung field numbers (standardised by law):
// Field 3: Bruttolohn (gross income)
// Field 4: Einbehaltene Lohnsteuer (income tax withheld)
// Field 5: Solidaritätszuschlag (solidarity surcharge)
// Field 6: Kirchensteuer (church tax)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      return NextResponse.json(
        { error: 'OCR service not configured' },
        { status: 500 }
      );
    }

    // Convert file to base64 for Google Cloud Vision API
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // Call Google Cloud Vision TEXT_DETECTION
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
            imageContext: { languageHints: ['de'] },
          }],
        }),
      }
    );

    const visionData = await visionResponse.json();
    const rawText: string = visionData.responses?.[0]?.fullTextAnnotation?.text || '';

    if (!rawText) {
      return NextResponse.json({
        confidence: 0,
        raw_text: '',
        error: 'No text detected in image',
      } satisfies Partial<LohnsteuerOCRResult>);
    }

    // Extract fields using patterns found on German Lohnsteuerbescheinigungen.
    // The form has standardised numbered boxes that appear consistently
    // across all German employers.
    const result = extractLohnsteuerFields(rawText);
    return NextResponse.json(result);

  } catch (error) {
    console.error('OCR failed:', error);
    return NextResponse.json(
      { error: 'OCR processing failed' },
      { status: 500 }
    );
  }
}

function extractLohnsteuerFields(text: string): LohnsteuerOCRResult {
  // Normalise: replace commas with dots for German number format,
  // collapse whitespace
  const normalised = text
    .replace(/\./g, '')      // remove thousand separators
    .replace(/,/g, '.')      // German decimal comma → dot
    .replace(/\s+/g, ' ');

  let fieldsFound = 0;

  // Field 3 — Bruttoarbeitslohn (gross income)
  const grossMatch = normalised.match(
    /(?:3\s*\.?\s*Bruttoarbeitslohn|Bruttolohn|Gesamtbrutto)[^\d]*(\d{1,6}(?:\.\d{2})?)/i
  );
  const gross_income = grossMatch ? parseFloat(grossMatch[1]) : undefined;
  if (gross_income) fieldsFound++;

  // Field 4 — Einbehaltene Lohnsteuer
  const lohnsteuerMatch = normalised.match(
    /(?:4\s*\.?\s*Lohnsteuer|Einbehaltene\s+Lohnsteuer)[^\d]*(\d{1,6}(?:\.\d{2})?)/i
  );
  const income_tax_paid = lohnsteuerMatch ? parseFloat(lohnsteuerMatch[1]) : undefined;
  if (income_tax_paid) fieldsFound++;

  // Field 5 — Solidaritätszuschlag
  const soliMatch = normalised.match(
    /(?:5\s*\.?\s*Solidarit|Soli)[^\d]*(\d{1,5}(?:\.\d{2})?)/i
  );
  const solidarity_surcharge_paid = soliMatch ? parseFloat(soliMatch[1]) : undefined;
  if (solidarity_surcharge_paid) fieldsFound++;

  // Field 6 — Kirchensteuer
  const kirchenMatch = normalised.match(
    /(?:6\s*\.?\s*Kirchen|Kirchensteuer)[^\d]*(\d{1,5}(?:\.\d{2})?)/i
  );
  const church_tax_paid = kirchenMatch ? parseFloat(kirchenMatch[1]) : undefined;
  if (church_tax_paid) fieldsFound++;

  // Tax class — single digit 1–6 near "Steuerklasse"
  const taxClassMatch = normalised.match(/Steuerklasse[^\d]*([1-6])/i);
  const tax_class = taxClassMatch ? taxClassMatch[1] : undefined;

  // Confidence: 0.25 per field found (4 key fields)
  const confidence = Math.min(fieldsFound / 4, 1);

  return {
    gross_income,
    income_tax_paid,
    solidarity_surcharge_paid,
    church_tax_paid,
    tax_class,
    confidence,
    raw_text: text.slice(0, 500), // truncate for response size
  };
}