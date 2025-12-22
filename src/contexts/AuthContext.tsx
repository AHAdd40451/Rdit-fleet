import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  userId?: string; // UUID of the user/admin who created this user
  avatar_url?: string; // URL of the profile image
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
  const isSigningOutRef = useRef(false);

  const fetchUserProfile = async (userId: string, isPhone: boolean = false) => {
    try {
      let query = supabase
        .from('users')
        .select('id, email, phone_no, role, first_name, last_name, userId, avatar_url');
      
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
        // Always fetch fresh data from database to get latest profile including avatar_url
        let query = supabase
          .from('users')
          .select('id, email, phone_no, role, first_name, last_name, userId, avatar_url');
        
        if (userData.id) {
          query = query.eq('id', userData.id);
        } else if (userData.phone_no) {
          query = query.eq('phone_no', userData.phone_no);
        } else if (userData.email) {
          query = query.eq('email', userData.email);
        } else {
          // If no identifier, use stored data as fallback
          setUserProfile(userData);
          setSession({} as Session);
          setUser({} as User);
          return true;
        }
        
        const { data: freshProfile, error } = await query.single();
        
        if (error) {
          console.error('Error fetching fresh profile:', error);
          // Fallback to AsyncStorage data if fetch fails
          setUserProfile(userData);
          setSession({} as Session);
          setUser({} as User);
          return true;
        }
        
        if (freshProfile) {
          // Update AsyncStorage with fresh data including avatar_url
          await AsyncStorage.setItem('phone_user', JSON.stringify(freshProfile));
          setUserProfile(freshProfile as UserProfile);
          // Create a mock session object for phone users
          setSession({} as Session);
          setUser({} as User);
          return true;
        }
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
      // Refresh phone-based user from database (loadPhoneUser now fetches fresh data)
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
      // Don't reload phone users if we're in the process of signing out
      if (isSigningOutRef.current) {
        return;
      }
      
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
    try {
      // Set signing out flag to prevent reloading phone users
      isSigningOutRef.current = true;
      // Clear phone user data first
      await AsyncStorage.removeItem('phone_user');
      // Clear all state immediately
      setSession(null);
      setUser(null);
      setUserProfile(null);
      // Sign out from Supabase (this will trigger onAuthStateChange, but we've set the flag)
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, clear local state
      setSession(null);
      setUser(null);
      setUserProfile(null);
    } finally {
      // Reset the flag after a short delay to allow state to settle
      setTimeout(() => {
        isSigningOutRef.current = false;
      }, 100);
    }
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

