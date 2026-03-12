'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Plus, RefreshCw, Pin, Globe, Trash2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  is_published: boolean;
  is_pinned: boolean;
  published_at?: string;
  expires_at?: string;
  created_at: string;
}

const TYPES = ['general', 'volunteer', 'event', 'research', 'urgent'];

const typeStyle: Record<string, string> = {
  general: 'text-slate-400 bg-slate-700/30 border-slate-600/30',
  volunteer: 'text-green-400 bg-green-500/10 border-green-500/30',
  event: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  research: 'text-purple-400 bg-purple/10 border-purple/30',
  urgent: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'general',
    is_published: true,
    is_pinned: false,
    expires_at: '',
  });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements?limit=50');
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const startEdit = (a: Announcement) => {
    setEditing(a);
    setForm({
      title: a.title,
      content: a.content,
      type: a.type,
      is_published: a.is_published,
      is_pinned: a.is_pinned,
      expires_at: a.expires_at ? new Date(a.expires_at).toISOString().slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ title: '', content: '', type: 'general', is_published: true, is_pinned: false, expires_at: '' });
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        expires_at: form.expires_at || null,
      };

      let res: Response;
      if (editing) {
        res = await fetch('/api/announcements', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
      } else {
        res = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(editing ? 'Announcement updated' : 'Announcement created');
        resetForm();
        fetchAnnouncements();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleField = async (id: string, field: 'is_published' | 'is_pinned', current: boolean) => {
    const updates: Record<string, unknown> = { id, [field]: !current };
    if (field === 'is_published' && !current) {
      updates.published_at = new Date().toISOString();
    }
    const res = await fetch('/api/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      toast.success(`${field === 'is_published' ? (current ? 'Unpublished' : 'Published') : (current ? 'Unpinned' : 'Pinned')}`);
      fetchAnnouncements();
    } else {
      toast.error('Update failed');
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
            <span className="font-bold font-grotesk text-white">Announcements</span>
            <span className="text-slate-500 text-xs ml-2">{announcements.length} total</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAnnouncements} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-orange to-yellow-500 text-white hover:-translate-y-0.5 transition-all"
          >
            <Plus size={16} />
            New Announcement
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold font-grotesk text-white">
                {editing ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button onClick={resetForm} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Announcement title"
                  className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Content *</label>
                <textarea
                  required
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Announcement content..."
                  rows={4}
                  className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full form-input rounded-xl px-3 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Expires</label>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    className="w-full form-input rounded-xl px-3 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                    />
                    <span className="text-sm text-slate-400">Publish now</span>
                  </label>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_pinned}
                      onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                    />
                    <span className="text-sm text-slate-400">Pin to top</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange to-yellow-500 text-white disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Announcement'}
                </button>
                <button type="button" onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div
                key={a.id}
                className={`glass-card rounded-2xl p-5 border ${a.is_pinned ? 'border-yellow-500/30 bg-yellow-500/3' : 'border-transparent'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {a.is_pinned && <Pin size={13} className="text-yellow-400" />}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${typeStyle[a.type]}`}>
                        {a.type}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        a.is_published ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-slate-400 bg-slate-700/30 border-slate-600/30'
                      }`}>
                        {a.is_published ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-xs text-slate-600">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-white font-grotesk">{a.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{a.content}</p>
                    {a.expires_at && (
                      <p className="text-xs text-orange mt-1">
                        Expires: {new Date(a.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleField(a.id, 'is_pinned', a.is_pinned)}
                      className={`p-2 rounded-lg border transition-colors ${
                        a.is_pinned ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' : 'text-slate-500 border-white/10 hover:text-yellow-400 hover:border-yellow-500/30'
                      }`}
                      title={a.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin size={14} />
                    </button>
                    <button
                      onClick={() => toggleField(a.id, 'is_published', a.is_published)}
                      className={`p-2 rounded-lg border transition-colors ${
                        a.is_published ? 'text-slate-400 border-white/10 hover:text-red-400' : 'text-green-400 border-green-500/30 hover:bg-green-500/10'
                      }`}
                      title={a.is_published ? 'Unpublish' : 'Publish'}
                    >
                      <Globe size={14} />
                    </button>
                    <button
                      onClick={() => startEdit(a)}
                      className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
