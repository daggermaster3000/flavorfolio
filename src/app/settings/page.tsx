'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Camera, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, updateUsername, updateProfilePicture } = useAuth();
  const router = useRouter();

  // State for form fields, initialized with user data
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // State for UI feedback
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Populate form with user data when component loads
  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata?.username || '');
      setAvatarPreview(user.user_metadata?.avatar_url || null);
    }
  }, [user]);

  // Handle new avatar file selection
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
      const usernameChanged = username.trim() !== (user.user_metadata?.username || '');
      if (usernameChanged) {
        if (username.trim().length < 3) {
            throw new Error('Username must be at least 3 characters long.');
        }
        const { error: usernameError } = await updateUsername(username.trim());
        if (usernameError) throw usernameError;
      }

      if (avatarFile) {
        const { error: avatarError } = await updateProfilePicture(avatarFile);
        if (avatarError) throw avatarError;
      }

      if (usernameChanged || avatarFile) {
          setMessage('Profile updated successfully!');
      } else {
          setMessage('No changes to save.');
      }

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

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-x-12 gap-y-16">
        {/* Left Column - Labels */}
        <div className="hidden md:flex flex-col font-mono text-black space-y-24 mt-12">
            <h2 className="text-xl font-bold tracking-tight">Profile Picture</h2>
            <h2 className="text-xl font-bold tracking-tight">Username</h2>
        </div>

        {/* Right Column - Form */}
        <form onSubmit={handleSubmit} className="space-y-12 md:space-y-24">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 md:gap-8 *aspect-square** **overflow-hidden**">
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
                <div className="absolute inset-0  group-hover:bg-opacity-50 flex items-center justify-center transition-opacity">
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
            {/* <div>
              <p className="text-sm text-gray-600 mt-1 ">Click the image to upload a new one. (PNG, JPG, WEBP)</p>
            </div> */}
          </div>

          {/* Username Section */}
          <div>
            <label htmlFor="username" className="block text-xl font-bold tracking-tight text-black mb-4 md:hidden">
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
          </div>

          {/* Submit Button & Messages */}
          <div className="mt-16 pt-8 border-t border-gray-200">
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
    </div>
  );
}