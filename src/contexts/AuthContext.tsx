import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserRole = 'admin' | 'user';

interface UserProfile {
  id: number;
  email?: string;
  phone_no?: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, isPhone: boolean = false) => {
    try {
      let query = supabase
        .from('users')
        .select('id, email, phone_no, role, first_name, last_name');
      
      if (isPhone) {
        query = query.eq('phone_no', userId);
      } else {
        query = query.eq('email', userId);
      }
      
      const { data, error } = await query.single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const loadPhoneUser = async () => {
    try {
      const phoneUserData = await AsyncStorage.getItem('phone_user');
      if (phoneUserData) {
        const userData = JSON.parse(phoneUserData);
        setUserProfile(userData);
        // Create a mock session object for phone users
        // This allows the app to treat phone users as authenticated
        setSession({} as Session);
        setUser({} as User);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading phone user:', error);
      return false;
    }
  };

  const refreshUserProfile = async () => {
    if (user?.email) {
      const profile = await fetchUserProfile(user.email);
      setUserProfile(profile);
    } else if (userProfile?.phone_no) {
      // Refresh phone-based user from AsyncStorage
      await loadPhoneUser();
    } else {
      // Check for phone-based user
      await loadPhoneUser();
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        setSession(session);
        setUser(session.user);
        const profile = await fetchUserProfile(session.user.email);
        setUserProfile(profile);
        setLoading(false);
      } else {
        // Check for phone-based user
        const hasPhoneUser = await loadPhoneUser();
        setLoading(false);
        if (!hasPhoneUser) {
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        setSession(session);
        setUser(session.user);
        const profile = await fetchUserProfile(session.user.email);
        setUserProfile(profile);
      } else {
        // Check for phone-based user
        const hasPhoneUser = await loadPhoneUser();
        if (!hasPhoneUser) {
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear phone user data
    await AsyncStorage.removeItem('phone_user');
    setSession(null);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userProfile,
        loading,
        signOut,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

