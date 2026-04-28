import { renderHook, act } from '@testing-library/react';
import { useTranslation } from './useTranslation';

describe('useTranslation Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  it('should initialize with English as default', () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.lang).toBe('en');
    expect(result.current.t.appName).toBe('Steuererklärung Buddy'); // Sanity check on translations
  });

  it('should load language from localStorage if available', () => {
    window.localStorage.setItem('steuer_lang', 'de');
    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.lang).toBe('de');
    expect(result.current.t.appName).toBe('Steuererklärung Buddy'); 
  });

  it('should fallback to default if invalid value in localStorage', () => {
    window.localStorage.setItem('steuer_lang', 'fr');
    const { result } = renderHook(() => useTranslation());
    
    expect(result.current.lang).toBe('en');
  });

  it('should toggle language and save to localStorage', () => {
    const { result } = renderHook(() => useTranslation());
    
    act(() => {
      result.current.toggleLang();
    });

    expect(result.current.lang).toBe('de');
    expect(window.localStorage.getItem('steuer_lang')).toBe('de');

    act(() => {
      result.current.toggleLang();
    });

    expect(result.current.lang).toBe('en');
    expect(window.localStorage.getItem('steuer_lang')).toBe('en');
  });
});
