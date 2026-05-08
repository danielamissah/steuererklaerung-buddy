# Steuererklärung Buddy

> A guided German tax return wizard with live refund estimation, Werbungskosten optimizer, Lohnsteuerbescheinigung OCR, ELSTER XML export, and AI-powered result explanations. Built for employees and freelancers in Germany. Free, in English and German.

The average German employee is owed over €1,095 in tax refunds — and most never claim it because the process is confusing, the forms are in dense German legalese, and the official ELSTER tool assumes you already understand the system. This app removes every barrier between you and your refund.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Web-blue)

---

## Live Demo

🔗 [steuererklaerung-buddy.vercel.app](https://steuererklaerung-buddy.vercel.app/)

---

## The Problem

Germany's income tax system is one of the most complex in the world. It uses a continuously progressive formula (not a bracket table), five income zones, a solidarity surcharge with a transitional phase-in, Kirchensteuer that varies by Bundesland, Ehegattensplitting for married couples, a Kinderfreibetrag that requires a Günstigerprüfung against received Kindergeld, and over 30 categories of deductible expenses across Werbungskosten and Sonderausgaben.

Most employees are overtaxed throughout the year because their payroll tax (Lohnsteuer) is calculated without accounting for deductible expenses. A tax return corrects this — but only if you file one. The average refund for those who do file is  **€1,095** .

The barriers to filing are real:

* ELSTER requires a tax certificate (ELSTER Zertifikat), a registered account, and assumes familiarity with the form structure
* Commercial tools like Taxfix and Wundertax oversimplify and miss edge cases
* Most guides are written in German for people who already understand the system
* New arrivals and expats have no accessible English-language tool that handles the German specifics correctly

This app solves all of that.

---

## Features

* **5-step guided wizard** — walks through employment situation, income, Werbungskosten, Sonderausgaben, and results with clear English explanations at every step
* **Live refund meter** — updates in real time as fields are completed; the refund estimate is always visible so users understand the impact of each deduction
* **Lohnsteuerbescheinigung OCR** — drag and drop a photo or scan of your salary certificate; Google Cloud Vision extracts the key figures (gross income, Lohnsteuer paid, Soli, Kirchensteuer) automatically
* **Werbungskosten optimizer** — 10 smart deduction suggestions based on what you have already entered; items already covered are filtered out; each suggestion includes the legal basis (EStG paragraph) and a one-click add button
* **AI result explainer** — contextual chat powered by Groq (Llama 3.3 70B); the model knows your exact filing numbers and explains why your refund is what it is and how to improve it next year
* **ELSTER XML export** — downloads a structured XML file in the ELSTER ESt 1A schema format for reference and manual submission
* **Freelancer support** — separate income and expense fields for Freiberufler and self-employed users with Gewinn calculation
* **Ehegattensplitting** — married couples automatically use the Splitting-Verfahren (income halved, tax doubled) which produces a lower combined tax
* **Kinderfreibetrag Günstigerprüfung** — automatically compares whether the child allowance saves more tax than received Kindergeld and applies whichever is more favourable
* **Solidarity surcharge transitional zone** — correctly implements the 2021 Soli reform including the Milderungszone for incomes just above the exemption threshold
* **English and German** — full translation of all wizard steps, labels, hints, and results; toggle persists via localStorage
* **Mobile responsive** — fluid layout using CSS clamp() and auto-fit grids

---

## How the Tax Calculation Works

The calculation engine (`src/lib/taxEngine.ts`) implements the §32a EStG formula directly. Germany uses a continuously progressive function — not a bracket table — so the marginal rate increases smoothly within each zone.

### The five income zones (2025)

```
Zone 1: Income ≤ €12,096 (Grundfreibetrag)
         → Tax = €0

Zone 2: €12,096 < Income ≤ €17,005
         → y = (Income − 12,096) / 10,000
         → Tax = (979.18 × y + 1,400) × y

Zone 3: €17,005 < Income ≤ €66,760
         → y = (Income − 17,005) / 10,000
         → Tax = (192.59 × y + 2,397) × y + 966.53

Zone 4: €66,760 < Income ≤ €277,825
         → Tax = 0.42 × Income − 10,602.13

Zone 5: Income > €277,825 (Reichensteuer)
         → Tax = 0.45 × Income − 18,936.88
```

### Ehegattensplitting

For married couples, the taxable income is halved before applying the formula, then the result is doubled. This reduces the effective rate because both halves fall into lower zones.

```
Tax (married) = calculateIncomeTax(taxableIncome / 2) × 2
```

### Werbungskosten deduction

Work-related expenses are only beneficial above the Arbeitnehmer-Pauschbetrag of €1,230. The engine calculates the total and applies the Pauschbetrag minimum:

```
homeOffice     = min(days, 210) × €6/day
commute        = km × €0.30/day × days  (€0.38/km beyond 20km)
equipment      = direct deduction
training       = direct deduction
union fees     = direct deduction

total = max(sum of above, €1,230 Pauschbetrag)
```

### Kinderfreibetrag Günstigerprüfung

```
taxWithKinderfreibetrag  = calculateIncomeTax(income − (€6,612 × children))
taxWithout               = calculateIncomeTax(income)
taxSaving                = taxWithout − taxWithKinderfreibetrag
kindergeldReceived        = €250 × 12 × children

if taxSaving > kindergeldReceived:
    apply Kinderfreibetrag  ← more beneficial
else:
    keep Kindergeld as received  ← default for most
```

### Example calculation — single employee, Berlin, €45,000 gross

```
Input:
  Gross income:          €45,000
  Tax class:             I
  Lohnsteuer paid:       €8,245
  Soli paid:             €0  (below threshold since 2021 reform)
  Home office days:      100
  Commute:               12km × 200 days
  Work laptop:           €1,200

Calculation:
  Home office deduction: 100 × €6                = €600
  Commute deduction:     12km × €0.30 × 200 days = €720
  Work laptop:           €1,200
  Total Werbungskosten:  €2,520  (above €1,230 Pauschbetrag ✓)

  Taxable income:        €45,000 − €2,520 − €36 = €42,444
  Income tax due:        §32a Zone 3 formula     = €7,668
  Soli due:              €0  (income tax below €18,130 threshold)

  Tax paid:              €8,245
  Tax due:               €7,668
  Refund:                €577
```

---

## OCR — Reading your Lohnsteuerbescheinigung

The Lohnsteuerbescheinigung is a standardised form issued by every German employer. By law, the fields are always in the same numbered positions:

| Field        | Content                                       |
| ------------ | --------------------------------------------- |
| 3            | Bruttoarbeitslohn (gross income)              |
| 4            | Einbehaltene Lohnsteuer (income tax withheld) |
| 5            | Solidaritätszuschlag                         |
| 6            | Kirchensteuer                                 |
| Steuerklasse | Tax class (1–6)                              |

When you upload an image, the app sends it to the Google Cloud Vision TEXT_DETECTION API with a German language hint. The returned text is normalised (German decimal comma → dot, thousand separators removed) and then parsed with field-specific regex patterns. Confidence is scored at 0.25 per successfully extracted field.

The extracted values pre-fill the income step. You can review and correct them before continuing.

---

## Project Structure

```
steuererklaerung-buddy/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts          # Groq AI result explainer
│   │   │   ├── estimate/route.ts      # Server-side tax calculation
│   │   │   ├── export/route.ts        # ELSTER XML generation
│   │   │   ├── ocr/route.ts           # Lohnsteuerbescheinigung OCR
│   │   │   └── health/route.ts        # Health check endpoint
│   │   ├── layout.tsx                 # Inter font, SEO metadata
│   │   ├── page.tsx                   # Full 5-step wizard UI
│   │   └── globals.css                # CSS variables, slider styles
│   ├── components/
│   │   ├── FormField.tsx              # Label + hint + error wrapper
│   │   ├── LanguageToggle.tsx         # EN / DE pill toggle
│   │   ├── LohnsteuerUpload.tsx       # Drag-and-drop OCR upload
│   │   ├── RefundMeter.tsx            # Live refund display card
│   │   ├── ResultBreakdown.tsx        # Full calculation table + drivers
│   │   ├── StepIndicator.tsx          # Wizard progress bar
│   │   ├── TaxChat.tsx                # Contextual AI chat
│   │   └── WerbungskostenSuggestions.tsx  # One-click deduction adder
│   ├── data/
│   │   ├── taxConstants.ts            # 2025 official rates — update each January
│   │   ├── translations.ts            # All UI strings in EN and DE
│   │   └── werbungskosten.ts          # 10 deduction suggestions with legal basis
│   ├── hooks/
│   │   ├── useTaxForm.ts              # Form state + live recalculation
│   │   └── useTranslation.ts          # Language state + localStorage
│   ├── lib/
│   │   ├── supabase.ts                # Supabase client (auth + saving)
│   │   └── taxEngine.ts              # Pure TypeScript tax calculation engine
│   └── types/
│       └── index.ts                   # Shared TypeScript interfaces
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                     # Type check, lint, build, Docker verify
│   │   └── lighthouse.yml             # SEO and performance audit on PRs
│   ├── dependabot.yml
│   └── pull_request_template.md
├── Dockerfile                         # Multi-stage production image
├── docker-compose.yml
├── lighthouserc.js
└── vercel.json                        # Frankfurt region, security headers
```

---

## Tech Stack

| Layer        | Technology                    | Why                                                                                 |
| ------------ | ----------------------------- | ----------------------------------------------------------------------------------- |
| Framework    | Next.js 15 (App Router)       | SSR for SEO — tax guides must rank on Google                                       |
| Language     | TypeScript (strict)           | Type-safe calculation engine; incorrect tax math is a user trust issue              |
| Font         | Inter (Google Fonts)          | Clean, highly legible for financial data at all sizes                               |
| Tax engine   | Custom TypeScript             | Pure functions, zero dependencies, unit-testable against official §32a EStG values |
| OCR          | Google Cloud Vision API       | Pre-trained German document model; TEXT_DETECTION with `languageHints: ['de']`    |
| AI explainer | Groq API (Llama 3.3 70B)      | Fast, free tier; model is grounded in the user's specific numbers via system prompt |
| File upload  | react-dropzone                | Accessible drag-and-drop with file type and size validation                         |
| i18n         | Custom hook + localStorage    | No library overhead; EN/DE with browser persistence                                 |
| Styling      | Inline styles + CSS variables | Full visual control; no Tailwind purge edge cases for financial UI                  |
| Hosting      | Vercel Frankfurt (fra1)       | EU data residency for financial data; zero-config CI/CD                             |
| CI           | GitHub Actions                | Type check, lint, build, Docker verify, Lighthouse SEO audit                        |
| Containers   | Docker multi-stage            | ~150MB production image; non-root user                                              |

---

## Getting Started

### Prerequisites

* Node.js 18+
* A [Google Cloud Vision API key](https://console.cloud.google.com/) (Vision API enabled)
* A [Groq API key](https://console.groq.com/) (free tier)

### Installation

```bash
git clone https://github.com/danielamissah/steuererklaerung-buddy.git
cd steuererklaerung-buddy
npm install
```

### Environment variables

```bash
cp .env.example .env.local
```

```
# Google Cloud Vision (OCR for Lohnsteuerbescheinigung)
GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key

# Groq (AI result explanations)
GROQ_API_KEY=your_groq_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000/).

---

## 2025 Tax Rates Reference

All rates are in `src/data/taxConstants.ts` — update this file each January.

| Parameter                  | Value                  | Source                 |
| -------------------------- | ---------------------- | ---------------------- |
| Grundfreibetrag            | €12,096               | §32a EStG             |
| Arbeitnehmer-Pauschbetrag  | €1,230                | §9a EStG              |
| Home office daily rate     | €6.00                 | §4 Abs. 5 Nr. 6b EStG |
| Home office max days       | 210 (€1,260)          | §4 Abs. 5 Nr. 6b EStG |
| Commute rate (first 20km)  | €0.30/km              | §9 Abs. 1 Nr. 4 EStG  |
| Commute rate (beyond 20km) | €0.38/km              | §9 Abs. 1 Nr. 4 EStG  |
| Soli exemption (single)    | €18,130 income tax    | §3 SolZG              |
| Soli rate                  | 5.5% of income tax     | §3 SolZG              |
| Kirchensteuer (BY, BW)     | 8% of income tax       | Landesrecht            |
| Kirchensteuer (all others) | 9% of income tax       | Landesrecht            |
| Kinderfreibetrag           | €6,612/child (couple) | §32 EStG              |
| Kindergeld                 | €250/month/child      | §66 EStG              |
| Riester max deduction      | €2,100/year           | §10a EStG             |
| Reichensteuer threshold    | €277,825              | §32a EStG             |

---

## Deduction Suggestions

The optimizer shows up to 10 deduction suggestions filtered to items the user has not yet entered. Each suggestion includes:

* The German legal name and English translation
* A plain-language description of what qualifies
* The typical annual amount for a German employee
* The relevant EStG paragraph (legal basis)
* Whether receipts are needed

| Suggestion                                    | Typical amount | Legal basis            |
| --------------------------------------------- | -------------- | ---------------------- |
| Home office (Homeoffice-Pauschale)            | €900/year     | §4 Abs. 5 Nr. 6b EStG |
| Commute (Entfernungspauschale)                | €660/year     | §9 Abs. 1 Nr. 4 EStG  |
| Work equipment (laptop, desk)                 | €500/year     | §9 Abs. 1 Nr. 6 EStG  |
| Professional training and courses             | €300/year     | §9 Abs. 1 Nr. 6 EStG  |
| Professional books and subscriptions          | €150/year     | §9 Abs. 1 Nr. 6 EStG  |
| Typical work clothing                         | €200/year     | §9 Abs. 1 Nr. 6 EStG  |
| Trade union fees                              | €250/year     | §9 Abs. 1 Nr. 3d EStG |
| Job application costs                         | €200/year     | §9 Abs. 1 Nr. 1 EStG  |
| Double household (doppelte Haushaltsführung) | €6,000/year   | §9 Abs. 1 Nr. 5 EStG  |
| Riester pension contributions                 | €1,200/year   | §10a EStG             |

---

## Key Design Decisions

**Why a web app and not mobile?**
Tax returns are completed at a desk, often with paper documents (Lohnsteuerbescheinigung, receipts) to hand. The OCR upload, multi-field form, and XML export are all desktop use cases. The app is fully mobile-responsive but the primary UX was designed for desktop.

**Why a custom tax engine instead of using ELSTER's ERiC library?**
The ERiC library is a compiled C library distributed by the Finanzamt with a complex integration process requiring registration and a digital certificate. For a portfolio app demonstrating tax knowledge and TypeScript precision, a custom engine implementing §32a EStG directly is more transparent, testable, and instructive. The engine is unit-testable against official ELSTER reference values. For production submission, the ELSTER XML export bridges the gap.

**Why Groq instead of OpenAI for the AI explainer?**
The free Groq tier handles all development and portfolio demo traffic. Llama 3.3 70B produces accurate, well-structured explanations of tax calculations. Switching to GPT-4o is a one-line model change if needed.

**Why inline styles instead of Tailwind for the financial UI?**
Financial interfaces require precise control over spacing, typography, and number alignment. Inline styles make every visual decision explicit, reviewable, and not dependent on Tailwind's purge configuration. The CSS custom properties provide design tokens without build-time overhead.

**Why is the tax engine client-side?**
The `calculateTax()` function runs in the browser for instant feedback as the user types. It also runs server-side in `/api/estimate` for the saved result. Both call the same pure TypeScript function — no duplication, no sync issues.

---

## Updating for a New Tax Year

All rates live in `src/data/taxConstants.ts`. Each January:

1. Update `GRUNDFREIBETRAG` — this changes almost every year
2. Update `ARBEITNEHMER_PAUSCHBETRAG` if changed
3. Update `HOME_OFFICE_DAILY` and `HOME_OFFICE_MAX_DAYS` if changed
4. Update `COMMUTE_RATE_KM` and `COMMUTE_RATE_KM_LONG` if changed
5. Update `SOLI_EXEMPTION_SINGLE` and `SOLI_EXEMPTION_MARRIED` if changed
6. Update `KINDERFREIBETRAG_PER_CHILD` and `KINDERGELD_MONTHLY`
7. Update the `year` field at the top of the constants object
8. Update the tax year in `src/hooks/useTaxForm.ts` default filing
9. Update metadata year references in `src/app/layout.tsx`
10. Run `npm run build` and verify a sample calculation against the official BMF tax calculator at https://www.bmf-steuerrechner.de

---

### Deployment

Vercel auto-deploys on every merge to `main`. Region: `fra1` (Frankfurt) for EU data residency. Financial data never leaves the EU.

---

## Roadmap

* [ ] Supabase auth — save and resume filings across sessions
* [ ] Multi-year support — file returns for 2022, 2023, 2024, 2025 (up to 4 years back)
* [ ] Anlage N deep-dive — double household, Arbeitnehmer-Sparzulage, Auslandstätigkeit
* [ ] Anlage G and S — full Gewerbe and Freiberufler profit calculation with depreciation
* [ ] Steuerberater marketplace — connect with verified tax advisors via Stripe
* [ ] Comparison mode — see what your refund would be with more deductions
* [ ] Direct ELSTER submission via ERiC library integration

---

## Disclaimer

All calculations are based on official 2025 rates from the Bundesministerium der Finanzen, §32a EStG, and related tax legislation. This tool provides estimates for informational purposes only and does not constitute tax advice. Actual tax liability is determined by the Finanzamt. For complex situations (multiple employers, foreign income, significant investments, business assets), consult a qualified Steuerberater.

---

## Sources

* [Bundesministerium der Finanzen — Einkommensteuer](https://www.bundesfinanzministerium.de/Web/DE/Themen/Steuern/Steuerarten/Einkommensteuer/einkommensteuer.html)
* [§32a EStG — Einkommensteuertarif](https://www.gesetze-im-internet.de/estg/__32a.html)
* [§9 EStG — Werbungskosten](https://www.gesetze-im-internet.de/estg/__9.html)
* [BMF Steuerrechner](https://www.bmf-steuerrechner.de/) — official reference calculator for verification
* [ELSTER](https://www.elster.de/) — official tax filing portal

---

## Contributing

Pull requests welcome, especially for:

* Corrections to tax calculation logic (cite the EStG paragraph)
* New Werbungskosten suggestions (with legal basis)
* Annual rate updates (with BMF source link)

Please open an issue first for significant changes.

---

## License

MIT — see [LICENSE](https://claude.ai/chat/LICENSE) for details.
