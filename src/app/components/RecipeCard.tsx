'use client';

import React from 'react';
import { Recipe } from '../lib/supabase';
import { Clock, Users } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const totalTime = recipe.prep_time + recipe.cook_time;

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
        <h3 className="text-xl font-bold tracking-tight text-black mb-1 uppercase font-mono">
          {recipe.title}
        </h3>
        {(recipe.author_name || recipe.author_id) && (
          <div className="mb-3 text-[11px] uppercase tracking-widest text-black/70 font-mono">
            by {recipe.author_name || 'Unknown'}
          </div>
        )}
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