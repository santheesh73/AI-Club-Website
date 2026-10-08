import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QuestionCard } from '@/features/assessment/QuestionCard';
import { QuestionPalette } from '@/features/assessment/QuestionPalette';
import { AssessmentTimer } from '@/features/assessment/AssessmentTimer';
import { SubmitConfirmModal } from '@/features/assessment/SubmitConfirmModal';
import { ApplicationTimeline } from '@/features/applications/ApplicationTimeline';
import { ApplicationCard } from '@/features/applications/ApplicationCard';
import type { SafeQuestion, QuestionOption } from '@/types/assessment';
import type { Application } from '@/types/application';

describe('AI CLUB Milestone 3: Application & Assessment Component Tests', () => {
  const mockQuestion: SafeQuestion = {
    id: 'q-101',
    category: 'Machine Learning',
    difficulty: 'medium',
    questionText: 'Which loss function is convex and commonly used for binary logistic regression?',
    optionA: 'Binary Cross-Entropy / Log Loss',
    optionB: 'Mean Squared Error',
    optionC: 'Hinge Loss',
    optionD: 'Categorical Cross-Entropy',
  };

  it('QuestionCard renders question details and invokes onSelectOption', () => {
    const handleSelect = vi.fn();

    render(
      <QuestionCard
        question={mockQuestion}
        questionNumber={1}
        totalQuestions={25}
        selectedOption="A"
        onSelectOption={handleSelect}
      />
    );

    expect(screen.getByText(/Question 1 of 25/i)).toBeInTheDocument();
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    expect(screen.getByText(mockQuestion.questionText)).toBeInTheDocument();
    expect(screen.getByText(mockQuestion.optionA)).toBeInTheDocument();
    expect(screen.getByText(mockQuestion.optionB)).toBeInTheDocument();

    // Click Option B
    fireEvent.click(screen.getByText(mockQuestion.optionB));
    expect(handleSelect).toHaveBeenCalledWith('B');
  });

  it('QuestionPalette renders all 25 buttons and handles jumping to questions', () => {
    const handleJump = vi.fn();
    const questionIds = Array.from({ length: 25 }, (_, i) => `q-${i + 1}`);
    const answers: Record<string, QuestionOption> = {
      'q-1': 'A',
      'q-2': 'B',
      'q-3': 'C',
    };

    render(
      <QuestionPalette
        totalQuestions={25}
        currentIndex={0}
        answers={answers}
        questionIds={questionIds}
        onSelectIndex={handleJump}
      />
    );

    expect(screen.getByText(/3\/25 Answered/i)).toBeInTheDocument();

    // Check button 5 exists and click it
    const btn5 = screen.getByRole('button', { name: 'Question 5' });
    expect(btn5).toBeInTheDocument();
    fireEvent.click(btn5);
    expect(handleJump).toHaveBeenCalledWith(4);
  });

  it('AssessmentTimer renders formatted time', () => {
    const handleExpire = vi.fn();

    render(
      <AssessmentTimer
        initialRemainingSeconds={1800}
        onTimeExpired={handleExpire}
      />
    );

    // 1800 seconds = 30:00
    expect(screen.getByText('30:00')).toBeInTheDocument();
  });

  it('SubmitConfirmModal displays answered and unanswered counts', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <SubmitConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        totalQuestions={25}
        answeredCount={20}
        isSubmitting={false}
      />
    );

    expect(screen.getByText(/Submit Assessment\?/i)).toBeInTheDocument();
    expect(screen.getByText('20 / 25')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // unanswered count
    expect(screen.getByText(/You have unanswered questions remaining/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /confirm & submit/i });
    fireEvent.click(submitBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('ApplicationTimeline reflects lifecycle stages', () => {
    render(
      <ApplicationTimeline
        profileComplete={true}
        hasApplication={true}
        applicationStatus="under_review"
        assessmentStatus="completed"
      />
    );

    expect(screen.getByText(/1\. Account & Candidate Record/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. 25-MCQ Technical Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Under Committee Review/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Admissions Decision/i)).toBeInTheDocument();
    expect(screen.getByText(/5\. Member Induction & Full Profile Setup/i)).toBeInTheDocument();
  });

  it('ApplicationCard displays application ID and status', () => {
    const mockApp: Application = {
      id: 'app-1',
      userId: 'usr-1',
      applicationNumber: 'AIC-2026-000001',
      status: 'under_review',
      academicYear: 2026,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewerNotes: null,
      assessmentScore: 21,
      assessmentPassed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <BrowserRouter>
        <ApplicationCard
          application={mockApp}
          canStartAssessment={false}
          assessmentStatus="completed"
        />
      </BrowserRouter>
    );

    expect(screen.getByText('AIC-2026-000001')).toBeInTheDocument();
    expect(screen.getByText(/Under Review/i)).toBeInTheDocument();
    expect(screen.getByText(/21\/25 \(Passed\)/i)).toBeInTheDocument();
  });
});
