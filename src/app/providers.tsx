// src/app/providers.tsx
'use client';

import { AuthProvider } from './contexts/AuthContext';
// Add any other client-side providers here

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* Other providers can go here, like theme providers, etc. */}
      {children}
    </AuthProvider>
  );
}