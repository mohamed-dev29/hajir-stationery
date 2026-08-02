import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppUser, UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  sales: 'Sales',
};

const ROLE_DEFAULTS: Record<UserRole, string> = {
  admin: 'Admin User',
  manager: 'Manager User',
  sales: 'Sales User',
};

const ROLE_ROUTE_ALLOWLIST: Record<UserRole, string[]> = {
  admin: ['/', '/pos', '/products', '/customers', '/expenses', '/suppliers', '/reports', '/money', '/settings'],
  manager: ['/', '/pos', '/products', '/customers', '/expenses', '/suppliers', '/reports', '/money'],
  sales: ['/', '/pos', '/customers', '/reports'],
};

const LOCAL_DATA_KEYS = [
  'haajir_products', 'haajir_categories', 'haajir_sales', 'haajir_customers',
  'haajir_expenses', 'haajir_suppliers', 'haajir_feedback',
  'haajir_money_accounts', 'haajir_money_transactions', 'haajir_user_profile',
];

function clearLocalDataCache() {
  try {
    LOCAL_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage may be unavailable or blocked by the browser.
  }
}

function getRole(value: unknown): UserRole {
  return typeof value === 'string' && value in ROLE_LABELS ? value as UserRole : 'sales';
}

function toAppUser(authUser: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }): AppUser {
  // user_metadata is user-editable, so roles must only come from server-managed app_metadata.
  const role = getRole(authUser.app_metadata?.role);
  return {
    id: authUser.id,
    name: typeof authUser.user_metadata?.full_name === 'string'
      ? authUser.user_metadata.full_name
      : authUser.email || ROLE_DEFAULTS[role],
    email: authUser.email || '',
    role,
  };
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  canAccess: (path: string) => boolean;
  getDefaultRoute: () => string;
  roleLabel: (role: UserRole) => string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ? toAppUser(session.user) : null);
        if (!session?.user) clearLocalDataCache();
      } catch {
        setUser(null);
        clearLocalDataCache();
      } finally {
        setLoading(false);
      }
    };

    void init();
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAppUser(session.user) : null);
      if (!session?.user) clearLocalDataCache();
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw error || new Error('Unable to sign in');
      setUser(toAppUser(data.user));
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    if (!supabase) throw new Error('Supabase is not configured');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || '' } },
      });
      if (error || !data.user) throw error || new Error('Unable to sign up');
      if (data.session?.user) {
        setUser(toAppUser(data.session.user));
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } finally {
      clearLocalDataCache();
      setUser(null);
    }
  };

  const canAccess = (path: string) => user ? ROLE_ROUTE_ALLOWLIST[user.role].includes(path) : false;

  const getDefaultRoute = () => user?.role === 'sales' ? '/pos' : '/';

  const roleLabel = (role: UserRole) => ROLE_LABELS[role];

  const value: AuthContextValue = { user, loading, signIn, signUp, logout, canAccess, getDefaultRoute, roleLabel };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// This hook is intentionally exported alongside its provider for the shared context API.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
