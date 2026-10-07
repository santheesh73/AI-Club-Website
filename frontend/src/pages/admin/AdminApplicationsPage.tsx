import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminApplications } from '@/features/admin';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const AdminApplicationsPage: React.FC = () => {
  const {
    applications,
    isLoading,
    error,
    status,
    department,
    searchTerm,
    sortBy,
    order,
    page,
    pageSize,
    total,
    totalPages,
    setStatus,
    setDepartment,
    setSearchTerm,
    setSortBy,
    setOrder,
    setPage,
    refresh,
  } = useAdminApplications();

  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'Test Completed', value: 'test_completed' },
    { label: 'Approved', value: 'approved' },
    { label: 'Waitlisted', value: 'waitlisted' },
    { label: 'Rejected', value: 'rejected' },
  ];

  const departmentOptions = ['all', 'CSE', 'AI&DS', 'IT', 'ECE', 'EEE', 'Mechanical'];

  const getStatusBadge = (appStatus: string) => {
    switch (appStatus) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'under_review':
        return <Badge variant="orange">Under Review</Badge>;
      case 'waitlisted':
        return <Badge variant="neutral">Waitlisted</Badge>;
      case 'rejected':
        return <Badge variant="error">Declined</Badge>;
      case 'test_completed':
        return <Badge variant="lavender">Test Completed</Badge>;
      default:
        return <Badge variant="neutral">{appStatus.replace('_', ' ')}</Badge>;
    }
  };

  const handleSortToggle = (field: 'submitted_at' | 'assessment_score' | 'student_name' | 'application_number') => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted uppercase">
            <span>AI CLUB CONTROL</span>
            <span>/</span>
            <span className="text-ink">Admissions Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mt-1">
            Application Review
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>
          <div className="text-xs font-mono px-3 py-1.5 rounded-pill bg-canvas-alt text-ink border border-surface-border">
            Total: <strong>{total}</strong> Applications
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statusFilters.map((tab) => {
            const isActive = status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                type="button"
                className={`px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-ink text-canvas font-semibold shadow-subtle'
                    : 'bg-canvas-alt text-ink-secondary hover:text-ink hover:bg-surface-border'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search, Department, and Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          {/* Search Box */}
          <div className="sm:col-span-7 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, application #, register #, dept..."
              className="w-full pl-10 pr-4 py-2 rounded-card-sm text-xs bg-canvas-alt border border-surface-border text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          {/* Department Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-card-sm text-xs bg-canvas-alt border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            >
              <option value="all">All Departments</option>
              {departmentOptions.slice(1).map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Menu */}
          <div className="sm:col-span-2">
            <select
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [sb, ord] = e.target.value.split('-');
                setSortBy(sb as 'submitted_at' | 'assessment_score' | 'student_name' | 'application_number');
                setOrder(ord as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 rounded-card-sm text-xs bg-canvas-alt border border-surface-border text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            >
              <option value="submitted_at-desc">Newest First</option>
              <option value="submitted_at-asc">Oldest First</option>
              <option value="assessment_score-desc">Highest Score</option>
              <option value="assessment_score-asc">Lowest Score</option>
              <option value="student_name-asc">Name (A-Z)</option>
              <option value="application_number-asc">App # (Asc)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table / Card Content */}
      {isLoading ? (
        <div className="p-16 rounded-card bg-surface border border-surface-border shadow-soft flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" label="Loading applications..." />
          <p className="text-xs text-ink-muted">Querying candidate records from database...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-card bg-red-50 border border-red-200 text-center space-y-2">
          <p className="text-sm font-semibold text-red-800">Error Loading Applications</p>
          <p className="text-xs text-red-700">{error}</p>
          <Button variant="ghost" size="sm" onClick={() => refresh()}>
            Retry
          </Button>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-16 rounded-card bg-surface border border-surface-border shadow-soft text-center space-y-3">
          <FileText className="h-10 w-10 text-ink-muted mx-auto" />
          <h3 className="text-base font-semibold text-ink">No Applications Match Filter Criteria</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            Try adjusting your search query, status tab, or department filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus('all');
              setDepartment('all');
              setSearchTerm('');
            }}
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block rounded-card bg-surface border border-surface-border shadow-soft overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas-alt border-b border-surface-border font-mono text-ink-muted uppercase">
                <tr>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-ink"
                    onClick={() => handleSortToggle('application_number')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Application #</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-ink"
                    onClick={() => handleSortToggle('student_name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Student</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold">Dept / Year</th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-ink"
                    onClick={() => handleSortToggle('assessment_score')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Exam Score</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th
                    className="py-3 px-4 font-semibold cursor-pointer hover:text-ink"
                    onClick={() => handleSortToggle('submitted_at')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Submitted</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-canvas-alt/50 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-ink">
                      {app.applicationNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink">{app.studentName}</div>
                      {app.registerNumber && (
                        <span className="text-[10px] text-ink-muted font-mono">
                          {app.registerNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-ink-secondary">
                      {app.department} • Yr {app.year}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-ink">
                      {app.assessmentScore !== null ? (
                        <div className="flex items-center gap-1">
                          <span>{app.assessmentScore}/25</span>
                          {app.assessmentPercentage !== null && (
                            <span className="text-[10px] text-ink-muted">
                              ({app.assessmentPercentage}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-muted italic">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(app.status)}</td>
                    <td className="py-3 px-4 text-ink-muted text-[11px]">
                      {app.submittedAt
                        ? new Date(app.submittedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/admin/applications/${app.id}`}>
                        <Button variant="ghost" size="sm">
                          <span>Review</span>
                          <ExternalLink className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Shown on screens < 768px) */}
          <div className="md:hidden space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-card bg-surface border border-surface-border shadow-soft space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <span className="font-mono text-xs font-bold text-ink">
                    {app.applicationNumber}
                  </span>
                  {getStatusBadge(app.status)}
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-ink">{app.studentName}</h4>
                  <p className="text-xs text-ink-secondary">
                    {app.department} • Year {app.year}
                    {app.registerNumber ? ` • ${app.registerNumber}` : ''}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-ink-muted">Score: </span>
                    <strong className="font-mono text-ink">
                      {app.assessmentScore !== null ? `${app.assessmentScore}/25` : 'Pending'}
                    </strong>
                  </div>
                  <Link to={`/admin/applications/${app.id}`}>
                    <Button variant="outline" size="sm">
                      Review Dossier
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-card bg-surface border border-surface-border shadow-soft text-xs">
            <div className="text-ink-muted">
              Showing{' '}
              <strong className="text-ink">
                {Math.min(total, (page - 1) * pageSize + 1)}
              </strong>{' '}
              to{' '}
              <strong className="text-ink">
                {Math.min(total, page * pageSize)}
              </strong>{' '}
              of <strong className="text-ink">{total}</strong> applications
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span>Previous</span>
              </Button>

              <span className="font-mono px-2 py-1 text-ink">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
