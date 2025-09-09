'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Activity, UserPlus, Settings } from 'lucide-react';
import { Circle } from '../lib/circles';
import CircleManager from './CircleManager';
import CircleFeed from './CircleFeed';
import CircleNetwork from './CircleNetwork';
import CircleInvitations from './CircleInvitations';

export default function CircleDashboard() {
  const [activeTab, setActiveTab] = useState<'feed' | 'circles' | 'network' | 'invitations'>('feed');
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);

  const tabs = [
    { id: 'feed', label: 'Circle Feed', icon: Activity },
    { id: 'circles', label: 'My Circles', icon: Users },
    { id: 'network', label: 'Network', icon: Settings },
    { id: 'invitations', label: 'Invitations', icon: UserPlus }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <CircleFeed selectedCircle={selectedCircle || undefined} />;
      case 'circles':
        return <CircleManager onCircleSelect={setSelectedCircle} />;
      case 'network':
        return <CircleNetwork selectedCircle={selectedCircle || undefined} />;
      case 'invitations':
        return <CircleInvitations circle={selectedCircle || undefined} />;
      default:
        return <CircleFeed selectedCircle={selectedCircle || undefined} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id !== 'network' && tab.id !== 'invitations') {
                    setSelectedCircle(null);
                  }
                }}
                className={`flex items-center gap-2 py-4 px-2 sm:px-4 border-b-2 font-mono text-xs sm:text-sm uppercase tracking-wide transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.id === 'feed' ? 'Feed' : 
                   tab.id === 'circles' ? 'Circles' : 
                   tab.id === 'network' ? 'Network' : 'Invites'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Circle Indicator */}
      {selectedCircle && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border border-gray-200 gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-mono uppercase">
              {selectedCircle.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold tracking-tight uppercase text-sm sm:text-base">
                {selectedCircle.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                {selectedCircle.member_count} members • {selectedCircle.recipe_count} recipes
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedCircle(null)}
            className="px-3 py-2 sm:px-4 border border-gray-300 font-mono text-xs sm:text-sm uppercase tracking-wide hover:bg-gray-100 transition-colors self-start sm:self-auto"
          >
            View All
          </button>
        </motion.div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
