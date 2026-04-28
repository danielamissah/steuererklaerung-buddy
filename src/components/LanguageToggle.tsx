'use client';

interface Props {
  lang: string;
  onToggle: () => void;
  label: string;
}

export function LanguageToggle({ lang, onToggle, label }: Props) {
  const isEN = lang === 'en';
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle language"
      className="flex items-center border-1.5 border-primary rounded-full overflow-hidden p-0 bg-white cursor-pointer font-inter"
    >
      <span className={`px-3 py-1 text-[12px] font-bold transition-colors ${isEN ? 'bg-primary text-white' : 'bg-white text-primary'}`}>EN</span>
      <span className={`px-3 py-1 text-[12px] font-bold transition-colors ${!isEN ? 'bg-primary text-white' : 'bg-white text-primary'}`}>DE</span>
    </button>
  );
}