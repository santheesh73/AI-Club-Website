import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import type { UserProfile } from '@/types/user';
import { mapAuthError } from './authErrors';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    metadata?: Partial<UserProfile>
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_DEV_USER_KEY = 'ai_club_dev_user_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

  // Helper to map DB row to UserProfile
  const mapRowToProfile = (row: Record<string, unknown>): UserProfile => ({
    id: String(row.id || ''),
    email: String(row.email || ''),
    fullName: String(row.full_name || ''),
    role: (row.role as UserProfile['role']) || 'applicant',
    registerNumber: row.register_number ? String(row.register_number) : undefined,
    department: row.department ? String(row.department) : undefined,
    year: typeof row.year === 'number' ? row.year : undefined,
    section: row.section ? String(row.section) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    bio: row.bio ? String(row.bio) : undefined,
    skills: Array.isArray(row.skills) ? (row.skills as string[]) : [],
    interests: Array.isArray(row.interests) ? (row.interests as string[]) : [],
    githubUrl: row.github_url ? String(row.github_url) : undefined,
    linkedinUrl: row.linkedin_url ? String(row.linkedin_url) : undefined,
    portfolioUrl: row.portfolio_url ? String(row.portfolio_url) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  });

  // Fetch user profile from Supabase Database (under RLS)
  const fetchProfile = useCallback(async (userId: string, userEmail?: string, userFullName?: string) => {
    if (!isSupabaseConfigured) {
      // In local development standby mode
      const saved = localStorage.getItem(LOCAL_STORAGE_DEV_USER_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProfile(parsed);
          return;
        } catch {
          // ignore corrupted local dev state
        }
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[AI CLUB Auth] Error fetching profile:', error.message);
        return;
      }

      if (data) {
        setProfile(mapRowToProfile(data));
      } else {
        // Fallback: Provision default profile if trigger hasn't completed
        const defaultProfile = {
          id: userId,
          email: userEmail || '',
          full_name: userFullName || '',
          role: 'applicant',
        };
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert(defaultProfile)
          .select()
          .single();

        if (!insertError && inserted) {
          setProfile(mapRowToProfile(inserted));
        }
      }
    } catch (err) {
      console.error('[AI CLUB Auth] Exception loading profile:', err);
    }
  }, [isSupabaseConfigured]);

  // Initial session restoration
  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      if (!isSupabaseConfigured) {
        // Local standby mode
        const saved = localStorage.getItem(LOCAL_STORAGE_DEV_USER_KEY);
        if (saved && isMounted) {
          try {
            const devProfile: UserProfile = JSON.parse(saved);
            setProfile(devProfile);
            setUser({ id: devProfile.id, email: devProfile.email } as unknown as User);
            setSession({ user: { id: devProfile.id, email: devProfile.email } } as unknown as Session);
          } catch {
            localStorage.removeItem(LOCAL_STORAGE_DEV_USER_KEY);
          }
        }
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[AI CLUB Auth] Failed to restore session:', error.message);
        }

        if (initialSession && isMounted) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(
            initialSession.user.id,
            initialSession.user.email,
            initialSession.user.user_metadata?.full_name
          );
        }
      } catch (err) {
        console.error('[AI CLUB Auth] Error restoring session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeSession();

    // Subscribe to auth state updates (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          await fetchProfile(
            newSession.user.id,
            newSession.user.email,
            newSession.user.user_metadata?.full_name
          );
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, isSupabaseConfigured]);

  // Sign In
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Local development demo sign-in
        const devUser: UserProfile = {
          id: 'dev-user-001',
          email,
          fullName: 'Demo Applicant',
          role: 'applicant',
          skills: ['TypeScript', 'Python'],
          interests: ['Deep Learning', 'Agent Architectures'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_STORAGE_DEV_USER_KEY, JSON.stringify(devUser));
        setProfile(devUser);
        setUser({ id: devUser.id, email } as unknown as User);
        setSession({ user: { id: devUser.id, email } } as unknown as Session);
        setIsLoading(false);
        return { success: true };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: mapAuthError(error) };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        await fetchProfile(data.user.id, data.user.email);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: mapAuthError(err) };
    }
  };

  // Sign Up
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    metadata?: Partial<UserProfile>
  ) => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Local development demo sign-up
        const devUser: UserProfile = {
          id: 'dev-user-' + Date.now(),
          email: email.trim(),
          fullName: fullName.trim(),
          role: 'applicant',
          skills: [],
          interests: [],
          ...metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_STORAGE_DEV_USER_KEY, JSON.stringify(devUser));
        setProfile(devUser);
        setUser({ id: devUser.id, email } as unknown as User);
        setSession({ user: { id: devUser.id, email } } as unknown as Session);
        setIsLoading(false);
        return { success: true };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'applicant', // Strictly applicant on registration
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: mapAuthError(error) };
      }

      if (data.user) {
        setUser(data.user);
        if (data.session) {
          setSession(data.session);
          await fetchProfile(data.user.id, data.user.email, fullName);
        }
      }

      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: mapAuthError(err) };
    }
  };

  // Sign Out
  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[AI CLUB Auth] Error during Supabase signOut:', err);
    } finally {
      localStorage.removeItem(LOCAL_STORAGE_DEV_USER_KEY);
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsLoading(false);
    }
  };

  // Password Reset Request
  const resetPassword = async (email: string) => {
    try {
      if (!isSupabaseConfigured) {
        return { success: true };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/forgot-password?mode=reset`,
      });

      if (error) {
        return { success: false, error: mapAuthError(error) };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err) };
    }
  };

  // Update Password
  const updatePassword = async (newPassword: string) => {
    try {
      if (!isSupabaseConfigured) {
        return { success: true };
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: mapAuthError(error) };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: mapAuthError(err) };
    }
  };

  // Refresh Profile
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, user.email || undefined);
    }
  };

  // Update Profile (Self only)
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile?.id) {
      return { success: false, error: 'User is not authenticated' };
    }

    try {
      // Disallow updating immutable security fields
      const { ...allowedUpdates } = updates;
      delete allowedUpdates.id;
      delete allowedUpdates.email;
      delete allowedUpdates.role;
      delete allowedUpdates.createdAt;

      if (!isSupabaseConfigured) {
        const updated: UserProfile = {
          ...profile,
          ...allowedUpdates,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_STORAGE_DEV_USER_KEY, JSON.stringify(updated));
        setProfile(updated);
        return { success: true };
      }

      // Convert camelCase to snake_case for DB columns
      const dbPayload: Record<string, unknown> = {};
      if (allowedUpdates.fullName !== undefined) dbPayload.full_name = allowedUpdates.fullName.trim();
      if (allowedUpdates.registerNumber !== undefined) dbPayload.register_number = allowedUpdates.registerNumber.trim();
      if (allowedUpdates.department !== undefined) dbPayload.department = allowedUpdates.department.trim();
      if (allowedUpdates.year !== undefined) dbPayload.year = allowedUpdates.year;
      if (allowedUpdates.section !== undefined) dbPayload.section = allowedUpdates.section.trim();
      if (allowedUpdates.phone !== undefined) dbPayload.phone = allowedUpdates.phone.trim();
      if (allowedUpdates.avatarUrl !== undefined) dbPayload.avatar_url = allowedUpdates.avatarUrl.trim();
      if (allowedUpdates.bio !== undefined) dbPayload.bio = allowedUpdates.bio.trim();
      if (allowedUpdates.skills !== undefined) dbPayload.skills = allowedUpdates.skills;
      if (allowedUpdates.interests !== undefined) dbPayload.interests = allowedUpdates.interests;
      if (allowedUpdates.githubUrl !== undefined) dbPayload.github_url = allowedUpdates.githubUrl.trim();
      if (allowedUpdates.linkedinUrl !== undefined) dbPayload.linkedin_url = allowedUpdates.linkedinUrl.trim();
      if (allowedUpdates.portfolioUrl !== undefined) dbPayload.portfolio_url = allowedUpdates.portfolioUrl.trim();

      const { data, error } = await supabase
        .from('profiles')
        .update(dbPayload)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (data) {
        setProfile(mapRowToProfile(data));
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated: Boolean(user && (isSupabaseConfigured ? session : true)),
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
