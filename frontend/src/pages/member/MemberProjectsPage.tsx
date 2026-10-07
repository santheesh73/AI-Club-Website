import React from 'react';
import { Link } from 'react-router-dom';
import { useMemberProjects } from '@/features/projects/useMemberProjects';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, FolderGit2, Globe } from 'lucide-react';

export const MemberProjectsPage: React.FC = () => {
  const {
    projects,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    publishProject,
    archiveProject,
    deleteProject,
  } = useMemberProjects();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-ink">
            My Projects & Showcase
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Build, publish, and collaborate on cutting-edge AI software systems.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/community/projects">
            <Button variant="outline" size="sm" className="gap-2">
              <Globe className="w-4 h-4" />
              Community Catalog
            </Button>
          </Link>
          <Link to="/member/projects/new">
            <Button variant="primary" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3 overflow-x-auto">
        {[
          { key: 'all', label: 'All Projects' },
          { key: 'published', label: 'Published' },
          { key: 'draft', label: 'Drafts' },
          { key: 'archived', label: 'Archived' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-pill tracking-wide transition-all ${
              statusFilter === tab.key
                ? 'bg-ink text-canvas shadow-xs'
                : 'bg-surface-muted text-ink-muted hover:text-ink hover:bg-surface-border/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Spinner className="w-8 h-8 text-ink" />
          <p className="text-sm text-ink-muted">Loading your projects...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-card bg-red-50 text-red-700 border border-red-200 text-sm">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="py-12 flex flex-col items-center">
          <EmptyState
            icon={<FolderGit2 className="h-7 w-7 text-ink-muted" />}
            title={statusFilter === 'all' ? 'No projects built yet' : `No ${statusFilter} projects`}
            description={
              statusFilter === 'all'
                ? 'Launch your first machine learning model, dataset pipeline, or web app to showcase your work to the AI CLUB community.'
                : `You do not have any projects in "${statusFilter}" state.`
            }
          />
          <div className="mt-4 flex justify-center">
            {statusFilter === 'all' ? (
              <Link to="/member/projects/new">
                <Button variant="primary" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Project
                </Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={() => setStatusFilter('all')}>
                View All Projects
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="flex flex-col">
              <ProjectCard
                project={project}
                showStatusBadge
                actionHref={`/member/projects/${project.id}/edit`}
                actionLabel="Manage"
              />
              {/* Quick Actions Bar below card */}
              <div className="flex items-center justify-end gap-2 pt-2 px-1 text-xs">
                {project.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => publishProject(project.id)}
                    className="text-accent-green-dark hover:underline font-medium"
                  >
                    Publish
                  </button>
                )}
                {project.status === 'published' && (
                  <button
                    type="button"
                    onClick={() => archiveProject(project.id)}
                    className="text-ink-muted hover:text-ink font-medium"
                  >
                    Archive
                  </button>
                )}
                <Link
                  to={`/member/projects/${project.id}/edit`}
                  className="text-accent-lavender-dark hover:underline font-medium"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
                      deleteProject(project.id);
                    }
                  }}
                  className="text-red-600 hover:underline font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
