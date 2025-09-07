'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // ✅ adjust the path to your client
import { User, Camera, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user, updateProfilePicture } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ✅ Load username, bio, and avatar from profiles table
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error(error);
        setError('Failed to load profile.');
      } else if (data) {
        setUsername(data.username || '');
        setBio(data.bio || '');
        setAvatarPreview(data.avatar_url || null);
      }
    };

    fetchProfile();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;

  setLoading(true);
  setMessage('');
  setError('');

  try {
    let updated = false;

    if (username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }

    // ✅ Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: username.trim(),
        bio: bio.trim(),
      })
      .eq('id', user.id);
    if (profileError) throw profileError;
    updated = true;

    // ✅ Update Supabase Auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { username: username.trim() },
    });
    if (authError) throw authError;
    updated = true;

    // ✅ Update avatar
    if (avatarFile) {
      const { error: avatarError } = await updateProfilePicture(avatarFile);
      if (avatarError) throw avatarError;
      updated = true;
    }

    setMessage(updated ? 'Profile updated successfully!' : 'No changes to save.');
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
    setError(`Update failed: ${errorMessage}`);
  } finally {
    setLoading(false);
    setAvatarFile(null);
  }
};


  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center font-mono text-black">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans">
      <div className="flex items-center space-x-4 mb-16">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <h1 className="text-4xl font-mono font-extrabold tracking-tight text-black">
          Settings
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-x-12 gap-y-12">
          {/* Avatar */}
          <label
            htmlFor="avatar-upload"
            className="text-xl font-bold tracking-tight text-black font-mono self-center"
          >
            Profile Picture
          </label>
          <div className="flex items-center gap-6 md:gap-8">
            <div className="relative group">
              <label htmlFor="avatar-upload" className="cursor-pointer block">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="User Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-black transition-all group-hover:scale-105"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center transition-all group-hover:scale-105">
                    <User className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:bg-opacity-50">
                  <Camera className="w-8 h-8 text-red opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </label>
              <input
                id="avatar-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                disabled={loading}
              />
            </div>
          </div>

          {/* Username */}
          <label
            htmlFor="username"
            className="text-xl font-bold tracking-tight text-black font-mono self-center"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 border-b-2 border-black focus:outline-none focus:ring-0 focus:border-red-500 text-black placeholder-gray-400 transition-colors bg-transparent font-mono"
            placeholder="Enter your username"
          />

          {/* Bio */}
          <label
            htmlFor="bio"
            className="text-xl font-bold tracking-tight text-black font-mono self-start pt-2"
          >
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={loading}
            rows={4}
            className="w-full px-4 py-3 border-b-2 border-black focus:outline-none focus:ring-0 focus:border-red-500 text-black placeholder-gray-400 transition-colors bg-transparent font-mono resize-none"
            placeholder="Tell us a little about yourself..."
          />
        </div>

        {/* Submit */}
        <div className="pt-8 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-12 py-4 bg-black text-white font-bold tracking-widest uppercase hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200 font-mono flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
          </button>
          {message && <p className="mt-4 text-green-700 font-mono text-center">{message}</p>}
          {error && <p className="mt-4 text-red-700 font-mono text-center">{error}</p>}
        </div>
      </form>
    </div>
  );
}
