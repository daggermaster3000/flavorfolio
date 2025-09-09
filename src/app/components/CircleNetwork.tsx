'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, Settings, UserPlus, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Circle, CircleMembership } from '../lib/circles';
import { ProfilePhoto } from './ProfilePhoto';

interface CircleNetworkProps {
  selectedCircle?: Circle;
}

interface Member {
  id: string;
  username: string;
  avatar_url?: string;
  role: string;
  joined_at: string;
}

export default function CircleNetwork({ selectedCircle }: CircleNetworkProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [networkUsers, setNetworkUsers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [animationTime, setAnimationTime] = useState(0);
  const [avatarImages, setAvatarImages] = useState<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    if (user) {
      if (selectedCircle) {
        loadCircleMembers(selectedCircle.id);
      } else {
        loadNetworkView();
      }
    }
  }, [user, selectedCircle]);

  useEffect(() => {
    if (!selectedCircle && circles.length > 0) {
      startAnimation();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [circles, selectedCircle]);

  const startAnimation = () => {
    const animate = (timestamp: number) => {
      setAnimationTime(timestamp * 0.001); // Convert to seconds
      drawNetworkGraph(timestamp * 0.001);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  const loadCircleMembers = async (circleId: string) => {
    try {
      const { data, error } = await supabase
        .from('circle_memberships')
        .select(`
          *,
          profiles!circle_memberships_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('circle_id', circleId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true });

      if (error) throw error;

      const memberData = data?.map(membership => ({
        id: membership.profiles.id,
        username: membership.profiles.username,
        avatar_url: membership.profiles.avatar_url,
        role: membership.role,
        joined_at: membership.joined_at
      })) || [];

      setMembers(memberData);
    } catch (error) {
      console.error('Error loading circle members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNetworkView = async () => {
    try {
      // Get user's circles with member info
      const { data: membershipData, error: membershipError } = await supabase
        .from('circle_memberships')
        .select(`
          *,
          circles (
            *,
            profiles!circles_created_by_fkey (
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (membershipError) throw membershipError;

      const userCircles = membershipData?.map(membership => membership.circles).filter(Boolean) || [];
      setCircles(userCircles as Circle[]);

      await loadNetworkUsers();
    } catch (error) {
      console.error('Error loading network view:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNetworkUsers = async () => {
    if (!user) {
      console.log('No user found, skipping network users load');
      return;
    }

    try {
      console.log('Loading network users for user:', user.id);
      
      // Get all circle memberships for the current user
      const { data: userMemberships, error: membershipError } = await supabase
        .from('circle_memberships')
        .select('circle_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (membershipError) {
        console.error('Error loading user memberships:', membershipError);
        throw membershipError;
      }

      console.log('User memberships:', userMemberships);
      const circleIds = userMemberships?.map(m => m.circle_id) || [];
      
      if (circleIds.length === 0) {
        console.log('No circles found for user, setting empty network users');
        setNetworkUsers([]);
        return;
      }

      console.log('Loading members for circles:', circleIds);

      // First, get basic membership data without joins
      const { data: basicMemberships, error: basicError } = await supabase
        .from('circle_memberships')
        .select('user_id, circle_id, role, joined_at')
        .in('circle_id', circleIds)
        .neq('user_id', user.id)
        .eq('status', 'active');

      if (basicError) {
        console.error('Error loading basic memberships:', basicError);
        throw basicError;
      }

      console.log('Basic memberships:', basicMemberships);

      if (!basicMemberships || basicMemberships.length === 0) {
        console.log('No other members found in user circles');
        setNetworkUsers([]);
        return;
      }

      // Get user profiles separately
      const userIds = [...new Set(basicMemberships.map(m => m.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        throw profilesError;
      }

      // Get circle data separately
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('id, name, type')
        .in('id', circleIds);

      if (circleError) {
        console.error('Error loading circles:', circleError);
        throw circleError;
      }

      console.log('Profiles:', profiles);
      console.log('Circles:', circleData);

      // Create lookup maps for efficient data joining
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const circleMap = new Map(circleData?.map(c => [c.id, c]) || []);

      // Combine the data manually
      const networkUserData = basicMemberships?.filter(membership => {
        const profile = profileMap.get(membership.user_id);
        const circle = circleMap.get(membership.circle_id);
        
        if (!profile || !circle) {
          console.warn('Missing profile or circle data for membership:', membership);
          return false;
        }
        return true;
      }).map(membership => {
        const profile = profileMap.get(membership.user_id)!;
        const circle = circleMap.get(membership.circle_id)!;
        
        return {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          role: membership.role,
          joined_at: membership.joined_at,
          circle_id: membership.circle_id,
          circle_name: circle.name,
          circle_type: circle.type
        };
      }) || [];

      console.log('Processed network user data:', networkUserData);
      setNetworkUsers(networkUserData);
      
      // Load avatar images
      if (networkUserData.length > 0) {
        await loadAvatarImages(networkUserData);
      }
    } catch (error) {
      console.error('Error loading network users:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    }
  };

  const loadAvatarImages = async (users: Member[]) => {
    const imageMap = new Map<string, HTMLImageElement>();
    
    for (const user of users) {
      if (user.avatar_url) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = user.avatar_url!;
          });
          imageMap.set(user.id, img);
        } catch (error) {
          console.log(`Failed to load avatar for user ${user.username}`);
        }
      }
    }
    
    setAvatarImages(imageMap);
  };

  const drawNetworkGraph = (time?: number) => {
    const canvas = canvasRef.current;
    if (!canvas || circles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.25;
    const userRadius = Math.min(canvas.width, canvas.height) * 0.4;
    const animTime = time || 0;

    // Draw animated connections between circles and users
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Animate connection opacity
    const connectionOpacity = 0.3 + 0.2 * Math.sin(animTime * 0.5);
    ctx.globalAlpha = connectionOpacity;

    circles.forEach((circle, i) => {
      const angle1 = (i / circles.length) * 2 * Math.PI + animTime * 0.1;
      const x1 = centerX + Math.cos(angle1) * radius;
      const y1 = centerY + Math.sin(angle1) * radius;

      // Draw connections to other circles
      circles.forEach((otherCircle, j) => {
        if (i < j) {
          const angle2 = (j / circles.length) * 2 * Math.PI + animTime * 0.1;
          const x2 = centerX + Math.cos(angle2) * radius;
          const y2 = centerY + Math.sin(angle2) * radius;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      });

      // Draw connections from center to circles
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    });

    ctx.globalAlpha = 1;

    // Draw user at center with pulsing animation
    const pulseScale = 1 + 0.1 * Math.sin(animTime * 2);
    const userSize = 20 * pulseScale;
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, userSize, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', centerX, centerY + 4);

    // Draw circles around the user with rotation animation
    circles.forEach((circle, i) => {
      const angle = (i / circles.length) * 2 * Math.PI + animTime * 0.1;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Circle background with hover effect
      const hoverScale = 1 + 0.05 * Math.sin(animTime * 3 + i);
      const circleSize = 30 * hoverScale;
      
      ctx.fillStyle = circle.type === 'private' ? '#fef3c7' : circle.type === 'themed' ? '#ddd6fe' : '#f0f9ff';
      ctx.beginPath();
      ctx.arc(x, y, circleSize, 0, 2 * Math.PI);
      ctx.fill();

      // Circle border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Circle name
      ctx.fillStyle = '#000';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      const name = circle.name.length > 8 ? circle.name.substring(0, 8) + '...' : circle.name;
      ctx.fillText(name, x, y - 40);

      // Member count
      ctx.font = '8px monospace';
      ctx.fillText(`${circle.member_count}`, x, y + 4);
    });

    // Draw network users connected to their specific circles
    const uniqueUsers = networkUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );

    // Group users by circle for better positioning
    const usersByCircle = new Map<string, typeof uniqueUsers>();
    uniqueUsers.forEach(user => {
      const circleId = (user as any).circle_id;
      if (!usersByCircle.has(circleId)) {
        usersByCircle.set(circleId, []);
      }
      usersByCircle.get(circleId)!.push(user);
    });

    // Draw users around each circle
    circles.forEach((circle, circleIndex) => {
      const circleAngle = (circleIndex / circles.length) * 2 * Math.PI + animTime * 0.1;
      const circleX = centerX + Math.cos(circleAngle) * radius;
      const circleY = centerY + Math.sin(circleAngle) * radius;
      
      const circleUsers = usersByCircle.get(circle.id) || [];
      
      circleUsers.forEach((networkUser, userIndex) => {
        // Position users around their circle
        const userAngle = circleAngle + (userIndex / Math.max(circleUsers.length, 1)) * Math.PI * 0.8 - Math.PI * 0.4;
        const userDistance = userRadius * 0.8;
        const x = circleX + Math.cos(userAngle) * userDistance * 0.6;
        const y = circleY + Math.sin(userAngle) * userDistance * 0.6;

        // Draw connection from user to their circle
        ctx.strokeStyle = circle.type === 'private' ? '#f59e0b' : circle.type === 'themed' ? '#8b5cf6' : '#3b82f6';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(circleX, circleY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // User node with gentle animation
        const userScale = 1 + 0.03 * Math.sin(animTime * 2 + userIndex * 0.5);
        const nodeSize = 16 * userScale;
        
        // Draw avatar if available
        const avatarImg = avatarImages.get(networkUser.id);
        if (avatarImg) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, nodeSize, 0, 2 * Math.PI);
          ctx.closePath();
          ctx.clip();
          
          const imgSize = nodeSize * 2;
          ctx.drawImage(avatarImg, x - imgSize/2, y - imgSize/2, imgSize, imgSize);
          ctx.restore();
          
          // Avatar border
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, nodeSize, 0, 2 * Math.PI);
          ctx.stroke();
        } else {
          // Fallback colored circle
          const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
          const colorIndex = networkUser.username.charCodeAt(0) % colors.length;
          
          ctx.fillStyle = colors[colorIndex];
          ctx.beginPath();
          ctx.arc(x, y, nodeSize, 0, 2 * Math.PI);
          ctx.fill();

          // User initial
          ctx.fillStyle = '#fff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(networkUser.username.charAt(0).toUpperCase(), x, y + 3);
          
          // Border
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Username below avatar
        ctx.fillStyle = '#374151';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        const username = networkUser.username.length > 8 ? networkUser.username.substring(0, 8) + '...' : networkUser.username;
        ctx.fillText(username, x, y + nodeSize + 12);
      });
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'creator': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin': return <Settings className="w-4 h-4 text-blue-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      creator: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      admin: 'bg-blue-100 text-blue-800 border-blue-300',
      member: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-mono uppercase tracking-wide border ${colors[role as keyof typeof colors] || colors.member}`}>
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg font-mono uppercase tracking-wide text-gray-500">
          Loading network...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
            {selectedCircle ? `${selectedCircle.name} Members` : 'Network Graph'}
          </h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {selectedCircle 
              ? `${members.length} members in this circle`
              : 'Visualize your food circle connections'
            }
          </p>
        </div>
        {!selectedCircle && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{circles.length} circles • {circles.reduce((sum, circle) => sum + circle.member_count, 0)} members</span>
          </div>
        )}
      </div>

      {selectedCircle ? (
        /* Circle Members View */
        <div className="space-y-6">
          {members.length === 0 ? (
            <div className="text-center py-12 border border-gray-200">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">No Members</h3>
              <p className="text-gray-600">This circle doesn't have any members yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {members.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2 }}
                  className="border border-gray-200 hover:border-black transition-colors p-4 cursor-pointer"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <ProfilePhoto
                      src={member.avatar_url}
                      alt={member.username}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold tracking-tight truncate uppercase">
                        {member.username}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        {getRoleIcon(member.role)}
                        <span className="text-xs font-mono text-gray-500 uppercase">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {getRoleBadge(member.role)}
                    <span className="text-xs font-mono text-gray-400">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Invite Members Button */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-black text-white font-mono text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors"
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Invite Members
            </motion.button>
          </div>
        </div>
      ) : (
        /* Network Graph View */
        <div className="space-y-6">
          {circles.length === 0 ? (
            <div className="text-center py-12 border border-gray-200">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">No Network Yet</h3>
              <p className="text-gray-600">Join some food circles to build your network</p>
            </div>
          ) : (
            <>
              {/* Network Visualization */}
              <div className="border border-gray-200 bg-gray-50">
                <canvas
                  ref={canvasRef}
                  className="w-full h-64 sm:h-80 lg:h-96"
                  style={{ display: 'block' }}
                />
              </div>

              {/* Circle List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {circles.map((circle) => (
                  <motion.div
                    key={circle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    className="border border-gray-200 hover:border-black transition-colors p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold tracking-tight uppercase text-sm">
                        {circle.name}
                      </h4>
                      <div className="flex items-center gap-1">
                        {circle.type === 'private' && <Crown className="w-3 h-3 text-yellow-600" />}
                        {circle.type === 'themed' && <Users className="w-3 h-3 text-purple-600" />}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {circle.description}
                    </p>

                    <div className="flex items-center justify-between text-xs font-mono text-gray-500">
                      <span>{circle.member_count} members</span>
                      <span>{circle.recipe_count} recipes</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Network Stats */}
              <div className="grid md:grid-cols-3 gap-6 p-6 bg-gray-50 border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-black tracking-tight mb-1">
                    {circles.length}
                  </div>
                  <div className="text-sm font-mono uppercase tracking-wide text-gray-600">
                    Circles Joined
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black tracking-tight mb-1">
                    {circles.reduce((sum, circle) => sum + circle.member_count, 0)}
                  </div>
                  <div className="text-sm font-mono uppercase tracking-wide text-gray-600">
                    Total Connections
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black tracking-tight mb-1">
                    {circles.reduce((sum, circle) => sum + circle.recipe_count, 0)}
                  </div>
                  <div className="text-sm font-mono uppercase tracking-wide text-gray-600">
                    Network Recipes
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Member Detail Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}

interface MemberDetailModalProps {
  member: Member;
  onClose: () => void;
}

function MemberDetailModal({ member, onClose }: MemberDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white max-w-md w-full border border-black"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <ProfilePhoto
              src={member.avatar_url}
              alt={member.username}
              size="lg"
            />
            <div>
              <h3 className="text-xl font-bold tracking-tight uppercase">
                {member.username}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {member.role === 'creator' && <Crown className="w-4 h-4 text-yellow-600" />}
                {member.role === 'admin' && <Settings className="w-4 h-4 text-blue-600" />}
                <span className="text-sm font-mono uppercase tracking-wide text-gray-600">
                  {member.role}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-gray-500 mb-1">
                Joined Circle
              </label>
              <div className="text-sm">
                {new Date(member.joined_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 p-3 border border-gray-300 font-mono text-sm uppercase tracking-wide hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button className="flex-1 p-3 bg-black text-white font-mono text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors">
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Message
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
