'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase, Recipe } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RecipeCard } from './RecipeCard';
import { RecipeDetail } from './RecipeDetail';
import { ProfilePhoto } from './ProfilePhoto';
import { Share2, Users, Heart, MessageCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface Circle {
  id: string;
  name: string;
  type: string;
}

interface CircleActivity {
  id: string;
  activity_type: string;
  created_at: string;
  profiles?: { username: string; avatar_url?: string };
  circles?: { name: string };
  recipes?: { title: string; image_url?: string };
}

interface CircleFeedProps {
  selectedCircle?: Circle;
}

export default function CircleFeed({ selectedCircle }: CircleFeedProps) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activities, setActivities] = useState<CircleActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [expandedCircles, setExpandedCircles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'recipes' | 'activity'>('recipes');

  useEffect(() => {
    if (user) {
      loadCircleFeed();
    }
  }, [user, selectedCircle]);

  const loadCircleFeed = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (selectedCircle) {
        // Load recipes from specific circle
        await loadCircleRecipes(selectedCircle.id);
        await loadCircleActivities(selectedCircle.id);
      } else {
        // Load recipes from all user's circles
        await loadCircleRecipes();
        await loadAllCircleActivities();
      }
    } catch (error) {
      console.error('Error loading circle feed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const loadCircleRecipes = async (circleId?: string) => {
    if (circleId) {
      // Load recipes for specific circle (excluding user's own recipes)
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          author:profiles!author_id(
            username,
            avatar_url
          )
        `)
        .eq('circle_id', circleId)
        .neq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRecipes(data || []);
    } else {
      // Load recipes from all circle members
      try {
        console.log('Loading circle recipes...');
        
        // Get user's circle memberships to find circle members
        const { data: memberships, error: membershipError } = await supabase
          .from('circle_memberships')
          .select('circle_id')
          .eq('user_id', user!.id)
          .eq('status', 'active');

        if (membershipError) throw membershipError;

        const circleIds = memberships?.map(m => m.circle_id) || [];
        console.log('User is in circles:', circleIds);
        
        if (circleIds.length === 0) {
          setRecipes([]);
          return;
        }

        // Get all members from user's circles
        const { data: allMemberships, error: allMembershipsError } = await supabase
          .from('circle_memberships')
          .select('user_id')
          .in('circle_id', circleIds)
          .eq('status', 'active');

        if (allMembershipsError) throw allMembershipsError;

        const memberIds = [...new Set(allMemberships?.map(m => m.user_id) || [])];
        console.log('Circle members:', memberIds);

        if (memberIds.length === 0) {
          setRecipes([]);
          return;
        }

        // Get recipes from all circle members with author info (excluding user's own recipes)
        const { data, error } = await supabase
          .from('recipes')
          .select(`
            *,
            author:profiles!author_id(
              username,
              avatar_url
            )
          `)
          .in('user_id', memberIds)
          .neq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        
        console.log('Loaded recipes:', data?.length);
        setRecipes(data || []);
      } catch (error) {
        console.error('Error loading circle recipes:', error);
        setRecipes([]);
      }
    }
  };

  const loadAllCircleRecipes = async () => {
    // Get user's circle IDs
    const { data: memberships, error: membershipError } = await supabase
      .from('circle_memberships')
      .select('circle_id')
      .eq('user_id', user!.id)
      .eq('status', 'active');

    if (membershipError) throw membershipError;

    const circleIds = memberships?.map(m => m.circle_id) || [];
    
    if (circleIds.length === 0) {
      setRecipes([]);
      return;
    }

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .in('circle_id', circleIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    setRecipes(data || []);
  };

  const loadCircleActivities = async (circleId: string) => {
    const { data, error } = await supabase
      .from('circle_activities')
      .select('*')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    setActivities(data || []);
  };

  const loadAllCircleActivities = async () => {
    // Get user's circle IDs
    const { data: memberships, error: membershipError } = await supabase
      .from('circle_memberships')
      .select('circle_id')
      .eq('user_id', user!.id)
      .eq('status', 'active');

    if (membershipError) throw membershipError;

    const circleIds = memberships?.map(m => m.circle_id) || [];
    
    if (circleIds.length === 0) {
      setActivities([]);
      return;
    }

    const { data, error } = await supabase
      .from('circle_activities')
      .select('*')
      .in('circle_id', circleIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    setActivities(data || []);
  };

  const formatActivityMessage = (activity: any) => {
    const username = activity.profiles?.username || 'Someone';
    const circleName = activity.circles?.name || 'a circle';
    
    switch (activity.activity_type) {
      case 'recipe_posted':
        return `${username} shared a new recipe "${activity.recipes?.title}" in ${circleName}`;
      case 'member_joined':
        return `${username} joined ${circleName}`;
      case 'recipe_liked':
        return `${username} liked "${activity.recipes?.title}" in ${circleName}`;
      default:
        return `${username} was active in ${circleName}`;
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'recipe_posted': return <Share2 className="w-4 h-4" />;
      case 'member_joined': return <Users className="w-4 h-4" />;
      case 'recipe_liked': return <Heart className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg font-mono uppercase tracking-wide text-gray-500">
          Loading feed...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">
            {selectedCircle ? selectedCircle.name : 'Circle Feed'}
          </h2>
          <p className="text-gray-600 mt-1">
            {selectedCircle 
              ? `Recipes and activity from ${selectedCircle.name}`
              : 'Latest recipes and activity from your food circles'
            }
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border border-black">
          {['recipes', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'recipes' | 'activity')}
              className={`px-6 py-2 font-mono text-sm uppercase tracking-wide transition-colors ${
                activeTab === tab
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'recipes' ? (
        <RecipesTab 
          recipes={recipes} 
          selectedCircle={selectedCircle}
          onRecipeClick={setSelectedRecipe}
          expandedCircles={expandedCircles}
          onToggleCircle={(circleId: string) => {
            const newExpanded = new Set(expandedCircles);
            if (newExpanded.has(circleId)) {
              newExpanded.delete(circleId);
            } else {
              newExpanded.add(circleId);
            }
            setExpandedCircles(newExpanded);
          }}
        />
      ) : (
        <ActivityTab activities={activities} formatMessage={formatActivityMessage} getIcon={getActivityIcon} />
      )}
      
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

interface RecipesTabProps {
  recipes: Recipe[];
  selectedCircle?: Circle;
  onRecipeClick: (recipe: Recipe) => void;
  expandedCircles: Set<string>;
  onToggleCircle: (circleId: string) => void;
}

function RecipesTab({ recipes, selectedCircle, onRecipeClick, expandedCircles, onToggleCircle }: RecipesTabProps) {
  // Group recipes by circle if not viewing a specific circle
  const groupedRecipes = useMemo(() => {
    if (selectedCircle) {
      return { [selectedCircle.id]: { circle: selectedCircle, recipes } };
    }

    const groups: Record<string, { circle: any, recipes: Recipe[] }> = {};
    
    recipes.forEach((recipe: any) => {
      // Handle recipes with circle_id (tagged to specific circles)
      if (recipe.circle_id) {
        const circleId = recipe.circle_id;
        const circleName = recipe.circles?.name || `Circle ${circleId}`;
        
        if (!groups[circleId]) {
          groups[circleId] = {
            circle: { id: circleId, name: circleName, type: recipe.circles?.type || 'public' },
            recipes: []
          };
        }
        groups[circleId].recipes.push(recipe);
      } else {
        // Handle recipes from circle members (not tagged to specific circles)
        const circleId = 'member-recipes';
        if (!groups[circleId]) {
          groups[circleId] = {
            circle: { id: circleId, name: 'From Circle Members', type: 'mixed' },
            recipes: []
          };
        }
        groups[circleId].recipes.push(recipe);
      }
    });

    return groups;
  }, [recipes, selectedCircle]);

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-200">
        <Share2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">No Recipes Yet</h3>
        <p className="text-gray-600 mb-6">
          {selectedCircle 
            ? `No recipes have been shared in ${selectedCircle.name} yet`
            : 'No recipes from your circles yet. Join some circles or create recipes!'
          }
        </p>
      </div>
    );
  }

  if (selectedCircle) {
    // Show recipes in grid for specific circle
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <RecipeCard 
              recipe={recipe} 
              showSaveButton={true}
              onClick={() => onRecipeClick(recipe)}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  // Show grouped recipes with expandable stacks
  return (
    <div className="space-y-6">
      {Object.entries(groupedRecipes).map(([circleId, { circle, recipes: circleRecipes }]) => {
        const isExpanded = expandedCircles.has(circleId);
        const previewRecipes = isExpanded ? circleRecipes : circleRecipes.slice(0, 3);
        const hasMore = circleRecipes.length > 3;

        return (
          <motion.div
            key={circleId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Circle Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight">{circle.name}</h3>
                  <p className="text-sm text-gray-600">
                    {circleRecipes.length} recipe{circleRecipes.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {hasMore && (
                  <button
                    onClick={() => onToggleCircle(circleId)}
                    className="flex items-center gap-2 px-3 py-1 text-sm font-mono uppercase tracking-wide border border-black hover:bg-black hover:text-white transition-colors"
                  >
                    {isExpanded ? (
                      <>Show Less <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>Show All <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Recipe Grid */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {previewRecipes.map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <RecipeCard 
                      recipe={recipe} 
                      showSaveButton={true}
                      onClick={() => onRecipeClick(recipe)}
                    />
                    
                    {/* Stack indicator for preview */}
                    {!isExpanded && index === 2 && hasMore && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer"
                           onClick={() => onToggleCircle(circleId)}>
                        <div className="text-white text-center">
                          <div className="text-2xl font-bold">+{circleRecipes.length - 3}</div>
                          <div className="text-sm font-mono uppercase">More Recipes</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

interface ActivityTabProps {
  activities: any[];
  formatMessage: (activity: any) => string;
  getIcon: (activityType: string) => React.ReactNode;
}

function ActivityTab({ activities, formatMessage, getIcon }: ActivityTabProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-200">
        <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">No Activity Yet</h3>
        <p className="text-gray-600">Activity from your circles will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-4 p-4 border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <ProfilePhoto
            src={activity.profiles?.avatar_url}
            alt={activity.profiles?.username}
            size="sm"
          />
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getIcon(activity.activity_type)}
              <span className="text-sm font-mono text-gray-500">
                {new Date(activity.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <p className="text-sm text-gray-800">
              {formatMessage(activity)}
            </p>
            
            {activity.recipes?.image_url && (
              <div className="mt-2">
                <img
                  src={activity.recipes.image_url}
                  alt={activity.recipes.title}
                  className="w-16 h-16 object-cover border border-gray-200"
                />
              </div>
            )}
          </div>
          
          <div className="text-xs font-mono text-gray-400">
            <Clock className="w-3 h-3 inline mr-1" />
            {new Date(activity.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
