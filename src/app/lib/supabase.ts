import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Recipe = {
  id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  steps: string[];
  step_items?: Array<{ text: string; image_url?: string | null }>; // optional rich steps
  tags?: string[];
  image_url: string | null;
  prep_time: number;
  cook_time: number;
  servings: number;
  user_id: string;
  author_id?: string | null;
  author_name?: string | null;
  created_at: string;
  updated_at: string;
};