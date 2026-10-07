import React from 'react';
import { Link } from 'react-router-dom';
import { useMemberDashboard } from '@/features/membership';
import { useRegisteredEvents } from '@/features/events';
import { useMyCourses, ProgressBar } from '@/features/courses';
import { DashboardFlashcard } from '@/features/dashboard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  CreditCard,
  User,
  FileText,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Calendar,
  BookOpen,
  PlayCircle,
  FolderGit2,
  Trophy,
  Bell,
  History,
  BarChart2,
} from 'lucide-react';

export const MemberDashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useMemberDashboard();
  const { upcoming: registeredEvents } = useRegisteredEvents();
  const { stats: learningStats } = useMyCourses();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading member workspace..." />
        <p className="text-xs text-ink-muted">Retrieving your membership and academic records...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-ink">Member Dashboard Unavailable</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          {error || 'Unable to retrieve member telemetry. Your membership may still be pending activation.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
          <Link to="/applicant">
            <Button variant="primary" size="sm">
              <span>View Application Status</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { profile, membership, application, assessment } = data;

  const joinedFormatted = new Date(membership.joinedAt).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Editorial Welcome Header */}
      <div className="p-6 sm:p-10 rounded-card-lg bg-surface border border-surface-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="success">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Active Member
            </Badge>
            <span className="text-xs font-mono text-ink-muted">
              Joined {joinedFormatted}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Welcome back, {profile.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1 max-w-xl leading-relaxed">
              You are an authenticated active member of the AI Innovation Collective. Your member credentials and academic records are securely established.
            </p>
          </div>
        </div>

        {/* Member Number Identity Cardlet */}
        <div className="p-4 rounded-card-sm bg-canvas border border-surface-border flex-shrink-0 space-y-1 sm:min-w-[200px]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
            Official Member #
          </span>
          <p className="text-base sm:text-lg font-mono font-bold text-ink">
            {membership.memberNumber}
          </p>
          <p className="text-[10px] text-ink-muted">
            {profile.department || 'AI Club Member'}
          </p>
        </div>
      </div>

      {/* Member Editorial Spotlight / Flashcard Carousel */}
      <DashboardFlashcard flashcards={data.flashcards} />

      {/* Your Journey Timeline */}
      <div className="p-6 sm:p-8 rounded-card-lg bg-surface border border-surface-border shadow-soft space-y-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink font-mono">
            Your Admissions Journey
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Full progression from student profile registration to active membership induction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-card-sm bg-accent-green-subtle/40 border border-accent-green/30 space-y-1">
            <div className="flex items-center gap-1.5 text-accent-green">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold text-ink">1. Profile</span>
            </div>
            <p className="text-[11px] text-ink-muted">Verified & Cataloged</p>
          </div>

          <div className="p-4 rounded-card-sm bg-accent-green-subtle/40 border border-accent-green/30 space-y-1">
            <div className="flex items-center gap-1.5 text-accent-green">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold text-ink">2. Application</span>
            </div>
            <p className="text-[11px] font-mono text-ink-muted">{application.applicationNumber}</p>
          </div>

          <div className="p-4 rounded-card-sm bg-accent-green-subtle/40 border border-accent-green/30 space-y-1">
            <div className="flex items-center gap-1.5 text-accent-green">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold text-ink">3. Assessment</span>
            </div>
            <p className="text-[11px] font-mono text-ink-muted">
              {assessment?.score !== null ? `${assessment?.score} / 25 (${assessment?.percentage}%)` : 'Completed'}
            </p>
          </div>

          <div className="p-4 rounded-card-sm bg-accent-green-subtle/40 border border-accent-green/30 space-y-1">
            <div className="flex items-center gap-1.5 text-accent-green">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold text-ink">4. Committee Review</span>
            </div>
            <p className="text-[11px] text-ink-muted">Formally Approved</p>
          </div>

          <div className="p-4 rounded-card-sm bg-accent-green-subtle/60 border border-accent-green/40 space-y-1">
            <div className="flex items-center gap-1.5 text-accent-green">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold text-ink">5. Membership</span>
            </div>
            <p className="text-[11px] font-mono text-ink-muted">{membership.memberNumber}</p>
          </div>
        </div>
      </div>

      {/* Grid: Assessment Summary & Academic Record */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assessment Card */}
        <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-ink-muted" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
                Entrance Evaluation
              </h3>
            </div>
            <Link to="/member/assessment" className="text-xs text-ink font-semibold hover:underline flex items-center gap-1">
              <span>View Scorecard</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-card-sm bg-canvas border border-surface-border space-y-1">
              <span className="text-[10px] text-ink-muted uppercase font-mono">Final Score</span>
              <p className="text-2xl font-extrabold text-ink font-mono">
                {assessment?.score ?? '—'}<span className="text-xs font-normal text-ink-muted"> / 25</span>
              </p>
            </div>

            <div className="p-4 rounded-card-sm bg-canvas border border-surface-border space-y-1">
              <span className="text-[10px] text-ink-muted uppercase font-mono">Percentage</span>
              <p className="text-2xl font-extrabold text-accent-green font-mono">
                {assessment?.percentage ?? '—'}%
              </p>
            </div>
          </div>

          <div className="p-3 rounded-card-sm bg-canvas text-xs text-ink-secondary flex items-center justify-between">
            <span>Result Status:</span>
            <Badge variant="success">Passed Threshold (≥60%)</Badge>
          </div>
        </div>

        {/* Membership Details Card */}
        <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-ink-muted" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
                Membership Identity
              </h3>
            </div>
            <Link to="/member/membership" className="text-xs text-ink font-semibold hover:underline flex items-center gap-1">
              <span>Digital Card</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded-card-sm bg-canvas">
              <span className="text-ink-muted">Member Number:</span>
              <span className="font-mono font-bold text-ink">{membership.memberNumber}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-card-sm bg-canvas">
              <span className="text-ink-muted">Status:</span>
              <span className="font-semibold text-accent-green uppercase">{membership.status}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-card-sm bg-canvas">
              <span className="text-ink-muted">Induction Date:</span>
              <span className="font-semibold text-ink">{joinedFormatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Progression & Continue Learning Section */}
      <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-ink-muted" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
              Learning Academy & Coursework
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/member/courses/my" className="text-xs text-ink font-semibold hover:underline flex items-center gap-1">
              <span>My Courses</span>
            </Link>
            <span className="text-surface-border text-xs">|</span>
            <Link to="/member/courses" className="text-xs text-ink font-semibold hover:underline flex items-center gap-1">
              <span>Course Catalog</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {learningStats?.continueLearning ? (
          <div className="p-4 rounded-card-sm bg-canvas border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="orange">Continue Learning</Badge>
                <span className="text-xs font-mono text-ink-muted">
                  {learningStats.continueLearning.courseTitle}
                </span>
              </div>
              <h4 className="text-sm font-bold text-ink">
                {learningStats.continueLearning.lessonTitle}
              </h4>
              <div className="w-48 pt-1">
                <ProgressBar
                  percentage={learningStats.continueLearning.progressPercentage}
                  showLabel={true}
                  size="sm"
                />
              </div>
            </div>

            <Link
              to={`/member/learn/${learningStats.continueLearning.courseSlug}?lesson=${learningStats.continueLearning.lessonSlug}`}
            >
              <Button variant="primary" size="sm" className="whitespace-nowrap">
                <PlayCircle className="h-3.5 w-3.5 mr-1" />
                <span>Resume Lesson</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="p-4 rounded-card-sm bg-canvas border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-ink">AI Engineering & Foundational Curriculum</h4>
              <p className="text-xs text-ink-secondary">
                {learningStats && learningStats.enrolledCount > 0
                  ? `You are enrolled in ${learningStats.enrolledCount} course(s). ${learningStats.completedCount} completed.`
                  : 'Explore structured courses on LLMs, Deep Learning, and Autonomous AI systems.'}
              </p>
            </div>
            <Link to="/member/courses">
              <Button variant="secondary" size="sm">
                <span>Browse Courses</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {/* Learning Telemetry Grid */}
        {learningStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-card-sm bg-canvas text-center">
              <span className="text-[10px] text-ink-muted uppercase font-mono block">Enrolled</span>
              <span className="text-lg font-bold font-mono text-ink">{learningStats.enrolledCount}</span>
            </div>
            <div className="p-3 rounded-card-sm bg-canvas text-center">
              <span className="text-[10px] text-ink-muted uppercase font-mono block">In Progress</span>
              <span className="text-lg font-bold font-mono text-accent-orange">{learningStats.inProgressCount}</span>
            </div>
            <div className="p-3 rounded-card-sm bg-canvas text-center">
              <span className="text-[10px] text-ink-muted uppercase font-mono block">Completed</span>
              <span className="text-lg font-bold font-mono text-accent-green">{learningStats.completedCount}</span>
            </div>
            <div className="p-3 rounded-card-sm bg-canvas text-center">
              <span className="text-[10px] text-ink-muted uppercase font-mono block">Lessons Done</span>
              <span className="text-lg font-bold font-mono text-ink">{learningStats.totalLessonsCompleted}</span>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Activities & Confirmed Registrations Block */}
      <div className="p-6 rounded-card bg-surface border border-surface-border shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-ink-muted" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
              Upcoming Club Activities
            </h3>
          </div>
          <Link to="/member/events" className="text-xs text-ink font-semibold hover:underline flex items-center gap-1">
            <span>Explore All Events</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {registeredEvents && registeredEvents.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-ink-muted">Your next confirmed event attendance:</p>
            <div className="p-4 rounded-card-sm bg-canvas border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Confirmed RSVP</Badge>
                  <span className="text-xs font-mono text-ink-muted">
                    {new Date(registeredEvents[0].startAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-ink">{registeredEvents[0].title}</h4>
                <p className="text-xs text-ink-secondary">{registeredEvents[0].shortDescription}</p>
              </div>
              <Link to={`/member/events/${registeredEvents[0].slug}`}>
                <Button variant="outline" size="sm" className="whitespace-nowrap">
                  <span>View Details</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-card-sm bg-canvas border border-surface-border text-center space-y-2">
            <p className="text-xs font-medium text-ink">No Registered Upcoming Activities</p>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              Check out the active workshop series and collaborative hackathons scheduled for this term.
            </p>
            <div className="pt-2">
              <Link to="/member/events">
                <Button variant="outline" size="sm">
                  <span>Browse Events Catalog</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/member/projects"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <FolderGit2 className="h-5 w-5 text-accent-lavender group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Projects & Showcase</h4>
            <p className="text-xs text-ink-muted">Build, publish, and showcase AI repositories and applications.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>Manage Projects</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          to="/member/achievements"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <Trophy className="h-5 w-5 text-accent-orange group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Credentials & Honors</h4>
            <p className="text-xs text-ink-muted">Display verified industry certifications, hackathon awards, and papers.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>View Achievements</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          to="/member/courses"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <BookOpen className="h-5 w-5 text-accent-lavender group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Courses & Labs</h4>
            <p className="text-xs text-ink-muted">Modular curriculums and learning workspaces.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>View Courses</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          to="/member/events"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <Calendar className="h-5 w-5 text-accent-green group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Club Events</h4>
            <p className="text-xs text-ink-muted">Workshops, hackathons, and research symposiums.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>Browse Events</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
        <Link
          to="/member/membership"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <CreditCard className="h-5 w-5 text-ink-muted group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Membership Card</h4>
            <p className="text-xs text-ink-muted">Inspect and display your official AI CLUB credential.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>Open Card</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          to="/member/profile"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <User className="h-5 w-5 text-ink-muted group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Member Profile</h4>
            <p className="text-xs text-ink-muted">View academic credentials, skills, and portfolio links.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>View Profile</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          to="/member/application"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <FileText className="h-5 w-5 text-ink-muted group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">My Application</h4>
            <p className="text-xs text-ink-muted">Review your submitted application and committee approval.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>View Application</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          to="/member/assessment"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <Award className="h-5 w-5 text-ink-muted group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Evaluation Results</h4>
            <p className="text-xs text-ink-muted">Inspect completed 25-MCQ exam metrics and answers.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>View Results</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          to="/member/notifications"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <Bell className="h-5 w-5 text-ink-muted group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Notifications & Alerts</h4>
            <p className="text-xs text-ink-muted">View incoming messages, invitations, and system updates.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>Open Inbox</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          to="/member/activity"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <History className="h-5 w-5 text-ink-muted group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Activity Timeline</h4>
            <p className="text-xs text-ink-muted">Trace your chronological progress and milestones.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>View Timeline</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>

        <Link
          to="/member/learning"
          className="p-5 rounded-card-sm bg-surface border border-surface-border shadow-subtle hover:border-ink transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <BarChart2 className="h-5 w-5 text-ink-muted group-hover:text-ink transition-colors" />
            <h4 className="text-sm font-bold text-ink">Learning Analytics</h4>
            <p className="text-xs text-ink-muted">Monitor completion percentages and lecture progress.</p>
          </div>
          <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-ink group-hover:translate-x-1 transition-transform">
            <span>Inspect Analytics</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </Link>
      </div>
    </div>
  );
};
