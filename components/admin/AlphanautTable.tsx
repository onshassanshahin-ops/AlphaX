'use client';

import { useState } from 'react';
import { Copy, Check, Edit, UserX, UserCheck, Eye } from 'lucide-react';
import { RoleBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { Alphanaut } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface AlphanautTableProps {
  alphanauts: Alphanaut[];
  onEdit?: (a: Alphanaut) => void;
  onToggleStatus?: (a: Alphanaut) => void;
  onRefresh?: () => void;
}

export default function AlphanautTable({
  alphanauts,
  onEdit,
  onToggleStatus,
}: AlphanautTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Access code copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!alphanauts.length) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-3xl mb-2">👥</p>
        <p>No Alphanauts found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-cyan/10">
      <table className="admin-table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Access Code</th>
            <th>Role</th>
            <th>Blocks</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {alphanauts.map((alphanaut) => (
            <tr key={alphanaut.id}>
              <td>
                <div>
                  <p className="font-medium text-white">{alphanaut.name}</p>
                  {alphanaut.email && (
                    <p className="text-xs text-slate-500">{alphanaut.email}</p>
                  )}
                  {alphanaut.university && (
                    <p className="text-xs text-slate-600">{alphanaut.university}</p>
                  )}
                </div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-navy/50 border border-cyan/20 px-2 py-1 rounded text-cyan font-mono">
                    {alphanaut.access_code}
                  </code>
                  <button
                    onClick={() => copyCode(alphanaut.access_code, alphanaut.id)}
                    className="text-slate-500 hover:text-cyan transition-colors"
                  >
                    {copiedId === alphanaut.id ? (
                      <Check size={14} className="text-green-400" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </td>
              <td>
                <RoleBadge role={alphanaut.role} />
              </td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {alphanaut.blocks?.length ? (
                    alphanaut.blocks.slice(0, 2).map((ab) => (
                      <span
                        key={ab.id}
                        className="text-xs px-1.5 py-0.5 rounded bg-cyan/10 text-cyan/80 border border-cyan/20"
                      >
                        {ab.block?.name || ab.block_id}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-600 text-xs">No blocks</span>
                  )}
                  {(alphanaut.blocks?.length || 0) > 2 && (
                    <span className="text-xs text-slate-500">
                      +{(alphanaut.blocks?.length || 0) - 2}
                    </span>
                  )}
                </div>
              </td>
              <td>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                    alphanaut.is_active
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  )}
                >
                  {alphanaut.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="text-sm text-slate-400">
                {formatDate(alphanaut.created_at)}
              </td>
              <td>
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(alphanaut)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan hover:bg-cyan/10 transition-colors"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                  )}
                  {onToggleStatus && (
                    <button
                      onClick={() => onToggleStatus(alphanaut)}
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                        alphanaut.is_active
                          ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                          : 'text-slate-400 hover:text-green-400 hover:bg-green-500/10'
                      )}
                      title={alphanaut.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {alphanaut.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
