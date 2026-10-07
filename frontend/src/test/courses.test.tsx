import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CourseCard } from '@/features/courses/CourseCard';
import { ProgressBar } from '@/features/courses/ProgressBar';
import { ModuleAccordion } from '@/features/courses/ModuleAccordion';
import { CoursePublishModal } from '@/features/courses/CoursePublishModal';
import { CourseArchiveModal } from '@/features/courses/CourseArchiveModal';
import type { CourseCardDto, ModuleSyllabusDto } from '@/types/courses';

const mockCourse: CourseCardDto = {
  id: 'course-test-101',
  title: 'Applied Generative AI & Large Language Models',
  slug: 'applied-generative-ai-llms',
  shortDescription: 'Master generative foundation models, transformer architectures, prompt engineering, and fine-tuning.',
  thumbnailUrl: null,
  category: {
    id: 'cat-genai',
    name: 'Generative AI',
    slug: 'generative-ai',
  },
  difficulty: 'intermediate',
  estimatedDuration: 240, // 4 hours
  status: 'published',
  totalModules: 3,
  totalLessons: 9,
  isEnrolled: false,
  enrollmentStatus: null,
  progressPercentage: null,
};

const mockModule: ModuleSyllabusDto = {
  id: 'mod-1',
  title: 'Module 1: Attention Mechanisms & Transformer Core',
  description: 'Deep dive into scaled dot-product attention and multi-head attention.',
  position: 0,
  lessons: [
    {
      id: 'les-1',
      title: 'Introduction to Attention Mechanisms',
      slug: 'intro-to-attention-mechanisms',
      duration: 15,
      position: 0,
      isPreview: true,
      isCompleted: false,
    },
    {
      id: 'les-2',
      title: 'Implementing Multi-Head Attention in PyTorch',
      slug: 'multi-head-attention-pytorch',
      duration: 30,
      position: 1,
      isPreview: false,
      isCompleted: false,
    },
  ],
};

describe('AI CLUB Milestone 7: Courses & Learning Management Platform Frontend Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('ProgressBar Component', () => {
    it('renders progress bar with correct ARIA attributes and percentage', () => {
      render(<ProgressBar percentage={65} showLabel={true} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '65');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('clamps negative percentages to 0 and values above 100 to 100', () => {
      const { rerender } = render(<ProgressBar percentage={-20} />);
      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');

      rerender(<ProgressBar percentage={150} />);
      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('CourseCard Component', () => {
    it('renders course details, badges, duration, and syllabus CTA when unenrolled', () => {
      render(
        <BrowserRouter>
          <CourseCard course={mockCourse} />
        </BrowserRouter>
      );

      expect(screen.getByText('Applied Generative AI & Large Language Models')).toBeInTheDocument();
      expect(screen.getByText('Generative AI')).toBeInTheDocument();
      expect(screen.getByText('intermediate')).toBeInTheDocument();
      expect(screen.getByText('4 hrs')).toBeInTheDocument();
      expect(screen.getByText('3 modules')).toBeInTheDocument();
      expect(screen.getByText('9 lessons')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view course syllabus/i })).toBeInTheDocument();
    });

    it('renders progress bar and "Continue Learning" CTA when enrolled in progress', () => {
      const enrolledCourse: CourseCardDto = {
        ...mockCourse,
        isEnrolled: true,
        enrollmentStatus: 'active',
        progressPercentage: 45,
      };

      render(
        <BrowserRouter>
          <CourseCard course={enrolledCourse} />
        </BrowserRouter>
      );

      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue learning/i })).toBeInTheDocument();
    });

    it('renders completed badge and "Review Course" CTA when completed', () => {
      const completedCourse: CourseCardDto = {
        ...mockCourse,
        isEnrolled: true,
        enrollmentStatus: 'completed',
        progressPercentage: 100,
      };

      render(
        <BrowserRouter>
          <CourseCard course={completedCourse} />
        </BrowserRouter>
      );

      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /review course/i })).toBeInTheDocument();
    });
  });

  describe('ModuleAccordion Component', () => {
    it('renders module title and lessons list with preview badges', () => {
      render(
        <ModuleAccordion
          module={mockModule}
          moduleIndex={0}
          isOpenDefault={true}
          isEnrolled={false}
        />
      );

      expect(screen.getByText('Module 1: Attention Mechanisms & Transformer Core')).toBeInTheDocument();
      expect(screen.getByText('Introduction to Attention Mechanisms')).toBeInTheDocument();
      expect(screen.getByText('Implementing Multi-Head Attention in PyTorch')).toBeInTheDocument();
      expect(screen.getByText('Free Preview')).toBeInTheDocument();
    });

    it('toggles collapse and expand when header button is clicked', () => {
      render(
        <ModuleAccordion
          module={mockModule}
          moduleIndex={0}
          isOpenDefault={true}
          isEnrolled={false}
        />
      );

      expect(screen.getByText('Introduction to Attention Mechanisms')).toBeInTheDocument();

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      expect(screen.queryByText('Introduction to Attention Mechanisms')).not.toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(screen.getByText('Introduction to Attention Mechanisms')).toBeInTheDocument();
    });

    it('triggers onSelectLesson when an unlocked lesson is clicked', () => {
      const handleSelect = vi.fn();
      render(
        <ModuleAccordion
          module={mockModule}
          moduleIndex={0}
          isOpenDefault={true}
          isEnrolled={false}
          onSelectLesson={handleSelect}
        />
      );

      // Lesson 1 is a Free Preview, so it is unlocked
      const previewLesson = screen.getByText('Introduction to Attention Mechanisms');
      fireEvent.click(previewLesson);

      expect(handleSelect).toHaveBeenCalledWith('intro-to-attention-mechanisms');
    });
  });

  describe('CoursePublishModal Component', () => {
    it('renders publish prompt and triggers onConfirm and onClose', async () => {
      const handleConfirm = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <CoursePublishModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          courseTitle="Applied Generative AI & Large Language Models"
          isSubmitting={false}
        />
      );

      expect(screen.getByText('Publish Course?')).toBeInTheDocument();
      expect(screen.getByText(/Applied Generative AI & Large Language Models/i)).toBeInTheDocument();

      // Click Confirm & Publish
      const publishBtn = screen.getByRole('button', { name: /confirm & publish/i });
      fireEvent.click(publishBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);

      // Click Keep as Draft
      const draftBtn = screen.getByRole('button', { name: /keep as draft/i });
      fireEvent.click(draftBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('CourseArchiveModal Component', () => {
    it('renders archive confirmation and handles actions', async () => {
      const handleConfirm = vi.fn().mockResolvedValue(undefined);
      const handleClose = vi.fn();

      render(
        <CourseArchiveModal
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
          courseTitle="Applied Generative AI & Large Language Models"
          isSubmitting={false}
        />
      );

      expect(screen.getByText('Archive Course?')).toBeInTheDocument();
      expect(screen.getByText(/Applied Generative AI & Large Language Models/i)).toBeInTheDocument();

      // Click Confirm & Archive
      const archiveBtn = screen.getByRole('button', { name: /confirm & archive/i });
      fireEvent.click(archiveBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);

      // Click Cancel
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
