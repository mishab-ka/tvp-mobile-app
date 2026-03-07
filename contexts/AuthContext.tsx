import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { TvpDriver } from '../lib/types';

type AuthContextType = {
  session: Session | null;
  driver: TvpDriver | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshDriver: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DRIVER_KEY = 'tvp_driver';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [driver, setDriver] = useState<TvpDriver | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDriverByEmail = async (email: string) => {
    const { data, error } = await supabase
      .from('tvp_drivers')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (!error && data) {
      setDriver(data as TvpDriver);
    } else {
      setDriver(null);
    }
  };

  const refreshDriver = async () => {
    if (session?.user?.email) {
      await fetchDriverByEmail(session.user.email);
    } else {
      setDriver(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s ?? null);
      if (s?.user?.email) {
        await fetchDriverByEmail(s.user.email);
      } else {
        setDriver(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s ?? null);
      if (s?.user?.email) {
        await fetchDriverByEmail(s.user.email);
      } else {
        setDriver(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setDriver(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'tvp-mobile-app://reset-password',
    });
    return { error: error ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        driver,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshDriver,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
