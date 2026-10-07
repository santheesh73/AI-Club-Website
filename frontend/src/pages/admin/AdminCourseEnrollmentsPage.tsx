import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, AlertCircle } from 'lucide-react';
import { useAdminCourseEnrollments } from '@/features/courses/useAdminCourseEnrollments';
import { ProgressBar } from '@/features/courses/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export const AdminCourseEnrollmentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { course, enrollments, isLoading, error } = useAdminCourseEnrollments(id);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading student enrollments..." />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <p className="text-sm font-semibold text-ink">{error || 'Course not found'}</p>
        <Link to="/admin/courses">
          <Button variant="secondary" size="sm">
            <span>Back to Courses</span>
          </Button>
        </Link>
      </div>
    );
  }

  const completedCount = enrollments.filter((e) => e.status === 'completed').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="space-y-4 pb-4 border-b border-surface-border">
        <Link
          to={`/admin/courses/${course.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Course Editor</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="lavender">{course.category.name}</Badge>
              <Badge variant={course.status === 'published' ? 'success' : 'neutral'}>
                {course.status}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight mt-1">
              {course.title} — Learner Roster
            </h1>
            <p className="text-xs text-ink-secondary mt-0.5">
              Detailed tracking of enrolled members, lesson completion rates, and learning milestones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-card-sm bg-canvas border border-surface-border text-center">
              <span className="text-[10px] font-mono uppercase text-ink-muted block">Enrolled</span>
              <span className="text-base font-bold font-mono text-ink">{enrollments.length}</span>
            </div>
            <div className="p-3 rounded-card-sm bg-canvas border border-surface-border text-center">
              <span className="text-[10px] font-mono uppercase text-ink-muted block">Completed</span>
              <span className="text-base font-bold font-mono text-accent-green">{completedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      {enrollments.length === 0 ? (
        <div className="p-12 rounded-card-lg bg-surface border border-surface-border text-center space-y-3">
          <Users className="h-8 w-8 text-ink-muted mx-auto" />
          <h3 className="text-sm font-bold text-ink">No members enrolled yet</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            Once active club members enroll in this course, their learning progress and completion milestones will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="rounded-card border border-surface-border bg-surface overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-border bg-canvas/40 text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                  <th className="p-4 font-semibold">Learner</th>
                  <th className="p-4 font-semibold">Member #</th>
                  <th className="p-4 font-semibold">Department</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Progress</th>
                  <th className="p-4 font-semibold">Enrolled On</th>
                  <th className="p-4 font-semibold">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {enrollments.map((enr) => (
                  <tr key={enr.enrollmentId} className="hover:bg-canvas/30 transition-colors">
                    {/* Learner Info */}
                    <td className="p-4">
                      <span className="font-bold text-ink block">{enr.fullName}</span>
                      <span className="text-[11px] text-ink-muted">{enr.email}</span>
                    </td>

                    {/* Member Number */}
                    <td className="p-4 font-mono text-ink-secondary">
                      {enr.memberNumber}
                    </td>

                    {/* Department */}
                    <td className="p-4 text-ink-secondary">
                      {enr.department || '—'}
                    </td>

                    {/* Enrollment Status */}
                    <td className="p-4">
                      {enr.status === 'completed' ? (
                        <Badge variant="success">Completed</Badge>
                      ) : enr.status === 'active' ? (
                        <Badge variant="orange">In Progress</Badge>
                      ) : (
                        <Badge variant="neutral">{enr.status}</Badge>
                      )}
                    </td>

                    {/* Progress */}
                    <td className="p-4 w-44">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-ink-muted">
                          <span>{enr.completedLessonsCount} / {enr.totalLessonsCount} lessons</span>
                          <span className="font-bold text-ink">{enr.progressPercentage}%</span>
                        </div>
                        <ProgressBar
                          percentage={enr.progressPercentage}
                          size="sm"
                          variant={enr.status === 'completed' ? 'success' : 'primary'}
                        />
                      </div>
                    </td>

                    {/* Enrolled On */}
                    <td className="p-4 font-mono text-ink-muted text-[11px]">
                      {new Date(enr.enrolledAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Last Active */}
                    <td className="p-4 font-mono text-ink-muted text-[11px]">
                      {new Date(enr.lastActivityAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
