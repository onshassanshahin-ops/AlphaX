'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Plus, ThumbsUp, ChevronDown, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRelativeDate } from '@/lib/utils';

interface Vote {
  alphanaut_id: string;
}

interface Suggestion {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: 'open' | 'under_review' | 'approved' | 'implemented' | 'rejected';
  created_at: string;
  author?: { id: string; name: string };
  suggestion_votes: Vote[];
}

interface SuggestionsPanelProps {
  blockSlug: string;
  alphanautId: string;
  isNavigator: boolean;
}

const typeColors: Record<string, string> = {
  idea: '#00B4D8',
  paper: '#9B59B6',
  research: '#FF6B35',
  poster: '#FFD700',
  topic: '#4FC3F7',
  other: '#94a3b8',
};

const statusConfig: Record<string, { color: string; label: string }> = {
  open: { color: '#94a3b8', label: 'Open' },
  under_review: { color: '#FFD700', label: 'Under Review' },
  approved: { color: '#00B4D8', label: 'Approved' },
  implemented: { color: '#22c55e', label: 'Implemented' },
  rejected: { color: '#ef4444', label: 'Rejected' },
};

export default function SuggestionsPanel({ blockSlug, alphanautId, isNavigator }: SuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'idea' });

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/suggestions?block=${blockSlug}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } finally {
      setLoading(false);
    }
  }, [blockSlug]);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, block_slug: blockSlug }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success('Suggestion posted!');
      setForm({ title: '', description: '', type: 'idea' });
      setShowCreate(false);
      fetchSuggestions();
    } finally {
      setCreating(false);
    }
  };

  const vote = async (id: string) => {
    const res = await fetch(`/api/suggestions/${id}/vote`, { method: 'POST' });
    if (res.ok) fetchSuggestions();
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success('Status updated');
      fetchSuggestions();
    }
  };

  const deleteSuggestion = async (id: string) => {
    if (!confirm('Delete this suggestion?')) return;
    const res = await fetch(`/api/suggestions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Suggestion deleted');
      fetchSuggestions();
    } else {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div>
          <h3 className="font-bold font-grotesk text-white flex items-center gap-2">
            <Lightbulb size={16} className="text-purple" />
            Suggestions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Ideas, papers, topics — suggest anything</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple/20 text-purple border border-purple/20 hover:bg-purple/30 transition-colors"
        >
          <Plus size={13} />
          Suggest
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="p-5 border-b border-white/5 bg-navy/30">
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex gap-2">
              <input
                required
                placeholder="Your suggestion..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="flex-1 form-input rounded-xl px-3 py-2 text-sm border border-purple/20 bg-dark/80"
              />
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="form-input rounded-xl px-3 py-2 text-sm border border-purple/20 bg-dark/80"
              >
                <option value="idea">Idea</option>
                <option value="paper">Paper to simplify</option>
                <option value="research">Research topic</option>
                <option value="poster">Poster</option>
                <option value="topic">Topic</option>
                <option value="other">Other</option>
              </select>
            </div>
            <textarea
              placeholder="Describe your suggestion in more detail (optional)..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full form-input rounded-xl px-3 py-2 text-sm border border-purple/20 bg-dark/80 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button type="submit" disabled={creating}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple/20 text-purple border border-purple/30 hover:bg-purple/30 disabled:opacity-50 transition-colors">
                {creating ? 'Posting...' : 'Post Suggestion'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-slate-500 hover:text-slate-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suggestions list */}
      <div className="divide-y divide-white/5">
        {loading ? (
          <div className="text-center py-10 text-slate-500 text-sm">Loading...</div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-10">
            <Lightbulb size={28} className="text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No suggestions yet — be the first!</p>
          </div>
        ) : (
          suggestions.map(s => {
            const voteCount = s.suggestion_votes?.length || 0;
            const hasVoted = s.suggestion_votes?.some(v => v.alphanaut_id === alphanautId);
            const typeColor = typeColors[s.type] || '#94a3b8';
            const sCfg = statusConfig[s.status] || statusConfig.open;

            return (
              <div key={s.id} className="p-4 flex gap-3 hover:bg-white/2 transition-colors">
                {/* Vote */}
                <button
                  onClick={() => vote(s.id)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border min-w-12 transition-colors ${
                    hasVoted
                      ? 'bg-purple/20 border-purple/30 text-purple'
                      : 'border-white/10 text-slate-500 hover:border-purple/30 hover:text-purple'
                  }`}
                >
                  <ThumbsUp size={14} />
                  <span className="text-xs font-bold">{voteCount}</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>
                      {s.type}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border"
                      style={{ backgroundColor: `${sCfg.color}10`, borderColor: `${sCfg.color}25`, color: sCfg.color }}>
                      {sCfg.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white mb-0.5">{s.title}</p>
                  {s.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{s.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                    {s.author && <span>by {s.author.name}</span>}
                    <span>{formatRelativeDate(s.created_at)}</span>
                  </div>
                </div>

                {/* Navigator status control + delete */}
                <div className="flex items-start gap-1 self-start">
                  {isNavigator && (
                    <div className="relative group/status">
                      <button className="text-xs p-1.5 rounded-lg border border-white/10 text-slate-500 hover:border-cyan/30 hover:text-cyan transition-colors">
                        <ChevronDown size={12} />
                      </button>
                      <div className="absolute right-0 top-full mt-1 bg-dark border border-white/10 rounded-xl overflow-hidden shadow-lg z-10 hidden group-hover/status:block min-w-32">
                        {Object.entries(statusConfig).map(([key, cfg]) => (
                          <button key={key} onClick={() => updateStatus(s.id, key)}
                            className="block w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                            style={{ color: cfg.color }}>
                            {cfg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {(isNavigator || s.author?.id === alphanautId) && (
                    <button
                      onClick={() => deleteSuggestion(s.id)}
                      className="p-1.5 rounded-lg border border-white/10 text-slate-500 hover:border-red-500/30 hover:text-red-400 transition-colors"
                      title="Delete suggestion"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
