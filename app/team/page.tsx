import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { Users, Star } from 'lucide-react';
import Link from 'next/link';

interface Alphanaut {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatar_url?: string;
  university?: string;
  field_of_study?: string;
  alphanaut_blocks: Array<{ blocks: { name: string; color: string; icon: string } }>;
}

async function getTeam() {
  const { data } = await supabaseAdmin
    .from('alphanauts')
    .select(`
      id, name, role, bio, avatar_url, university, field_of_study,
      alphanaut_blocks(
        blocks(name, color, icon)
      )
    `)
    .eq('is_public', true)
    .eq('is_active', true)
    .order('role', { ascending: true });
  return data || [];
}

const roleOrder: Record<string, number> = { 'co-captain': 0, navigator: 1, alphanaut: 2 };
const roleLabel: Record<string, string> = { 'co-captain': 'Co-Captain', navigator: 'Navigator', alphanaut: 'Alphanaut' };
const roleColor: Record<string, string> = { 'co-captain': '#FFD700', navigator: '#00D4FF', alphanaut: '#9B59B6' };

function Avatar({ name, url, size = 48 }: { name: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="rounded-full bg-gradient-to-br from-cyan/20 to-purple/20 border border-cyan/20 flex items-center justify-center font-bold text-white font-grotesk"
      style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

export default async function TeamPage() {
  const team = (await getTeam()) as unknown as Alphanaut[];
  const sorted = [...team].sort((a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3));
  const coCaptains = sorted.filter(m => m.role === 'co-captain');
  const navigators = sorted.filter(m => m.role === 'navigator');
  const alphanauts = sorted.filter(m => m.role === 'alphanaut');

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-15 pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-64 h-64 bg-purple/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan/30 bg-cyan/10 text-cyan text-sm font-medium mb-6">
            <Users size={14} />
            The Team
          </div>
          <h1 className="text-5xl font-bold font-grotesk text-white mb-5">
            Meet the <span className="text-gradient">Alphanauts</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Researchers, translators, designers, and communicators united by one mission — advancing Arabic science.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto space-y-14">

          {/* Co-Captains */}
          {coCaptains.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold font-grotesk text-white mb-6">
                <Star size={18} className="text-gold" />
                Co-Captains
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {coCaptains.map(m => <MemberCard key={m.id} member={m} />)}
              </div>
            </div>
          )}

          {/* Navigators */}
          {navigators.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold font-grotesk text-white mb-6">
                <span className="text-2xl">◈</span>
                <span className="text-cyan">Navigators</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {navigators.map(m => <MemberCard key={m.id} member={m} />)}
              </div>
            </div>
          )}

          {/* Alphanauts */}
          {alphanauts.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold font-grotesk text-white mb-6">
                <span className="text-purple font-bold">●</span>
                Alphanauts
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {alphanauts.map(m => <MemberCard key={m.id} member={m} compact />)}
              </div>
            </div>
          )}

          {team.length === 0 && (
            <div className="text-center py-20">
              <Users size={48} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">Team profiles coming soon.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function MemberCard({ member, compact = false }: { member: Alphanaut; compact?: boolean }) {
  const color = roleColor[member.role] || '#94a3b8';
  const label = roleLabel[member.role] || 'Alphanaut';
  const blocks = member.alphanaut_blocks?.map(ab => ab.blocks).filter(Boolean) || [];

  return (
    <Link href={`/team/${member.id}`}
      className="glass-card rounded-2xl p-5 flex flex-col gap-3 border border-white/5 hover:border-cyan/20 hover:-translate-y-1 transition-all group">
      <div className="flex items-center gap-3">
        <Avatar name={member.name} url={member.avatar_url} size={compact ? 40 : 52} />
        <div className="min-w-0">
          <p className="font-bold text-white group-hover:text-cyan transition-colors truncate">{member.name}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}15`, color }}>
            {label}
          </span>
        </div>
      </div>

      {!compact && member.bio && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{member.bio}</p>
      )}

      {!compact && member.university && (
        <p className="text-xs text-slate-600">{member.university}{member.field_of_study ? ` · ${member.field_of_study}` : ''}</p>
      )}

      {blocks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {blocks.slice(0, 3).map((b, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full border"
              style={{ backgroundColor: `${b.color}10`, borderColor: `${b.color}25`, color: b.color }}>
              {b.icon} {b.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
