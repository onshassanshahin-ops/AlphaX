export type PublicLang = 'en' | 'ar';

export const PUBLIC_LANG_COOKIE = 'public_lang';

export function normalizePublicLang(value?: string | null): PublicLang {
  return value === 'ar' ? 'ar' : 'en';
}

export function t(lang: PublicLang, en: string, ar: string): string {
  return lang === 'ar' ? ar : en;
}

export function getPublicDir(lang: PublicLang): 'ltr' | 'rtl' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}
