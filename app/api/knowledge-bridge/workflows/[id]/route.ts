import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getKbAuthContext,
  isSectionNavigator,
  isSubgroupLeader,
} from '../../_utils';

async function getWorkflow(id: string) {
  const { data } = await supabaseAdmin.from('kb_workflows').select('*').eq('id', id).single();
  return data;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { adminSession, isKbPortalUser } = await getKbAuthContext();
  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('kb_workflows')
    .select(`
      *,
      creator:created_by(id, name),
      translation_subgroup:translation_subgroup_id(id, name, leader_id),
      simplification_subgroup:simplification_subgroup_id(id, name, leader_id),
      translation_navigator:translation_navigator_id(id, name),
      simplification_navigator:simplification_navigator_id(id, name)
    `)
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ workflow: data });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { adminSession, portalSession, userId, isKbPortalUser } = await getKbAuthContext();
  if (!adminSession && !isKbPortalUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const workflow = await getWorkflow(params.id);
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const action = body.action as string | undefined;

    const isTranslationNavigator = !!(userId && (portalSession?.role === 'co-captain' || await isSectionNavigator(userId, 'translation')));
    const isSimplificationNavigator = !!(userId && (portalSession?.role === 'co-captain' || await isSectionNavigator(userId, 'simplification')));
    const isTranslationLeader = !!(userId && workflow.translation_subgroup_id && await isSubgroupLeader(userId, workflow.translation_subgroup_id));
    const isSimplificationLeader = !!(userId && workflow.simplification_subgroup_id && await isSubgroupLeader(userId, workflow.simplification_subgroup_id));

    const nowIso = new Date().toISOString();

    if (!action) {
      const allowed: Record<string, unknown> = {};
      if ('translated_file_url' in body) allowed.translated_file_url = body.translated_file_url || null;
      if ('simplified_file_url' in body) allowed.simplified_file_url = body.simplified_file_url || null;
      if ('translation_notes' in body) allowed.translation_notes = body.translation_notes || null;
      if ('simplification_notes' in body) allowed.simplification_notes = body.simplification_notes || null;
      if ('translation_subgroup_id' in body) allowed.translation_subgroup_id = body.translation_subgroup_id || null;
      if ('simplification_subgroup_id' in body) allowed.simplification_subgroup_id = body.simplification_subgroup_id || null;
      allowed.updated_at = nowIso;

      if (!adminSession && !(isTranslationNavigator || isSimplificationNavigator || isTranslationLeader || isSimplificationLeader)) {
        return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('kb_workflows')
        .update(allowed)
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ workflow: data, success: true });
    }

    if (action === 'submit_translation') {
      if (!adminSession && !isTranslationNavigator && !isTranslationLeader) {
        return NextResponse.json({ error: 'Only translation leader/navigator can submit translation.' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('kb_workflows')
        .update({
          status: 'translation_review',
          translated_file_url: body.translated_file_url || workflow.translated_file_url || null,
          translation_notes: body.translation_notes || workflow.translation_notes || null,
          updated_at: nowIso,
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ workflow: data, success: true });
    }

    if (action === 'approve_translation') {
      if (!adminSession && !isTranslationNavigator) {
        return NextResponse.json({ error: 'Only translation navigator can approve this stage.' }, { status: 403 });
      }

      const updates: Record<string, unknown> = {
        status: 'simplification_in_progress',
        updated_at: nowIso,
      };

      if (body.simplification_subgroup_id) {
        updates.simplification_subgroup_id = body.simplification_subgroup_id;
      }

      const { data, error } = await supabaseAdmin
        .from('kb_workflows')
        .update(updates)
        .eq('id', params.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ workflow: data, success: true });
    }

    if (action === 'request_translation_changes') {
      if (!adminSession && !isTranslationNavigator) {
        return NextResponse.json({ error: 'Only translation navigator can request changes.' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('kb_workflows')
        .update({
          status: 'translation_in_progress',
          translation_notes: body.translation_notes || workflow.translation_notes || null,
          updated_at: nowIso,
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ workflow: data, success: true });
    }

    if (action === 'submit_simplification') {
      if (!adminSession && !isSimplificationNavigator && !isSimplificationLeader) {
        return NextResponse.json({ error: 'Only simplification leader/navigator can submit simplification.' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('kb_workflows')
        .update({
          status: 'simplification_review',
          simplified_file_url: body.simplified_file_url || workflow.simplified_file_url || null,
          simplification_notes: body.simplification_notes || workflow.simplification_notes || null,
          updated_at: nowIso,
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ workflow: data, success: true });
    }

    if (action === 'approve_simplification') {
      if (!adminSession && !isSimplificationNavigator) {
        return NextResponse.json({ error: 'Only simplification navigator can approve this stage.' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('kb_workflows')
        .update({
          status: 'admin_review',
          updated_at: nowIso,
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ workflow: data, success: true });
    }

    if (action === 'request_simplification_changes') {
      if (!adminSession && !isSimplificationNavigator) {
        return NextResponse.json({ error: 'Only simplification navigator can request changes.' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('kb_workflows')
        .update({
          status: 'simplification_in_progress',
          simplification_notes: body.simplification_notes || workflow.simplification_notes || null,
          updated_at: nowIso,
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ workflow: data, success: true });
    }

    if (action === 'admin_request_changes') {
      if (!adminSession) {
        return NextResponse.json({ error: 'Only admin can request final-stage changes.' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('kb_workflows')
        .update({
          status: 'changes_requested',
          admin_notes: body.admin_notes || null,
          updated_at: nowIso,
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ workflow: data, success: true });
    }

    if (action === 'admin_reject') {
      if (!adminSession) {
        return NextResponse.json({ error: 'Only admin can reject workflow cards.' }, { status: 403 });
      }

      const { data, error } = await supabaseAdmin
        .from('kb_workflows')
        .update({
          status: 'rejected',
          admin_notes: body.admin_notes || null,
          updated_at: nowIso,
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ workflow: data, success: true });
    }

    if (action === 'admin_approve') {
      if (!adminSession) {
        return NextResponse.json({ error: 'Only admin can publish workflow cards.' }, { status: 403 });
      }

      const paperPayload = {
        title_ar: workflow.title_ar,
        title_en: workflow.title_en,
        original_authors: workflow.original_authors,
        description_ar: workflow.description_ar,
        description_en: workflow.description_en,
        field: workflow.field || 'other',
        file_url: workflow.simplified_file_url || workflow.translated_file_url || null,
        status: 'published',
        submitted_by: workflow.created_by,
        published_at: nowIso,
        navigator_notes: workflow.simplification_notes || workflow.translation_notes || null,
      };

      let paperId = workflow.paper_id;

      if (paperId) {
        const { error: paperUpdateError } = await supabaseAdmin
          .from('papers')
          .update(paperPayload)
          .eq('id', paperId);
        if (paperUpdateError) {
          return NextResponse.json({ error: paperUpdateError.message }, { status: 500 });
        }
      } else {
        const { data: paper, error: paperInsertError } = await supabaseAdmin
          .from('papers')
          .insert(paperPayload)
          .select('id')
          .single();
        if (paperInsertError) {
          return NextResponse.json({ error: paperInsertError.message }, { status: 500 });
        }
        paperId = paper.id;
      }

      const { data, error } = await supabaseAdmin
        .from('kb_workflows')
        .update({
          status: 'published',
          paper_id: paperId,
          admin_notes: body.admin_notes || null,
          updated_at: nowIso,
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ workflow: data, success: true, paper_id: paperId });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }
}
