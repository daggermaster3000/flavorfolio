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

  const firstName = user.user_metadata?.username?.split(' ')[0] || user.email?.split('@')[0] || 'My Friend';

  return (
    <Layout>
      <main className="max-w-6xl mx-auto px-6">
        {/* Personalized Welcome Header */}
        <div className="mt-8 mb-12 text-center md:text-left">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black mb-2">
            Hi, {firstName}!
          </h2>
          <p className="text-gray-500 text-lg font-medium">
            Let's get cooking. 🍳
          </p>
        </div>

        {/* Call to Action and Navigation */}
        <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center mb-10">
          <div className="flex gap-4">
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
          {/* The rest of your code */}

          {/* Add a dynamic, secondary call-to-action */}
          {/* {view === 'my' && (
            <button className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-black border border-black rounded-lg hover:bg-gray-100 transition-colors">
              New Recipe
            </button>
          )}
          {view === 'explore' && (
            <button className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-black border border-black rounded-lg hover:bg-gray-100 transition-colors">
              Find Something New
            </button>
          )} */}
        </div>

        {/* Dynamic Content */}
        {view === 'my' ? <RecipesDashboard /> : <ExploreFeed />}
      </main>

      {/* Footer */}
      <footer className="mt-16 mb-6 text-center text-gray-400 text-sm">
        Eat well 🍕
      </footer>
    </Layout>
  );
}