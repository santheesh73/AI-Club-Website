import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApplication } from '@/features/applications';
import {
  useAssessment,
  AssessmentTimer,
  QuestionCard,
  QuestionPalette,
  AutosaveIndicator,
  SubmitConfirmModal,
} from '@/features/assessment';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  FileCheck2,
  ArrowRight,
} from 'lucide-react';

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    application,
    isLoading: appLoading,
    error: appError,
    createApplication,
  } = useApplication();

  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const handleQuickInitialize = async () => {
    setIsInitializing(true);
    setInitError(null);
    const res = await createApplication();
    setIsInitializing(false);
    if (!res.success) {
      setInitError(res.error || 'Failed to initialize application.');
    }
  };

  const applicationId = application?.id;

  const {
    attempt,
    questions,
    currentQuestion,
    currentIndex,
    totalQuestions,
    answers,
    isLoading: assessmentLoading,
    isSubmitting,
    autosaveStatus,
    lastSavedAt,
    error: assessmentError,
    selectAnswer,
    submit,
    nextQuestion,
    prevQuestion,
    goToQuestion,
  } = useAssessment(applicationId);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // If already completed or expired, navigate to results page
  useEffect(() => {
    if (attempt && (attempt.status === 'completed' || attempt.status === 'expired')) {
      navigate('/applicant/result', { replace: true });
    }
  }, [attempt, navigate]);

  const handleTimeExpired = async () => {
    const res = await submit();
    if (res) {
      navigate('/applicant/result', { replace: true });
    }
  };

  const handleConfirmSubmit = async () => {
    const res = await submit();
    setIsSubmitModalOpen(false);
    if (res) {
      navigate('/applicant/result', { replace: true });
    }
  };

  if (appLoading || assessmentLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" label="Loading assessment session..." />
        <p className="text-xs text-ink-muted">Establishing secure evaluation environment...</p>
      </div>
    );
  }

  if (appError || !application) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-accent-orange mx-auto" />
        <h2 className="text-lg font-semibold text-ink">Application Required</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          An official application record (AIC-2026-XXXXXX) is required to access the 25-MCQ technical assessment.
        </p>
        {initError && (
          <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-cardSm border border-red-200">
            {initError}
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            onClick={handleQuickInitialize}
            disabled={isInitializing}
          >
            {isInitializing ? (
              <>
                <Spinner size="sm" className="mr-2" />
                <span>Initializing Exam...</span>
              </>
            ) : (
              <>
                <span>Start Assessment Questions</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
          <Link to="/applicant/dashboard">
            <Button variant="outline">
              <span>View Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (assessmentError || !attempt || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-card-lg bg-surface border border-surface-border text-center space-y-4 shadow-soft">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-semibold text-ink">Assessment Unavailable</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          {assessmentError || 'Could not load questions. Please ensure you are authorized.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/applicant">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry Session
          </Button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const questionIds = questions.map((q) => q.id);
  const selectedOption = currentQuestion ? answers[currentQuestion.id] : undefined;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sticky Exam Bar */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-md border border-surface-border rounded-card p-4 sm:px-6 shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-ink text-canvas text-xs flex items-center justify-center font-bold font-mono">
            25
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-ink">Technical Assessment</h1>
              <span className="text-xs font-mono text-ink-muted hidden sm:inline">
                [{application.applicationNumber}]
              </span>
            </div>
            <AutosaveIndicator status={autosaveStatus} lastSavedAt={lastSavedAt} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {attempt.remainingSeconds !== undefined && (
            <AssessmentTimer
              initialRemainingSeconds={attempt.remainingSeconds}
              onTimeExpired={handleTimeExpired}
              isSubmitting={isSubmitting}
            />
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsSubmitModalOpen(true)}
            isLoading={isSubmitting}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            <span>Submit Exam</span>
          </Button>
        </div>
      </div>

      {/* Main Assessment Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Question & Navigation (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={totalQuestions}
              selectedOption={selectedOption}
              onSelectOption={(opt) => selectAnswer(currentQuestion.id, opt)}
              disabled={isSubmitting}
            />
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-card bg-surface border border-surface-border shadow-soft">
            <Button
              variant="outline"
              size="sm"
              onClick={prevQuestion}
              disabled={currentIndex === 0 || isSubmitting}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Previous</span>
            </Button>

            <div className="text-xs font-mono text-ink-muted">
              {currentIndex + 1} / {totalQuestions}
            </div>

            {currentIndex < totalQuestions - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={nextQuestion}
                disabled={isSubmitting}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsSubmitModalOpen(true)}
                disabled={isSubmitting}
              >
                <FileCheck2 className="h-4 w-4 mr-1.5" />
                <span>Review & Submit</span>
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Palette & Legend (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <QuestionPalette
            totalQuestions={totalQuestions}
            currentIndex={currentIndex}
            answers={answers}
            questionIds={questionIds}
            onSelectIndex={goToQuestion}
          />

          <div className="p-4 rounded-card bg-canvas-alt/70 border border-surface-border text-xs text-ink-muted space-y-2">
            <p className="font-semibold text-ink">Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Click any option to record your answer instantly.</li>
              <li>You may jump freely between all 25 questions.</li>
              <li>Timer runs continuously on the server.</li>
              <li>When timer hits 0:00, test is auto-submitted.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
