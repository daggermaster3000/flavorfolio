'use client';

import { Recipe } from '../lib/supabase';

interface RecipeThumbnailProps {
  recipe: Recipe;
  onClick: () => void;
}

export function RecipeThumbnail({ recipe, onClick }: RecipeThumbnailProps) {
  return (
    <div
      onClick={onClick}
      className="w-full h-full cursor-pointer overflow-hidden relative"
    >
      {recipe.image_url ? (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
          No Image
        </div>
      )}
    </div>
  );
}
