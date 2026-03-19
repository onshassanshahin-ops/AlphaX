import { cookies } from 'next/headers';
import { normalizePublicLang, type PublicLang, PUBLIC_LANG_COOKIE } from '@/lib/public-lang';

export function getPublicLang(): PublicLang {
  const value = cookies().get(PUBLIC_LANG_COOKIE)?.value;
  return normalizePublicLang(value);
}
