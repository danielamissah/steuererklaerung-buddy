import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Steuererklärung Buddy — German Tax Return Calculator 2025',
  description:
    'Calculate your German tax refund for 2025. Free guided wizard, Werbungskosten optimizer, Lohnsteuerbescheinigung OCR, and ELSTER XML export. English and German.',
  keywords: [
    'steuererklärung 2025', 'german tax return', 'steuererstattung',
    'werbungskosten rechner', 'lohnsteuer erstattung', 'elster',
    'german tax calculator', 'steuer buddy',
  ],
  manifest: '/manifest.json',
  themeColor: '#0D5C63',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Steuer Buddy',
  },
  openGraph: {
    title: 'Steuererklärung Buddy — German Tax Return 2025',
    description: 'Find every deduction, calculate your refund, export to ELSTER.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}