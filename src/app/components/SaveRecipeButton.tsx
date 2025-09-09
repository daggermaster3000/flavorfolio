'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Bookmark, BookmarkCheck, Plus, X } from 'lucide-react';
import { Collection } from '../lib/collections';

interface SaveRecipeButtonProps {
  recipeId: string;
  className?: string;
}

export function SaveRecipeButton({ recipeId, className = '' }: SaveRecipeButtonProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if recipe is already saved
  useEffect(() => {
    if (!user) return;

    const checkSavedStatus = async () => {
      try {
        const { data } = await supabase
          .from('saved_recipes')
          .select('id')
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId)
          .single();
        
        setIsSaved(!!data);
      } catch (error) {
        console.log('Collections feature not available - tables not created');
        setIsSaved(false);
      }
    };

    checkSavedStatus();
  }, [user, recipeId]);

  // Load user's collections
  const loadCollections = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      setCollections(data || []);
    } catch (error) {
      console.log('Collections feature not available - tables not created');
      setCollections([]);
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) return;

    if (isSaved) {
      // Unsave recipe
      try {
        await supabase
          .from('saved_recipes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);
        
        setIsSaved(false);
      } catch (error) {
        console.log('Collections feature not available - tables not created');
      }
    } else {
      // Show collection modal
      await loadCollections();
      setShowCollectionModal(true);
    }
  };

  const handleSaveToCollection = async (collectionId?: string | null) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('saved_recipes')
        .insert({
          user_id: user.id,
          recipe_id: recipeId,
          collection_id: collectionId || null
        });

      if (error) throw error;

      setIsSaved(true);
      setShowCollectionModal(false);
    } catch (error) {
      console.log('Collections feature not available - tables not created');
      setShowCollectionModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!user || !newCollectionName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          name: newCollectionName.trim(),
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Save recipe to new collection
      await handleSaveToCollection(data.id);
      setNewCollectionName('');
    } catch (error) {
      console.log('Collections feature not available - tables not created');
      setShowCollectionModal(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={handleSaveClick}
        className={`p-2 rounded-full transition-colors relative z-[1] ${
          isSaved 
            ? 'bg-black text-white hover:bg-gray-800' 
            : 'bg-white text-black hover:bg-gray-100 border border-black'
        } ${className}`}
        title={isSaved ? 'Unsave recipe' : 'Save recipe'}
      >
        {isSaved ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>

      {/* Collection Selection Modal */}
      {showCollectionModal && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-transparent flex items-center justify-center z-[99999] p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowCollectionModal(false);
          }}
        >
          <div 
            className="bg-white border border-black max-w-md w-full max-h-96 overflow-y-auto relative z-[99999] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold tracking-tight text-black uppercase font-mono">
                  Save to Collection
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCollectionModal(false);
                  }}
                  className="p-1 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Collections List */}
              <div className="space-y-2 mb-4">
                {/* Default "No Collection" option */}
                <button
                  onClick={() => handleSaveToCollection(null)}
                  disabled={loading}
                  className="w-full text-left p-3 border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  <span className="text-lg">📚</span>
                  <span className="font-mono text-sm">Saved Recipes (No Collection)</span>
                </button>

                {/* User's collections */}
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleSaveToCollection(collection.id)}
                    disabled={loading}
                    className="w-full text-left p-3 border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                  >
                    <span className="text-lg">📁</span>
                    <span className="font-mono text-sm">{collection.name}</span>
                  </button>
                ))}
              </div>

              {/* Create New Collection */}
              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New collection name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 text-sm font-mono"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateCollection();
                      }
                    }}
                  />
                  <button
                    onClick={handleCreateCollection}
                    disabled={loading || !newCollectionName.trim()}
                    className="p-2 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
