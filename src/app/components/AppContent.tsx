'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthForm } from './AuthForm';
import { Layout } from './Layout';
import { RecipesDashboard } from './RecipesDashboard';
import { ExploreFeed } from './ExploreFeed';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './LandingPage';
import CircleDashboard from './CircleDashboard';

export default function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'my' | 'explore' | 'circles'>('my');

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
    return <LandingPage />;
  }

  const firstName = user.user_metadata?.username?.split(' ')[0] || user.email?.split('@')[0] || 'My Friend';

  return (
    <Layout>
      <main className="max-w-6xl mx-auto px-6">
        {/* Personalized Welcome Header with Animations */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 mb-12 text-center md:text-left"
        >
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black mb-2">
            Hi, {firstName}!
          </h2>
          <p className="text-gray-500 text-lg font-medium">
            Let&apos;s get cooking. 🍳
          </p>
        

        {/* Call to Action and Navigation */}
        <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center mt-10 mb-10">
          <div className="flex gap-4">
            {['my', 'explore', 'circles'].map((v) => (
              <motion.button
                key={v}
                onClick={() => setView(v as 'my' | 'explore' | 'circles')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-5 py-3 text-sm font-semibold tracking-wide uppercase border transition-colors duration-200
                  ${view === v
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black hover:bg-black hover:text-white'}`}
              >
                {v === 'my' ? 'My Recipes' : v === 'explore' ? 'Explore' : 'Food Circles'}
              </motion.button>
            ))}
          </div>
        </div>
</motion.div>
        {/* Dynamic Content with a Smooth Crossfade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view} // The key is crucial for AnimatePresence
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5}}
          >
            {view === 'my' ? <RecipesDashboard /> : view === 'explore' ? <ExploreFeed /> : <CircleDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-16 mb-6 text-center text-gray-400 text-sm">
        Eat well 🍕
      </footer>
    </Layout>
  );
}