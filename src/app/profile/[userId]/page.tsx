'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Recipe } from '../../lib/supabase';
import { ArrowLeft } from 'lucide-react';

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
      <div className="flex items-center mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-black">
          {profile?.username || 'Profile'}
        </h1>
        <div className="w-6" /> {/* spacer for symmetry */}
      </div>

      {/* Profile Header */}
      {profile && (
        <div className="flex flex-col items-center text-center mb-10">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-black shadow-sm">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={`${profile.username || 'User'}'s avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-2xl font-bold">
                ?
              </div>
            )}
          </div>

          {/* Username + Bio */}
          <h1 className="text-xl font-bold mt-4 text-black">
            {profile.username || 'Unknown User'}
          </h1>
          {profile.bio && (
            <p className="text-gray-600 text-sm mt-2 max-w-sm leading-snug">
              {profile.bio}
            </p>
          )}

          {/* Stats Section */}
          <div className="flex space-x-10 mt-6">
            <div className="text-center">
              <p className="font-bold text-black">{recipes.length}</p>
              <p className="text-xs text-gray-500">Recipes</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-black">0</p>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-black">0</p>
              <p className="text-xs text-gray-500">Following</p>
            </div>
          </div>
        </div>
      )}

      {/* Recipes Grid */}
      <div className="grid grid-cols-3 gap-2">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="aspect-square relative group cursor-pointer"
            onClick={() => console.log('Open recipe', recipe.id)}
          >
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm rounded-md">
                No Image
              </div>
            )}
            {/* Title overlay */}
            <div className="absolute font-mono bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 truncate">
              {recipe.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
