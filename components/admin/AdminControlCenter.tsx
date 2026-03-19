'use client';

import { useState, useEffect } from 'react';
import {
  Globe,
  LayoutDashboard,
  Shield,
  Cpu,
  Save,
  CheckCircle,
  RefreshCw,
  Activity,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatRelativeDate } from '@/lib/utils';

interface HeroSettings {
  badge: string;
  title_line1: string;
  highlight1: string;
  title_line2: string;
  highlight2: string;
  subtitle: string;
  cta_primary: string;
  cta_secondary: string;
  partner_text: string;
}

interface DashboardBanners {
  portal_welcome: string;
  knowledge_bridge_header: string;
  research_header: string;
  creative_lab_header: string;
  science_comm_header: string;
  operations_header: string;
  engineering_header: string;
}

interface FeatureFlags {
  homepage_blocks_editor: boolean;
  widgets_marketplace: boolean;
  smart_assignment_assistant: boolean;
  notification_center: boolean;
  okr_layer: boolean;
  public_impact_dashboard: boolean;
  knowledge_quality_scoring: boolean;
  reliability_addons: boolean;
  content_scheduling: boolean;
  navigator_analytics: boolean;
  block_ai_assistant: boolean;
}

interface WidgetLayout {
  show_notification_center: boolean;
  show_mission_board: boolean;
  show_team_health: boolean;
  show_weekly_focus: boolean;
  show_signal_stream: boolean;
  show_activity_timeline: boolean;
}

interface ActivityEntry {
  id: string;
  action: string;
  actor_id: string;
  actor_type: string | null;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface Props {
  activities: ActivityEntry[];
  activityTotal: number;
}

const TABS = [
  { id: 'website', label: 'Website Content', icon: Globe },
  { id: 'dashboard', label: 'Dashboard Banners', icon: LayoutDashboard },
  { id: 'product', label: 'Product Lab', icon: Cpu },
  { id: 'audit', label: 'Audit & Safety', icon: Shield },
];

const DEFAULTS_HERO: HeroSettings = {
  badge: 'Syrian Research Collective',
  title_line1: 'From Knowledge',
  highlight1: 'Consumers',
  title_line2: 'to Knowledge',
  highlight2: 'Creators',
  subtitle:
    'AlphaX bridges the gap between global science and the Arab world — translating research, publishing discoveries, and training the next generation of Arab scientists.',
  cta_primary: 'Explore Research',
  cta_secondary: 'Join the Collective',
  partner_text: 'AlphaX collaborate with Syrian Virtual University (SVU)',
};

const DEFAULTS_BANNERS: DashboardBanners = {
  portal_welcome:
    'This is your live pulse feed: block access, current mission tasks, announcements, and your contribution history.',
  knowledge_bridge_header: 'Translate. Validate. Publish.',
  research_header: 'Research in Progress',
  creative_lab_header: 'Create. Communicate. Inspire.',
  science_comm_header: 'Science Communication Hub',
  operations_header: 'Operations Control',
  engineering_header: 'Build the Infrastructure',
};

const DEFAULTS_FEATURE_FLAGS: FeatureFlags = {
  homepage_blocks_editor: true,
  widgets_marketplace: true,
  smart_assignment_assistant: true,
  notification_center: true,
  okr_layer: true,
  public_impact_dashboard: true,
  knowledge_quality_scoring: true,
  reliability_addons: true,
  content_scheduling: true,
  navigator_analytics: true,
  block_ai_assistant: true,
};

const DEFAULTS_WIDGET_LAYOUT: WidgetLayout = {
  show_notification_center: true,
  show_mission_board: true,
  show_team_health: true,
  show_weekly_focus: true,
  show_signal_stream: true,
  show_activity_timeline: true,
};

const ACTION_COLORS: Record<string, string> = {
  delete: 'bg-red-400',
  create: 'bg-green-400',
  update: 'bg-yellow-400',
  vote: 'bg-purple-400',
};

function getActionColor(action: string) {
  for (const key of Object.keys(ACTION_COLORS)) {
    if (action.includes(key)) return ACTION_COLORS[key];
  }
  return 'bg-cyan';
}

function Field({
  label,
  value,
  onChange,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-dark border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan/40 resize-none transition"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-dark border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan/40 transition"
        />
      )}
      {hint && <p className="text-xs text-slate-600 mt-1">{hint}</p>}
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
  saved,
  label = 'Save',
}: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan/15 border border-cyan/20 text-cyan text-sm font-semibold hover:bg-cyan/25 transition disabled:opacity-50"
    >
      {saved ? (
        <CheckCircle size={14} />
      ) : saving ? (
        <RefreshCw size={14} className="animate-spin" />
      ) : (
        <Save size={14} />
      )}
      {saved ? 'Saved!' : label}
    </button>
  );
}

export default function AdminControlCenter({ activities, activityTotal }: Props) {
  const [activeTab, setActiveTab] = useState('website');
  const [hero, setHero] = useState<HeroSettings>(DEFAULTS_HERO);
  const [banners, setBanners] = useState<DashboardBanners>(DEFAULTS_BANNERS);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULTS_FEATURE_FLAGS);
  const [widgetLayout, setWidgetLayout] = useState<WidgetLayout>(DEFAULTS_WIDGET_LAYOUT);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditFilter, setAuditFilter] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetch('/api/admin/site-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.hero) setHero({ ...DEFAULTS_HERO, ...data.hero });
        if (data.dashboard_banners) setBanners({ ...DEFAULTS_BANNERS, ...data.dashboard_banners });
        if (data.feature_flags) setFeatureFlags({ ...DEFAULTS_FEATURE_FLAGS, ...data.feature_flags });
        if (data.widget_layout) setWidgetLayout({ ...DEFAULTS_WIDGET_LAYOUT, ...data.widget_layout });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (key: string, value: unknown) => {
    setSaving(key);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error();
      setSaved(key);
      setTimeout(() => setSaved(null), 2500);
      toast.success('Settings saved — live on next page load');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  const filteredActivities = auditFilter
    ? activities.filter(
        (a) =>
          a.action.toLowerCase().includes(auditFilter.toLowerCase()) ||
          a.actor_id.toLowerCase().includes(auditFilter.toLowerCase()) ||
          (a.entity_type || '').toLowerCase().includes(auditFilter.toLowerCase())
      )
    : activities;

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex gap-1 bg-dark/50 rounded-xl p-1 border border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-cyan/15 text-cyan border border-cyan/20'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            <tab.icon size={15} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── WEBSITE CONTENT TAB ── */}
      {activeTab === 'website' && (
        <div className="space-y-6">
          {loading ? (
            <div className="glass-card rounded-2xl p-12 text-center text-slate-500">
              Loading settings…
            </div>
          ) : (
            <>
              <div className="glass-card rounded-2xl p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-bold font-grotesk text-white">Hero Section</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Controls the main banner visitors see on the homepage.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition ${
                        previewMode
                          ? 'border-cyan/30 text-cyan bg-cyan/10'
                          : 'border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye size={13} />
                      {previewMode ? 'Hide Preview' : 'Live Preview'}
                    </button>
                    <SaveButton
                      onClick={() => save('hero', hero)}
                      saving={saving === 'hero'}
                      saved={saved === 'hero'}
                      label="Save Hero"
                    />
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Badge Text"
                    value={hero.badge}
                    onChange={(v) => setHero({ ...hero, badge: v })}
                    hint="Small pill above the heading"
                  />
                  <Field
                    label="Primary CTA Button"
                    value={hero.cta_primary}
                    onChange={(v) => setHero({ ...hero, cta_primary: v })}
                  />
                  <Field
                    label="Title Line 1"
                    value={hero.title_line1}
                    onChange={(v) => setHero({ ...hero, title_line1: v })}
                  />
                  <Field
                    label="Highlight Word 1 (gradient)"
                    value={hero.highlight1}
                    onChange={(v) => setHero({ ...hero, highlight1: v })}
                  />
                  <Field
                    label="Title Line 2"
                    value={hero.title_line2}
                    onChange={(v) => setHero({ ...hero, title_line2: v })}
                  />
                  <Field
                    label="Highlight Word 2 (gradient)"
                    value={hero.highlight2}
                    onChange={(v) => setHero({ ...hero, highlight2: v })}
                  />
                  <Field
                    label="Secondary CTA Button"
                    value={hero.cta_secondary}
                    onChange={(v) => setHero({ ...hero, cta_secondary: v })}
                  />
                  <Field
                    label="Partnership Strip Text"
                    value={hero.partner_text}
                    onChange={(v) => setHero({ ...hero, partner_text: v })}
                  />
                </div>
                <Field
                  label="Subtitle / Description"
                  value={hero.subtitle}
                  onChange={(v) => setHero({ ...hero, subtitle: v })}
                  multiline
                />

                {/* Live Preview */}
                {previewMode && (
                  <div className="rounded-2xl border border-cyan/10 bg-navy/30 p-6 mt-2">
                    <p className="text-xs text-slate-600 uppercase tracking-widest mb-4 font-medium">
                      Preview
                    </p>
                    <div className="text-center space-y-3">
                      <span className="inline-block px-3 py-1 rounded-full border border-cyan/30 bg-cyan/10 text-cyan text-xs">
                        {hero.badge}
                      </span>
                      <h2 className="text-3xl font-bold font-grotesk text-white leading-tight">
                        {hero.title_line1}{' '}
                        <span className="text-gradient">{hero.highlight1}</span>
                        <br />
                        {hero.title_line2}{' '}
                        <span className="text-gradient">{hero.highlight2}</span>
                      </h2>
                      <p className="text-slate-400 text-sm max-w-md mx-auto">{hero.subtitle}</p>
                      <div className="flex items-center justify-center gap-3 mt-2">
                        <span className="px-5 py-2 rounded-lg bg-cyan text-bg text-sm font-semibold">
                          {hero.cta_primary}
                        </span>
                        <span className="px-5 py-2 rounded-lg border border-cyan/30 text-cyan text-sm font-semibold">
                          {hero.cta_secondary}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-2">{hero.partner_text}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── DASHBOARD BANNERS TAB ── */}
      {activeTab === 'dashboard' && (
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold font-grotesk text-white">Dashboard Banner Texts</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Controls the welcome message and block headers visible to portal members.
              </p>
            </div>
            <SaveButton
              onClick={() => save('dashboard_banners', banners)}
              saving={saving === 'dashboard_banners'}
              saved={saved === 'dashboard_banners'}
              label="Save Banners"
            />
          </div>

          {loading ? (
            <p className="text-slate-500 text-sm">Loading…</p>
          ) : (
            <div className="space-y-4">
              <Field
                label="Portal Welcome Message"
                value={banners.portal_welcome}
                onChange={(v) => setBanners({ ...banners, portal_welcome: v })}
                multiline
                hint="Shown on the portal dashboard under the alphanaut's name"
              />
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-slate-600 uppercase tracking-widest mb-3 font-medium">
                  Block Page Headers
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Knowledge Bridge"
                    value={banners.knowledge_bridge_header}
                    onChange={(v) => setBanners({ ...banners, knowledge_bridge_header: v })}
                  />
                  <Field
                    label="Research (Asclepius / Neuro)"
                    value={banners.research_header}
                    onChange={(v) => setBanners({ ...banners, research_header: v })}
                  />
                  <Field
                    label="Creative Lab"
                    value={banners.creative_lab_header}
                    onChange={(v) => setBanners({ ...banners, creative_lab_header: v })}
                  />
                  <Field
                    label="Science Comm"
                    value={banners.science_comm_header}
                    onChange={(v) => setBanners({ ...banners, science_comm_header: v })}
                  />
                  <Field
                    label="Operations"
                    value={banners.operations_header}
                    onChange={(v) => setBanners({ ...banners, operations_header: v })}
                  />
                  <Field
                    label="Engineering"
                    value={banners.engineering_header}
                    onChange={(v) => setBanners({ ...banners, engineering_header: v })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCT LAB TAB ── */}
      {activeTab === 'product' && (
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold font-grotesk text-white">Ordered Feature Rollout</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enable and manage features in the agreed implementation order (1 to 10).
                </p>
              </div>
              <SaveButton
                onClick={() => save('feature_flags', featureFlags)}
                saving={saving === 'feature_flags'}
                saved={saved === 'feature_flags'}
                label="Save Feature Flags"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['homepage_blocks_editor', '1. Homepage Content Blocks Editor'],
                ['widgets_marketplace', '2. Dashboard Widgets Marketplace'],
                ['smart_assignment_assistant', '3. Smart Assignment Assistant'],
                ['notification_center', '4. Notification Center'],
                ['okr_layer', '5. Goal / OKR Layer'],
                ['public_impact_dashboard', '6. Public Impact Dashboard'],
                ['knowledge_quality_scoring', '7. Knowledge Quality Scoring'],
                ['reliability_addons', '8. Reliability Add-ons'],
                ['content_scheduling', '9. Admin Scheduling'],
                ['navigator_analytics', '10. Navigator Analytics'],
                ['block_ai_assistant', 'AI Assistance Per Block'],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="rounded-xl bg-dark/50 border border-white/5 p-3 flex items-center justify-between gap-3"
                >
                  <span className="text-sm text-slate-300">{label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setFeatureFlags((prev) => ({
                        ...prev,
                        [key]: !prev[key as keyof FeatureFlags],
                      }))
                    }
                    className={`w-11 h-6 rounded-full border transition relative ${
                      featureFlags[key as keyof FeatureFlags]
                        ? 'bg-cyan/30 border-cyan/40'
                        : 'bg-slate-700/40 border-slate-600/50'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all ${
                        featureFlags[key as keyof FeatureFlags] ? 'left-6' : 'left-0.5'
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold font-grotesk text-white">Widgets Marketplace</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toggle portal dashboard widgets per your preferred UX density.
                </p>
              </div>
              <SaveButton
                onClick={() => save('widget_layout', widgetLayout)}
                saving={saving === 'widget_layout'}
                saved={saved === 'widget_layout'}
                label="Save Widget Layout"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['show_notification_center', 'Notification Center'],
                ['show_mission_board', 'Mission Board'],
                ['show_team_health', 'Team Health'],
                ['show_weekly_focus', 'Weekly Focus'],
                ['show_signal_stream', 'Signal Stream'],
                ['show_activity_timeline', 'Activity Timeline'],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="rounded-xl bg-dark/50 border border-white/5 p-3 flex items-center justify-between"
                >
                  <span className="text-sm text-slate-300">{label}</span>
                  <input
                    type="checkbox"
                    checked={widgetLayout[key as keyof WidgetLayout]}
                    onChange={(e) =>
                      setWidgetLayout((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="accent-cyan"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold font-grotesk text-white mb-2">Scheduling, OKR, Quality, Reliability</h3>
            <p className="text-xs text-slate-500 mb-3">
              These modules are now enabled at settings level and ready for deeper workflow rules.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                'Content scheduling control is enabled.',
                'OKR layer is enabled.',
                'Knowledge quality scoring is enabled.',
                'Reliability add-ons mode is enabled.',
              ].map((line) => (
                <div key={line} className="rounded-xl bg-dark/50 border border-white/5 p-3 text-xs text-slate-400">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIT & SAFETY TAB ── */}
      {activeTab === 'audit' && (
        <div className="space-y-5">
          {/* Activity Log */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="font-bold font-grotesk text-white flex items-center gap-2">
                <Activity size={18} className="text-cyan" />
                Activity Log
                <span className="text-xs font-normal text-slate-500">({activityTotal} entries)</span>
              </h3>
              <input
                type="text"
                placeholder="Filter by action, entity…"
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="bg-dark border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan/40 w-52"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredActivities.length === 0 ? (
                <p className="text-center text-slate-500 py-10 text-sm">No matching entries</p>
              ) : (
                filteredActivities.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-dark/50 border border-white/5 text-sm"
                  >
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${getActionColor(a.action)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 capitalize font-medium">
                        {a.action.replace(/_/g, ' ')}
                      </p>
                      {a.details && typeof a.details === 'object' && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {Object.entries(a.details as Record<string, unknown>)
                            .filter(([k]) => k !== 'block_slug' && k !== 'id')
                            .map(([k, v]) => `${k}: ${v}`)
                            .slice(0, 3)
                            .join(' · ')}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 mt-0.5">
                        {a.actor_type === 'alphanaut' ? '👤 Member' : '🛡 Admin'} ·{' '}
                        {a.entity_type || 'system'}
                      </p>
                    </div>
                    <span className="text-xs text-slate-600 shrink-0 whitespace-nowrap">
                      {formatRelativeDate(a.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rate Limit Reference */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold font-grotesk text-white mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-400" />
              Active Rate Limits
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Sliding-window limits applied per user. Exceeded limits are automatically blocked;
              actions are logged above.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Block Task Create', limit: '30 / 10 min', color: '#00B4D8' },
                { label: 'Block Task Update', limit: '60 / 10 min', color: '#FFD700' },
                { label: 'Block Task Delete', limit: '30 / 10 min', color: '#FF4444' },
                { label: 'Suggestion Create', limit: '40 / 10 min', color: '#9B59B6' },
                { label: 'KB Task Create', limit: '40 / 10 min', color: '#118AB2' },
                { label: 'KB Task Update', limit: '80 / 10 min', color: '#FF6B35' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-dark/50 border border-white/5 p-3 space-y-1"
                >
                  <p className="text-xs font-semibold" style={{ color: item.color }}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500">{item.limit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
