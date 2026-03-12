'use client';

import { useState } from 'react';
import { Eye, Check, X, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { VolunteerApplication } from '@/types';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ApplicationsTableProps {
  applications: VolunteerApplication[];
  onStatusChange?: (id: string, status: string, notes?: string) => void;
}

export default function ApplicationsTable({ applications, onStatusChange }: ApplicationsTableProps) {
  const [selected, setSelected] = useState<VolunteerApplication | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    waitlisted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  const handleAction = async (id: string, status: string, notes?: string) => {
    setProcessing(id);
    try {
      await onStatusChange?.(id, status, notes);
      setSelected(null);
    } finally {
      setProcessing(null);
    }
  };

  if (!applications.length) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-3xl mb-2">📋</p>
        <p>No applications found</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-cyan/10">
        <table className="admin-table w-full">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>University</th>
              <th>Preferred Blocks</th>
              <th>Status</th>
              <th>Applied</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>
                  <div>
                    <p className="font-medium text-white">{app.name}</p>
                    <p className="text-xs text-slate-500">{app.email}</p>
                  </div>
                </td>
                <td>
                  <div>
                    <p className="text-sm text-slate-300">{app.university || '—'}</p>
                    <p className="text-xs text-slate-500">{app.field_of_study || ''}</p>
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {app.preferred_blocks?.slice(0, 2).map((b) => (
                      <span
                        key={b}
                        className="text-xs px-1.5 py-0.5 rounded bg-cyan/10 text-cyan/80 border border-cyan/20"
                      >
                        {b}
                      </span>
                    ))}
                    {(app.preferred_blocks?.length || 0) > 2 && (
                      <span className="text-xs text-slate-500">
                        +{(app.preferred_blocks?.length || 0) - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    className={cn(
                      'badge text-xs',
                      statusColors[app.status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                    )}
                  >
                    {app.status}
                  </span>
                </td>
                <td className="text-sm text-slate-400">{formatDate(app.created_at)}</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelected(app)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan hover:bg-cyan/10 transition-colors"
                      title="View"
                    >
                      <Eye size={14} />
                    </button>
                    {app.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(app.id, 'accepted')}
                          disabled={processing === app.id}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                          title="Accept"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelected(app);
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Reject"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Application Detail Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`Application: ${selected.name}`}
          size="lg"
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Email</p>
                <p className="text-sm text-white">{selected.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phone</p>
                <p className="text-sm text-white">{selected.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">University</p>
                <p className="text-sm text-white">{selected.university || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Field of Study</p>
                <p className="text-sm text-white">{selected.field_of_study || '—'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Preferred Blocks</p>
              <div className="flex flex-wrap gap-2">
                {selected.preferred_blocks?.map((b) => (
                  <span key={b} className="badge bg-cyan/10 text-cyan border-cyan/20">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Motivation</p>
              <p className="text-sm text-slate-300 bg-dark/50 rounded-xl p-3 border border-white/5">
                {selected.motivation || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Skills</p>
              <p className="text-sm text-slate-300 bg-dark/50 rounded-xl p-3 border border-white/5">
                {selected.skills || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">How they heard</p>
              <p className="text-sm text-slate-300">{selected.how_heard || '—'}</p>
            </div>

            {selected.status === 'pending' && (
              <>
                <div>
                  <label className="block text-xs text-slate-500 uppercase tracking-wide mb-1">
                    Admin Notes (optional)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full form-input rounded-xl px-3 py-2 text-sm border border-cyan/20 bg-dark/80 resize-none"
                    placeholder="Internal notes..."
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    className="flex-1"
                    loading={processing === selected.id}
                    onClick={() => handleAction(selected.id, 'accepted', rejectNote)}
                  >
                    <Check size={16} />
                    Accept & Create Alphanaut
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    loading={processing === selected.id}
                    onClick={() => handleAction(selected.id, 'rejected', rejectNote)}
                  >
                    <X size={16} />
                    Reject
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
