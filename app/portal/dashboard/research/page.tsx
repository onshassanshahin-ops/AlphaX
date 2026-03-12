'use client';

import { useState, useEffect } from 'react';
import PortalLayout from '@/components/layout/PortalLayout';
import ResearchForm from '@/components/portal/ResearchForm';
import TasksPanel from '@/components/portal/TasksPanel';
import InitiativesPanel from '@/components/portal/InitiativesPanel';
import SuggestionsPanel from '@/components/portal/SuggestionsPanel';
import Modal from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { Plus, FlaskConical } from 'lucide-react';
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
        if (authData.session.role === 'co-captain' || nav.includes('asclepius-lab') || nav.includes('neuroscience')) {
          fetch('/api/blocks/asclepius-lab/members')
            .then(r => r.json())
            .then(d => setBlockMembers(d.members || []));
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

  return (
    <PortalLayout session={mockSession}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal/20 border border-teal/30 flex items-center justify-center text-xl">
              🔬
            </div>
            <div>
              <h1 className="text-2xl font-bold font-grotesk text-white">Research Lab</h1>
              <p className="text-sm text-slate-400">Manage your research projects</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus size={16} />
            New Project
          </Button>
        </div>

        {/* Projects */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold font-grotesk text-white mb-5 flex items-center gap-2">
            <FlaskConical size={18} className="text-teal" />
            Research Projects ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🔬</p>
              <p className="text-slate-400 mb-4">No research projects yet</p>
              <Button onClick={() => setShowForm(true)} variant="secondary" size="sm">
                Create First Project
              </Button>
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

        {/* Tasks / Initiatives / Suggestions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TasksPanel
            blockSlug="asclepius-lab"
            alphanautId={mockSession.alphanaut_id}
            isNavigator={isNavigator}
            blockMembers={blockMembers}
          />
          <SuggestionsPanel
            blockSlug="asclepius-lab"
            alphanautId={mockSession.alphanaut_id}
            isNavigator={isNavigator}
          />
        </div>
        <InitiativesPanel
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
