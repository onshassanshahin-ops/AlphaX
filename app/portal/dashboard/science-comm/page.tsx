'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PortalLayout from '@/components/layout/PortalLayout';
import TasksPanel from '@/components/portal/TasksPanel';
import InitiativesPanel from '@/components/portal/InitiativesPanel';
import SuggestionsPanel from '@/components/portal/SuggestionsPanel';
import Button from '@/components/ui/Button';
import { Radio, Plus, Send } from 'lucide-react';
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
        <div className="flex items-center justify-between">
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

        {/* Draft Announcement */}
        <div className="glass-card rounded-2xl p-6">
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
            blockSlug="science-comm"
            alphanautId={session.alphanaut_id}
            isNavigator={isNavigator}
            blockMembers={blockMembers}
          />
          <SuggestionsPanel
            blockSlug="science-comm"
            alphanautId={session.alphanaut_id}
            isNavigator={isNavigator}
          />
        </div>
        <InitiativesPanel
          blockSlug="science-comm"
          alphanautId={session.alphanaut_id}
          isNavigator={isNavigator}
        />

        {/* Content Calendar */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold font-grotesk text-white mb-4 flex items-center gap-2">
            <Radio size={18} className="text-yellow-400" />
            Content Calendar
          </h2>
          <div className="text-center py-10">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-slate-400 text-sm">Content calendar coming soon</p>
            <p className="text-xs text-slate-600 mt-1">
              {isNavigator ? 'You can share the content schedule here.' : 'Your Navigator will share the upcoming content schedule here.'}
            </p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
