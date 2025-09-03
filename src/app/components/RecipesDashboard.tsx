'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase, Recipe } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RecipeCard } from './RecipeCard';
import { RecipeForm } from './RecipeForm';
import { RecipeDetail } from './RecipeDetail';
import { Plus, Search } from 'lucide-react';


export function RecipesDashboard() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const loadRecipes = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRecipes(data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error loading recipes:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleDelete = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;
    
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);
      
      if (error) throw error;
      
      setRecipes(recipes.filter(r => r.id !== recipeId));
      setSelectedRecipe(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Error deleting recipe: ' + err.message);
      }
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-xl font-bold tracking-wide text-black uppercase">Loading Recipes...</div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          <h1 className="text-4xl font-bold tracking-tight text-black uppercase font-mono">
            Your Recipes
          </h1>
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-3 px-4 py-2 md:px-6 md:py-3 bg-black text-white font-bold tracking-wide hover:bg-gray-900 transition-colors uppercase font-mono"
          >
            <Plus className="w-5 h-5" />
            <span>Add Recipe</span>
          </button>
        </div>
        
        {/* Search */}
        <div className="mt-4 md:mt-8 relative max-w-md">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search recipes..."
            className="w-full pl-12 pr-4 py-3 border border-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-8">📚</div>
          <h2 className="text-2xl font-bold tracking-tight text-black mb-4 uppercase font-mono">
            {recipes.length === 0 ? 'No Recipes Yet' : 'No Matching Recipes'}
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {recipes.length === 0 
              ? 'Start building your recipe collection by adding your first recipe.'
              : 'Try adjusting your search terms to find recipes.'
            }
          </p>
          {recipes.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-3 bg-black text-white font-bold tracking-wide hover:bg-gray-900 transition-colors uppercase font-mono"
            >
              Add Your First Recipe
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => setSelectedRecipe(recipe)}
            />
          ))}
        </div>
      )}

      {/* Recipe Form Modal */}
      {showForm && (
        <RecipeForm
          onClose={() => {
            setShowForm(false);
            setEditingRecipe(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingRecipe(null);
            loadRecipes();
          }}
          initialRecipe={editingRecipe ? {
            id: editingRecipe.id,
            title: editingRecipe.title,
            description: editingRecipe.description,
            prep_time: editingRecipe.prep_time,
            cook_time: editingRecipe.cook_time,
            servings: editingRecipe.servings,
            image_url: editingRecipe.image_url,
            ingredients: editingRecipe.ingredients,
            steps: editingRecipe.steps,
            step_items: editingRecipe.step_items || null,
          } : null}
        />
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={() => {
            setEditingRecipe(selectedRecipe);
            setSelectedRecipe(null);
            setShowForm(true);
          }}
          onDelete={() => handleDelete(selectedRecipe.id)}
        />
      )}
    </>
  );
}