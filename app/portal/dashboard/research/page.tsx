'use client';

import { useState, useEffect } from 'react';
import PortalLayout from '@/components/layout/PortalLayout';
import ResearchForm from '@/components/portal/ResearchForm';
import SuggestionsPanel from '@/components/portal/SuggestionsPanel';
import BlockPulseStrip from '@/components/portal/BlockPulseStrip';
import RoleJourneyPanel from '@/components/portal/RoleJourneyPanel';
import NextActionsCard from '@/components/portal/NextActionsCard';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  FlaskConical,
  Workflow,
  Sparkles,
  Microscope,
  Rocket,
  ShieldCheck,
  Target,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { PortalSession, ResearchProject } from '@/types';

export default function ResearchPortalPage() {
  return <ResearchPortalClient />;
}

function ResearchPortalClient() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [blockMembers, setBlockMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Get session + projects in parallel
    Promise.all([
      fetch('/api/auth/portal').then(r => r.ok ? r.json() : null),
      fetch('/api/research').then(r => r.json()).catch(() => ({ projects: [] })),
    ]).then(([authData, researchData]) => {
      if (authData?.session) {
        setSession(authData.session);
        const nav: string[] = authData.session.navigatorBlocks || [];
        const isNav =
          authData.session.role === 'co-captain' ||
          nav.includes('asclepius-lab') ||
          nav.includes('neuroscience');

        if (isNav) {
          fetch('/api/blocks/asclepius-lab/members')
            .then((r) => r.ok ? r.json() : { members: [] })
            .then((d) => setBlockMembers(d.members || []));
        }
      }
      setProjects(researchData.projects || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleSuccess = () => {
    setShowForm(false);
    // Refresh
    fetch('/api/research')
      .then(r => r.json())
      .then(data => setProjects(data.projects || []))
      .catch(() => {});
    toast.success('Research project created!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan/20 border-t-cyan animate-spin" />
      </div>
    );
  }

  const mockSession: PortalSession = {
    alphanaut_id: session?.alphanaut_id || '',
    name: session?.name || 'Researcher',
    role: session?.role || 'alphanaut',
    blocks: session?.blocks || ['asclepius-lab'],
    navigatorBlocks: session?.navigatorBlocks || [],
  };
  const isNavigator =
    mockSession.role === 'co-captain' ||
    mockSession.navigatorBlocks.includes('asclepius-lab') ||
    mockSession.navigatorBlocks.includes('neuroscience');

  const publishedCount = projects.filter((p) => p.status === 'published').length;
  const reviewCount = projects.filter((p) => p.status === 'under_review' || p.status === 'submitted').length;
  const activeCount = projects.filter((p) => p.status === 'in_progress').length;
  const spotlightProjects = projects.slice(0, 3);

  return (
    <PortalLayout session={mockSession}>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl p-7 border border-teal/25 bg-gradient-to-r from-[#0c2226] via-dark to-[#12242a] portal-reveal portal-stagger-1">
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-teal/10 blur-3xl" />
          <div className="absolute -left-16 -bottom-20 w-64 h-64 rounded-full bg-cyan/10 blur-3xl" />
          <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal/20 border border-teal/30 flex items-center justify-center text-xl">
              🔬
            </div>
            <div>
              <h1 className="text-2xl font-bold font-grotesk text-white">Research Lab</h1>
              <p className="text-sm text-slate-400">
                {isNavigator ? 'Navigator Panel — Research pipeline management' : 'Overview and idea space'}
              </p>
            </div>
          </div>
          {isNavigator && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus size={16} />
              New Project
            </Button>
          )}
          </div>
          <BlockPulseStrip
            items={[
              { label: 'Active Projects', value: activeCount, tone: 'teal' },
              { label: 'In Review', value: reviewCount, tone: 'yellow' },
              { label: 'Published', value: publishedCount, tone: 'cyan' },
              { label: 'Lab Mode', value: isNavigator ? 'Navigator Control' : 'Discovery Experience', tone: 'purple' },
            ]}
          />
        </div>

        <RoleJourneyPanel
          title={isNavigator ? 'Navigator Research Command Center' : 'Alphanaut Discovery Experience'}
          icon={isNavigator ? Rocket : Sparkles}
          iconClassName="text-teal"
          containerClassName="border border-teal/20"
          items={isNavigator
            ? [
                { title: 'Pipeline Control', desc: 'Launch projects with precise scope and track progress by status shifts.' },
                { title: 'Team Orchestration', desc: `Coordinate contributors and keep ownership clear (${blockMembers.length} lab members visible).` },
                { title: 'Quality + Publication', desc: 'Push high-signal outputs through review toward publication readiness.' },
              ]
            : [
                { title: 'Explore Frontiers', desc: 'Browse active projects and identify where your background can add value.' },
                { title: 'Contribute Smartly', desc: 'Use suggestions to propose hypotheses, methods, and critical improvements.' },
                { title: 'Grow Research Identity', desc: 'Track published outcomes and build your own contribution narrative.' },
              ]}
        />

        <NextActionsCard
          title={isNavigator ? 'Navigator Research Next Actions' : 'Your Discovery Next Actions'}
          icon={Target}
          iconClassName="text-teal"
          containerClassName="border border-teal/20 bg-teal/10"
          actions={isNavigator
            ? [
                { title: 'Triage One In-Review Project', hint: 'Push at least one review item toward final decision.', href: '#research-projects', actionLabel: 'Open Projects' },
                { title: 'Open One Contributor Slot', hint: 'Assign a focused contribution path for a team member.', href: '#research-suggestions', actionLabel: 'Open Suggestions' },
                { title: 'Publish One Quality Note', hint: 'Share one method or quality standard update this week.', href: '#research-quality', actionLabel: 'Open Quality Standard' },
              ]
            : [
                { title: 'Follow One Active Project', hint: 'Pick one project and map where your skills fit best.', href: '#research-projects', actionLabel: 'Open Projects' },
                { title: 'Submit One Strong Suggestion', hint: 'Propose a clear hypothesis, method tweak, or source.', href: '#research-suggestions', actionLabel: 'Open Suggestions' },
                { title: 'Track One Published Output', hint: 'Study one published project to improve your own contributions.', href: '#research-spotlight', actionLabel: 'Open Spotlight' },
              ]}
        />

        {!isNavigator && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold font-grotesk text-white mb-4 flex items-center gap-2">
              <Workflow size={18} className="text-teal" />
              Research Workflow Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { title: 'Navigator Creates', desc: 'Research navigators define projects and assign contributors.' },
                { title: 'Alphanaut Contributes', desc: 'Members collaborate through tasks and suggestions.' },
                { title: 'Review & Publish', desc: 'Navigator and admin handle review and publication states.' },
              ].map((step) => (
                <div key={step.title} className="p-3 rounded-xl border border-teal/20 bg-teal/5">
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        <div id="research-projects" className="glass-card rounded-2xl p-6 portal-reveal portal-stagger-2 panel-target">
          <h2 className="text-lg font-bold font-grotesk text-white mb-5 flex items-center gap-2">
            <FlaskConical size={18} className="text-teal" />
            Research Projects ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔬</p>
              <p className="text-slate-400 mb-4">No research projects yet</p>
              {isNavigator && (
                <Button onClick={() => setShowForm(true)} variant="secondary" size="sm">
                  Create First Project
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 rounded-xl bg-dark/50 border border-white/5 hover:border-teal/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white mb-1 truncate">{project.title}</p>
                      {project.abstract && (
                        <p className="text-xs text-slate-500 line-clamp-2">{project.abstract}</p>
                      )}
                      {project.journal && (
                        <p className="text-xs text-slate-600 italic mt-1">{project.journal}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={project.status} />
                      <span className="text-xs text-slate-600">{formatDate(project.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div id="research-spotlight" className="glass-card rounded-2xl p-6 border border-teal/20 panel-target">
            <h3 className="font-bold font-grotesk text-white mb-3 flex items-center gap-2">
              <Microscope size={16} className="text-teal" />
              Spotlight Projects
            </h3>
            {spotlightProjects.length === 0 ? (
              <p className="text-sm text-slate-500">No spotlight projects yet.</p>
            ) : (
              <div className="space-y-2">
                {spotlightProjects.map((project) => (
                  <div key={project.id} className="p-3 rounded-xl border border-white/10 bg-dark/50">
                    <p className="text-sm font-semibold text-white truncate">{project.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{project.journal || 'Internal track'} · {formatDate(project.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div id="research-quality" className="glass-card rounded-2xl p-6 border border-cyan/20 panel-target">
            <h3 className="font-bold font-grotesk text-white mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-cyan" />
              Research Quality Standard
            </h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p className="p-3 rounded-xl border border-white/10 bg-dark/40">Every project should have clear objective, method outline, and expected impact.</p>
              <p className="p-3 rounded-xl border border-white/10 bg-dark/40">Strong submissions include concise abstract, relevant field tagging, and traceable source context.</p>
              <p className="p-3 rounded-xl border border-white/10 bg-dark/40">Navigator handoff should include review notes and next decision checkpoint.</p>
            </div>
            <div className="mt-3 p-3 rounded-xl border border-teal/20 bg-teal/10 flex items-start gap-2">
              <Target size={14} className="text-teal mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                {isNavigator ? 'Use this as your project triage checklist before moving work into review states.' : 'Use this as your contribution checklist before posting suggestions to the research team.'}
              </p>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <SuggestionsPanel
          panelId="research-suggestions"
          blockSlug="asclepius-lab"
          alphanautId={mockSession.alphanaut_id}
          isNavigator={isNavigator}
        />

        {/* Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="New Research Project"
          size="lg"
        >
          <ResearchForm
            blockSlug="asclepius-lab"
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      </div>
    </PortalLayout>
  );
}
