import { NextRequest, NextResponse } from 'next/server';
import { TaxFiling, TaxResult } from '@/types';

// POST /api/export — generates an ELSTER-compatible XML file.
// This is a simplified representation of the ERiC XML schema.
// A full ELSTER integration requires the ERiC library (C library, complex setup).
// For portfolio purposes this demonstrates the data structure and format
// that would be submitted to the Finanzamt.
export async function POST(req: NextRequest) {
  try {
    const { filing, result }: { filing: TaxFiling; result: TaxResult } = await req.json();

    const xml = generateElsterXml(filing, result);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="steuererklaerung-${filing.tax_year}.xml"`,
      },
    });
  } catch (error) {
    console.error('XML export failed:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function generateElsterXml(filing: TaxFiling, result: TaxResult): string {
  const now = new Date().toISOString();

  // Simplified ELSTER ESt 1A XML structure.
  // Real ELSTER XML uses the ERiC schema with digital signatures.
  // This demonstrates the data mapping without the cryptographic layer.
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Steuererklärung Buddy — ELSTER Export (vereinfacht) -->
<!-- Steuerart: ESt | Veranlagungszeitraum: ${filing.tax_year} -->
<!-- Erstellt: ${now} -->
<!-- HINWEIS: Diese Datei dient der Orientierung. Für die offizielle -->
<!-- Einreichung verwenden Sie ELSTER unter www.elster.de -->
<Elster xmlns="http://www.elster.de/elsterxml/schema/v12">
  <TransferHeader>
    <Verfahren>ElsterAnmeldung</Verfahren>
    <DatenArt>ESt</DatenArt>
    <Vorgang>send-Auth</Vorgang>
    <Erstellungsdatum>${now.split('T')[0]}</Erstellungsdatum>
    <Erstellungszeit>${now.split('T')[1].split('.')[0]}</Erstellungszeit>
    <SoftwareVersion>SteuererklaerungBuddy_1.0</SoftwareVersion>
  </TransferHeader>
  <DatenTeil>
    <Nutzdatenblock>
      <NutzdatenHeader>
        <Empfaenger id="F">${filing.bundesland.toUpperCase()}</Empfaenger>
        <Hersteller>
          <ProduktName>Steuererklärung Buddy</ProduktName>
          <ProduktVersion>1.0.0</ProduktVersion>
        </Hersteller>
      </NutzdatenHeader>
      <Nutzdaten>
        <Anmeldungssteuern art="ESt" version="202501">
          <Steuerfall>
            <ESt>
              <!-- Allgemeine Angaben -->
              <Veranlagungszeitraum>${filing.tax_year}</Veranlagungszeitraum>
              <Familienstand>${filing.marital_status}</Familienstand>
              <Steuerklasse>${filing.tax_class}</Steuerklasse>
              <Bundesland>${filing.bundesland}</Bundesland>
              <Kirchenmitglied>${filing.church_member ? 'true' : 'false'}</Kirchenmitglied>
              <AnzahlKinder>${filing.child_count}</AnzahlKinder>

              <!-- Einkommen -->
              <Bruttoarbeitslohn>${Math.round(filing.gross_income_eur * 100)}</Bruttoarbeitslohn>
              <EinbehalteneLohnsteuer>${Math.round(filing.income_tax_paid_eur * 100)}</EinbehalteneLohnsteuer>
              <EinbehalteneSoli>${Math.round(filing.solidarity_surcharge_paid_eur * 100)}</EinbehalteneSoli>
              <EinbehalteneKirchensteuer>${Math.round(filing.church_tax_paid_eur * 100)}</EinbehalteneKirchensteuer>
              ${filing.freelance_income_eur > 0 ? `
              <FreiberuflicheEinkuenfte>${Math.round(filing.freelance_income_eur * 100)}</FreiberuflicheEinkuenfte>
              <Betriebsausgaben>${Math.round(filing.freelance_expenses_eur * 100)}</Betriebsausgaben>` : ''}

              <!-- Werbungskosten -->
              <Werbungskosten>
                <Homeoffice>
                  <Tage>${filing.home_office_days}</Tage>
                  <Betrag>${Math.round(Math.min(filing.home_office_days, 210) * 6 * 100)}</Betrag>
                </Homeoffice>
                <Entfernungspauschale>
                  <KilometerEinfach>${filing.commute_km}</KilometerEinfach>
                  <Arbeitstage>${filing.commute_days}</Arbeitstage>
                </Entfernungspauschale>
                <Arbeitsmittel>${Math.round(filing.work_equipment_eur * 100)}</Arbeitsmittel>
                <Fortbildung>${Math.round(filing.professional_training_eur * 100)}</Fortbildung>
                <Gewerkschaftsbeitraege>${Math.round(filing.union_fees_eur * 100)}</Gewerkschaftsbeitraege>
                <WerbungskostenGesamt>${Math.round(result.werbungskosten_total * 100)}</WerbungskostenGesamt>
              </Werbungskosten>

              <!-- Sonderausgaben -->
              <Sonderausgaben>
                <RiesterBeitraege>${Math.round(filing.riester_eur * 100)}</RiesterBeitraege>
                <Spenden>${Math.round(filing.donations_eur * 100)}</Spenden>
                <SonderausgabenGesamt>${Math.round(result.sonderausgaben_total * 100)}</SonderausgabenGesamt>
              </Sonderausgaben>

              <!-- Berechnungsergebnis -->
              <Berechnungsergebnis>
                <ZuVersteuerndesEinkommen>${Math.round(result.taxable_income * 100)}</ZuVersteuerndesEinkommen>
                <Einkommensteuer>${Math.round(result.income_tax_due * 100)}</Einkommensteuer>
                <Solidaritaetszuschlag>${Math.round(result.solidarity_surcharge_due * 100)}</Solidaritaetszuschlag>
                <Kirchensteuer>${Math.round(result.church_tax_due * 100)}</Kirchensteuer>
                <GesamtsteuerBetrag>${Math.round(result.total_tax_due * 100)}</GesamtsteuerBetrag>
                <VoraussichtlicheErstattung>${Math.round(result.refund_eur * 100)}</VoraussichtlicheErstattung>
                <VoraussichtlicheNachzahlung>${Math.round(result.additional_payment_eur * 100)}</VoraussichtlicheNachzahlung>
              </Berechnungsergebnis>
            </ESt>
          </Steuerfall>
        </Anmeldungssteuern>
      </Nutzdaten>
    </Nutzdatenblock>
  </DatenTeil>
</Elster>`;
}