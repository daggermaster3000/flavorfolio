'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ChefHat, BookOpen, Users, Sparkles, ArrowRight, Check, Camera, Zap } from 'lucide-react';
import { AuthForm } from './AuthForm';
import { supabase } from '../lib/supabase';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const authFormRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    recipes: 0,
    users: 0,
    saves: 0
  });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const featuresY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 300]);

  // Fetch stats from database
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get recipe count
        const { count: recipeCount } = await supabase
          .from('recipes')
          .select('*', { count: 'exact', head: true });

        // Get user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Get saves count
        const { count: savesCount } = await supabase
          .from('saved_recipes')
          .select('*', { count: 'exact', head: true });

        setStats({
          recipes: recipeCount || 0,
          users: userCount || 0,
          saves: savesCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to default values
        setStats({
          recipes: 1250,
          users: 850,
          saves: 3200
        });
      }
    };

    fetchStats();
  }, []);

  const scrollToAuthForm = () => {
    authFormRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'center'
    });
  };

  return (
    <div ref={containerRef} className="min-h-screen font-mono bg-white overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        style={{ y: backgroundY }}
        className="fixed inset-0 -z-10"
      >
        <div className="absolute top-20 left-10 w-64 h-64 border border-gray-200 rotate-12 opacity-20" />
        <div className="absolute top-40 right-20 w-32 h-32 border border-gray-300 -rotate-45 opacity-30" />
        <div className="absolute bottom-40 left-1/3 w-48 h-48 border border-gray-100 rotate-45 opacity-15" />
      </motion.div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tight uppercase"
          >
            FlavorFolio
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            className="px-6 py-2 bg-black text-white font-mono text-sm uppercase tracking-wide hover:bg-gray-800 transition-colors"
          >
            Get Started
          </motion.button>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        style={{ y: heroY }}
        className="min-h-screen flex items-center justify-center px-6 pt-20"
      >
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-none">
              COOK
              <br />
              <span className="text-gray-400">CURATE</span>
              <br />
              CREATE
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            The minimalist recipe management platform for modern chefs.
            Organize, discover, and share culinary masterpieces.
          </motion.p>

          <motion.div
            ref={authFormRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <AuthForm />
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        style={{ y: featuresY }}
        className="py-32 px-6 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 uppercase">
              Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your culinary journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <ChefHat className="w-8 h-8" />,
                title: "Recipe Management",
                description: "Create, edit, and organize your recipes with our intuitive interface. Add photos, ingredients, and step-by-step instructions.",
                delay: 0.1
              },
              {
                icon: <Camera className="w-8 h-8" />,
                title: "AI Photo Import",
                description: "Upload photos from TikTok, Instagram, or camera roll and let AI extract recipes automatically. Turn any food photo into a structured recipe.",
                delay: 0.2
              },
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: "Smart Collections",
                description: "Organize recipes into custom collections. Save favorites from other chefs and build your personal cookbook.",
                delay: 0.3
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Social Discovery",
                description: "Explore recipes from the community. Follow your favorite chefs and discover new culinary inspirations.",
                delay: 0.4
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "Clean Interface",
                description: "Swiss-inspired minimalist design that puts your recipes first. No clutter, just pure culinary focus.",
                delay: 0.5
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Smart Features",
                description: "AI-powered recipe suggestions, automatic ingredient scaling, and intelligent meal planning to enhance your cooking experience.",
                delay: 0.6
              }
            ].map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-32 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 uppercase">
              Join The Community
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { number: `${stats.recipes.toLocaleString()}+`, label: "Recipes Created" },
              { number: `${stats.users.toLocaleString()}+`, label: "Active Chefs" },
              { number: `${stats.saves.toLocaleString()}+`, label: "Recipe Saves" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <div className="text-6xl md:text-7xl font-black tracking-tighter mb-4">
                  {stat.number}
                </div>
                <div className="text-xl text-gray-400 uppercase tracking-wide font-mono">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-8 uppercase">
              Ready to Cook?
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Join thousands of chefs who have already transformed their cooking experience.
            </p>
            <motion.button
              onClick={scrollToAuthForm}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-4 bg-black text-white text-lg font-mono uppercase tracking-wide hover:bg-gray-800 transition-colors"
            >
              Start Your Journey
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold tracking-tight uppercase mb-4">
            FlavorFolio
          </div>
          <p className="text-gray-600 font-mono text-sm">
            Crafted with ❤️ for culinary enthusiasts
          </p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay }}
      whileHover={{ y: -5 }}
      className="bg-white p-8 border border-gray-200 hover:border-black transition-colors duration-300 group"
    >
      <div className="mb-6 text-black group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-bold tracking-tight mb-4 uppercase">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
