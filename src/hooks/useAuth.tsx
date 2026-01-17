import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ensureProfile = async (nextSession: Session | null) => {
      if (!nextSession?.user) return;

      const meta = (nextSession.user.user_metadata ?? {}) as any;
      // If we don't know the user's role yet, onboarding will collect it.
      if (!meta?.user_type) return;

      const email = nextSession.user.email ?? meta.email ?? null;
      const full_name = meta.full_name ?? (email ? email.split('@')[0] : 'User');

      try {
        const { data: existing, error: existingError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', nextSession.user.id)
          .maybeSingle();

        if (existingError) return;
        if (existing) return;

        await supabase.from('profiles').insert([
          {
            user_id: nextSession.user.id,
            email,
            full_name,
            user_type: meta.user_type,
            phone: meta.phone ?? null,
          },
        ]);
      } catch {
        // Silent: onboarding can recover.
      }
    };

    // Listen for auth changes FIRST (prevents missing events during init)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      // Never call Supabase directly inside this callback.
      setTimeout(() => {
        void ensureProfile(nextSession);
      }, 0);
    });

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);

      setTimeout(() => {
        void ensureProfile(initialSession);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        // Persist onboarding-critical info so we can safely create the profile
        // even if profile insert fails during signup (e.g. email confirmation flow)
        data: {
          ...userData,
        },
      },
    });

    // Attempt profile creation when a session exists (RLS usually requires auth)
    if (data?.user && data?.session && !error) {
      const { error: profileError } = await supabase.from('profiles').upsert([
        {
          user_id: data.user.id,
          email,
          ...userData,
        },
      ]);

      if (profileError) {
        // Don't block auth; onboarding will recover.
        console.error('Profile upsert error:', profileError);
      }
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}