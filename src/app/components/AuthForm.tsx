'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, UserCircle2 } from 'lucide-react';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Assuming useAuth now returns the modified signUp function
  const { signIn, signUp } = useAuth();

  // Clean up the object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAvatarFile(file);
      // Create a preview URL
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const clearFormState = () => {
    setError('');
    setUsername('');
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password, username, avatarFile ?? undefined);
        
      if (error) throw error;
      // Note: On successful sign-up, you might want to show a "Check your email" message.
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 md:px-8 py-12">
      <div className="w-full max-w-md">
        <div className="border border-black p-6 md:p-12">
          <h1 className="text-3xl font-bold tracking-tight text-black mb-12 text-center font-mono">
            {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}<sup className="text-lg">⁰¹</sup>
          </h1>
          
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-500">
              <p className="text-sm font-medium text-red-900 tracking-wide font-mono">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {!isLogin && (
              <>
                <div className="flex flex-col items-center space-y-4">
                  <label htmlFor="avatar-upload" className="cursor-pointer group">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover border-2 border-black group-hover:opacity-80 transition-opacity" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-400 flex flex-col items-center justify-center group-hover:bg-gray-200 group-hover:border-black transition-colors">
                        <UserCircle2 className="w-8 h-8 text-gray-500 mb-1" />
                        <span className="text-xs font-mono text-gray-600">ADD AVATAR</span>
                      </div>
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold tracking-wide text-black uppercase mb-2 font-mono">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                    className="w-full px-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black placeholder-gray-500 bg-white"
                    placeholder="Choose a username"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-bold tracking-wide text-black uppercase mb-2 font-mono">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black placeholder-gray-500 bg-white"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold tracking-wide text-black uppercase mb-2 font-mono">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black placeholder-gray-500 bg-white pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-600 hover:text-black transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 md:py-4 bg-black text-white font-bold tracking-wide uppercase hover:bg-gray-900 disabled:opacity-50 transition-colors duration-200 font-mono"
            >
              {loading ? 'PROCESSING...' : (isLogin ? 'SIGN IN' : 'SIGN UP')}
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-gray-300 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                clearFormState();
              }}
              className="text-sm font-medium tracking-wide text-black hover:text-red-500 transition-colors uppercase font-mono"
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}