'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ChefHat } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black">
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-8 md:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ChefHat className="w-7 h-7 md:w-8 md:h-8 text-black shrink-0" />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-black font-mono truncate">Flavorfolio</h1>
            </div>
            {user && (
              <div className="flex items-center gap-3 md:gap-6">
                <span className="hidden sm:block text-xs md:text-sm font-medium tracking-wide text-black uppercase font-mono max-w-[40vw] truncate">
                  {user.email}
                </span>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-medium text-black border border-black hover:bg-black hover:text-white transition-colors duration-200 font-mono"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="tracking-wide">SIGN OUT</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-8 md:py-12">
        {children}
      </main>
    </div>
  );
}