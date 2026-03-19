import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail, ExternalLink } from 'lucide-react';
import type { PublicLang } from '@/lib/public-lang';
import { t } from '@/lib/public-lang';

export default function Footer({ lang = 'en' }: { lang?: PublicLang }) {
  return (
    <footer className="bg-dark border-t border-cyan/10 mt-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan to-navy flex items-center justify-center font-bold text-white font-grotesk">
                AX
              </div>
              <span className="text-xl font-bold font-grotesk text-white">AlphaX</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {t(
                lang,
                'From knowledge consumers to knowledge creators. A Syrian research collective bridging the gap between global science and the Arab world.',
                'من مستهلكي المعرفة إلى صُنّاعها. تجمع بحثي سوري يجسر الفجوة بين العلم العالمي والعالم العربي.'
              )}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan hover:border-cyan/30 transition-colors"
              >
                <Twitter size={16} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan hover:border-cyan/30 transition-colors"
              >
                <Linkedin size={16} />
              </a>
              <a
                href="mailto:contact@alphax.org"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-cyan hover:border-cyan/30 transition-colors"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t(lang, 'Explore', 'استكشف')}
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: '/knowledge-bridge', label: t(lang, 'Knowledge Bridge', 'جسر المعرفة') },
                { href: '/research', label: t(lang, 'Research', 'الأبحاث') },
                { href: '/announcements', label: t(lang, 'Announcements', 'الإعلانات') },
                { href: '/about', label: t(lang, 'About Us', 'من نحن') },
                { href: '/orientation', label: t(lang, 'Orientation', 'الدليل التعريفي') },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-cyan transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Blocks */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t(lang, 'Our Blocks', 'فرقنا')}
            </h3>
            <ul className="space-y-2.5">
              {[
                '📚 Knowledge Bridge',
                '🏥 Asclepius Lab',
                '🧠 Neuroscience',
                '🎨 Creative Lab',
                '📡 Science Comm',
                '⚙️ Operations',
                '💻 Engineering',
              ].map((block) => (
                <li key={block}>
                  <span className="text-sm text-slate-400">{block}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Join */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t(lang, 'Get Involved', 'شارك معنا')}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {t(lang, 'Join AlphaX as a volunteer and help advance Arabic science.', 'انضم إلى AlphaX كمتطوع وساهم في تطوير العلم العربي.')}
            </p>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan/20 text-cyan border border-cyan/30 text-sm font-semibold hover:bg-cyan/30 transition-colors"
            >
              {t(lang, 'Apply Now', 'قدّم الآن')}
              <ExternalLink size={14} />
            </Link>
            <div className="mt-6">
              <Link
                href="/portal"
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                {t(lang, 'Alphanaut Portal →', 'بوابة ألفانات →')}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {t(
              lang,
              `© ${new Date().getFullYear()} AlphaX Research Collective. All rights reserved.`,
              `© ${new Date().getFullYear()} تجمع AlphaX البحثي. جميع الحقوق محفوظة.`
            )}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              {t(lang, 'Built with ', 'صُنع بـ ')}
              <span className="text-cyan">♥</span>{' '}
              {t(lang, 'for Arab science', 'من أجل العلم العربي')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
