'use client';

import React from 'react';
import { User } from 'lucide-react';
import Link from 'next/link';

interface ProfilePhotoProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  userId?: string | null;
  showHoverEffect?: boolean;
  clickable?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-24 h-24',
  xl: 'w-28 h-28'
};

const iconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-6 h-6',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
};

export function ProfilePhoto({ 
  src, 
  alt = 'Profile photo', 
  size = 'md', 
  className = '', 
  userId,
  showHoverEffect = false,
  clickable = true
}: ProfilePhotoProps) {
  const baseClasses = `${sizeClasses[size]} rounded-full overflow-hidden border border-black flex-shrink-0`;
  const hoverClasses = showHoverEffect ? 'hover:scale-105 transition-transform duration-300' : '';
  const combinedClasses = `${baseClasses} ${hoverClasses} ${className}`;

  // Generate a colorful avatar based on the alt text or userId
  const generateAvatar = () => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const text = alt || userId || 'U';
    const colorIndex = text.charCodeAt(0) % colors.length;
    const initial = text.charAt(0).toUpperCase();
    
    return (
      <div className={`w-full h-full flex items-center justify-center text-white font-bold ${colors[colorIndex]}`}>
        {initial}
      </div>
    );
  };

  const content = (
    <div className={combinedClasses}>
      {src && src !== 'null' ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => {
            // On error, React will re-render with src as null/undefined
            console.log('Avatar image failed to load:', src);
          }}
        />
      ) : (
        generateAvatar()
      )}
    </div>
  );

  if (clickable && userId) {
    return (
      <Link href={`/profile/${userId}`}>
        {content}
      </Link>
    );
  }

  return content;
}
