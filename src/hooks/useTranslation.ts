'use client';

import { useState } from 'react';
import { t, Language, T } from '@/data/translations';

// Initialise language directly from localStorage to avoid setState-in-effect.
// getItem returns null in SSR (no localStorage) so we default to 'en' safely.
function getInitialLang(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('steuer_lang');
  if (stored === 'en' || stored === 'de') return stored;
  return 'en';
}

export function useTranslation() {
  const [lang, setLang] = useState<Language>(getInitialLang);

  function toggleLang() {
    const next: Language = lang === 'en' ? 'de' : 'en';
    setLang(next);
    localStorage.setItem('steuer_lang', next);
  }

  return { t: t[lang] as T, lang, toggleLang };
}