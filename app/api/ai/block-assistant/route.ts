import { NextResponse } from 'next/server';
import { getPortalSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

function canAccessBlock(session: { role: string; blocks: string[] }, blockSlug: string) {
  if (session.role === 'co-captain') return true;
  if (blockSlug === 'asclepius-lab' || blockSlug === 'neuroscience') {
    return session.blocks.includes('asclepius-lab') || session.blocks.includes('neuroscience');
  }
  return session.blocks.includes(blockSlug);
}

export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { blockSlug?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const blockSlug = body.blockSlug || '';
  const message = body.message || '';

  if (!blockSlug) return NextResponse.json({ error: 'blockSlug is required' }, { status: 400 });
  if (!canAccessBlock(session, blockSlug)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [membersRes, tasksRes, suggestionsRes, settingsRes] = await Promise.all([
    supabaseAdmin
      .from('blocks')
      .select('id, name')
      .eq('slug', blockSlug)
      .single(),
    supabaseAdmin
      .from('block_tasks')
      .select('id, status, priority, deadline')
      .eq('block_slug', blockSlug)
      .limit(200),
    supabaseAdmin
      .from('block_suggestions')
      .select('id, status')
      .eq('block_slug', blockSlug)
      .limit(200),
    supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'ai_assistant_settings')
      .maybeSingle(),
  ]);

  const block = membersRes.data;
  const tasks = tasksRes.data || [];
  const suggestions = suggestionsRes.data || [];

  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const overdueTasks = tasks.filter(
    (t) => t.deadline && new Date(t.deadline).getTime() < Date.now() && t.status !== 'done'
  ).length;
  const openSuggestions = suggestions.filter((s) => s.status === 'open' || s.status === 'under_review').length;
  const completionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const aiSettings = (settingsRes.data?.value || {}) as {
    status_message?: string;
    prompts?: Record<string, string>;
  };

  const prompt = aiSettings.prompts?.[blockSlug] || 'AI advisor prompt is not configured yet.';

  return NextResponse.json({
    mode: 'coming_soon',
    message: aiSettings.status_message || 'Coming soon',
    reply: `Coming soon: block AI assistant is not connected to an LLM API yet.`,
    context: {
      blockSlug,
      blockName: block?.name || blockSlug,
      completionRate,
      overdueTasks,
      openSuggestions,
      totalTasks: tasks.length,
      prompt,
      navigatorInput: message,
    },
    suggestedPrompts: [
      'What should our top 3 priorities be this week?',
      'How can we reduce overdue tasks?',
      'What high-impact initiative should we launch next?',
    ],
  });
}
