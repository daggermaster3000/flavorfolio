'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ChefHat, Settings, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.user_metadata?.username || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;

  // Effect to close the menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black">
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-8 md:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ChefHat className="w-7 h-7 md:w-8 md:h-8 text-black shrink-0" />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-black font-mono truncate">
                Flavorfolio
              </h1>
            </div>
            
            {user && (
              <div className="relative" ref={menuRef}>
                {/* User menu trigger */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 md:gap-3 p-1 border border-transparent hover:border-gray-300 rounded-full transition-colors"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="text-xs md:text-sm font-medium tracking-wide text-black uppercase font-mono max-w-[40vw] truncate">
                    {displayName}
                  </span>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-black object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-black bg-gray-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-black shadow-lg z-10 font-mono">
                    <div className="border-b border-black p-3">
                      <p className="text-sm font-bold tracking-wide uppercase truncate">{displayName}</p>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                    <ul>
                      <li>
                        {/* NOTE: For a Next.js or React Router app, you should replace 
                          this `<a>` tag with a `<Link>` component for client-side routing.
                          e.g., <Link href="/settings">...</Link>
                        */}
                        <a
                          href="/settings"
                          className="flex items-center gap-3 px-3 py-3 text-sm tracking-wide text-black hover:bg-black hover:text-white transition-colors duration-200"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Account Settings</span>
                        </a>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            signOut();
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 text-sm tracking-wide text-black hover:bg-black hover:text-white transition-colors duration-200"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
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