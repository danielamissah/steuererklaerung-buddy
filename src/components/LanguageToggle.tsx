'use client';

interface Props {
  lang: string;
  onToggle: () => void;
}

export function LanguageToggle({ lang, onToggle }: Props) {
  const isEN = lang === 'en';
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle language"
      style={{
        display: 'flex', alignItems: 'center',
        border: '1.5px solid #0D5C63', borderRadius: '999px',
        overflow: 'hidden', padding: 0, background: 'white',
        cursor: 'pointer', fontFamily: 'var(--font-inter)',
      }}
    >
      <span style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 700, background: isEN ? '#0D5C63' : 'white', color: isEN ? 'white' : '#0D5C63' }}>EN</span>
      <span style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 700, background: !isEN ? '#0D5C63' : 'white', color: !isEN ? 'white' : '#0D5C63' }}>DE</span>
    </button>
  );
}