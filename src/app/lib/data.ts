// src/app/lib/data.ts

import { supabase } from './supabase';

/**
 * Fetches a single recipe and its author's profile information.
 * @param recipeId The ID of the recipe to fetch.
 */
export async function getRecipeWithAuthor(recipeId: string) {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(
        `
        *,
        author:profiles(
          username,
          avatar_url
        )
      `
      )
      .eq('id', recipeId)
      .single();

    if (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }

    return data;

  } catch (err) {
    console.error('An unexpected error occurred:', err);
    return null;
  }
}