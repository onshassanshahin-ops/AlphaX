'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, RefreshCw, Plus, Globe, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface ResearchProject {
  id: string;
  title: string;
  abstract?: string;
  field?: string;
  block_slug?: string;
  status: string;
  journal?: string;
  doi?: string;
  is_public: boolean;
  created_at: string;
  published_at?: string;
  authors?: { author_order: number; alphanaut?: { id: string; name: string } }[];
  block?: { slug: string; name: string; color: string; icon: string };
}

const STATUS_FILTERS = ['all', 'in_progress', 'submitted', 'under_review', 'accepted', 'published', 'rejected'];
const BLOCK_FILTERS = ['all', 'asclepius-lab', 'neuroscience', 'knowledge-bridge', 'creative-lab', 'science-comm', 'operations', 'engineering'];

const statusStyle: Record<string, string> = {
  in_progress: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  submitted: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  under_review: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  accepted: 'text-cyan-400 bg-cyan/10 border-cyan/30',
  published: 'text-green-400 bg-green-500/10 border-green-500/30',
  rejected: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function AdminResearch() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [blockFilter, setBlockFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [alphanauts, setAlphanauts] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    title: '', abstract: '', field: '', block_slug: 'asclepius-lab',
    status: 'in_progress', journal: '', doi: '', is_public: false,
    author_ids: [] as string[],
  });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (blockFilter !== 'all') params.set('block', blockFilter);
      const res = await fetch(`/api/research?${params}`);
      const data = await res.json();
      setProjects(data.projects || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, blockFilter]);

  const fetchAlphanauts = useCallback(async () => {
    const res = await fetch('/api/alphanauts?active=true');
    if (res.ok) {
      const data = await res.json();
      setAlphanauts((data.alphanauts || []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })));
    }
  }, []);

  useEffect(() => { fetchProjects(); fetchAlphanauts(); }, [fetchProjects, fetchAlphanauts]);

  const updateProject = async (id: string, updates: Record<string, unknown>) => {
    setProcessing(id);
    try {
      const res = await fetch('/api/research', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        toast.success('Updated');
        fetchProjects();
      } else {
        toast.error('Update failed');
      }
    } finally {
      setProcessing(null);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title required'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Research project created');
        setShowForm(false);
        setForm({ title: '', abstract: '', field: '', block_slug: 'asclepius-lab', status: 'in_progress', journal: '', doi: '', is_public: false, author_ids: [] });
        fetchProjects();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <nav className="bg-dark border-b border-cyan/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-cyan transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-navy flex items-center justify-center font-bold text-white text-sm font-grotesk">
            AX
          </div>
          <div>
            <span className="font-bold font-grotesk text-white">Research Projects</span>
            <span className="text-slate-500 text-xs ml-2">{projects.length} shown</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProjects} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple to-navy text-white hover:-translate-y-0.5 transition-all"
          >
            <Plus size={16} />
            Add Project
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {/* Add Form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold font-grotesk text-white mb-5">New Research Project</h2>
            <form onSubmit={createProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-1.5">Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Research project title"
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-1.5">Abstract</label>
                  <textarea
                    value={form.abstract}
                    onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))}
                    placeholder="Project abstract..."
                    rows={3}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Block</label>
                  <select
                    value={form.block_slug}
                    onChange={e => setForm(f => ({ ...f, block_slug: e.target.value }))}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  >
                    {BLOCK_FILTERS.filter(b => b !== 'all').map(b => (
                      <option key={b} value={b}>{b.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  >
                    {STATUS_FILTERS.filter(s => s !== 'all').map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Field</label>
                  <input
                    type="text"
                    value={form.field}
                    onChange={e => setForm(f => ({ ...f, field: e.target.value }))}
                    placeholder="e.g. Medical AI, Neuroscience"
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Journal</label>
                  <input
                    type="text"
                    value={form.journal}
                    onChange={e => setForm(f => ({ ...f, journal: e.target.value }))}
                    placeholder="Journal name"
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">DOI</label>
                  <input
                    type="text"
                    value={form.doi}
                    onChange={e => setForm(f => ({ ...f, doi: e.target.value }))}
                    placeholder="10.xxxx/..."
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                </div>
              </div>

              {alphanauts.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Authors</label>
                  <div className="flex flex-wrap gap-2">
                    {alphanauts.map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          author_ids: f.author_ids.includes(a.id)
                            ? f.author_ids.filter(x => x !== a.id)
                            : [...f.author_ids, a.id],
                        }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          form.author_ids.includes(a.id)
                            ? 'bg-purple/20 text-purple border-purple/40'
                            : 'text-slate-400 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public_r"
                  checked={form.is_public}
                  onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                />
                <label htmlFor="is_public_r" className="text-sm text-slate-400">Visible on public Research page</label>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={creating} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple to-navy text-white disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-300">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  statusFilter === s ? 'bg-purple/20 text-purple border-purple/40' : 'text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {BLOCK_FILTERS.map(b => (
              <button
                key={b}
                onClick={() => setBlockFilter(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  blockFilter === b ? 'bg-teal/20 text-teal-400 border-teal/40' : 'text-slate-500 border-white/10 hover:border-white/20'
                }`}
              >
                {b === 'all' ? 'All Blocks' : b.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Projects */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <FlaskConical size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No projects found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="glass-card rounded-2xl overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-white/2 transition-colors"
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${statusStyle[p.status]}`}>
                          {p.status.replace(/_/g, ' ')}
                        </span>
                        {p.is_public ? (
                          <span className="flex items-center gap-1 text-xs text-green-400"><Globe size={11} />Public</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-slate-500"><Lock size={11} />Private</span>
                        )}
                        {p.block_slug && (
                          <span className="text-xs text-slate-500 capitalize">{p.block_slug.replace(/-/g, ' ')}</span>
                        )}
                      </div>
                      <p className="font-bold text-white font-grotesk">{p.title}</p>
                      {p.authors && p.authors.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          {p.authors.sort((a, b) => a.author_order - b.author_order).map(a => a.alphanaut?.name).filter(Boolean).join(', ')}
                        </p>
                      )}
                      {p.journal && <p className="text-xs text-slate-500 italic mt-0.5">{p.journal}</p>}
                    </div>
                    <div className="shrink-0 text-slate-500">
                      {expandedId === p.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {expandedId === p.id && (
                  <div className="border-t border-white/5 p-5 space-y-4">
                    {p.abstract && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Abstract</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{p.abstract}</p>
                      </div>
                    )}
                    {p.doi && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">DOI</p>
                        <a href={`https://doi.org/${p.doi}`} target="_blank" className="text-sm text-cyan hover:underline">{p.doi}</a>
                      </div>
                    )}

                    {/* Quick status update */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_FILTERS.filter(s => s !== 'all' && s !== p.status).map(s => (
                          <button
                            key={s}
                            onClick={() => updateProject(p.id, {
                              status: s,
                              is_public: s === 'published' ? true : p.is_public,
                            })}
                            disabled={processing === p.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border text-slate-400 border-white/10 hover:border-white/30 hover:text-white transition-colors disabled:opacity-50 capitalize"
                          >
                            {processing === p.id ? '...' : `→ ${s.replace(/_/g, ' ')}`}
                          </button>
                        ))}
                        <button
                          onClick={() => updateProject(p.id, { is_public: !p.is_public })}
                          disabled={processing === p.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
                            p.is_public ? 'text-red-400 border-red-500/30 hover:bg-red-500/10' : 'text-green-400 border-green-500/30 hover:bg-green-500/10'
                          }`}
                        >
                          {p.is_public ? 'Make Private' : 'Make Public'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
