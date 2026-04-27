'use client';

import { useState, useEffect } from 'react';
import { t, Language, T } from '@/data/translations';

// Reads language preference from localStorage on mount.
// Defaults to English — primary audience is expats filing
// their first German tax return in an unfamiliar language.
export function useTranslation() {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem('steuer_lang') as Language | null;
    if (stored === 'en' || stored === 'de') setLang(stored);
  }, []);

  function toggleLang() {
    const next: Language = lang === 'en' ? 'de' : 'en';
    setLang(next);
    localStorage.setItem('steuer_lang', next);
  }

  return { t: t[lang] as T, lang, toggleLang };
}