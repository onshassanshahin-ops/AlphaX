'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PortalLayout from '@/components/layout/PortalLayout';
import TasksPanel from '@/components/portal/TasksPanel';
import InitiativesPanel from '@/components/portal/InitiativesPanel';
import SuggestionsPanel from '@/components/portal/SuggestionsPanel';
import BlockPulseStrip from '@/components/portal/BlockPulseStrip';
import RoleJourneyPanel from '@/components/portal/RoleJourneyPanel';
import NextActionsCard from '@/components/portal/NextActionsCard';
import BlockAIAssistant from '@/components/portal/BlockAIAssistant';
import Button from '@/components/ui/Button';
import { Radio, Plus, Send, Megaphone, Sparkles, Target, Waves } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PortalSession } from '@/types';

export default function ScienceCommPortalPage() {
  const router = useRouter();
  const [session, setSession] = useState<PortalSession | null>(null);
  const [blockMembers, setBlockMembers] = useState<{ id: string; name: string }[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'general' });
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    fetch('/api/auth/portal')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.session) { router.push('/portal'); return; }
        const s: PortalSession = data.session;
        if (s.role !== 'co-captain' && !s.blocks.includes('science-comm')) {
          router.push('/portal/dashboard');
          return;
        }
        setSession(s);
        const isNav = s.role === 'co-captain' || (s.navigatorBlocks || []).includes('science-comm');
        if (isNav) {
          fetch('/api/blocks/science-comm/members')
            .then(r => r.json())
            .then(d => setBlockMembers(d.members || []));
        }

        fetch('/api/announcements')
          .then(r => r.ok ? r.json() : { announcements: [] })
          .then((d) => {
            const announcements = d.announcements || [];
            setPublishedCount(announcements.filter((a: any) => !!a.is_published).length);
            setDraftCount(announcements.filter((a: any) => !a.is_published).length);
          });
      })
      .finally(() => setSessionLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { toast.error('Title and content are required'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, is_published: false }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      toast.success('Draft submitted for admin review!');
      setSubmitted(true);
      setForm({ title: '', content: '', type: 'general' });
    } catch {
      toast.error('Failed to submit draft');
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || !session) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan/20 border-t-cyan animate-spin" />
      </div>
    );
  }

  const isNavigator = session.role === 'co-captain' || (session.navigatorBlocks || []).includes('science-comm');

  return (
    <PortalLayout session={session}>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl p-7 border border-yellow-500/25 bg-gradient-to-r from-[#2f240a] via-dark to-[#1c1a10] portal-reveal portal-stagger-1">
          <div className="absolute -right-14 -top-14 w-72 h-72 rounded-full bg-yellow-500/10 blur-3xl" />
          <div className="absolute -left-16 -bottom-20 w-64 h-64 rounded-full bg-cyan/10 blur-3xl" />
          <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-xl">
              📡
            </div>
            <div>
              <h1 className="text-2xl font-bold font-grotesk text-white">Science Communication</h1>
              <p className="text-sm text-slate-400">
                {isNavigator ? 'Navigator Panel — Outreach & Content' : 'Outreach & Content Portal'}
              </p>
            </div>
          </div>
          {isNavigator && (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
              ⭐ Navigator
            </span>
          )}
          </div>
          <BlockPulseStrip
            items={[
              { label: 'Published Signals', value: publishedCount, tone: 'yellow' },
              { label: 'Pending Drafts', value: draftCount, tone: 'cyan' },
              { label: 'Team Members', value: blockMembers.length || '—', tone: 'purple' },
              { label: 'Role Focus', value: isNavigator ? 'Lead Narrative' : 'Contribute Stories', tone: 'orange' },
            ]}
          />
        </div>

        <BlockAIAssistant blockSlug="science-comm" blockName="Science Communication" />

        <RoleJourneyPanel
          title={isNavigator ? 'Navigator Broadcast Studio' : 'Alphanaut Story Experience'}
          icon={isNavigator ? Megaphone : Sparkles}
          iconClassName="text-yellow-400"
          containerClassName="border border-yellow-500/20"
          items={isNavigator
            ? [
                { title: 'Signal Strategy', desc: 'Set weekly campaign arc and align each draft to one clear audience.' },
                { title: 'Editorial Quality', desc: 'Review content for scientific clarity, tone, and actionability.' },
                { title: 'Release Cadence', desc: 'Convert approved ideas to initiatives and maintain posting rhythm.' },
              ]
            : [
                { title: 'Choose Theme', desc: 'Pick one focus area and connect it to real student impact.' },
                { title: 'Draft Clearly', desc: 'Write concise, evidence-backed content ready for navigator feedback.' },
                { title: 'Amplify', desc: 'Use suggestions and initiatives to turn one post into a content series.' },
              ]}
        />

        <NextActionsCard
          title={isNavigator ? 'Navigator Broadcast Next Actions' : 'Your Story Next Actions'}
          icon={Target}
          iconClassName="text-yellow-400"
          containerClassName="border border-yellow-500/20 bg-yellow-500/10"
          actions={isNavigator
            ? [
                { title: 'Approve One High-Signal Draft', hint: 'Prioritize evidence-backed content with clear audience fit.', href: '#science-draft', actionLabel: 'Open Draft Panel' },
                { title: 'Launch One Campaign Initiative', hint: 'Convert content direction into an execution initiative.', href: '#science-initiatives', actionLabel: 'Open Initiatives' },
                { title: 'Set Weekly CTA Pattern', hint: 'Keep one consistent call-to-action across this week posts.', href: '#science-calendar', actionLabel: 'Open Calendar' },
              ]
            : [
                { title: 'Draft One Focused Story', hint: 'Choose one audience and one message for your draft.', href: '#science-draft', actionLabel: 'Open Draft Panel' },
                { title: 'Add Supporting Evidence', hint: 'Include one data point or citation to boost credibility.', href: '#science-suggestions', actionLabel: 'Open Suggestions' },
                { title: 'Propose Follow-up Idea', hint: 'Suggest how this content can become a mini-series.', href: '#science-initiatives', actionLabel: 'Open Initiatives' },
              ]}
        />

        {/* Draft Announcement */}
        <div id="science-draft" className="glass-card rounded-2xl p-6 portal-reveal portal-stagger-2 panel-target">
          <h2 className="text-lg font-bold font-grotesk text-white mb-2 flex items-center gap-2">
            <Plus size={18} className="text-yellow-400" />
            Draft Announcement
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            Submit a draft announcement for admin review and publishing.
          </p>
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Send size={24} className="text-green-400" />
              </div>
              <p className="text-green-400 font-semibold mb-1">Draft submitted!</p>
              <p className="text-sm text-slate-500">An admin will review and publish it soon.</p>
              <button onClick={() => setSubmitted(false)} className="mt-4 text-cyan text-sm hover:text-white transition-colors">
                Submit another draft
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Announcement Title</label>
                <input type="text" required placeholder="Enter announcement title"
                  className="w-full form-input rounded-xl px-4 py-3 text-sm border border-cyan/20 bg-dark/80"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
                <select className="w-full form-input rounded-xl px-4 py-3 text-sm border border-cyan/20 bg-dark/80"
                  value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {['general', 'volunteer', 'event', 'research'].map((t) => (
                    <option key={t} value={t} className="bg-dark capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Content</label>
                <textarea required rows={6} placeholder="Write the announcement content..."
                  className="w-full form-input rounded-xl px-4 py-3 text-sm border border-cyan/20 bg-dark/80 resize-none"
                  value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
              <Button type="submit" loading={loading}>
                <Send size={16} />
                Submit Draft
              </Button>
            </form>
          )}
        </div>

        {/* Tasks / Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TasksPanel
            panelId="science-tasks"
            blockSlug="science-comm"
            alphanautId={session.alphanaut_id}
            isNavigator={isNavigator}
            blockMembers={blockMembers}
          />
          <SuggestionsPanel
            panelId="science-suggestions"
            blockSlug="science-comm"
            alphanautId={session.alphanaut_id}
            isNavigator={isNavigator}
          />
        </div>
        <InitiativesPanel
          panelId="science-initiatives"
          blockSlug="science-comm"
          alphanautId={session.alphanaut_id}
          isNavigator={isNavigator}
        />

        {/* Content Calendar */}
        <div id="science-calendar" className="glass-card rounded-2xl p-6 panel-target">
          <h2 className="text-lg font-bold font-grotesk text-white mb-4 flex items-center gap-2">
            <Waves size={18} className="text-yellow-400" />
            Content Pulse Calendar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10">
              <p className="text-xs text-slate-500 mb-1">This Week</p>
              <p className="text-sm text-white font-semibold">Research digest + one story-led announcement</p>
            </div>
            <div className="p-3 rounded-xl border border-cyan/20 bg-cyan/10">
              <p className="text-xs text-slate-500 mb-1">Next Wave</p>
              <p className="text-sm text-white font-semibold">Volunteer and event spotlight rotation</p>
            </div>
            <div className="p-3 rounded-xl border border-purple/20 bg-purple/10">
              <p className="text-xs text-slate-500 mb-1">Quality Rule</p>
              <p className="text-sm text-white font-semibold">One post = one core message + one clear CTA</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl border border-white/10 bg-dark/40 flex items-start gap-2">
            <Target size={14} className="text-yellow-400 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              {isNavigator ? 'Use this panel to keep campaign consistency across drafts, tasks, and initiative execution.' : 'Follow this pattern to craft high-impact drafts that are easy to approve and publish.'}
            </p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
