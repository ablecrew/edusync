import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { supabase, isSupabaseConfigured, getLocalDB } from '../../lib/supabase/client';

interface AuthContextType {
  user: User | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  forgotPassword: (email: string) => Promise<boolean>;
}

const DEFAULT_AUTH_CONTEXT: AuthContextType = {
  user: null,
  currentRole: 'Teacher',
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  switchRole: () => {},
  forgotPassword: async () => true,
};

const AuthContext = createContext<AuthContextType>(DEFAULT_AUTH_CONTEXT);

const AUTH_STORAGE_KEY = 'edusync_active_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const currentRole = user?.role || 'Teacher';

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  // Fetch real user profile from Supabase PostgreSQL database table
  const fetchProfileFromDB = async (email: string): Promise<User | null> => {
    if (isSupabaseConfigured) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (!error && profile) {
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: (profile.role as UserRole) || 'Teacher',
          department: profile.department || 'Academic Faculty',
          avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          created_at: profile.created_at || new Date().toISOString(),
        };
      }
    }

    // Check local storage database table if live Supabase is offline
    const localProfiles = getLocalDB<User>('profiles', []);
    const match = localProfiles.find((p) => p.email.toLowerCase() === email.toLowerCase().trim());
    if (match) return match;

    return null;
  };

  // Synchronize with Supabase Auth state changes & pull profile from DB
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        const sessionEmail = session.user.email;
        const dbUser = await fetchProfileFromDB(sessionEmail);
        if (dbUser) {
          setUser(dbUser);
        } else {
          // If profile doesn't exist in DB yet, create it
          const isSuper = sessionEmail.toLowerCase() === 'dandemarasighan@gmail.com';
          const newProfile = {
            id: session.user.id,
            email: sessionEmail,
            full_name: isSuper ? 'Dande Marasighan' : sessionEmail.split('@')[0],
            role: isSuper ? 'Super Admin' : 'Teacher',
            department: isSuper ? 'Executive Board & Administration' : 'Academic Faculty',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            created_at: new Date().toISOString(),
          };
          await supabase.from('profiles').upsert([newProfile] as any);
          setUser(newProfile as User);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password = '', role: UserRole = 'Teacher') => {
    const cleanEmail = email.toLowerCase().trim();
    const isSuper = cleanEmail === 'dandemarasighan@gmail.com';

    if (isSupabaseConfigured && password) {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        // If login failed because user doesn't exist yet in Auth, attempt automatic signup/provisioning
        if (signInError.message.includes('Invalid login') || signInError.message.includes('User not found')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: isSuper ? 'Dande Marasighan' : cleanEmail.split('@')[0],
                role: isSuper ? 'Super Admin' : role,
              },
            },
          });

          if (signUpError) {
            throw new Error(signUpError.message);
          }

          if (signUpData.user) {
            const createdProfile = {
              id: signUpData.user.id,
              email: cleanEmail,
              full_name: isSuper ? 'Dande Marasighan' : cleanEmail.split('@')[0],
              role: isSuper ? 'Super Admin' : role,
              department: isSuper ? 'Executive Board & Administration' : 'Academic Faculty',
              avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            };
            await supabase.from('profiles').upsert([createdProfile] as any);
            setUser({ ...createdProfile, created_at: new Date().toISOString() } as User);
            return;
          }
        } else {
          throw new Error(signInError.message);
        }
      } else if (authData.user) {
        const dbProfile = await fetchProfileFromDB(cleanEmail);
        if (dbProfile) {
          setUser(dbProfile);
          return;
        }
      }
    }

    // If Supabase not connected or password bypassed in local test mode
    const fetched = await fetchProfileFromDB(cleanEmail);
    if (fetched) {
      setUser(fetched);
      return;
    }

    // Provision local fallback record
    const created: User = {
      id: isSuper ? 'usr_super_admin_dande' : `usr_${Date.now()}`,
      email: cleanEmail,
      full_name: isSuper ? 'Dande Marasighan' : cleanEmail.split('@')[0],
      role: isSuper ? 'Super Admin' : role,
      department: isSuper ? 'Executive Board & Administration' : 'Academic Faculty',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    };
    setUser(created);
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    setUser({
      ...user,
      role: newRole,
      full_name: user.email.toLowerCase() === 'dandemarasighan@gmail.com' && newRole === 'Super Admin'
        ? 'Dande Marasighan'
        : `${user.full_name.split(' (')[0]} (${newRole})`,
    });
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      return true;
    }
    return new Promise((resolve) => setTimeout(() => resolve(Boolean(email)), 800));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        isAuthenticated: Boolean(user),
        login,
        logout,
        switchRole,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || DEFAULT_AUTH_CONTEXT;
};
