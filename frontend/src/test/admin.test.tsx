import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApproveConfirmModal } from '@/features/admin/ApproveConfirmModal';
import { WaitlistConfirmModal } from '@/features/admin/WaitlistConfirmModal';
import { RejectReasonModal } from '@/features/admin/RejectReasonModal';

describe('AI CLUB Milestone 4: Admin Decision Modals & Review Tests', () => {
  it('ApproveConfirmModal renders student details and passes notes to confirm callback', async () => {
    const handleConfirm = vi.fn().mockResolvedValue(true);
    const handleClose = vi.fn();

    render(
      <ApproveConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        studentName="Kavya Sundaram"
        applicationNumber="AIC-2026-000042"
        assessmentScore={22}
        isSubmitting={false}
      />
    );

    expect(screen.getByText(/Approve Candidate Application\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Kavya Sundaram/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified Exam Score: 22 \/ 25/i)).toBeInTheDocument();

    const notesInput = screen.getByLabelText(/Administrative Review Notes/i);
    fireEvent.change(notesInput, { target: { value: 'Strong candidate portfolio' } });

    const confirmBtn = screen.getByRole('button', { name: /confirm approval/i });
    fireEvent.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledWith('Strong candidate portfolio');
  });

  it('WaitlistConfirmModal renders waitlist notice and calls onConfirm', async () => {
    const handleConfirm = vi.fn().mockResolvedValue(true);
    const handleClose = vi.fn();

    render(
      <WaitlistConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        studentName="Rohan Gupta"
        applicationNumber="AIC-2026-000043"
        isSubmitting={false}
      />
    );

    expect(screen.getByText(/Waitlist Application\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Rohan Gupta/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /confirm waitlist/i });
    fireEvent.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalled();
  });

  it('RejectReasonModal validates required rejection reason (disables submit when empty)', async () => {
    const handleConfirm = vi.fn().mockResolvedValue(true);
    const handleClose = vi.fn();

    render(
      <RejectReasonModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        studentName="Aakash Nair"
        applicationNumber="AIC-2026-000044"
        isSubmitting={false}
      />
    );

    expect(screen.getByText(/Reject Application/i)).toBeInTheDocument();
    expect(screen.getByText(/A documented rejection reason is mandatory/i)).toBeInTheDocument();

    const rejectBtn = screen.getByRole('button', { name: /confirm rejection/i });
    expect(rejectBtn).toBeDisabled();

    // Type short invalid reason
    const textarea = screen.getByLabelText(/Official Rejection Reason/i);
    fireEvent.change(textarea, { target: { value: 'No' } });
    expect(rejectBtn).toBeDisabled();

    // Type valid reason
    fireEvent.change(textarea, { target: { value: 'Prerequisites not met' } });
    expect(rejectBtn).not.toBeDisabled();

    fireEvent.click(rejectBtn);
    expect(handleConfirm).toHaveBeenCalledWith('Prerequisites not met');
  });
});
