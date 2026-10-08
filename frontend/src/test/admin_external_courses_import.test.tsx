import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminExternalCoursesPage } from '@/pages/admin/AdminExternalCoursesPage';
import { externalCoursesApi } from '@/services/externalCoursesApi';

vi.mock('@/services/externalCoursesApi', () => ({
  externalCoursesApi: {
    getAdminExternalCourses: vi.fn(),
    getAdminStats: vi.fn(),
    extractCourseDetails: vi.fn(),
    createExternalCourse: vi.fn(),
    updateExternalCourse: vi.fn(),
    publishExternalCourse: vi.fn(),
    verifyExternalCourse: vi.fn(),
    deleteExternalCourse: vi.fn(),
  },
}));

describe('AdminExternalCoursesPage: Smart External Course URL Import UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(externalCoursesApi.getAdminExternalCourses).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'course-1',
          title: 'Existing Draft Course',
          provider: 'Coursera',
          providerKey: 'COURSERA',
          officialUrl: 'https://www.coursera.org/learn/existing',
          category: 'AI',
          skills: ['Python'],
          difficulty: 'beginner',
          description: 'A course already created.',
          status: 'draft',
          publishedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any);

    vi.mocked(externalCoursesApi.getAdminStats).mockResolvedValue({
      success: true,
      data: {
        total: 1,
        published: 0,
        byProvider: { Coursera: 1 },
        byCategory: { AI: 1 },
        byDifficulty: { beginner: 1 },
      },
    } as any);
  });

  it('renders the Smart URL Importer section with input and extract button', async () => {
    render(
      <BrowserRouter>
        <AdminExternalCoursesPage />
      </BrowserRouter>
    );

    expect(await screen.findByText(/Add External Course/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/www\.coursera\.org\/learn\//i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Extract Course Details/i })).toBeInTheDocument();
  });

  it('validates URL input and keeps extract button disabled when input is empty', async () => {
    render(
      <BrowserRouter>
        <AdminExternalCoursesPage />
      </BrowserRouter>
    );

    const extractBtn = await screen.findByRole('button', { name: /Extract Course Details/i });
    expect(extractBtn).toBeDisabled();
  });

  it('extracts metadata, displays Course Preview card, and permits editing and saving draft', async () => {
    vi.mocked(externalCoursesApi.extractCourseDetails).mockResolvedValue({
      success: true,
      data: {
        success: true,
        sourceUrl: 'https://www.coursera.org/learn/machine-learning',
        canonicalUrl: 'https://www.coursera.org/learn/machine-learning',
        provider: 'COURSERA',
        providerDisplayName: 'Coursera',
        metadata: {
          title: 'Machine Learning Specialization',
          description: 'Comprehensive introduction to machine learning by Stanford.',
          imageUrl: 'https://images.coursera.org/ml.jpg',
          category: 'MACHINE_LEARNING',
          difficulty: 'beginner',
          skills: ['Python', 'Supervised Learning'],
          priceType: 'free',
        },
        extraction: {
          titleSource: 'jsonld',
          descriptionSource: 'jsonld',
          imageSource: 'jsonld',
          providerSource: 'domain-allowlist',
        },
      },
    } as any);

    vi.mocked(externalCoursesApi.createExternalCourse).mockResolvedValue({
      success: true,
      data: {
        id: 'new-course-id',
        title: 'Machine Learning Specialization (Curated)',
        provider: 'Coursera',
        providerKey: 'COURSERA',
        officialUrl: 'https://www.coursera.org/learn/machine-learning',
        category: 'MACHINE_LEARNING',
        skills: ['Python', 'Supervised Learning', 'Deep Learning'],
        difficulty: 'intermediate',
        description: 'Comprehensive introduction to machine learning by Stanford.',
        status: 'draft',
        publishedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as any);

    render(
      <BrowserRouter>
        <AdminExternalCoursesPage />
      </BrowserRouter>
    );

    const input = await screen.findByPlaceholderText(/https:\/\/www\.coursera\.org\/learn\//i);
    fireEvent.change(input, {
      target: { value: 'https://www.coursera.org/learn/machine-learning' },
    });

    const extractBtn = screen.getByRole('button', { name: /Extract Course Details/i });
    fireEvent.click(extractBtn);

    // Verify Course Preview card appears
    expect(await screen.findByText(/Course Preview/i)).toBeInTheDocument();
    expect(screen.getByText('Machine Learning Specialization')).toBeInTheDocument();
    expect(screen.getByText(/Comprehensive introduction to machine learning by Stanford/i)).toBeInTheDocument();

    // Click Edit Details
    const editBtn = screen.getByRole('button', { name: /Edit Details/i });
    fireEvent.click(editBtn);

    // Save as Draft
    const saveDraftBtn = screen.getByRole('button', { name: /Save as Draft/i });
    fireEvent.click(saveDraftBtn);

    await waitFor(() => {
      expect(externalCoursesApi.createExternalCourse).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Machine Learning Specialization',
          status: 'draft',
        })
      );
    });
  });

  it('allows Admin to explicitly publish a draft course', async () => {
    vi.mocked(externalCoursesApi.publishExternalCourse).mockResolvedValue({
      success: true,
      data: {
        id: 'course-1',
        title: 'Existing Draft Course',
        provider: 'Coursera',
        providerKey: 'COURSERA',
        officialUrl: 'https://www.coursera.org/learn/existing',
        category: 'AI',
        skills: ['Python'],
        difficulty: 'beginner',
        description: 'A course already created.',
        status: 'published',
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as any);

    render(
      <BrowserRouter>
        <AdminExternalCoursesPage />
      </BrowserRouter>
    );

    // Find the Publish button on the draft course
    const publishBtn = await screen.findByRole('button', { name: /Publish/i });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(externalCoursesApi.publishExternalCourse).toHaveBeenCalledWith('course-1');
    });
  });
});
