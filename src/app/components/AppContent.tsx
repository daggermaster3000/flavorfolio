'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthForm } from './AuthForm';
import { Layout } from './Layout';
import { RecipesDashboard } from './RecipesDashboard';
import { ExploreFeed } from './ExploreFeed';

export default function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'my' | 'explore'>('my');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-2xl font-extrabold tracking-tight text-gray-900 uppercase">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Flavorfolio</h1>
        <p className="text-gray-600 text-lg mb-10 text-center max-w-md">
          Curate, explore, and organize your favorite recipes in a clean, minimal, and stylish way.
        </p>
        <AuthForm />
      </div>
    );
  }

  return (
    <Layout>
      {/* Header with Swiss-style buttons */}
      <div className="flex justify-center gap-4 mb-10 mt-6">
        {['my', 'explore'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v as 'my' | 'explore')}
            className={`px-5 py-3 text-sm font-semibold tracking-wide uppercase border transition-colors duration-200
              ${view === v
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-black hover:bg-black hover:text-white'}`}
          >
            {v === 'my' ? 'My Recipes' : 'Explore'}
          </button>
        ))}
      </div>

      {/* Dashboard / Feed */}
      <main className="max-w-6xl mx-auto px-6">
        {view === 'my' ? <RecipesDashboard /> : <ExploreFeed />}
      </main>

      {/* Footer */}
      <footer className="mt-16 mb-6 text-center text-gray-400 text-sm">
        Eat well 🍕
      </footer>
    </Layout>
  );
}
