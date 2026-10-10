import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TinyClassifier } from '@/features/publicLearning/TinyClassifier';
import { StarterLessonPage } from '@/pages/public/StarterLessonPage';
import { LearnPage } from '@/pages/public/LearnPage';

const auth = vi.hoisted(() => ({ isAuthenticated: false, isAdmin: false, isActiveMember: false }));
vi.mock('@/features/auth', () => ({ useAuth: () => auth }));
vi.mock('@/features/membership', () => ({ useMembership: () => ({ isActiveMember: auth.isActiveMember }) }));

afterEach(cleanup);

describe('Public first-model experiment', () => {
  it('shows a perfect training score alongside an honest held-out error', () => {
    render(<TinyClassifier />);
    expect(screen.getByText('Training: 6/6 correct · Held-out: 2/3 correct')).toBeInTheDocument();
    const example = screen.getByRole('rowheader', { name: '38 mm' }).closest('tr')!;
    expect(within(example).getByText('Meadow')).toBeInTheDocument();
    expect(within(example).getByText('Ridge')).toBeInTheDocument();
    expect(within(example).getByText('Incorrect')).toBeInTheDocument();
  });

  it('changes the rule and predictions, then resets the experiment', () => {
    render(<TinyClassifier />);
    const boundary = screen.getByRole('slider', { name: 'Move the decision boundary' });
    fireEvent.change(boundary, { target: { value: '12' } });
    expect(screen.getByText('Training: 4/6 correct · Held-out: 1/3 correct')).toBeInTheDocument();
    expect(screen.getByText('Below 12 mm → Meadow. At least 12 mm → Ridge. Use arrow keys to adjust.')).toBeInTheDocument();
    fireEvent.change(boundary, { target: { value: '39' } });
    const example = screen.getByRole('rowheader', { name: '38 mm' }).closest('tr')!;
    expect(within(example).getByText('Correct')).toBeInTheDocument();
    expect(within(example).queryByText('Ridge')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reset to 24 mm' }));
    expect(boundary).toHaveValue('24');
    expect(screen.getByText('Training: 6/6 correct · Held-out: 2/3 correct')).toBeInTheDocument();
  });

  it('keeps the compact homepage experiment interactive without repeating the table', () => {
    render(<TinyClassifier compact />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(/Six training samples and three held-out samples/);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('offers the full lesson without an account and explains the takeaway after a choice', () => {
    render(<MemoryRouter><StarterLessonPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: 'Teach a rule. Find its limits.' })).toBeInTheDocument();
    expect(screen.getByText(/No account, code, or prior AI knowledge required/)).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'A perfect score on the examples used to choose its boundary.' }));
    expect(screen.getByRole('status', { name: 'Knowledge check feedback' })).toHaveTextContent('Check separate examples');
    fireEvent.click(screen.getByRole('radio', { name: 'Its score on fresh examples kept separate from training.' }));
    expect(screen.getByRole('status', { name: 'Knowledge check feedback' })).toHaveTextContent('Separate examples reveal errors');
  });
});

describe('Public learning next actions', () => {
  beforeEach(() => { auth.isAuthenticated = false; auth.isAdmin = false; auth.isActiveMember = false; });

  it('gives visitors a public exercise before membership and avoids an empty project destination', () => {
    render(<MemoryRouter><LearnPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Try your first model' })).toHaveAttribute('href', '/learn/first-model');
    expect(screen.getByRole('link', { name: 'How to join the club' })).toHaveAttribute('href', '/join');
    expect(screen.queryByRole('link', { name: 'Explore projects' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Browse member courses' })).not.toBeInTheDocument();
  });

  it('directs active members to topic searches and their existing courses', () => {
    auth.isAuthenticated = true; auth.isActiveMember = true;
    render(<MemoryRouter><LearnPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Find vision courses' })).toHaveAttribute('href', '/member/courses?search=computer%20vision');
    expect(screen.getByRole('link', { name: 'My courses' })).toHaveAttribute('href', '/member/my-courses');
    expect(screen.queryByRole('link', { name: 'How to join the club' })).not.toBeInTheDocument();
  });

  it('does not expose member workspace actions merely because an applicant has an account', () => {
    auth.isAuthenticated = true;
    render(<MemoryRouter><LearnPage /></MemoryRouter>);
    expect(screen.queryByRole('link', { name: 'Find vision courses' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try your first model' })).toBeInTheDocument();
  });
});
