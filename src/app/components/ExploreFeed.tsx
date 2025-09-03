'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase, Recipe } from '../lib/supabase';
import { RecipeCard } from './RecipeCard';
import { RecipeDetail } from './RecipeDetail';
import { Search } from 'lucide-react';

export function ExploreFeed() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Corrected loadAllRecipes function
const loadAllRecipes = async () => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(
        `
        *,
        author:profiles!author_id(
          username,
          avatar_url
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    setRecipes(data || []);
  } catch (err) {
    console.error('An unexpected error occurred:', err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadAllRecipes();
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach(r => (Array.isArray(r.tags) ? r.tags.forEach(t => set.add(t)) : null));
    return Array.from(set).sort();
  }, [recipes]);

  const filtered = recipes.filter((r) => {
    const matchesText = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = activeTags.length === 0 || activeTags.every(t => Array.isArray(r.tags) && r.tags.includes(t));
    return matchesText && matchesTags;
  });

  const [selected, setSelected] = useState<Recipe | null>(null);

  return (
    <>
      <div className="mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          <h1 className="text-4xl font-bold tracking-tight text-black uppercase font-mono">Explore</h1>
        </div>

        {/* Search */}
        <div className="mt-4 md:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search all recipes..."
              className="w-full pl-12 pr-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2">
              {allTags.map((t) => {
                const active = activeTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTags(active ? activeTags.filter(x => x !== t) : [...activeTags, t])}
                    className={`px-2 py-1 text-[10px] md:text-xs border uppercase font-mono ${active ? 'bg-black text-white border-black' : 'border-black text-black hover:bg-black hover:text-white transition-colors'}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-xl font-bold tracking-wide text-black uppercase">Loading...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <h2 className="text-2xl font-bold tracking-tight text-black mb-4 uppercase font-mono">No Results</h2>
          <p className="text-gray-600">Try adjusting your search or tag filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelected(recipe)} />
          ))}
        </div>
      )}

      {selected && (
        <RecipeDetail
          recipe={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {}}
          onDelete={() => {}}
          readOnly
        />
      )}
    </>
  );
}

