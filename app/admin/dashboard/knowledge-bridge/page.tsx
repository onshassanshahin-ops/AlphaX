'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, RefreshCw, Check, X, Eye, Download, Search, Filter, Users, Workflow } from 'lucide-react';
import toast from 'react-hot-toast';

interface Paper {
  id: string;
  title_ar: string;
  title_en?: string;
  original_authors?: string;
  description_ar?: string;
  field?: string;
  tags?: string[];
  file_url?: string;
  download_count: number;
  status: string;
  navigator_notes?: string;
  published_at?: string;
  created_at: string;
  submitter?: { id: string; name: string };
}

interface MemberOption {
  id: string;
  name: string;
}

interface SectionNavigator {
  section: 'translation' | 'simplification';
  alphanaut_id: string | null;
  alphanaut?: { id: string; name: string };
}

interface KbWorkflow {
  id: string;
  title_ar: string;
  status: string;
  admin_notes?: string | null;
  paper_id?: string | null;
}

const STATUS_FILTERS = ['all', 'under_review', 'published', 'draft', 'rejected'];
const FIELDS = ['all', 'medical', 'ai', 'stem', 'neuroscience', 'other'];

const fieldColor: Record<string, string> = {
  medical: '#118AB2',
  ai: '#9B59B6',
  stem: '#00B4D8',
  neuroscience: '#FF6B35',
  other: '#FFD700',
};

const statusStyle: Record<string, string> = {
  draft: 'text-slate-400 bg-slate-700/30 border-slate-600/30',
  under_review: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  published: 'text-green-400 bg-green-500/10 border-green-500/30',
  rejected: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function AdminKnowledgeBridge() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('under_review');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [kbMembers, setKbMembers] = useState<MemberOption[]>([]);
  const [sectionNavigators, setSectionNavigators] = useState<SectionNavigator[]>([]);
  const [reviewWorkflows, setReviewWorkflows] = useState<KbWorkflow[]>([]);
  const [sectionSelection, setSectionSelection] = useState<Record<'translation' | 'simplification', string>>({
    translation: '',
    simplification: '',
  });

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (fieldFilter !== 'all') params.set('field', fieldFilter);
      if (search) params.set('search', search);
      params.set('limit', '50');

      const res = await fetch(`/api/papers?${params}`);
      const data = await res.json();
      setPapers(data.papers || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, fieldFilter, search]);

  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  const fetchKbWorkflowData = useCallback(async () => {
    const [membersRes, navRes, workflowRes] = await Promise.all([
      fetch('/api/blocks/knowledge-bridge/members'),
      fetch('/api/knowledge-bridge/section-navigators'),
      fetch('/api/knowledge-bridge/workflows?status=admin_review'),
    ]);

    if (membersRes.ok) {
      const membersData = await membersRes.json();
      setKbMembers((membersData.members || []).map((m: any) => ({ id: m.id, name: m.name })));
    }

    if (navRes.ok) {
      const navData = await navRes.json();
      const navs = navData.sectionNavigators || [];
      setSectionNavigators(navs);
      setSectionSelection({
        translation: navs.find((n: SectionNavigator) => n.section === 'translation')?.alphanaut_id || '',
        simplification: navs.find((n: SectionNavigator) => n.section === 'simplification')?.alphanaut_id || '',
      });
    }

    if (workflowRes.ok) {
      const workflowData = await workflowRes.json();
      setReviewWorkflows(workflowData.workflows || []);
    }
  }, []);

  useEffect(() => {
    fetchKbWorkflowData();
  }, [fetchKbWorkflowData]);

  const assignSectionNavigator = async (section: 'translation' | 'simplification') => {
    const selected = sectionSelection[section] || null;
    const res = await fetch('/api/knowledge-bridge/section-navigators', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, alphanaut_id: selected }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Failed to assign section navigator');
      return;
    }
    toast.success('Section navigator updated');
    fetchKbWorkflowData();
  };

  const runAdminWorkflowAction = async (id: string, action: 'admin_approve' | 'admin_request_changes' | 'admin_reject') => {
    const res = await fetch(`/api/knowledge-bridge/workflows/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Action failed');
      return;
    }
    toast.success('Workflow updated');
    fetchKbWorkflowData();
    fetchPapers();
  };

  const updatePaper = async (id: string, updates: Record<string, unknown>) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/papers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        toast.success('Paper updated');
        fetchPapers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Update failed');
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setProcessing(null);
    }
  };

  const publish = (id: string) => updatePaper(id, {
    status: 'published',
    published_at: new Date().toISOString(),
    navigator_notes: notesMap[id] || undefined,
  });

  const reject = (id: string) => updatePaper(id, {
    status: 'rejected',
    navigator_notes: notesMap[id] || undefined,
  });

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
            <span className="font-bold font-grotesk text-white">Knowledge Bridge</span>
            <span className="text-slate-500 text-xs ml-2">{papers.length} papers</span>
          </div>
        </div>
        <button onClick={fetchPapers} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors">
          <RefreshCw size={16} />
        </button>
      </nav>

      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {/* Section Navigator Assignment */}
        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-sm font-bold font-grotesk text-white mb-3 flex items-center gap-2">
            <Users size={15} className="text-cyan" />
            Knowledge Bridge Section Navigators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['translation', 'simplification'] as const).map((section) => (
              <div key={section} className="p-3 rounded-xl border border-white/10 bg-dark/50">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">{section}</p>
                <div className="flex items-center gap-2">
                  <select
                    value={sectionSelection[section]}
                    onChange={(e) => setSectionSelection((s) => ({ ...s, [section]: e.target.value }))}
                    className="flex-1 form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80"
                  >
                    <option value="">Select navigator...</option>
                    {kbMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => assignSectionNavigator(section)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold border border-cyan/30 text-cyan hover:bg-cyan/10"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Final Review Queue */}
        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-sm font-bold font-grotesk text-white mb-3 flex items-center gap-2">
            <Workflow size={15} className="text-gold" />
            Workflow Final Review ({reviewWorkflows.length})
          </h2>
          {reviewWorkflows.length === 0 ? (
            <p className="text-sm text-slate-500">No workflow cards pending admin review.</p>
          ) : (
            <div className="space-y-2">
              {reviewWorkflows.map((wf) => (
                <div key={wf.id} className="p-3 rounded-xl border border-white/10 bg-dark/50 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white font-semibold" dir="rtl">{wf.title_ar}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{wf.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runAdminWorkflowAction(wf.id, 'admin_approve')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-green-300 border border-green-500/30 hover:bg-green-500/10"
                    >
                      Approve & Publish
                    </button>
                    <button
                      onClick={() => runAdminWorkflowAction(wf.id, 'admin_request_changes')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/10"
                    >
                      Send Back
                    </button>
                    <button
                      onClick={() => runAdminWorkflowAction(wf.id, 'admin_reject')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-300 border border-red-500/30 hover:bg-red-500/10"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                  statusFilter === s ? 'bg-cyan/20 text-cyan border-cyan/40' : 'text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search papers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full form-input rounded-xl pl-8 pr-3 py-2 text-sm border border-cyan/20 bg-dark/80"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-slate-500" />
              {FIELDS.map(f => (
                <button
                  key={f}
                  onClick={() => setFieldFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all capitalize ${
                    fieldFilter === f ? 'bg-purple/20 text-purple border-purple/40' : 'text-slate-500 border-white/10 hover:border-white/20'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Papers */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading...</div>
        ) : papers.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No papers found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {papers.map(paper => (
              <div key={paper.id} className="glass-card rounded-2xl overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-white/2 transition-colors"
                  onClick={() => setExpandedId(expandedId === paper.id ? null : paper.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusStyle[paper.status]}`}>
                          {paper.status.replace('_', ' ')}
                        </span>
                        {paper.field && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full border"
                            style={{ color: fieldColor[paper.field], backgroundColor: `${fieldColor[paper.field]}15`, borderColor: `${fieldColor[paper.field]}30` }}
                          >
                            {paper.field}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-white font-grotesk text-lg" dir="rtl">{paper.title_ar}</p>
                      {paper.title_en && <p className="text-sm text-slate-400 mt-0.5">{paper.title_en}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        {paper.submitter && <span>By: {paper.submitter.name}</span>}
                        <span>· {new Date(paper.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Download size={11} />{paper.download_count}</span>
                      </div>
                    </div>

                    {/* Quick Actions for under_review */}
                    {paper.status === 'under_review' && (
                      <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        {paper.file_url && (
                          <a
                            href={paper.file_url}
                            target="_blank"
                            className="p-2 rounded-lg text-slate-400 border border-white/10 hover:text-white hover:border-white/30 transition-colors"
                          >
                            <Eye size={15} />
                          </a>
                        )}
                        <button
                          onClick={() => publish(paper.id)}
                          disabled={processing === paper.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                        >
                          <Check size={13} />
                          {processing === paper.id ? '...' : 'Publish'}
                        </button>
                        <button
                          onClick={() => reject(paper.id)}
                          disabled={processing === paper.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          <X size={13} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded */}
                {expandedId === paper.id && (
                  <div className="border-t border-white/5 p-5 space-y-4">
                    {paper.description_ar && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Abstract (Arabic)</p>
                        <p className="text-sm text-slate-300 leading-relaxed" dir="rtl">{paper.description_ar}</p>
                      </div>
                    )}
                    {paper.original_authors && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Original Authors</p>
                        <p className="text-sm text-slate-300">{paper.original_authors}</p>
                      </div>
                    )}
                    {paper.tags && paper.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {paper.tags.map(t => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">{t}</span>
                        ))}
                      </div>
                    )}
                    {paper.file_url && (
                      <a href={paper.file_url} target="_blank" className="inline-flex items-center gap-2 text-sm text-cyan hover:underline">
                        <Eye size={14} /> View PDF
                      </a>
                    )}

                    {/* Navigator Notes */}
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-widest mb-1 block">Navigator Notes / Feedback</label>
                      <textarea
                        value={notesMap[paper.id] ?? (paper.navigator_notes || '')}
                        onChange={e => setNotesMap(m => ({ ...m, [paper.id]: e.target.value }))}
                        placeholder="Add feedback for the submitter..."
                        rows={2}
                        className="w-full form-input rounded-xl px-3 py-2 text-sm border border-white/10 bg-dark/80 resize-none"
                      />
                    </div>

                    {paper.status === 'under_review' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => publish(paper.id)}
                          disabled={!!processing}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                        >
                          <Check size={15} />
                          {processing === paper.id ? 'Publishing...' : 'Publish Paper'}
                        </button>
                        <button
                          onClick={() => reject(paper.id)}
                          disabled={!!processing}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          <X size={15} />
                          Reject
                        </button>
                      </div>
                    )}

                    {paper.status === 'published' && (
                      <button
                        onClick={() => updatePaper(paper.id, { status: 'draft' })}
                        disabled={!!processing}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Unpublish (move to draft)
                      </button>
                    )}
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
