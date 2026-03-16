import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession, getPortalSession } from '@/lib/auth';

export async function getKbAuthContext() {
  const adminSession = await getAdminSession();
  const portalSession = await getPortalSession();

  const userId = portalSession?.alphanaut_id || null;
  const isKbPortalUser =
    !!portalSession &&
    (portalSession.role === 'co-captain' || portalSession.blocks.includes('knowledge-bridge'));

  return {
    adminSession,
    portalSession,
    userId,
    isKbPortalUser,
  };
}

export async function getSectionNavigatorIds() {
  const { data } = await supabaseAdmin
    .from('kb_section_navigators')
    .select('section, alphanaut_id');

  const map: Record<'translation' | 'simplification', string | null> = {
    translation: null,
    simplification: null,
  };

  (data || []).forEach((row: any) => {
    if (row.section === 'translation' || row.section === 'simplification') {
      const section = row.section as 'translation' | 'simplification';
      map[section] = row.alphanaut_id || null;
    }
  });

  return map;
}

export async function isSectionNavigator(userId: string, section: 'translation' | 'simplification') {
  const { data } = await supabaseAdmin
    .from('kb_section_navigators')
    .select('alphanaut_id')
    .eq('section', section)
    .single();

  return !!data?.alphanaut_id && data.alphanaut_id === userId;
}

export async function isSubgroupLeader(userId: string, subgroupId: string) {
  const { data } = await supabaseAdmin
    .from('kb_subgroups')
    .select('id')
    .eq('id', subgroupId)
    .eq('leader_id', userId)
    .single();

  return !!data;
}

export async function isSubgroupMember(userId: string, subgroupId: string) {
  const { data } = await supabaseAdmin
    .from('kb_subgroup_members')
    .select('subgroup_id')
    .eq('subgroup_id', subgroupId)
    .eq('alphanaut_id', userId)
    .single();

  return !!data;
}
