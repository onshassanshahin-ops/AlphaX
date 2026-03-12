'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Plus, Trash2, RefreshCw, Eye, EyeOff, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Admin {
  id: string;
  username: string;
  name?: string;
  created_at: string;
}

export default function AdminsManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({ username: '', password: '', name: '' });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admins');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) { toast.error('Username and password are required'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    setCreating(true);
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success(`Admin "${form.username}" created`);
      setForm({ username: '', password: '', name: '' });
      setShowForm(false);
      fetchAdmins();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (admin: Admin) => {
    if (!confirm(`Delete admin "${admin.username}"? This cannot be undone.`)) return;
    setDeletingId(admin.id);
    try {
      const res = await fetch(`/api/admins?id=${admin.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Admin deleted');
        fetchAdmins();
      } else {
        toast.error('Delete failed');
      }
    } finally {
      setDeletingId(null);
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
            <span className="font-bold font-grotesk text-white">Admin Accounts</span>
            <span className="text-slate-500 text-xs ml-2">{admins.length} admins</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAdmins} className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan to-teal text-white hover:-translate-y-0.5 transition-all"
          >
            <Plus size={16} />
            Add Admin
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-3xl mx-auto space-y-5">
        {/* Warning */}
        <div className="glass-card rounded-2xl p-4 border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-sm text-yellow-400 font-semibold mb-1">⚠ Admin Security</p>
          <p className="text-xs text-slate-400">
            Admins have full access to all site data. The default admin (from environment variables) is always active
            and cannot be deleted here. Only add trusted people as admins.
            Always use strong, unique passwords.
          </p>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold font-grotesk text-white flex items-center gap-2">
                <Shield size={18} className="text-cyan" />
                New Admin Account
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Username *</label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                    placeholder="e.g. admin2"
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. AlphaX Admin"
                    className="w-full form-input rounded-xl px-4 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Password * (min 8 characters)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Strong password..."
                    className="w-full form-input rounded-xl px-4 pr-11 py-2.5 text-sm border border-cyan/20 bg-dark/80"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-1">Use a strong, unique password — admins have full site access</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan to-teal text-white disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Admin Account'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admins Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-slate-500">Loading...</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-16">
              <Shield size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No additional admins in database</p>
              <p className="text-xs text-slate-600 mt-1">
                The default admin (from .env) is always available
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Display Name</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => (
                    <tr key={admin.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-navy/60 border border-cyan/20 flex items-center justify-center">
                            <Shield size={12} className="text-cyan" />
                          </div>
                          <code className="text-sm text-cyan font-mono">{admin.username}</code>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-slate-300">{admin.name || '—'}</span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-500">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(admin)}
                          disabled={deletingId === admin.id}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                          {deletingId === admin.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Env admin note */}
        <div className="glass-card rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-slate-500 font-semibold mb-1">Environment Variable Admin (always active)</p>
          <p className="text-xs text-slate-600">
            Username: <code className="text-slate-400">ADMIN_USERNAME</code> from your <code className="text-slate-400">.env.local</code> file
            (default: <code className="text-slate-400">admin</code> / <code className="text-slate-400">alphax2025</code>).
            This admin cannot be managed through this page — edit your env file to change it.
          </p>
        </div>
      </div>
    </div>
  );
}
