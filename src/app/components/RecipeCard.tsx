'use client';
import React, { useRef } from 'react';
import { Recipe } from '../lib/supabase';
import { X, Clock, User, Users, Edit3, Trash2, Download } from 'lucide-react';
import { metadata } from '../layout';
import Link from "next/link";

interface RecipeCardProps {
  
  onClick: () => void;
  recipe: Recipe & { author?: AuthorDetails };
  
  readOnly?: boolean;
}
interface AuthorDetails {
  username?: string | null;
  avatar_url?: string | null;
}




export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const totalTime = recipe.prep_time + recipe.cook_time;
    
  const printRef = useRef<HTMLDivElement>(null);

  const authorName = recipe.author?.username || recipe.author_name || 'Unknown';
  const authorAvatarUrl = recipe.author?.avatar_url || null;
  return (
    <div 
      onClick={onClick}
      className="border border-black cursor-pointer hover:bg-gray-50 transition-colors duration-200 group"
    >
      {recipe.image_url && (
        <div className="aspect-[4/3] sm:aspect-square overflow-hidden">
          <img 
            src={recipe.image_url} 
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
  {/* The title and author information */}
  <div className="flex justify-between items-start mb-1">
    <div>
      <h3 className="text-xl font-bold tracking-tight text-black uppercase font-mono">
        {recipe.title}
      </h3>
      {(recipe.author_name || recipe.author_id) && (
        <div className="text-[11px] uppercase tracking-widest text-black/70 font-mono">
          by {authorName || 'Unknown'}
        </div>
      )}
    </div>
    
    {/* The profile picture on the right side */}
    <div className="flex-shrink-0 w-10 h-10  hover:scale-150 transition-transform duration-300 rounded-full overflow-hidden border-1 border-black">
  <Link href={`/profile/${recipe.author_id}`}>
    {authorAvatarUrl ? (
      <img
        src={authorAvatarUrl}
        alt={`${authorName}'s avatar`}
        className="w-full h-full object-cover "
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gray-200">
        <User className="w-6 h-6 text-gray-500" />
      </div>
    )}
  </Link>
</div>
  </div>

  {Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
    <div className="mb-3 flex flex-wrap gap-2">
      {recipe.tags.slice(0, 4).map((t, i) => (
        <span key={i} className="inline-block px-2 py-0.5 text-[10px] border border-black uppercase font-mono tracking-widest">
          {t}
        </span>
      ))}
    </div>
  )}

  {recipe.description && (
    <div
      className="text-sm text-gray-700 mb-4 leading-relaxed prose prose-sm max-w-none [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1"
      dangerouslySetInnerHTML={{ __html: recipe.description }}
    />
  )}

  <div className="flex items-center justify-between text-xs font-medium tracking-wide text-black uppercase font-mono">
    {totalTime > 0 && (
      <div className="flex items-center space-x-1">
        <Clock className="w-4 h-4" />
        <span>{totalTime} min</span>
      </div>
    )}

    <div className="flex items-center space-x-1">
      <Users className="w-4 h-4" />
      <span>{recipe.servings}</span>
    </div>
  </div>
</div>
    </div>
  );
}