'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    username?: string,
    avatarFile?: File
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfilePicture: (avatarFile: File) => Promise<{ error: Error | null }>;
  updateUsername: (username: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to upload avatar and get URL
  const uploadAvatar = async (userId: string, avatarFile: File) => {
    const filePath = `${userId}/${Date.now()}_${avatarFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars') // Your bucket name
      .upload(filePath, avatarFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const signUp = async (
    email: string,
    password: string,
    username?: string,
    avatarFile?: File
  ) => {
    // First, sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: username ? { username } : undefined,
      },
    });

    if (signUpError) {
      return { error: signUpError };
    }
    if (!signUpData.user) {
      return { error: new Error("Sign up successful, but user data wasn't returned.") };
    }

    // If an avatar file is provided, upload it
    if (avatarFile) {
      try {
        const avatarUrl = await uploadAvatar(signUpData.user.id, avatarFile);

        // Update the user's metadata with the avatar URL
        const { error: updateError } = await supabase.auth.updateUser({
          data: { ...signUpData.user.user_metadata, avatar_url: avatarUrl },
        });

        if (updateError) return { error: updateError };

      } catch (uploadError) {
        return { error: uploadError as Error };
      }
    }
    
    // We manually set the user here after sign-up + potential update to refresh the state
    setUser(signUpData.user);
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfilePicture = async (avatarFile: File) => {
    if (!user) {
      return { error: new Error('User not authenticated.') };
    }

    try {
      const avatarUrl = await uploadAvatar(user.id, avatarFile);

      const { data: updatedUserData, error: updateError } = await supabase.auth.updateUser({
        data: { ...user.user_metadata, avatar_url: avatarUrl },
      });

      if (updateError) return { error: updateError };
      
      // Manually update the local user state to reflect the change immediately
      if (updatedUserData.user) {
          setUser(updatedUserData.user);
      }

      return { error: null };
    } catch (uploadError) {
      return { error: uploadError as Error };
    }
  };

 const updateUsername = async (username: string) => {
    if (!user) {
      return { error: new Error('User not authenticated.') };
    }

    const { data: updatedUserData, error } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, username: username },
    });

    if (error) return { error };

    // Manually update the local user state to reflect the change immediately
    if (updatedUserData.user) {
        setUser(updatedUserData.user);
    }

    return { error: null };
};

// Also, add it to the context 'value' object:
const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfilePicture,
    updateUsername, // Add this line
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