import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { communityApi } from '@/services/communityApi';
import { ProjectHideModal } from '@/features/projects/ProjectHideModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type {
  AdminProjectSummaryDto,
  AdminReportDto,
  AchievementDto,
} from '@/types/community';
import {
  ShieldAlert,
  FolderGit2,
  Flag,
  Award,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const AdminCommunityPage: React.FC = () => {
  const location = useLocation();

  const getInitialTab = (): 'projects' | 'reports' | 'achievements' => {
    if (location.pathname.includes('achievements')) return 'achievements';
    if (location.pathname.includes('reports')) return 'reports';
    return 'projects';
  };

  const [activeTab, setActiveTab] = useState<'projects' | 'reports' | 'achievements'>(getInitialTab);

  // Sync activeTab if location.pathname changes
  useEffect(() => {
    if (location.pathname.includes('achievements')) {
      setActiveTab('achievements');
    } else if (location.pathname.includes('reports')) {
      setActiveTab('reports');
    } else if (location.pathname.includes('projects')) {
      setActiveTab('projects');
    }
  }, [location.pathname]);

  // Projects State
  const [projects, setProjects] = useState<AdminProjectSummaryDto[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Reports State
  const [reports, setReports] = useState<AdminReportDto[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Achievements State
  const [achievements, setAchievements] = useState<AchievementDto[]>([]);
  const [achLoading, setAchLoading] = useState(false);

  // Hide Modal State
  const [hideModalOpen, setHideModalOpen] = useState(false);
  const [targetHideProject, setTargetHideProject] = useState<{ id: string; title: string } | null>(null);

  // Fetch Projects
  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const res = await communityApi.getAdminProjects();
      if (res.success && res.data) {
        const items = Array.isArray(res.data.items)
          ? res.data.items
          : Array.isArray(res.data)
          ? (res.data as any)
          : [];
        setProjects(items);
      }
    } catch (err) {
      console.error('Failed to load admin projects', err);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  // Fetch Reports
  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await communityApi.getAdminReports();
      if (res.success && res.data) {
        setReports(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Failed to load admin reports', err);
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  // Fetch Achievements
  const fetchAchievements = useCallback(async () => {
    setAchLoading(true);
    try {
      const res = await communityApi.getAchievements();
      if (res.success && res.data) {
        setAchievements(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Failed to load admin achievements', err);
      setAchievements([]);
    } finally {
      setAchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'projects') fetchProjects();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'achievements') fetchAchievements();
  }, [activeTab, fetchProjects, fetchReports, fetchAchievements]);


  // Project Actions
  const handleFeature = async (id: string, isFeatured: boolean) => {
    if (isFeatured) {
      await communityApi.unfeatureProject(id);
    } else {
      await communityApi.featureProject(id, 1);
    }
    fetchProjects();
  };

  const handleRestoreProject = async (id: string) => {
    await communityApi.restoreProject(id);
    fetchProjects();
  };

  // Report Actions
  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    const notes = window.prompt(`Enter resolution notes for this report (${status}):`);
    if (notes !== null) {
      await communityApi.resolveReport(reportId, status, notes);
      fetchReports();
    }
  };

  // Achievement Actions
  const handleHideAchievement = async (id: string) => {
    const reason = window.prompt('Enter reason for hiding this achievement:');
    if (reason) {
      await communityApi.hideAchievement(id, reason);
      fetchAchievements();
    }
  };

  const handleRestoreAchievement = async (id: string) => {
    await communityApi.restoreAchievement(id);
    fetchAchievements();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-surface-border pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="orange">Administrative Oversight</Badge>
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-ink">
          Community Moderation & Showcase Control
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Review community projects, handle misconduct reports, spotlight flagship initiatives, and moderate credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3">
        <button
          onClick={() => setActiveTab('projects')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-pill tracking-wide transition-all ${
            activeTab === 'projects'
              ? 'bg-ink text-canvas shadow-xs'
              : 'bg-surface-muted text-ink-muted hover:text-ink'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          Projects Management ({projects?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-pill tracking-wide transition-all ${
            activeTab === 'reports'
              ? 'bg-ink text-canvas shadow-xs'
              : 'bg-surface-muted text-ink-muted hover:text-ink'
          }`}
        >
          <Flag className="w-4 h-4" />
          Reports Queue ({(Array.isArray(reports) ? reports : []).filter((r) => r?.status === 'open' || r?.status === 'under_review').length})
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-pill tracking-wide transition-all ${
            activeTab === 'achievements'
              ? 'bg-ink text-canvas shadow-xs'
              : 'bg-surface-muted text-ink-muted hover:text-ink'
          }`}
        >
          <Award className="w-4 h-4" />
          Achievements Oversight ({achievements?.length || 0})
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 1. PROJECTS MODERATION TAB */}
      {/* ===================================================================== */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {projectsLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Spinner className="w-8 h-8 text-ink" />
              <p className="text-sm text-ink-muted">Loading projects database...</p>
            </div>
          ) : !projects || projects.length === 0 ? (
            <EmptyState
              icon={<FolderGit2 className="h-7 w-7 text-ink-muted" />}
              title="No projects found"
              description="No projects have been registered on the platform yet."
            />
          ) : (
            <div className="overflow-x-auto rounded-card border border-surface-border bg-surface">
              <table className="w-full text-left text-sm text-ink divide-y divide-surface-border">
                <thead className="bg-surface-muted text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Project Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reports</th>
                    <th className="px-4 py-3 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {projects.map((p) => (
                    <tr key={p?.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink leading-snug">{p?.title || 'Untitled Project'}</div>
                        <div className="text-xs text-ink-muted font-mono">{p?.slug || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {p?.category?.name || (typeof p?.category === 'string' ? p.category : 'General')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-ink">{p?.owner?.fullName || 'Anonymous'}</div>
                        <div className="text-[11px] text-ink-muted">{p?.ownerEmail || p?.owner?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            p?.status === 'published'
                              ? 'success'
                              : p?.status === 'hidden'
                              ? 'error'
                              : 'neutral'
                          }
                          className="text-[10px]"
                        >
                          {p?.status || 'published'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        {(p?.reportsCount || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {p.reportsCount} open
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {p?.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => handleFeature(p?.id || '', Boolean(p?.isFeatured))}
                            className={`p-1.5 rounded transition-colors ${
                              p?.isFeatured
                                ? 'text-accent-orange bg-accent-orange-subtle hover:bg-accent-orange/20'
                                : 'text-ink-muted hover:text-accent-orange hover:bg-surface-muted'
                            }`}
                            title={p?.isFeatured ? 'Unfeature project' : 'Feature project'}
                          >
                            <Star className={`w-4 h-4 ${p?.isFeatured ? 'fill-current' : ''}`} />
                          </button>
                        )}

                        {p?.status === 'hidden' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreProject(p?.id || '')}
                            className="gap-1 text-xs text-accent-green-dark border-accent-green/30"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (p?.id) {
                                setTargetHideProject({ id: p.id, title: p.title || 'Project' });
                                setHideModalOpen(true);
                              }
                            }}
                            className="text-xs text-red-600 hover:bg-red-50 hover:border-red-200"
                          >
                            Hide
                          </Button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. REPORTS QUEUE TAB */}
      {/* ===================================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reportsLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Spinner className="w-8 h-8 text-ink" />
              <p className="text-sm text-ink-muted">Loading reports queue...</p>
            </div>
          ) : !reports || reports.length === 0 ? (
            <EmptyState
              icon={<ShieldAlert className="h-7 w-7 text-ink-muted" />}
              title="No reports filed"
              description="There are currently no community reports pending review."
            />
          ) : (
            <div className="space-y-3">
              {(Array.isArray(reports) ? reports : []).map((r) => (
                <Card key={r?.id} className="border-surface-border space-y-3">

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={r?.status === 'open' ? 'error' : r?.status === 'resolved' ? 'success' : 'neutral'}
                          className="text-[10px]"
                        >
                          {r?.status || 'open'}
                        </Badge>
                        <Badge variant="orange" className="text-[10px] capitalize">
                          {r?.reason || 'report'}
                        </Badge>
                        <span className="text-xs text-ink-muted">
                          Reported on {new Date(r?.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-base text-ink mt-1">
                        Target: {r?.targetTitle || 'Unknown'} ({r?.targetType || 'item'})
                      </h4>
                      <p className="text-xs text-ink-muted">
                        Filed by <span className="font-medium text-ink">{r?.reporterName || 'Anonymous'}</span> ({r?.reporterEmail || 'no-email'})
                      </p>
                    </div>

                    {r?.status === 'open' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveReport(r?.id || '', 'dismissed')}
                          className="gap-1 text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Dismiss
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleResolveReport(r?.id || '', 'resolved')}
                          className="gap-1 text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Resolve Claim
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-card bg-surface-muted text-xs text-ink-secondary leading-relaxed border border-surface-border">
                    <span className="font-semibold text-ink block mb-0.5">Reporter Statement:</span>
                    {r?.description || 'No statement provided.'}
                  </div>

                  {r?.adminNotes && (
                    <div className="p-2.5 rounded-card bg-accent-lavender-subtle/40 text-xs text-accent-lavender-dark border border-accent-lavender/20">
                      <span className="font-semibold block mb-0.5">Admin Resolution Notes:</span>
                      {r.adminNotes}
                    </div>
                  )}

                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. ACHIEVEMENTS OVERSIGHT TAB */}
      {/* ===================================================================== */}
      {activeTab === 'achievements' && (
        <div className="space-y-4">
          {achLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <Spinner className="w-8 h-8 text-ink" />
              <p className="text-sm text-ink-muted">Loading achievements...</p>
            </div>
          ) : achievements.length === 0 ? (
            <EmptyState
              icon={<Award className="h-7 w-7 text-ink-muted" />}
              title="No achievements registered"
              description="No members have claimed credentials or achievements yet."
            />
          ) : (
            <div className="overflow-x-auto rounded-card border border-surface-border bg-surface">
              <table className="w-full text-left text-sm text-ink divide-y divide-surface-border">
                <thead className="bg-surface-muted text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Achievement Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Issuer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {(Array.isArray(achievements) ? achievements : []).map((a) => (
                    <tr key={a?.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink">{a?.title || 'Untitled'}</td>
                      <td className="px-4 py-3 text-xs">
                        {a?.category?.name || (typeof a?.category === 'string' ? a.category : 'General')}
                      </td>
                      <td className="px-4 py-3 text-xs">{a?.user?.fullName || 'Member'}</td>
                      <td className="px-4 py-3 text-xs">{a?.issuer || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={a?.status === 'published' ? 'success' : a?.status === 'hidden' ? 'error' : 'neutral'}
                          className="text-[10px]"
                        >
                          {a?.status || 'published'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {a?.status === 'hidden' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreAchievement(a?.id || '')}
                            className="text-xs text-accent-green-dark"
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleHideAchievement(a?.id || '')}
                            className="text-xs text-red-600 hover:bg-red-50"
                          >
                            Hide
                          </Button>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Hide Modal */}
      {targetHideProject && (
        <ProjectHideModal
          isOpen={hideModalOpen}
          onClose={() => {
            setHideModalOpen(false);
            setTargetHideProject(null);
          }}
          projectId={targetHideProject.id}
          projectTitle={targetHideProject.title}
          onProjectHidden={fetchProjects}
        />
      )}
    </div>
  );
};
