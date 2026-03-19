import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabaseAdmin } from '@/lib/supabase';
import { RoleBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { Alphanaut } from '@/types';

const MILESTONES = [
  {
    date: 'Mid 2025',
    title: 'AlphaX Founded',
    description: 'AlphaX is established as a Syrian research collective by a group of passionate researchers determined to advance Arab science.',
  },
  {
    date: 'Late 2025',
    title: 'First Block Launches',
    description: 'Knowledge Bridge begins operations, translating the first batch of research papers into Arabic.',
  },
  {
    date: 'Early 2026',
    title: 'Asclepius Lab Formed',
    description: 'Medical AI research team launches, focusing on building tools for Arabic medical education.',
  },
  {
    date: 'Early 2026',
    title: 'Platform Launch',
    description: 'AlphaX launches its public platform, making all translated papers freely accessible to the Arab research community.',
  },
  {
    date: 'Early 2026',
    title: 'Growing to 7 Blocks',
    description: 'All seven blocks fully operational: Knowledge Bridge, Asclepius Lab, Neuroscience, Creative Lab, Science Comm, Operations, and Engineering.',
  },
];

async function getPublicAlphanauts() {
  const { data } = await supabaseAdmin
    .from('alphanauts')
    .select(`
      id, name, role, bio, university, field_of_study, avatar_url, created_at,
      alphanaut_blocks (
        role,
        blocks (slug, name, color, icon)
      )
    `)
    .eq('is_public', true)
    .eq('is_active', true)
    .order('role', { ascending: true });

  return data || [];
}

export default async function AboutPage() {
  const members = await getPublicAlphanauts();

  const captains = (members as any[]).filter((m) => m.role === 'co-captain');
  const navigators = (members as any[]).filter((m) => m.role === 'navigator');
  const alphanauts = (members as any[]).filter((m) => m.role === 'alphanaut');

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <span className="text-cyan text-sm font-semibold uppercase tracking-widest">About AlphaX</span>
          <h1 className="text-5xl sm:text-6xl font-bold font-grotesk text-white mt-4 mb-6">
            Who We Are
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            AlphaX is a Syrian research collective dedicated to building a knowledge bridge
            between the Arab world and global science. We translate, research, and train —
            all to transform Arab scientists from knowledge consumers into knowledge creators.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="glass-card rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-cyan/20 border border-cyan/30 flex items-center justify-center text-2xl mb-6">
                🎯
              </div>
              <h2 className="text-2xl font-bold font-grotesk text-white mb-4">Our Mission</h2>
              <p className="text-slate-400 leading-relaxed">
                To accelerate scientific progress in the Arab world by breaking down language and
                access barriers, fostering original research, and building the capacity of the next
                generation of Arab scientists and researchers.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-purple/20 border border-purple/30 flex items-center justify-center text-2xl mb-6">
                🔭
              </div>
              <h2 className="text-2xl font-bold font-grotesk text-white mb-4">Our Vision</h2>
              <p className="text-slate-400 leading-relaxed">
                A future where Arabic-speaking researchers have equal access to global knowledge,
                where original Arab research is published and recognized worldwide, and where
                Syria is a hub of scientific innovation and discovery.
              </p>
            </div>
          </div>

          {/* Three Pillars */}
          <h2 className="text-3xl font-bold font-grotesk text-white mb-8 text-center">
            Our Three Pillars
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {[
              {
                num: '1',
                icon: '📚',
                title: 'Translation & Access',
                subtitle: 'Knowledge Bridge',
                desc: 'We select high-impact research papers from leading journals and translate them into clear, scientifically accurate Arabic. Every paper is freely downloadable by anyone.',
                color: '#00B4D8',
              },
              {
                num: '2',
                icon: '🔬',
                title: 'Research & Innovation',
                subtitle: 'Original Research',
                desc: 'Our research blocks (Asclepius Lab and Neuroscience) conduct original research, collaborating with international researchers and publishing in peer-reviewed journals.',
                color: '#9B59B6',
              },
              {
                num: '3',
                icon: '🎓',
                title: 'Training & Capacity',
                subtitle: 'Alphanaut Development',
                desc: 'Through the Alphanaut program, we provide structured training, mentorship, and hands-on project experience to develop well-rounded researchers.',
                color: '#FF6B35',
              },
            ].map((pillar) => (
              <div key={pillar.num} className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className="text-6xl font-black opacity-5 absolute top-2 right-4 font-grotesk"
                  style={{ color: pillar.color }}>{pillar.num}</div>
                <div className="text-3xl mb-4">{pillar.icon}</div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: pillar.color }}>
                  {pillar.subtitle}
                </p>
                <h3 className="text-xl font-bold font-grotesk text-white mb-3">{pillar.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>

          {/* Blocks */}
          <h2 className="text-3xl font-bold font-grotesk text-white mb-8 text-center">
            Our Blocks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
            {[
              { icon: '📚', name: 'Knowledge Bridge', desc: 'Translation & Simplification', color: '#00B4D8' },
              { icon: '🏥', name: 'Asclepius Lab', desc: 'Med-AI Research', color: '#118AB2' },
              { icon: '🧠', name: 'Neuroscience Research', desc: 'Brain Science & Mental Health', color: '#9B59B6' },
              { icon: '🎨', name: 'Creative Lab', desc: 'Design & Visual Identity', color: '#FF6B35' },
              { icon: '📡', name: 'Science Communication', desc: 'Outreach & Social Media', color: '#FFD700' },
              { icon: '⚙️', name: 'Operations & Strategy', desc: 'Coordination & Planning', color: '#EDF2F4' },
              { icon: '💻', name: 'Engineering & Systems', desc: 'Technical Infrastructure', color: '#4FC3F7' },
            ].map((block) => (
              <div
                key={block.name}
                className="flex items-center gap-4 p-4 rounded-xl border transition-colors"
                style={{ backgroundColor: `${block.color}08`, borderColor: `${block.color}20` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ backgroundColor: `${block.color}15`, border: `1px solid ${block.color}30` }}
                >
                  {block.icon}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{block.name}</p>
                  <p className="text-xs text-slate-500">{block.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      {members.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-gold text-sm font-semibold uppercase tracking-widest">The Team</span>
              <h2 className="text-3xl sm:text-4xl font-bold font-grotesk text-white mt-3">
                Meet the Alphanauts
              </h2>
            </div>

            {captains.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-semibold text-gold mb-6 text-center uppercase tracking-widest">
                  Co-Captains
                </h3>
                <div className="flex flex-wrap justify-center gap-6">
                  {captains.map((m: Alphanaut) => <MemberCard key={m.id} member={m} />)}
                </div>
              </div>
            )}

            {navigators.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-semibold text-cyan mb-6 text-center uppercase tracking-widest">
                  Navigators
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {navigators.map((m: Alphanaut) => <MemberCard key={m.id} member={m} />)}
                </div>
              </div>
            )}

            {alphanauts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-purple mb-6 text-center uppercase tracking-widest">
                  Alphanauts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {alphanauts.map((m: Alphanaut) => <MemberCard key={m.id} member={m} compact />)}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-orange text-sm font-semibold uppercase tracking-widest">Journey</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-grotesk text-white mt-3">
              AlphaX Timeline
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan via-purple to-orange" />

            <div className="space-y-8">
              {MILESTONES.map((milestone, i) => (
                <div key={i} className="flex gap-6 pl-2">
                  {/* Dot */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-dark border-2 border-cyan flex items-center justify-center z-10 relative">
                      <div className="w-3 h-3 rounded-full bg-cyan" />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="glass-card rounded-xl p-5 flex-1 mb-2">
                    <p className="text-xs text-cyan font-semibold uppercase tracking-widest mb-1">
                      {milestone.date}
                    </p>
                    <h3 className="text-lg font-bold font-grotesk text-white mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function MemberCard({ member, compact = false }: { member: Alphanaut; compact?: boolean }) {
  const blocks = (member as any).alphanaut_blocks || [];

  if (compact) {
    return (
      <div className="glass-card rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy to-cyan/20 flex items-center justify-center text-white font-bold font-grotesk shrink-0">
          {member.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate">{member.name}</p>
          <p className="text-xs text-slate-500 truncate">{member.university || member.field_of_study || ''}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 w-full max-w-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy to-cyan/30 flex items-center justify-center text-2xl font-bold font-grotesk text-white">
          {member.name.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-white font-grotesk text-lg">{member.name}</p>
          <RoleBadge role={member.role} />
        </div>
      </div>
      {member.bio && (
        <p className="text-sm text-slate-400 leading-relaxed mb-4">{member.bio}</p>
      )}
      {(member.university || member.field_of_study) && (
        <p className="text-xs text-slate-500">
          {[member.university, member.field_of_study].filter(Boolean).join(' · ')}
        </p>
      )}
      {blocks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {blocks.slice(0, 3).map((ab: any) => ab.blocks && (
            <span
              key={ab.blocks.slug}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${ab.blocks.color}15`,
                color: ab.blocks.color,
                border: `1px solid ${ab.blocks.color}30`,
              }}
            >
              {ab.blocks.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
