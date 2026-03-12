import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, FlaskConical, Calendar } from 'lucide-react';
import Link from 'next/link';

async function getMember(id: string) {
  const { data } = await supabaseAdmin
    .from('alphanauts')
    .select(`
      id, name, role, bio, avatar_url, university, field_of_study, created_at,
      alphanaut_blocks(
        role,
        blocks(name, color, icon, slug)
      )
    `)
    .eq('id', id)
    .eq('is_public', true)
    .eq('is_active', true)
    .single();
  return data;
}

async function getMemberPapers(id: string) {
  const { data } = await supabaseAdmin
    .from('papers')
    .select('id, title_ar, title_en, field, published_at')
    .eq('submitted_by', id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(6);
  return data || [];
}

async function getMemberResearch(id: string) {
  const { data } = await supabaseAdmin
    .from('research_authors')
    .select('research_projects(id, title, field, status, published_at)')
    .eq('alphanaut_id', id)
    .limit(6);
  return (data || []).map((r: { research_projects: unknown }) => r.research_projects).filter(Boolean);
}

const roleLabel: Record<string, string> = { 'co-captain': 'Co-Captain', navigator: 'Navigator', alphanaut: 'Alphanaut' };
const roleColor: Record<string, string> = { 'co-captain': '#FFD700', navigator: '#00D4FF', alphanaut: '#9B59B6' };

function Avatar({ name, url }: { name: string; url?: string }) {
  if (url) return <img src={url} alt={name} className="w-24 h-24 rounded-2xl object-cover border border-cyan/20" />;
  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan/20 to-purple/20 border border-cyan/20 flex items-center justify-center text-3xl font-bold text-white font-grotesk">
      {initials}
    </div>
  );
}

export default async function MemberProfilePage({ params }: { params: { id: string } }) {
  const [member, papers, research] = await Promise.all([
    getMember(params.id),
    getMemberPapers(params.id),
    getMemberResearch(params.id),
  ]);

  if (!member) notFound();

  const color = roleColor[member.role] || '#94a3b8';
  const label = roleLabel[member.role] || 'Alphanaut';
  const blocks = (member.alphanaut_blocks || []).map((ab: { blocks: { name: string; color: string; icon: string; slug: string }[]; role: string }) => {
    const b = Array.isArray(ab.blocks) ? ab.blocks[0] : ab.blocks;
    return b ? { ...b, memberRole: ab.role } : null;
  }).filter(Boolean) as { name: string; color: string; icon: string; slug: string; memberRole: string }[];
  const joinYear = new Date(member.created_at).getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      <section className="pt-24 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <Link href="/team" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-cyan transition-colors mb-8">
            <ArrowLeft size={16} />
            Back to Team
          </Link>

          {/* Profile Header */}
          <div className="glass-card rounded-2xl p-8 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 hero-grid opacity-5 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
              style={{ backgroundColor: `${color}08` }} />
            <div className="relative flex flex-col sm:flex-row gap-6 items-start">
              <Avatar name={member.name} url={member.avatar_url} />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold font-grotesk text-white">{member.name}</h1>
                  <span className="text-sm font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${color}15`, color }}>
                    {label}
                  </span>
                </div>
                {member.bio && (
                  <p className="text-slate-300 leading-relaxed mb-4 max-w-xl">{member.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  {member.university && <span>🎓 {member.university}</span>}
                  {member.field_of_study && <span>📖 {member.field_of_study}</span>}
                  <span className="flex items-center gap-1.5"><Calendar size={13} /> Joined {joinYear}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Blocks */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-bold font-grotesk text-white mb-4">Blocks</h2>
              {blocks.length === 0 ? (
                <p className="text-slate-500 text-sm">No public blocks</p>
              ) : (
                <div className="space-y-3">
                  {blocks.map((b: { name: string; color: string; icon: string; slug: string; memberRole: string }, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ backgroundColor: `${b.color}08`, borderColor: `${b.color}20` }}>
                      <span className="text-xl">{b.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{b.name}</p>
                        <p className="text-xs capitalize" style={{ color: b.color }}>
                          {b.memberRole === 'navigator' ? 'Navigator' : 'Member'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="mt-5 pt-5 border-t border-white/5 grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-xl bg-dark/50">
                  <p className="text-2xl font-bold text-cyan font-grotesk">{papers.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Papers</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-dark/50">
                  <p className="text-2xl font-bold text-purple font-grotesk">{research.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Research</p>
                </div>
              </div>
            </div>

            {/* Contributions */}
            <div className="lg:col-span-2 space-y-5">
              {/* Papers */}
              {papers.length > 0 && (
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-bold font-grotesk text-white mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-cyan" />
                    Published Papers
                  </h2>
                  <div className="space-y-2">
                    {papers.map(p => (
                      <Link key={p.id} href={`/knowledge-bridge/${p.id}`}
                        className="flex items-start gap-3 p-3 rounded-xl bg-dark/50 border border-white/5 hover:border-cyan/20 transition-colors group">
                        <FileText size={15} className="text-slate-500 group-hover:text-cyan mt-0.5 shrink-0 transition-colors" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-cyan transition-colors">
                            {p.title_ar || p.title_en}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5 capitalize">{p.field}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Research */}
              {research.length > 0 && (
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-bold font-grotesk text-white mb-4 flex items-center gap-2">
                    <FlaskConical size={16} className="text-purple" />
                    Research Projects
                  </h2>
                  <div className="space-y-2">
                    {(research as { id: string; title: string; field?: string; status?: string }[]).map((r) => (
                      <Link key={r.id} href={`/research/${r.id}`}
                        className="flex items-start gap-3 p-3 rounded-xl bg-dark/50 border border-white/5 hover:border-purple/20 transition-colors group">
                        <FlaskConical size={15} className="text-slate-500 group-hover:text-purple mt-0.5 shrink-0 transition-colors" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{r.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5 capitalize">{r.field} · {r.status?.replace('_', ' ')}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {papers.length === 0 && research.length === 0 && (
                <div className="glass-card rounded-2xl p-10 text-center">
                  <p className="text-slate-500 text-sm">No public contributions yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
