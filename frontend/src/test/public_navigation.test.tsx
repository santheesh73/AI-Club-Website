import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';

vi.mock('@/features/auth', () => ({ useAuth: () => ({ isAuthenticated: false, profile: null, isAdmin: false, signOut: vi.fn() }) }));
afterEach(cleanup);
const CurrentRoute = () => <output aria-label="Current route">{useLocation().pathname}</output>;
const renderNavigation = () => render(<MemoryRouter initialEntries={['/']}><Navbar /><CurrentRoute /></MemoryRouter>);

describe('Public mobile navigation', () => {
  it('exposes discovery and account links through an announced toggle', () => {
    renderNavigation();
    const toggle = screen.getByRole('button', { name: 'Open navigation' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const navigation = screen.getByRole('navigation', { name: 'Mobile navigation' });
    for (const [name, href] of [['About', '/about'], ['Learn', '/learn'], ['Events', '/events'], ['Sign in', '/login']]) {
      expect(within(navigation).getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });
  it('dismisses with Escape and returns focus to the toggle', () => {
    renderNavigation();
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    within(screen.getByRole('navigation', { name: 'Mobile navigation' })).getByRole('link', { name: 'Learn' }).focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveFocus();
  });
  it('closes after choosing a destination and keeps homepage sign-in available', () => {
    renderNavigation();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Mobile navigation' })).getByRole('link', { name: 'Events' }));
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/events');
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();
  });
});
