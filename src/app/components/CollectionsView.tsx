'use client';

import React, { useState, useEffect } from 'react';
import { supabase, Recipe } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Collection } from '../lib/collections';
import { RecipeCard } from './RecipeCard';
import { RecipeDetail } from './RecipeDetail';
import { Folder, FolderOpen, Plus, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface CollectionWithRecipes extends Collection {
  recipes: (Recipe & { author?: { username?: string; avatar_url?: string } })[];
}

export function CollectionsView() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<CollectionWithRecipes[]>([]);
  const [uncategorizedRecipes, setUncategorizedRecipes] = useState<Recipe[]>([]);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCollectionsAndRecipes = async () => {
    if (!user) return;

    try {
      // Load collections
      const { data: collectionsData } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      // Load saved recipes with their details
      const { data: savedRecipesData } = await supabase
        .from('saved_recipes')
        .select(`
          *,
          recipe:recipes(
            *,
            author:profiles!author_id(
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Organize recipes by collection
      const collectionsWithRecipes: CollectionWithRecipes[] = (collectionsData || []).map(collection => ({
        ...collection,
        recipes: (savedRecipesData || [])
          .filter(saved => saved.collection_id === collection.id)
          .map(saved => saved.recipe)
          .filter(Boolean)
      }));

      // Get uncategorized saved recipes
      const uncategorized = (savedRecipesData || [])
        .filter(saved => !saved.collection_id)
        .map(saved => saved.recipe)
        .filter(Boolean);

      setCollections(collectionsWithRecipes);
      setUncategorizedRecipes(uncategorized);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollectionsAndRecipes();
  }, [user]);

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const handleUnsaveRecipe = async (recipeId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);

      // Reload data
      loadCollectionsAndRecipes();
    } catch (error) {
      console.error('Error unsaving recipe:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-xl font-bold tracking-wide text-black uppercase">Loading Collections...</div>
      </div>
    );
  }

  const totalSavedRecipes = collections.reduce((sum, col) => sum + col.recipes.length, 0) + uncategorizedRecipes.length;

  if (totalSavedRecipes === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-8">📚</div>
        <h2 className="text-2xl font-bold tracking-tight text-black mb-4 uppercase font-mono">
          No Saved Recipes Yet
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Start saving recipes from the Explore page to build your collection.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Uncategorized Recipes */}
      {uncategorizedRecipes.length > 0 && (
        <div>
          <div 
            className="flex items-center gap-3 mb-4 cursor-pointer"
            onClick={() => toggleCollection('uncategorized')}
          >
            {expandedCollections.has('uncategorized') ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            <Folder className="w-6 h-6 text-gray-600" />
            <h3 className="text-xl font-bold tracking-tight text-black uppercase font-mono">
              Saved Recipes ({uncategorizedRecipes.length})
            </h3>
          </div>

          {expandedCollections.has('uncategorized') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ml-8">
              {uncategorizedRecipes.map((recipe) => (
                <div key={recipe.id} className="relative">
                  <RecipeCard
                    recipe={recipe}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnsaveRecipe(recipe.id);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collections */}
      {collections.map((collection) => (
        <div key={collection.id}>
          <div 
            className="flex items-center gap-3 mb-4 cursor-pointer"
            onClick={() => toggleCollection(collection.id)}
          >
            {expandedCollections.has(collection.id) ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            {expandedCollections.has(collection.id) ? (
              <FolderOpen className="w-6 h-6 text-yellow-600" />
            ) : (
              <Folder className="w-6 h-6 text-gray-600" />
            )}
            <h3 className="text-xl font-bold tracking-tight text-black uppercase font-mono">
              {collection.name} ({collection.recipes.length})
            </h3>
          </div>

          {expandedCollections.has(collection.id) && (
            <>
              {collection.description && (
                <p className="text-gray-600 mb-4 ml-8">{collection.description}</p>
              )}
              
              {collection.recipes.length === 0 ? (
                <div className="ml-8 text-gray-500 italic">No recipes in this collection yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ml-8">
                  {collection.recipes.map((recipe) => (
                    <div key={recipe.id} className="relative">
                      <RecipeCard
                        recipe={recipe}
                        onClick={() => setSelectedRecipe(recipe)}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnsaveRecipe(recipe.id);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Remove from saved"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={() => {}}
          onDelete={() => {}}
          readOnly
        />
      )}
    </div>
  );
}
