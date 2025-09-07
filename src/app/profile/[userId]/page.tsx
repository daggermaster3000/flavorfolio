'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Recipe } from '../../lib/supabase';
import { RecipeCard } from '../../components/RecipeCard';
import { ArrowLeft } from 'lucide-react';
import { RecipeThumbnail } from '@/app/components/recipeThumbnail'; 

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function ProfilePage() {
  const { userId } = useParams();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }

      // fetch recipes
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('author_id', userId);

      if (recipeError) {
        console.error('Error fetching recipes:', recipeError);
      } else {
        setRecipes(recipeData || []);
      }

      setLoading(false);
    }

    if (userId) {
      fetchData();
    }
  }, [userId]);

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold">
          {profile?.username || 'Profile'}
        </h1>
        <div className="w-6" /> {/* spacer for symmetry */}
      </div>

      {/* Profile Header */}
      {profile && (
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-black">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${profile.username || 'User'}'s avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xl">
                ?
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold mt-3">
            {profile.username || 'Unknown User'}
          </h1>
          {profile.bio && (
            <p className="text-gray-600 text-sm mt-1 max-w-xs">{profile.bio}</p>
          )}

          {/* Stats Section */}
          <div className="flex space-x-6 mt-4">
            <div className="text-center">
              <p className="font-bold">{recipes.length}</p>
              <p className="text-xs text-gray-500">Recipes</p>
            </div>
            <div className="text-center">
              <p className="font-bold">0</p>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-bold">0</p>
              <p className="text-xs text-gray-500">Following</p>
            </div>
          </div>
        </div>
      )}

      {/* Recipes Grid */}
      <div className="flex flex-wrap gap-1">
  {recipes.map((recipe) => (
    <div
      key={recipe.id}
      className="w-1/3 aspect-square"
    >
      <RecipeThumbnail
        recipe={recipe}
        onClick={() => console.log('Open recipe', recipe.id)}
      />
    </div>
  ))}
</div>

     
    </div>
  );
}
