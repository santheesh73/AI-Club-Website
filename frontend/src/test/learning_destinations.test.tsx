import type { ContextType } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@/features/auth/AuthContext';
import { MemberCoursesPage } from '@/pages/member/MemberCoursesPage';
import { coursesApi } from '@/services/coursesApi';

vi.mock('@/features/courses', () => ({ CourseCard: () => <div />, RecommendedCoursesSection: () => <div /> }));
const account = { isAuthenticated: true, profile: { id: 'learning-member', role: 'member' } } as ContextType<typeof AuthContext>;
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Learning track catalogue destinations', () => {
  it('uses the selected track query in the course request and lets the member clear it', async () => {
    vi.spyOn(coursesApi, 'getCategories').mockResolvedValue({ success: true, data: [] });
    const courses = vi.spyOn(coursesApi, 'getMemberCourses').mockResolvedValue({ success: true, data: [], meta: { total: 0 } });
    render(<AuthContext.Provider value={account}><MemoryRouter initialEntries={['/member/courses?search=%20computer%20vision%20']}><MemberCoursesPage /></MemoryRouter></AuthContext.Provider>);
    await waitFor(() => expect(courses).toHaveBeenCalledWith(expect.objectContaining({ search: 'computer vision' })));
    expect(screen.getByPlaceholderText('Search courses by title, topic...')).toHaveValue('computer vision');
    expect(screen.getByRole('link', { name: 'My Learning' })).toHaveAttribute('href', '/member/my-courses');
    fireEvent.click(await screen.findByRole('button', { name: 'Clear Filters' }));
    await waitFor(() => expect(courses).toHaveBeenLastCalledWith(expect.objectContaining({ search: undefined })));
    expect(screen.getByPlaceholderText('Search courses by title, topic...')).toHaveValue('');
  });

  it('bounds catalogue search supplied through a URL', async () => {
    vi.spyOn(coursesApi, 'getCategories').mockResolvedValue({ success: true, data: [] });
    const courses = vi.spyOn(coursesApi, 'getMemberCourses').mockResolvedValue({ success: true, data: [] });
    render(<AuthContext.Provider value={account}><MemoryRouter initialEntries={[`/member/courses?search=${'a'.repeat(150)}`]}><MemberCoursesPage /></MemoryRouter></AuthContext.Provider>);
    await waitFor(() => expect(courses).toHaveBeenCalledWith(expect.objectContaining({ search: 'a'.repeat(100) })));
  });
});
