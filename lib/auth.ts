import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';
import type { PortalSession, AdminSession } from '@/types';

const PORTAL_COOKIE = 'portal_session';
const ADMIN_COOKIE = 'admin_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
};

// ===== PORTAL AUTH =====

export async function validatePortalCode(code: string): Promise<{
  session: PortalSession | null;
  error: string | null;
}> {
  const normalizedCode = code.trim().toUpperCase();

  const { data: alphanaut, error } = await supabaseAdmin
    .from('alphanauts')
    .select(`
      id, name, role, is_active,
      alphanaut_blocks (
        block_id,
        role,
        blocks (slug)
      )
    `)
    .eq('access_code', normalizedCode)
    .single();

  if (error || !alphanaut) {
    return { session: null, error: 'Invalid access code. Please check your code and try again.' };
  }

  if (!alphanaut.is_active) {
    return { session: null, error: 'Your account is inactive. Please contact an admin.' };
  }

  const blockSlugs = (alphanaut.alphanaut_blocks || [])
    .map((ab: any) => ab.blocks?.slug)
    .filter(Boolean) as string[];

  const navigatorBlocks = (alphanaut.alphanaut_blocks || [])
    .filter((ab: any) => ab.role === 'navigator' && ab.blocks?.slug)
    .map((ab: any) => ab.blocks.slug as string);

  const session: PortalSession = {
    alphanaut_id: alphanaut.id,
    name: alphanaut.name,
    role: alphanaut.role,
    blocks: blockSlugs,
    navigatorBlocks,
  };

  return { session, error: null };
}

export async function setPortalSession(session: PortalSession): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(PORTAL_COOKIE, JSON.stringify(session), COOKIE_OPTIONS);
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const cookieStore = cookies();
  const cookie = cookieStore.get(PORTAL_COOKIE);

  if (!cookie?.value) return null;

  try {
    return JSON.parse(cookie.value) as PortalSession;
  } catch {
    return null;
  }
}

export async function clearPortalSession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(PORTAL_COOKIE);
}

// ===== ADMIN AUTH =====

export async function validateAdminCredentials(
  username: string,
  password: string
): Promise<{ session: AdminSession | null; error: string | null }> {
  // Check environment variables first (for initial setup)
  const envUsername = process.env.ADMIN_USERNAME || 'admin';
  const envPassword = process.env.ADMIN_PASSWORD || 'alphax2025';

  if (username === envUsername && password === envPassword) {
    const session: AdminSession = {
      admin_id: 'env-admin',
      username: envUsername,
      name: 'AlphaX Admin',
    };
    return { session, error: null };
  }

  // Check DB for additional admins
  const { data: admin, error } = await supabaseAdmin
    .from('admins')
    .select('id, username, name, password_hash')
    .eq('username', username)
    .single();

  if (error || !admin) {
    return { session: null, error: 'Invalid username or password.' };
  }

  const bcrypt = await import('bcryptjs');
  const valid = await bcrypt.compare(password, admin.password_hash);

  if (!valid) {
    return { session: null, error: 'Invalid username or password.' };
  }

  const session: AdminSession = {
    admin_id: admin.id,
    username: admin.username,
    name: admin.name,
  };

  return { session, error: null };
}

export async function setAdminSession(session: AdminSession): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE, JSON.stringify(session), COOKIE_OPTIONS);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE);

  if (!cookie?.value) return null;

  try {
    return JSON.parse(cookie.value) as AdminSession;
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
