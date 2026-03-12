'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, Plus, Users, Clock, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRelativeDate } from '@/lib/utils';

interface Participant {
  alphanaut_id: string;
  response: 'yes' | 'no';
}

interface Initiative {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
  creator?: { id: string; name: string };
  initiative_participants: Participant[];
}

interface InitiativesPanelProps {
  blockSlug: string;
  alphanautId: string;
  isNavigator: boolean;
}

export default function InitiativesPanel({ blockSlug, alphanautId, isNavigator }: InitiativesPanelProps) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', deadline: '' });

  const fetchInitiatives = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/initiatives?block=${blockSlug}`);
      if (res.ok) {
        const data = await res.json();
        setInitiatives(data.initiatives || []);
      }
    } finally {
      setLoading(false);
    }
  }, [blockSlug]);

  useEffect(() => { fetchInitiatives(); }, [fetchInitiatives]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, block_slug: blockSlug }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success('Initiative posted — block members will be notified');
      setForm({ title: '', description: '', deadline: '' });
      setShowCreate(false);
      fetchInitiatives();
    } finally {
      setCreating(false);
    }
  };

  const respond = async (initiativeId: string, response: 'yes' | 'no') => {
    setResponding(initiativeId + response);
    try {
      const res = await fetch(`/api/initiatives/${initiativeId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      if (res.ok) {
        toast.success(response === 'yes' ? "You're in!" : 'Got it');
        fetchInitiatives();
      }
    } finally {
      setResponding(null);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div>
          <h3 className="font-bold font-grotesk text-white flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            Open Initiatives
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Who wants to work on this?</p>
        </div>
        {(isNavigator) && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/30 transition-colors"
          >
            <Plus size={13} />
            Post Initiative
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="p-5 border-b border-white/5 bg-navy/30">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              required
              placeholder="Initiative title..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full form-input rounded-xl px-3 py-2 text-sm border border-yellow-500/20 bg-dark/80"
            />
            <textarea
              placeholder="Describe the initiative — what needs to be done, who would be ideal..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full form-input rounded-xl px-3 py-2 text-sm border border-yellow-500/20 bg-dark/80 resize-none"
              rows={3}
            />
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="form-input rounded-xl px-3 py-2 text-sm border border-yellow-500/20 bg-dark/80"
              />
              <button type="submit" disabled={creating}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 disabled:opacity-50 transition-colors">
                {creating ? 'Posting...' : 'Post Initiative'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-slate-500 hover:text-slate-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Initiatives list */}
      <div className="divide-y divide-white/5">
        {loading ? (
          <div className="text-center py-10 text-slate-500 text-sm">Loading...</div>
        ) : initiatives.length === 0 ? (
          <div className="text-center py-10 text-slate-600 text-sm">
            No open initiatives right now
          </div>
        ) : (
          initiatives.map(initiative => {
            const yesCount = initiative.initiative_participants?.filter(p => p.response === 'yes').length || 0;
            const noCount = initiative.initiative_participants?.filter(p => p.response === 'no').length || 0;
            const myResponse = initiative.initiative_participants?.find(p => p.alphanaut_id === alphanautId)?.response;
            const isOverdue = initiative.deadline && new Date(initiative.deadline) < new Date();

            return (
              <div key={initiative.id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <Zap size={14} className="text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-white">{initiative.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        initiative.status === 'open'
                          ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                          : 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                      }`}>
                        {initiative.status}
                      </span>
                    </div>
                    {initiative.description && (
                      <p className="text-sm text-slate-400 leading-relaxed mb-2">{initiative.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-600 mb-3 flex-wrap">
                      {initiative.creator && <span>by {initiative.creator.name}</span>}
                      {initiative.deadline && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                          <Clock size={11} />
                          {isOverdue ? 'Deadline passed · ' : 'Due '}
                          {new Date(initiative.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <span>{formatRelativeDate(initiative.created_at)}</span>
                    </div>

                    {/* Participation */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs text-green-400">
                          <Users size={12} />
                          {yesCount} joining
                        </span>
                        {noCount > 0 && (
                          <span className="text-xs text-slate-600">{noCount} can't</span>
                        )}
                      </div>

                      {initiative.status === 'open' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => respond(initiative.id, 'yes')}
                            disabled={!!responding || myResponse === 'yes'}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              myResponse === 'yes'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'border-white/10 text-slate-400 hover:border-green-500/30 hover:text-green-400'
                            }`}
                          >
                            <ThumbsUp size={12} />
                            {myResponse === 'yes' ? "You're in!" : "I'm in"}
                          </button>
                          <button
                            onClick={() => respond(initiative.id, 'no')}
                            disabled={!!responding || myResponse === 'no'}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              myResponse === 'no'
                                ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                                : 'border-white/10 text-slate-500 hover:border-slate-500/30 hover:text-slate-300'
                            }`}
                          >
                            <ThumbsDown size={12} />
                            Can't do it
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
