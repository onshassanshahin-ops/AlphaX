import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getKbAuthContext,
  getSectionNavigatorIds,
  isSectionNavigator,
  isSubgroupLeader,
} from '../_utils';

export async function GET(request: NextRequest) {
  const { adminSession, portalSession, userId, isKbPortalUser } = await getKbAuthContext();
  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '40'), 100);

  let query = supabaseAdmin
    .from('kb_workflows')
    .select(`
      *,
      creator:created_by(id, name),
      translation_subgroup:translation_subgroup_id(id, name, leader_id),
      simplification_subgroup:simplification_subgroup_id(id, name, leader_id),
      translation_navigator:translation_navigator_id(id, name),
      simplification_navigator:simplification_navigator_id(id, name)
    `)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (!adminSession && portalSession && userId && portalSession.role !== 'co-captain') {
    const navIds = await getSectionNavigatorIds();
    const isTranslationNav = navIds.translation === userId;
    const isSimplificationNav = navIds.simplification === userId;

    if (isTranslationNav || isSimplificationNav) {
      if (isTranslationNav && !isSimplificationNav) {
        query = query.or('status.eq.translation_in_progress,status.eq.translation_review,status.eq.changes_requested,status.eq.admin_review,status.eq.published');
      } else if (!isTranslationNav && isSimplificationNav) {
        query = query.or('status.eq.simplification_in_progress,status.eq.simplification_review,status.eq.admin_review,status.eq.changes_requested,status.eq.published');
      }
    } else {
      const { data: memberships } = await supabaseAdmin
        .from('kb_subgroup_members')
        .select('subgroup_id')
        .eq('alphanaut_id', userId);

      const subgroupIds = (memberships || []).map((m: any) => m.subgroup_id);
      if (subgroupIds.length === 0) {
        query = query.eq('status', 'published');
      } else {
        query = query.or(`translation_subgroup_id.in.(${subgroupIds.join(',')}),simplification_subgroup_id.in.(${subgroupIds.join(',')}),status.eq.published`);
      }
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workflows: data || [] });
}

export async function POST(request: NextRequest) {
  const { adminSession, portalSession, userId, isKbPortalUser } = await getKbAuthContext();
  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const titleAr = body.title_ar as string;
    const titleEn = body.title_en || null;
    const originalAuthors = body.original_authors || null;
    const descriptionAr = body.description_ar || null;
    const descriptionEn = body.description_en || null;
    const field = body.field || 'other';
    const sourceUrl = body.source_url || null;
    const translationSubgroupId = body.translation_subgroup_id || null;

    if (!titleAr) {
      return NextResponse.json({ error: 'Arabic title is required' }, { status: 400 });
    }

    if (!translationSubgroupId) {
      return NextResponse.json({ error: 'Translation subgroup is required' }, { status: 400 });
    }

    if (!adminSession && portalSession && userId) {
      const isNav =
        portalSession.role === 'co-captain' ||
        (await isSectionNavigator(userId, 'translation'));
      const isLeader = await isSubgroupLeader(userId, translationSubgroupId);

      if (!isNav && !isLeader) {
        return NextResponse.json(
          { error: 'Only translation navigator or subgroup leader can create workflow cards.' },
          { status: 403 }
        );
      }
    }

    const sectionNavigators = await getSectionNavigatorIds();

    const { data: workflow, error } = await supabaseAdmin
      .from('kb_workflows')
      .insert({
        title_ar: titleAr,
        title_en: titleEn,
        original_authors: originalAuthors,
        description_ar: descriptionAr,
        description_en: descriptionEn,
        field,
        source_url: sourceUrl,
        translation_subgroup_id: translationSubgroupId,
        created_by: userId,
        translation_navigator_id: sectionNavigators.translation,
        simplification_navigator_id: sectionNavigators.simplification,
        status: 'translation_in_progress',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ workflow, success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}
