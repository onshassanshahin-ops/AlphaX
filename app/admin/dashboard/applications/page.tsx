'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, RefreshCw, CheckCircle, XCircle, Clock, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface Application {
  id: string;
  name: string;
  email: string;
  phone?: string;
  university?: string;
  field_of_study?: string;
  preferred_blocks?: string[];
  motivation?: string;
  skills?: string;
  how_heard?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'waitlisted';
  admin_notes?: string;
  reviewed_at?: string;
  created_at: string;
}

const STATUS_FILTERS = ['all', 'pending', 'accepted', 'waitlisted', 'rejected'];

const statusStyle: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  accepted: 'text-green-400 bg-green-500/10 border-green-500/30',
  rejected: 'text-red-400 bg-red-500/10 border-red-500/30',
  waitlisted: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [newAccess, setNewAccess] = useState<{ name: string; code: string } | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications?status=${statusFilter}`);
      const data = await res.json();
      setApplications(data.applications || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const updateStatus = async (id: string, status: string, app: Application) => {
    setProcessing(id);
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, admin_notes: notesMap[id] || '' }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }

      if (status === 'accepted' && data.accessCode) {
        setNewAccess({ name: app.name, code: data.accessCode });
        toast.success(`${app.name} accepted! Access code generated.`);
      } else {
        toast.success(`Application ${status}`);
      }
      fetchApplications();
    } catch {
      toast.error('Action failed');
    } finally {
      setProcessing(null);
    }
  };

  const counts = { total: applications.length };

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
            <span className="font-bold font-grotesk text-white">Volunteer Applications</span>
            <span className="text-slate-500 text-xs ml-2">{counts.total} shown</span>
          </div>
        </div>
        <button onClick={fetchApplications} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors">
          <RefreshCw size={16} />
        </button>
      </nav>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Access Code Banner */}
        {newAccess && (
          <div className="glass-card rounded-2xl p-5 border border-green-500/30 bg-green-500/5">
            <p className="text-green-400 font-semibold mb-1">✅ {newAccess.name} has been accepted and an Alphanaut account created!</p>
            <p className="text-slate-400 text-sm mb-3">Share this access code:</p>
            <div className="flex items-center gap-3">
              <code className="text-xl font-mono font-bold text-green-300 bg-dark/80 px-4 py-2 rounded-xl border border-green-500/30 tracking-widest">
                {newAccess.code}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(newAccess.code); toast.success('Copied!'); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-colors"
              >
                <Copy size={14} /> Copy
              </button>
              <button onClick={() => setNewAccess(null)} className="text-slate-500 hover:text-slate-300 text-sm">Dismiss</button>
            </div>
          </div>
        )}

        {/* Status Filters */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${
                statusFilter === s
                  ? 'bg-cyan/20 text-cyan border-cyan/40'
                  : 'text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No {statusFilter !== 'all' ? statusFilter : ''} applications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map(app => (
              <div key={app.id} className="glass-card rounded-2xl overflow-hidden">
                {/* Header Row */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white/2 transition-colors"
                  onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-bold text-white font-grotesk">{app.name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${statusStyle[app.status]}`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span>{app.email}</span>
                      {app.university && <span>· {app.university}</span>}
                      {app.field_of_study && <span>· {app.field_of_study}</span>}
                      <span>· {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                    {app.preferred_blocks && app.preferred_blocks.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {app.preferred_blocks.map(b => (
                          <span key={b} className="text-xs px-2 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/20">
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-slate-500">
                    {expandedId === app.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === app.id && (
                  <div className="border-t border-white/5 p-5 space-y-4">
                    {app.motivation && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Motivation</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{app.motivation}</p>
                      </div>
                    )}
                    {app.skills && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Skills</p>
                        <p className="text-sm text-slate-300">{app.skills}</p>
                      </div>
                    )}
                    {app.how_heard && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">How they heard</p>
                        <p className="text-sm text-slate-300">{app.how_heard}</p>
                      </div>
                    )}
                    {app.phone && (
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Phone</p>
                        <p className="text-sm text-slate-300">{app.phone}</p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-widest mb-1 block">Admin Notes</label>
                      <textarea
                        value={notesMap[app.id] ?? (app.admin_notes || '')}
                        onChange={e => setNotesMap(m => ({ ...m, [app.id]: e.target.value }))}
                        placeholder="Internal notes..."
                        rows={2}
                        className="w-full form-input rounded-xl px-3 py-2 text-sm border border-white/10 bg-dark/80 resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    {app.status === 'pending' && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() => updateStatus(app.id, 'accepted', app)}
                          disabled={!!processing}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={15} />
                          {processing === app.id ? 'Processing...' : 'Accept & Create Account'}
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'waitlisted', app)}
                          disabled={!!processing}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                        >
                          <Clock size={15} />
                          Waitlist
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'rejected', app)}
                          disabled={!!processing}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={15} />
                          Reject
                        </button>
                      </div>
                    )}

                    {app.status === 'waitlisted' && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateStatus(app.id, 'accepted', app)}
                          disabled={!!processing}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={15} />
                          {processing === app.id ? 'Processing...' : 'Accept Now'}
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'rejected', app)}
                          disabled={!!processing}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={15} />
                          Reject
                        </button>
                      </div>
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
