import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface RateLimitResult {
  allowed: boolean;
  response?: NextResponse;
}

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.ip || 'unknown';
}

// Basic DB-backed sliding-window limiter using activity_log.
export async function checkWriteRateLimit(
  request: NextRequest,
  action: string,
  actorType: 'alphanaut' | 'admin',
  actorId?: string | null,
  maxRequests = 20,
  windowMinutes = 10
): Promise<RateLimitResult> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const ip = getClientIp(request);

    let query = supabaseAdmin
      .from('activity_log')
      .select('id', { count: 'exact', head: true })
      .eq('action', action)
      .gte('created_at', windowStart);

    if (actorId) {
      query = query.eq('actor_id', actorId);
    } else {
      query = query.eq('actor_type', actorType).contains('details', { ip });
    }

    const { count, error } = await query;
    if (error) {
      // Fail-open to avoid blocking core actions if logging table query fails.
      return { allowed: true };
    }

    if ((count || 0) >= maxRequests) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        ),
      };
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

export async function logActivity(params: {
  actorType: 'alphanaut' | 'admin';
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  const { actorType, actorId, action, entityType, entityId, details } = params;

  await supabaseAdmin.from('activity_log').insert({
    actor_type: actorType,
    actor_id: actorId || null,
    action,
    entity_type: entityType || null,
    entity_id: entityId || null,
    details: details || {},
  });
}
