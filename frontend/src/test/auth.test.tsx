import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { ProfileView } from '@/features/profile/ProfileView';
import { AuthProvider } from '@/features/auth';
import type { UserProfile } from '@/types/user';

describe('AI CLUB Milestone 2: Frontend Auth & Profile Tests', () => {
  it('LoginPage renders semantic form controls and handles input', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('RegisterPage displays validation errors when passwords do not match', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passInput = screen.getByLabelText(/^password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(nameInput, { target: { value: 'Ada Lovelace' } });
    fireEvent.change(emailInput, { target: { value: 'ada@example.com' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'mismatch456' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('ProfileView renders user profile and triggers onEdit callback', () => {
    const mockProfile: UserProfile = {
      id: 'test-user-id',
      email: 'test@aiclub.internal',
      fullName: 'Alan Turing',
      role: 'applicant',
      department: 'Mathematics',
      year: 4,
      skills: ['Cryptography', 'Computability'],
      interests: ['Machine Intelligence'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const handleEdit = vi.fn();

    render(
      <BrowserRouter>
        <ProfileView profile={mockProfile} onEdit={handleEdit} />
      </BrowserRouter>
    );

    expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    expect(screen.getByText(/APPLICANT/i)).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Cryptography')).toBeInTheDocument();

    const editBtn = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });
});
