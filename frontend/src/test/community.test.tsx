import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProjectCard } from '@/features/projects/ProjectCard';
import { ProjectReportModal } from '@/features/projects/ProjectReportModal';
import { ProjectHideModal } from '@/features/projects/ProjectHideModal';
import { AchievementCard } from '@/features/achievements/AchievementCard';
import { AchievementModal } from '@/features/achievements/AchievementModal';
import { communityApi } from '@/services/communityApi';
import type { ProjectCardDto, AchievementDto } from '@/types/community';

const mockProject: ProjectCardDto = {
  id: 'proj-test-101',
  title: 'Neural Style Matrix',
  slug: 'neural-style-matrix',
  shortDescription: 'Real-time multi-style neural transfer pipeline using mobile GPUs.',
  coverImageUrl: null,
  category: {
    id: 'pcat-1',
    name: 'AI & Machine Learning',
    slug: 'ai-ml',
  },
  technologies: [
    { id: 'tech-1', name: 'Python', slug: 'python' },
    { id: 'tech-2', name: 'PyTorch', slug: 'pytorch' },
    { id: 'tech-3', name: 'FastAPI', slug: 'fastapi' },
  ],
  owner: {
    id: 'user-mem-1',
    fullName: 'Ada Lovelace',
    email: 'ada@aiclub.org',
    memberNumber: 'AIC-2026-0001',
  },
  status: 'published',
  visibility: 'public',
  isFeatured: true,
  contributorCount: 3,
  publishedAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-05T00:00:00Z',
};

const mockAchievement: AchievementDto = {
  id: 'ach-test-101',
  title: 'AWS Certified Machine Learning - Specialty',
  description: 'Demonstrated expertise in designing, building, deploying, and maintaining ML solutions.',
  issuer: 'Amazon Web Services',
  issuedAt: '2026-04-12',
  credentialUrl: 'https://aws.amazon.com/verification/12345',
  credentialId: 'AWS-ML-83921',
  status: 'published',
  category: {
    id: 'acat-1',
    name: 'Certifications & Accreditations',
    slug: 'certifications',
  },
  user: {
    id: 'user-mem-1',
    fullName: 'Ada Lovelace',
    email: 'ada@aiclub.org',
    memberNumber: 'AIC-2026-0001',
  },
  isOwner: true,
  createdAt: '2026-04-12T00:00:00Z',
  updatedAt: '2026-04-12T00:00:00Z',
};

describe('AI CLUB Milestone 8: Community Projects & Achievements Platform Frontend Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // 1. ProjectCard Component Tests
  // ============================================================================
  describe('ProjectCard Component', () => {
    it('renders project metadata, technology tags, owner, and featured badge', () => {
      render(
        <BrowserRouter>
          <ProjectCard project={mockProject} />
        </BrowserRouter>
      );

      expect(screen.getByText('Neural Style Matrix')).toBeInTheDocument();
      expect(screen.getByText(/Real-time multi-style neural transfer/i)).toBeInTheDocument();
      expect(screen.getByText('AI & Machine Learning')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('PyTorch')).toBeInTheDocument();
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(screen.getByText('Featured')).toBeInTheDocument();
      expect(screen.getByText('Public')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // contributorCount
    });

    it('renders members-only lock badge when project visibility is members_only', () => {
      const membersOnlyProj: ProjectCardDto = {
        ...mockProject,
        visibility: 'members_only',
        isFeatured: false,
      };

      render(
        <BrowserRouter>
          <ProjectCard project={membersOnlyProj} />
        </BrowserRouter>
      );

      expect(screen.getByText('Members Only')).toBeInTheDocument();
      expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // 2. AchievementCard Component Tests
  // ============================================================================
  describe('AchievementCard Component', () => {
    it('renders achievement details, issuer, date, and verification links', () => {
      render(
        <AchievementCard achievement={mockAchievement} />
      );

      expect(screen.getByText('AWS Certified Machine Learning - Specialty')).toBeInTheDocument();
      expect(screen.getByText('Amazon Web Services')).toBeInTheDocument();
      expect(screen.getByText('2026-04-12')).toBeInTheDocument();
      expect(screen.getByText('ID: AWS-ML-83921')).toBeInTheDocument();
      expect(screen.getByText('Verify Credential')).toBeInTheDocument();
    });

    it('renders action buttons when showActions is enabled', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      render(
        <AchievementCard
          achievement={mockAchievement}
          showActions
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );

      const editBtn = screen.getByTitle('Edit Achievement');
      const deleteBtn = screen.getByTitle('Delete Achievement');

      expect(editBtn).toBeInTheDocument();
      expect(deleteBtn).toBeInTheDocument();

      fireEvent.click(editBtn);
      expect(onEdit).toHaveBeenCalledWith(mockAchievement);

      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledWith(mockAchievement.id);
    });
  });

  // ============================================================================
  // 3. ProjectReportModal Component Tests
  // ============================================================================
  describe('ProjectReportModal Component', () => {
    it('submits community misconduct report with reason and description', async () => {
      const mockCreateReport = vi.spyOn(communityApi, 'createReport').mockResolvedValue({
        success: true,
        data: { id: 'rep-101', status: 'open' },
      });

      const onClose = vi.fn();
      const onSubmitted = vi.fn();

      render(
        <ProjectReportModal
          isOpen={true}
          onClose={onClose}
          targetId="proj-test-101"
          targetTitle="Neural Style Matrix"
          onReportSubmitted={onSubmitted}
        />
      );

      expect(screen.getByText(/You are reporting/i)).toBeInTheDocument();
      expect(screen.getByText(/"Neural Style Matrix"/i)).toBeInTheDocument();

      // Enter explanation
      const textarea = screen.getByPlaceholderText(/Describe why this content violates/i);
      fireEvent.change(textarea, { target: { value: 'This project contains code copied without attribution.' } });

      // Submit
      const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreateReport).toHaveBeenCalledWith({
          targetType: 'project',
          targetId: 'proj-test-101',
          reason: 'inappropriate',
          description: 'This project contains code copied without attribution.',
        });
        expect(onSubmitted).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // 4. ProjectHideModal Component Tests
  // ============================================================================
  describe('ProjectHideModal Component', () => {
    it('allows admin to submit reason and hide project', async () => {
      const mockHideProject = vi.spyOn(communityApi, 'hideProject').mockResolvedValue({
        success: true,
        data: { id: 'proj-test-101', status: 'hidden' },
      });

      const onClose = vi.fn();
      const onHidden = vi.fn();

      render(
        <ProjectHideModal
          isOpen={true}
          onClose={onClose}
          projectId="proj-test-101"
          projectTitle="Neural Style Matrix"
          onProjectHidden={onHidden}
        />
      );

      expect(screen.getByText('Hide Project from Community')).toBeInTheDocument();

      const textarea = screen.getByPlaceholderText(/State the violation or rationale/i);
      fireEvent.change(textarea, { target: { value: 'Copyright claim validated by audit.' } });

      const confirmBtn = screen.getByRole('button', { name: /Confirm Hide/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockHideProject).toHaveBeenCalledWith('proj-test-101', 'Copyright claim validated by audit.');
        expect(onHidden).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // 5. AchievementModal Component Tests
  // ============================================================================
  describe('AchievementModal Component', () => {
    it('creates new achievement with valid data', async () => {
      const mockCreate = vi.spyOn(communityApi, 'createAchievement').mockResolvedValue({
        success: true,
        data: mockAchievement,
      });

      const onClose = vi.fn();
      const onSaved = vi.fn();

      render(
        <AchievementModal
          isOpen={true}
          onClose={onClose}
          categories={[{ id: 'acat-1', name: 'Certifications', slug: 'certifications', createdAt: '', updatedAt: '' }]}
          onSaved={onSaved}
        />
      );

      fireEvent.change(screen.getByPlaceholderText(/e.g. AWS Certified/i), {
        target: { value: 'Deep Learning Specialization' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e.g. Amazon Web Services/i), {
        target: { value: 'Coursera / DeepLearning.AI' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Summarize the scope/i), {
        target: { value: 'Completed 5-course sequence on CNNs, RNNs, and Transformers.' },
      });

      const submitBtn = screen.getByRole('button', { name: /Add Achievement/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
        expect(onSaved).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });
});
