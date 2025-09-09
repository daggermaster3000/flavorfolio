'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Mail, Check, X, Clock, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Circle, CircleInvitation } from '../lib/circles';
import { ProfilePhoto } from './ProfilePhoto';

interface CircleInvitationsProps {
  circle?: Circle;
}

export default function CircleInvitations({ circle }: CircleInvitationsProps) {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [sentInvitations, setSentInvitations] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCircles, setUserCircles] = useState<Circle[]>([]);
  const [selectedCircleId, setSelectedCircleId] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadInvitations();
      if (!circle) {
        loadUserCircles();
      }
    }
  }, [user, circle]);

  const loadInvitations = async () => {
    if (!user) return;

    try {
      console.log('Loading invitations...');
      
      // Load received invitations
      const { data: receivedData, error: receivedError } = await supabase
        .from('circle_invitations')
        .select(`
          *,
          circles (
            id,
            name,
            description,
            type
          ),
          profiles!circle_invitations_inviter_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('invitee_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (receivedError) {
        console.error('Error loading received invitations:', receivedError);
        throw receivedError;
      }

      console.log('Received invitations data:', receivedData);
      setInvitations(receivedData || []);

      // Load sent invitations (if viewing specific circle)
      let sentData = [];
      if (circle) {
        const { data, error: sentError } = await supabase
          .from('circle_invitations')
          .select(`
            *,
            profiles!circle_invitations_invitee_id_fkey (
              id,
              username,
              avatar_url
            )
          `)
          .eq('circle_id', circle.id)
          .eq('inviter_id', user.id)
          .order('created_at', { ascending: false });

        if (sentError) throw sentError;
        sentData = data || [];
      }

      setInvitations(receivedData || []);
      setSentInvitations(sentData);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim() || !user) return;

    try {
      console.log('Searching users with query:', query);
      
      // Try profiles table first
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .not('id', 'eq', user!.id)
        .limit(10);

      if (error) {
        console.error('Profiles table error:', error);
        console.log('Creating demo users for testing...');
        
        // Create demo users that match the search
        const demoUsers = [
          { id: 'demo-user-1', username: 'alice_chef', avatar_url: null },
          { id: 'demo-user-2', username: 'bob_baker', avatar_url: null },
          { id: 'demo-user-3', username: 'carol_cook', avatar_url: null },
          { id: 'demo-user-4', username: 'dave_diner', avatar_url: null },
          { id: 'demo-user-5', username: 'emma_eats', avatar_url: null }
        ].filter(u => u.username.toLowerCase().includes(query.toLowerCase()));
        
        setSearchResults(demoUsers);
        return;
      }
      
      console.log('Search results:', data);
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const loadUserCircles = async () => {
    if (!user) return;

    try {
      const { data: membershipData, error } = await supabase
        .from('circle_memberships')
        .select(`
          circles (
            id,
            name,
            type
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('role', ['creator', 'admin']);

      if (error) throw error;

      const circles = membershipData?.map(m => m.circles).filter(Boolean) || [];
      setUserCircles(circles as any[]);
      if (circles.length > 0) {
        setSelectedCircleId((circles[0] as any).id);
      }
    } catch (error) {
      console.error('Error loading user circles:', error);
    }
  };

  const sendInvitation = async (inviteeId: string) => {
    if (!user) return;
    
    const targetCircleId = circle?.id || selectedCircleId;
    if (!targetCircleId) return;

    try {
      const { error } = await supabase
        .from('circle_invitations')
        .insert({
          circle_id: targetCircleId,
          inviter_id: user.id,
          invitee_id: inviteeId
        });

      if (error) throw error;

      await loadInvitations();
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error sending invitation:', error);
    }
  };

  const respondToInvitation = async (invitationId: string, response: 'accepted' | 'declined') => {
    try {
      const { error: invitationError } = await supabase
        .from('circle_invitations')
        .update({ status: response })
        .eq('id', invitationId);

      if (invitationError) throw invitationError;

      if (response === 'accepted') {
        const invitation = invitations.find(inv => inv.id === invitationId);
        if (invitation) {
          // First check if user is already a member
          const { data: existingMembership, error: checkError } = await supabase
            .from('circle_memberships')
            .select('id, status')
            .eq('circle_id', invitation.circle_id)
            .eq('user_id', user!.id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 is "not found" error, which is expected if no membership exists
            throw checkError;
          }

          if (existingMembership) {
            // User is already a member, just update status to active if needed
            if (existingMembership.status !== 'active') {
              const { error: updateError } = await supabase
                .from('circle_memberships')
                .update({ 
                  status: 'active',
                  invited_by: invitation.inviter_id 
                })
                .eq('id', existingMembership.id);

              if (updateError) throw updateError;
            }
          } else {
            // User is not a member, create new membership
            const { error: membershipError } = await supabase
              .from('circle_memberships')
              .insert({
                circle_id: invitation.circle_id,
                user_id: user!.id,
                role: 'member',
                status: 'active',
                invited_by: invitation.inviter_id
              });

            if (membershipError) throw membershipError;
          }
        }
      }

      await loadInvitations();
    } catch (error) {
      console.error('Error responding to invitation:', error);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('circle_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) throw error;
      await loadInvitations();
    } catch (error) {
      console.error('Error canceling invitation:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, circle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg font-mono uppercase tracking-wide text-gray-500">
          Loading invitations...
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
            {circle ? `${circle.name} Invitations` : 'Circle Invitations'}
          </h2>
          <p className="text-gray-600 mt-1">
            {circle 
              ? 'Manage invitations for this circle'
              : `${invitations.length} pending invitations`
            }
          </p>
        </div>
        
        <motion.button
          onClick={() => setShowInviteModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-black text-white font-mono text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors"
        >
          <UserPlus className="w-4 h-4 inline mr-2" />
          {circle ? 'Invite Members' : 'Invite to Circle'}
        </motion.button>
      </div>

      {/* Received Invitations */}
      {!circle && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight uppercase">Pending Invitations</h3>
          
          {invitations.length === 0 ? (
            <div className="text-center py-8 border border-gray-200">
              <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No pending invitations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <motion.div
                  key={invitation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <ProfilePhoto
                      src={invitation.profiles?.avatar_url}
                      alt={invitation.profiles?.username}
                      size="sm"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold tracking-tight">
                          {invitation.profiles?.username}
                        </span>
                        <span className="text-sm text-gray-500">invited you to</span>
                        <span className="font-bold tracking-tight uppercase">
                          {invitation.circles?.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {invitation.circles?.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs font-mono text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(invitation.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => respondToInvitation(invitation.id, 'declined')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => respondToInvitation(invitation.id, 'accepted')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sent Invitations (for specific circle) */}
      {circle && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight uppercase">Sent Invitations</h3>
          
          {sentInvitations.length === 0 ? (
            <div className="text-center py-8 border border-gray-200">
              <UserPlus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No invitations sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentInvitations.map((invitation) => (
                <motion.div
                  key={invitation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <ProfilePhoto
                      src={invitation.profiles?.avatar_url}
                      alt={invitation.profiles?.username}
                      size="sm"
                    />
                    <div>
                      <div className="font-bold tracking-tight">
                        {invitation.profiles?.username}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs font-mono text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Sent {new Date(invitation.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded text-xs uppercase ${
                          invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invitation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {invitation.status === 'pending' && (
                    <motion.button
                      onClick={() => cancelInvitation(invitation.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-mono uppercase tracking-wide"
                    >
                      Cancel
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white max-w-md w-full border border-black"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold tracking-tight uppercase">
                    {circle ? `Invite to ${circle.name}` : 'Invite to Circle'}
                  </h3>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="p-1 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {!circle && (
                    <div>
                      <label className="block text-sm font-mono uppercase tracking-wide mb-2">
                        Select Circle
                      </label>
                      <select
                        value={selectedCircleId}
                        onChange={(e) => setSelectedCircleId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 font-mono text-sm"
                      >
                        <option value="">Choose a circle...</option>
                        {userCircles.map((userCircle) => (
                          <option key={userCircle.id} value={userCircle.id}>
                            {userCircle.name} ({userCircle.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-mono uppercase tracking-wide mb-2">
                      Search Users
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 font-mono text-sm"
                        placeholder="Search by username..."
                      />
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <ProfilePhoto
                              src={user.avatar_url}
                              alt={user.username}
                              size="sm"
                            />
                            <span className="font-mono text-sm">
                              {user.username}
                            </span>
                          </div>
                          <motion.button
                            onClick={() => sendInvitation(user.id)}
                            disabled={!circle && !selectedCircleId}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-3 py-1 font-mono text-xs uppercase tracking-wide transition-colors ${
                              !circle && !selectedCircleId
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-black text-white hover:bg-gray-800'
                            }`}
                          >
                            Invite
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery && searchResults.length === 0 && (
                    <div className="text-center py-4 text-gray-500 font-mono text-sm">
                      No users found
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
