'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Globe, Lock, Crown, UserPlus, Settings, X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Circle, CircleMembership } from '../lib/circles';
import { ProfilePhoto } from './ProfilePhoto';

interface CircleManagerProps {
  onCircleSelect?: (circle: Circle) => void;
}

export default function CircleManager({ onCircleSelect }: CircleManagerProps) {
  const { user } = useAuth();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [memberships, setMemberships] = useState<CircleMembership[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadUserCircles();
    }
  }, [user]);

  const loadUserCircles = async () => {
    if (!user) {
      console.log('No user found');
      return;
    }

    console.log('Loading circles for user:', user.id);

    try {
      // First, let's check if the tables exist by doing a simple query
      const { data: testData, error: testError } = await supabase
        .from('circles')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('Error accessing circles table:', testError);
        console.error('Error details:', JSON.stringify(testError, null, 2));
        console.error('Error code:', testError.code);
        console.error('Error message:', testError.message);
        
        // If it's an RLS policy issue, let's try to get public circles instead
        if (testError.code === 'PGRST116' || testError.message?.includes('policy')) {
          console.log('Trying to access public circles only...');
          const { data: publicData, error: publicError } = await supabase
            .from('circles')
            .select('id, name, type')
            .eq('type', 'public')
            .limit(1);
            
          if (publicError) {
            console.error('Public circles also failed:', publicError);
            throw testError;
          } else {
            console.log('Public circles accessible:', publicData?.length || 0);
          }
        } else {
          throw testError;
        }
      } else {
        console.log('Circles table accessible, found records:', testData?.length || 0);
      }

      // Get user's circle memberships
      const { data: membershipData, error: membershipError } = await supabase
        .from('circle_memberships')
        .select(`
          *,
          circles (
            *
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (membershipError) throw membershipError;

      const userCircles = membershipData?.map(membership => membership.circles).filter(Boolean) || [];
      const userMemberships = membershipData || [];

      setCircles(userCircles as Circle[]);
      setMemberships(userMemberships);
    } catch (error) {
      console.error('Error loading circles:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCircle = async (circleData: {
    name: string;
    description: string;
    type: 'public' | 'private' | 'themed';
    theme?: string;
  }) => {
    if (!user) return;

    try {
      // Create circle
      const { data: circle, error: circleError } = await supabase
        .from('circles')
        .insert({
          name: circleData.name,
          description: circleData.description,
          type: circleData.type,
          theme: circleData.theme,
          created_by: user.id
        })
        .select()
        .single();

      if (circleError) throw circleError;

      // Add creator as member
      const { error: membershipError } = await supabase
        .from('circle_memberships')
        .insert({
          circle_id: circle.id,
          user_id: user.id,
          role: 'creator',
          status: 'active'
        });

      if (membershipError) throw membershipError;

      await loadUserCircles();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating circle:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error code:', (error as any)?.code);
      console.error('Error message:', (error as any)?.message);
    }
  };

  const getUserRole = (circleId: string) => {
    const membership = memberships.find(m => m.circle_id === circleId);
    return membership?.role || 'member';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg font-mono uppercase tracking-wide text-gray-500">
          Loading circles...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">Food Circles</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Connect with fellow food enthusiasts</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <motion.button
            onClick={() => setShowJoinModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 sm:px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors font-mono text-xs sm:text-sm uppercase tracking-wide"
          >
            <Search className="w-4 h-4 inline mr-2" />
            <span className="hidden sm:inline">Discover</span>
            <span className="sm:hidden">Find</span>
          </motion.button>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 sm:px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors font-mono text-xs sm:text-sm uppercase tracking-wide"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            <span className="hidden sm:inline">Create Circle</span>
            <span className="sm:hidden">Create</span>
          </motion.button>
        </div>
      </div>

      {/* Circles Grid */}
      {circles.length === 0 ? (
        <div className="text-center py-12 border border-gray-200">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">No Circles Yet</h3>
          <p className="text-gray-600 mb-6">Create your first food circle or discover existing ones</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-black text-white font-mono text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors"
            >
              Create Circle
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-6 py-2 border border-black font-mono text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
            >
              Discover Circles
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {circles.map((circle) => (
            <CircleCard
              key={circle.id}
              circle={circle}
              userRole={getUserRole(circle.id)}
              onClick={() => onCircleSelect?.(circle)}
            />
          ))}
        </div>
      )}

      {/* Create Circle Modal */}
      <CreateCircleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCircle}
      />

      {/* Join Circle Modal */}
      <JoinCircleModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={loadUserCircles}
      />
    </div>
  );
}

interface CircleCardProps {
  circle: Circle;
  userRole: string;
  onClick: () => void;
}

function CircleCard({ circle, userRole, onClick }: CircleCardProps) {
  const getTypeIcon = () => {
    switch (circle.type) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      case 'themed': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'creator': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin': return <Settings className="w-4 h-4 text-blue-600" />;
      default: return null;
    }
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="border border-gray-200 hover:border-black transition-colors cursor-pointer bg-white"
    >
      {circle.cover_image_url && (
        <div className="aspect-video overflow-hidden">
          <img 
            src={circle.cover_image_url} 
            alt={circle.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <span className="text-xs font-mono uppercase tracking-wide text-gray-500">
              {circle.type}
            </span>
          </div>
          {getRoleIcon()}
        </div>

        <h3 className="text-xl font-bold tracking-tight mb-2 uppercase">
          {circle.name}
        </h3>
        
        {circle.theme && (
          <div className="text-sm text-gray-600 mb-2 font-mono">
            Theme: {circle.theme}
          </div>
        )}

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {circle.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 font-mono">
          <span>{circle.member_count} members</span>
          <span>{circle.recipe_count} recipes</span>
        </div>
      </div>
    </motion.div>
  );
}

interface CreateCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    type: 'public' | 'private' | 'themed';
    theme?: string;
  }) => void;
}

function CreateCircleModal({ isOpen, onClose, onSubmit }: CreateCircleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public' as 'public' | 'private' | 'themed',
    theme: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', description: '', type: 'public', theme: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white max-w-md w-full border border-black"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold tracking-tight uppercase">
              Create Food Circle
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-mono uppercase tracking-wide mb-2">
                Circle Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-300 font-mono text-sm"
                placeholder="e.g., Italian Food Lovers"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono uppercase tracking-wide mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border border-gray-300 font-mono text-sm h-24 resize-none"
                placeholder="Describe your circle's purpose..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-mono uppercase tracking-wide mb-2">
                Circle Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full p-3 border border-gray-300 font-mono text-sm"
              >
                <option value="public">Public - Anyone can discover and join</option>
                <option value="private">Private - Invite only</option>
                <option value="themed">Themed - Focused on specific cuisine</option>
              </select>
            </div>

            {formData.type === 'themed' && (
              <div>
                <label className="block text-sm font-mono uppercase tracking-wide mb-2">
                  Theme
                </label>
                <input
                  type="text"
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className="w-full p-3 border border-gray-300 font-mono text-sm"
                  placeholder="e.g., Italian, Vegan, Desserts"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 p-3 border border-gray-300 font-mono text-sm uppercase tracking-wide hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 p-3 bg-black text-white font-mono text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors"
              >
                Create Circle
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

interface JoinCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: () => void;
}

function JoinCircleModal({ isOpen, onClose, onJoin }: JoinCircleModalProps) {
  const { user } = useAuth();
  const [publicCircles, setPublicCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPublicCircles();
    }
  }, [isOpen]);

  const loadPublicCircles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('circles')
        .select(`
          *,
          profiles!circles_created_by_fkey (
            username,
            avatar_url
          )
        `)
        .eq('type', 'public')
        .not('id', 'in', `(
          SELECT circle_id FROM circle_memberships 
          WHERE user_id = '${user.id}' AND status = 'active'
        )`)
        .order('member_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPublicCircles(data || []);
    } catch (error) {
      console.error('Error loading public circles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCircle = async (circleId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('circle_memberships')
        .insert({
          circle_id: circleId,
          user_id: user.id,
          role: 'member',
          status: 'active'
        });

      if (error) throw error;

      onJoin();
      onClose();
    } catch (error) {
      console.error('Error joining circle:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white max-w-2xl w-full max-h-96 overflow-y-auto border border-black"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold tracking-tight uppercase">
              Discover Food Circles
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="font-mono text-sm uppercase tracking-wide text-gray-500">
                Loading circles...
              </div>
            </div>
          ) : publicCircles.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No public circles available to join</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {publicCircles.map((circle) => (
                <motion.div
                  key={circle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  className="border border-gray-200 p-4 sm:p-6 cursor-pointer hover:border-black transition-colors"
                  onClick={() => handleJoinCircle(circle.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black text-white flex items-center justify-center font-mono text-base sm:text-lg uppercase">
                      {circle.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-mono uppercase">
                      <Users className="w-3 h-3" />
                      {circle.member_count}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-base sm:text-lg mb-2 uppercase tracking-tight">
                    {circle.name}
                  </h3>
                  
                  {circle.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {circle.description}
                    </p>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500">
                      <span className="font-mono uppercase">{circle.type}</span>
                      <span>{circle.recipe_count} recipes</span>
                    </div>
                    
                    <div className="text-xs text-gray-400 font-mono">
                      {new Date(circle.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
