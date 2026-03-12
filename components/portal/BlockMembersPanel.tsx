'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Star } from 'lucide-react';

interface BlockMember {
  id: string;
  name: string;
  university?: string;
  field_of_study?: string;
  blockRole: 'member' | 'navigator';
}

interface BlockMembersPanelProps {
  blockSlug: string;
  currentAlphanautId: string;
}

export default function BlockMembersPanel({ blockSlug, currentAlphanautId }: BlockMembersPanelProps) {
  const [members, setMembers] = useState<BlockMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blocks/${blockSlug}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } finally {
      setLoading(false);
    }
  }, [blockSlug]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const navigator = members.find(m => m.blockRole === 'navigator');
  const teammates = members.filter(m => m.blockRole !== 'navigator' && m.id !== currentAlphanautId);
  const you = members.find(m => m.id === currentAlphanautId);

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div>
          <h3 className="font-bold font-grotesk text-white flex items-center gap-2">
            <Users size={16} className="text-cyan" />
            Your Team
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''} in this block</p>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {loading ? (
          <div className="text-center py-6 text-slate-500 text-sm">Loading...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-6">
            <Users size={24} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No members yet</p>
          </div>
        ) : (
          <>
            {/* Navigator */}
            {navigator && (
              <div className="mb-3">
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-2 px-1">Navigator</p>
                <MemberRow member={navigator} isYou={navigator.id === currentAlphanautId} initials={initials} />
              </div>
            )}

            {/* You */}
            {you && you.blockRole !== 'navigator' && (
              <div className="mb-3">
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-2 px-1">You</p>
                <MemberRow member={you} isYou={true} initials={initials} />
              </div>
            )}

            {/* Teammates */}
            {teammates.length > 0 && (
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-2 px-1">
                  Teammates ({teammates.length})
                </p>
                <div className="space-y-1.5">
                  {teammates.map(m => (
                    <MemberRow key={m.id} member={m} isYou={false} initials={initials} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MemberRow({ member, isYou, initials }: { member: BlockMember; isYou: boolean; initials: (n: string) => string }) {
  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${isYou ? 'bg-cyan/5 border border-cyan/10' : 'hover:bg-white/3'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-grotesk shrink-0 ${
        member.blockRole === 'navigator' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-navy/60 text-cyan'
      }`}>
        {initials(member.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-white truncate">{member.name}{isYou && <span className="text-xs text-slate-500 ml-1">(you)</span>}</p>
          {member.blockRole === 'navigator' && (
            <Star size={11} className="text-yellow-400 shrink-0" />
          )}
        </div>
        {(member.field_of_study || member.university) && (
          <p className="text-xs text-slate-500 truncate">
            {member.field_of_study}{member.field_of_study && member.university ? ' · ' : ''}{member.university}
          </p>
        )}
      </div>
    </div>
  );
}
