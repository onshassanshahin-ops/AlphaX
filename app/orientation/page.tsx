import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowRight, BookOpen, Users, Star, Shield, Lightbulb, Target } from 'lucide-react';
import { getPublicLang } from '@/lib/public-lang.server';
import { t } from '@/lib/public-lang';

export default function OrientationPage() {
  const lang = getPublicLang();
  return (
    <div className="min-h-screen flex flex-col bg-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />
        <div className="absolute top-32 left-1/4 w-64 h-64 bg-cyan/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-48 h-48 bg-purple/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan/30 bg-cyan/10 text-cyan text-sm font-medium mb-6">
            <BookOpen size={14} />
            {t(lang, 'Alphanaut Orientation Manual', 'الدليل التعريفي للألفانات')}
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold font-grotesk text-white mb-6 leading-tight">
            {t(lang, 'Welcome to ', 'مرحبًا بك في ')}
            <span className="text-gradient">AlphaX</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            {t(
              lang,
              'This is your complete guide to becoming an Alphanaut — our values, structure, responsibilities, and what it means to be part of this collective.',
              'هذا دليلك الكامل لتصبح ألفانات: قيمنا، هيكلنا، المسؤوليات، ومعنى الانضمام إلى هذا التجمع.'
            )}
          </p>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold font-grotesk text-white mb-4">{t(lang, 'Table of Contents', 'جدول المحتويات')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'what-is-alphax', label: t(lang, '1. What is AlphaX?', '1. ما هو AlphaX؟') },
                { id: 'our-vision', label: t(lang, '2. Our Vision & Mission', '2. الرؤية والرسالة') },
                { id: 'three-pillars', label: t(lang, '3. The Three Pillars', '3. الركائز الثلاث') },
                { id: 'blocks', label: t(lang, '4. Blocks & Structure', '4. الفرق والهيكل') },
                { id: 'roles', label: t(lang, '5. Roles & Hierarchy', '5. الأدوار والهيكلية') },
                { id: 'becoming-alphanaut', label: t(lang, '6. Becoming an Alphanaut', '6. كيف تصبح ألفانات') },
                { id: 'responsibilities', label: t(lang, '7. Your Responsibilities', '7. مسؤولياتك') },
                { id: 'values', label: t(lang, '8. Core Values', '8. القيم الأساسية') },
                { id: 'code-of-conduct', label: t(lang, '9. Code of Conduct', '9. مدونة السلوك') },
                { id: 'faq', label: t(lang, '10. FAQ', '10. الأسئلة الشائعة') },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-cyan hover:bg-cyan/5 transition-colors"
                >
                  <ArrowRight size={14} />
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* Section 1 */}
          <div id="what-is-alphax" className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-cyan/20 border border-cyan/30 flex items-center justify-center">
                <Target size={24} className="text-cyan" />
              </div>
              <div>
                <p className="text-xs text-cyan uppercase tracking-widest font-semibold">Section 1</p>
                <h2 className="text-2xl font-bold font-grotesk text-white">What is AlphaX?</h2>
              </div>
            </div>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                AlphaX is a Syrian research collective — a community of passionate individuals united
                by a single belief: <strong className="text-white">the Arab world deserves to be a producer of global knowledge,
                not just a consumer of it.</strong>
              </p>
              <p>
                We are researchers, translators, designers, developers, and communicators. We are
                students, graduates, and professionals. What unites us is a commitment to advancing
                Arab science in three key areas: translation and access, original research, and
                capacity building.
              </p>
              <p>
                The name &ldquo;AlphaX&rdquo; reflects our identity. <em>Alpha</em> represents excellence, leadership,
                and being first. <em>X</em> represents the unknown, the frontier, the questions we
                haven&rsquo;t yet answered. Together, AlphaX means being at the cutting edge — always
                pushing forward into the unknown.
              </p>
              <p>
                Our members are called <strong className="text-cyan">Alphanauts</strong> — explorers of knowledge,
                navigating the frontier of science just as astronauts navigate space.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div id="our-vision" className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple/20 border border-purple/30 flex items-center justify-center">
                <Star size={24} className="text-purple" />
              </div>
              <div>
                <p className="text-xs text-purple uppercase tracking-widest font-semibold">Section 2</p>
                <h2 className="text-2xl font-bold font-grotesk text-white">Our Vision & Mission</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-5 rounded-xl bg-cyan/5 border border-cyan/15">
                <h3 className="font-bold text-cyan mb-3 text-lg">🎯 Vision</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  A future where Arabic-speaking scientists contribute at the highest levels of
                  global research, where knowledge barriers are eliminated, and where Syria is
                  recognized as a hub of scientific innovation.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-purple/5 border border-purple/15">
                <h3 className="font-bold text-purple mb-3 text-lg">🚀 Mission</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  To bridge the knowledge gap in the Arab world by translating global research,
                  conducting original studies, and developing the next generation of Arab researchers
                  through structured training and mentorship.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-dark/50 border border-white/5">
              <p className="text-center text-xl font-bold font-grotesk text-white italic">
                &ldquo;From knowledge consumers to knowledge creators.&rdquo;
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div id="three-pillars" className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-orange/20 border border-orange/30 flex items-center justify-center">
                <Lightbulb size={24} className="text-orange" />
              </div>
              <div>
                <p className="text-xs text-orange uppercase tracking-widest font-semibold">Section 3</p>
                <h2 className="text-2xl font-bold font-grotesk text-white">The Three Pillars</h2>
              </div>
            </div>

            <div className="space-y-6">
              {[
                {
                  num: '01',
                  color: '#00B4D8',
                  title: 'Pillar 1: Translation & Access',
                  subtitle: 'Knowledge Bridge',
                  content: `The world's most important research is published in English. For Arabic-speaking researchers and students, this creates a significant barrier — not just linguistic, but intellectual and cultural. The Knowledge Bridge pillar exists to demolish that barrier.

Our translators select high-impact papers from leading journals across medicine, AI, neuroscience, and STEM. They translate them into clear, accurate, scientifically sound Arabic, and make them freely available to anyone.

Every paper we translate is not just a translation — it's an act of democratizing knowledge.`,
                },
                {
                  num: '02',
                  color: '#9B59B6',
                  title: 'Pillar 2: Research & Innovation',
                  subtitle: 'Original Research',
                  content: `Translation alone is not enough. AlphaX aspires to be a producer of original research, not just a translator of others'. Our research blocks — Asclepius Lab and Neuroscience Research — conduct studies, collaborate with international researchers, and submit findings to peer-reviewed journals.

From medical AI tools designed for Arabic-speaking patients, to ADHD and mental health research in the Syrian context, our researchers are tackling real problems that matter to our community.`,
                },
                {
                  num: '03',
                  color: '#FF6B35',
                  title: 'Pillar 3: Training & Capacity Building',
                  subtitle: 'Alphanaut Development',
                  content: `A collective is only as strong as its members. AlphaX invests deeply in developing the skills, knowledge, and mindset of every Alphanaut. Through the orientation program, ongoing workshops, mentorship from Navigators, and hands-on project experience, we turn enthusiastic beginners into capable researchers and contributors.

When you join AlphaX, you don't just get a title — you get a curriculum.`,
                },
              ].map((pillar) => (
                <div key={pillar.num} className="p-6 rounded-xl border"
                  style={{ backgroundColor: `${pillar.color}08`, borderColor: `${pillar.color}20` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl font-black opacity-30 font-grotesk" style={{ color: pillar.color }}>
                      {pillar.num}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: pillar.color }}>
                        {pillar.subtitle}
                      </p>
                      <h3 className="text-lg font-bold font-grotesk text-white">{pillar.title}</h3>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{pillar.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 */}
          <div id="blocks" className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal/20 border border-teal/30 flex items-center justify-center">
                <Users size={24} className="text-teal" />
              </div>
              <div>
                <p className="text-xs text-teal uppercase tracking-widest font-semibold">Section 4</p>
                <h2 className="text-2xl font-bold font-grotesk text-white">Blocks & Structure</h2>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed mb-6">
              AlphaX is organized into <strong className="text-white">Blocks</strong> — specialized teams, each with a distinct
              focus. Think of blocks like departments in a research institute. You can belong to
              one or multiple blocks, depending on your skills and interest.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: '📚', name: 'Knowledge Bridge', color: '#00B4D8', desc: 'Select, translate, and publish global research papers in Arabic. Requires Arabic-English bilingual proficiency and scientific literacy.' },
                { icon: '🏥', name: 'Asclepius Lab', color: '#118AB2', desc: 'Medical AI research. Build tools for Arabic medical education and conduct clinical AI studies. For medical students and AI engineers.' },
                { icon: '🧠', name: 'Neuroscience Research', color: '#9B59B6', desc: 'ADHD, mental health, and cognitive neuroscience research. For psychology, neuroscience, and medical students.' },
                { icon: '🎨', name: 'Creative Lab', color: '#FF6B35', desc: 'Visual identity, infographics, social media graphics, and scientific visualization. For designers and visual artists.' },
                { icon: '📡', name: 'Science Communication', color: '#FFD700', desc: 'Manage AlphaX social media, write science explainers, organize events, and build community. For communicators and writers.' },
                { icon: '⚙️', name: 'Operations & Strategy', color: '#EDF2F4', desc: 'Project management, partnerships, strategic planning, and organizational logistics. For organized, strategic thinkers.' },
                { icon: '💻', name: 'Engineering & Systems', color: '#4FC3F7', desc: 'Build and maintain AlphaX\'s technical infrastructure — website, tools, and internal systems. For developers and engineers.' },
              ].map((block) => (
                <div key={block.name} className="p-4 rounded-xl border"
                  style={{ backgroundColor: `${block.color}08`, borderColor: `${block.color}20` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{block.icon}</span>
                    <p className="font-bold text-white">{block.name}</p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{block.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5 */}
          <div id="roles" className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center">
                <Shield size={24} className="text-gold" />
              </div>
              <div>
                <p className="text-xs text-gold uppercase tracking-widest font-semibold">Section 5</p>
                <h2 className="text-2xl font-bold font-grotesk text-white">Roles & Hierarchy</h2>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed mb-6">
              AlphaX has a flat, collaborative structure with three formal roles:
            </p>

            <div className="space-y-4">
              {[
                {
                  role: 'Co-Captain',
                  color: '#FFD700',
                  badge: '★',
                  desc: 'The founders and overall leaders of AlphaX. Co-Captains set the vision, make strategic decisions, and ensure AlphaX stays true to its mission. They have access to all blocks and all portals.',
                },
                {
                  role: 'Navigator',
                  color: '#00B4D8',
                  badge: '◈',
                  desc: 'Each block has a Navigator — an experienced Alphanaut appointed to lead that block. Navigators approve papers and research, assign tasks, mentor members, and represent the block to Co-Captains. Being a Navigator is both a privilege and a significant responsibility.',
                },
                {
                  role: 'Alphanaut',
                  color: '#9B59B6',
                  badge: '●',
                  desc: 'The core members of AlphaX. All new members start as Alphanauts. As you contribute, learn, and grow, you may be considered for Navigator roles. An Alphanaut is a contributor — every contribution matters.',
                },
              ].map((r) => (
                <div key={r.role} className="p-5 rounded-xl border flex gap-4"
                  style={{ backgroundColor: `${r.color}08`, borderColor: `${r.color}20` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ backgroundColor: `${r.color}20`, color: r.color }}>
                    {r.badge}
                  </div>
                  <div>
                    <p className="font-bold text-white mb-1">{r.role}</p>
                    <p className="text-sm text-slate-400 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6 */}
          <div id="becoming-alphanaut" className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-cyan/20 border border-cyan/30 flex items-center justify-center text-2xl">
                🚀
              </div>
              <div>
                <p className="text-xs text-cyan uppercase tracking-widest font-semibold">Section 6</p>
                <h2 className="text-2xl font-bold font-grotesk text-white">Becoming an Alphanaut</h2>
              </div>
            </div>

            <div className="space-y-4 text-slate-300 leading-relaxed mb-6">
              <p>The process of becoming an Alphanaut is straightforward:</p>
            </div>

            <div className="space-y-4">
              {[
                { step: '01', title: 'Apply', desc: 'Complete the application form on our Join page. Tell us who you are, why you want to join, what skills you bring, and which blocks interest you.' },
                { step: '02', title: 'Review', desc: 'Our team reviews your application within 1–3 business days. We look for genuine motivation, alignment with our values, and skills that can contribute to our mission.' },
                { step: '03', title: 'Acceptance', desc: 'If accepted, you\'ll receive your unique 8-digit Alphanaut Access Code (format: AX-XXXXXXXX). This code is your key to the Alphanaut Portal.' },
                { step: '04', title: 'Orientation', desc: 'You\'re reading it! Complete this orientation manual to understand AlphaX fully before diving into your block work.' },
                { step: '05', title: 'Onboarding', desc: 'Your Navigator will reach out to welcome you to the block, explain your first tasks, and introduce you to the team.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 p-4 rounded-xl bg-dark/50 border border-white/5">
                  <span className="text-2xl font-black text-cyan/30 font-grotesk shrink-0 w-10">{s.step}</span>
                  <div>
                    <p className="font-bold text-white mb-1">{s.title}</p>
                    <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7 */}
          <div id="responsibilities" className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-orange/20 border border-orange/30 flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <p className="text-xs text-orange uppercase tracking-widest font-semibold">Section 7</p>
                <h2 className="text-2xl font-bold font-grotesk text-white">Your Responsibilities</h2>
              </div>
            </div>

            <p className="text-slate-300 mb-6">
              Being an Alphanaut is a commitment, not just a title. Here&rsquo;s what we expect from every member:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: '⏰', title: 'Active Participation', desc: 'Contribute regularly to your block. If you need a break, communicate it to your Navigator.' },
                { icon: '📋', title: 'Meet Deadlines', desc: 'Respect timelines for assigned tasks. AlphaX is a collective — delays affect everyone.' },
                { icon: '🗣️', title: 'Communicate Openly', desc: 'If you\'re stuck, overwhelmed, or have a suggestion, speak up. We support each other.' },
                { icon: '📚', title: 'Keep Learning', desc: 'AlphaX invests in your growth. Attend workshops, read the materials, and stay curious.' },
                { icon: '🤝', title: 'Collaborate', desc: 'We are a collective. Help teammates, share knowledge, and credit others\' contributions.' },
                { icon: '🌐', title: 'Represent AlphaX', desc: 'When you interact publicly as an AlphaX member, you represent all of us. Act accordingly.' },
              ].map((r) => (
                <div key={r.title} className="p-4 rounded-xl bg-dark/50 border border-white/5">
                  <p className="text-2xl mb-2">{r.icon}</p>
                  <p className="font-semibold text-white mb-1">{r.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8 */}
          <div id="values" className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple/20 border border-purple/30 flex items-center justify-center text-2xl">
                💎
              </div>
              <div>
                <p className="text-xs text-purple uppercase tracking-widest font-semibold">Section 8</p>
                <h2 className="text-2xl font-bold font-grotesk text-white">Core Values</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { value: 'Scientific Integrity', desc: 'We are committed to truth, accuracy, and rigorous methodology. We never compromise scientific integrity for speed or convenience.' },
                { value: 'Accessibility', desc: 'Knowledge should be free and accessible. We publish all our translations for free, forever.' },
                { value: 'Excellence', desc: 'We hold ourselves to high standards. If something bears the AlphaX name, it should be outstanding.' },
                { value: 'Community', desc: 'We are stronger together. We celebrate each other\'s successes and support each other through challenges.' },
                { value: 'Innovation', desc: 'We don\'t just translate the status quo — we push boundaries, try new approaches, and question assumptions.' },
                { value: 'Impact', desc: 'Everything we do should have real impact on real people. We ask: "Who does this help, and how?"' },
              ].map((v) => (
                <div key={v.value} className="p-4 rounded-xl bg-purple/5 border border-purple/15">
                  <p className="font-bold text-purple mb-1">{v.value}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 9 */}
          <div id="code-of-conduct" className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-2xl">
                📜
              </div>
              <div>
                <p className="text-xs text-red-400 uppercase tracking-widest font-semibold">Section 9</p>
                <h2 className="text-2xl font-bold font-grotesk text-white">Code of Conduct</h2>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed mb-6">
              All Alphanauts are expected to uphold the following standards:
            </p>

            <div className="space-y-3">
              {[
                'Treat all members with respect, regardless of their background, experience level, or role.',
                'Do not plagiarize or misrepresent work — in translations, research, or any AlphaX output.',
                'Keep internal discussions and sensitive information confidential.',
                'Do not use AlphaX\'s name, resources, or platform for personal gain without authorization.',
                'Report any violations of this code to a Navigator or Co-Captain immediately.',
                'Harassment, discrimination, or intimidation of any kind is grounds for immediate removal.',
              ].map((rule, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl bg-dark/50 border border-red-500/10">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-300">
                <strong>Violation of this code of conduct may result in removal from AlphaX without notice.</strong>
              </p>
            </div>
          </div>

          {/* Section 10 - FAQ */}
          <div id="faq" className="glass-card rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal/20 border border-teal/30 flex items-center justify-center text-2xl">
                ❓
              </div>
              <div>
                <p className="text-xs text-teal uppercase tracking-widest font-semibold">Section 10</p>
                <h2 className="text-2xl font-bold font-grotesk text-white">Frequently Asked Questions</h2>
              </div>
            </div>

            <div className="space-y-5">
              {[
                {
                  q: 'Is AlphaX paid?',
                  a: 'AlphaX is currently a volunteer collective. All contributions are made out of passion for the mission. In the future, we hope to offer stipends for specific roles as we grow.',
                },
                {
                  q: 'How much time commitment is required?',
                  a: 'It varies by block and role, but generally we expect 3–8 hours per week from active Alphanauts. If you\'re going through a busy period, just communicate with your Navigator.',
                },
                {
                  q: 'Can I be in multiple blocks?',
                  a: 'Yes! If you have skills applicable to multiple blocks, you can request access to additional blocks through the portal. However, we recommend starting with one block and establishing yourself before expanding.',
                },
                {
                  q: 'What if I\'m a beginner in my field?',
                  a: 'We welcome beginners. AlphaX is partly a learning environment. You\'ll be paired with more experienced members and given tasks appropriate for your level. Growth is part of the mission.',
                },
                {
                  q: 'Do I need to be Syrian?',
                  a: 'Our roots are Syrian, but AlphaX welcomes anyone who aligns with our mission to advance Arabic science. We have members from the Syrian diaspora and beyond.',
                },
                {
                  q: 'What if I lose my access code?',
                  a: 'Contact a Navigator or Co-Captain. They can retrieve your code from the admin panel. Your code is tied to your profile — it can be retrieved but not changed.',
                },
              ].map((faq, i) => (
                <div key={i} className="p-5 rounded-xl bg-dark/50 border border-teal/10">
                  <p className="font-bold text-teal mb-2">{faq.q}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="glass-card rounded-2xl p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 via-transparent to-purple/5 pointer-events-none" />
            <div className="relative">
              <p className="text-4xl mb-4">🚀</p>
              <h2 className="text-3xl font-bold font-grotesk text-white mb-4">
                Ready to Begin?
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                If you haven&rsquo;t applied yet, now is the time. AlphaX is growing, and we need
                passionate people like you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/join" className="btn-primary flex items-center gap-2 text-base px-8 py-4">
                  Apply Now
                  <ArrowRight size={18} />
                </Link>
                <Link href="/portal" className="px-8 py-4 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-white/30 transition-all font-semibold">
                  Access Portal
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer lang={lang} />
    </div>
  );
}
