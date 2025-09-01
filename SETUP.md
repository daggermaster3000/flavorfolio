# Flavorfolio Setup Guide

## Prerequisites
- Node.js 18+ and npm
- A Supabase account (free tier works great)

## Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd flavorfolio
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # OpenAI Configuration (for TikTok recipe parser)
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Get your Supabase credentials:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Navigate to Settings → API
   - Copy the "Project URL" and "anon public" key

4. **Get your OpenAI API key:**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Sign up or log in to your account
   - Navigate to API Keys section
   - Create a new API key
   - **Note:** You'll need credits in your OpenAI account to use the API

## Database Setup

1. **Create the recipes table:**
   In your Supabase SQL editor, run:
   ```sql
   CREATE TABLE recipes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     ingredients TEXT[] NOT NULL,
     steps TEXT[] NOT NULL,
     step_items JSONB,
     tags TEXT[],
     image_url TEXT,
     prep_time INTEGER DEFAULT 0,
     cook_time INTEGER DEFAULT 0,
     servings INTEGER DEFAULT 1,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     author_id UUID REFERENCES auth.users(id),
     author_name TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **Set up Row Level Security (RLS):**
   ```sql
   ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
   
   -- Users can only see their own recipes
   CREATE POLICY "Users can view own recipes" ON recipes
     FOR SELECT USING (auth.uid() = user_id);
   
   -- Users can insert their own recipes
   CREATE POLICY "Users can insert own recipes" ON recipes
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   
   -- Users can update their own recipes
   CREATE POLICY "Users can update own recipes" ON recipes
     FOR UPDATE USING (auth.uid() = user_id);
   
   -- Users can delete their own recipes
   CREATE POLICY "Users can delete own recipes" ON recipes
     FOR DELETE USING (auth.uid() = user_id);
   ```

3. **Create storage bucket for recipe images:**
   ```sql
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('recipe-images', 'recipe-images', true);
   
   -- Allow authenticated users to upload images
   CREATE POLICY "Authenticated users can upload images" ON storage.objects
     FOR INSERT WITH CHECK (bucket_id = 'recipe-images' AND auth.role() = 'authenticated');
   
   -- Allow public access to view images
   CREATE POLICY "Public can view images" ON storage.objects
     FOR SELECT USING (bucket_id = 'recipe-images');
   ```

## Running the App

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

3. **Sign up or sign in:**
   - Create a new account or sign in with existing credentials
   - The app will automatically create a user profile

## Features

- **User Authentication:** Secure sign-up/sign-in with Supabase Auth
- **Recipe Management:** Create, edit, delete, and organize recipes
- **Rich Text Editor:** Beautiful recipe descriptions with TipTap
- **Image Uploads:** Add photos to recipes and individual steps
- **AI Recipe Parser:** Paste TikTok links and let OpenAI extract recipe details
- **Responsive Design:** Works perfectly on desktop and mobile
- **Search & Tags:** Find recipes quickly with search and tag filtering

## TikTok Recipe Parser

The app includes an AI-powered recipe parser that can extract recipe information from TikTok links:

1. **Click "New Recipe"** in the dashboard
2. **Paste a TikTok recipe link** in the "AI Recipe Parser" section
3. **Click "Parse Recipe"** to extract ingredients, steps, and other details
4. **Review and edit** the parsed information as needed
5. **Save your recipe** with all the extracted details

**Note:** This feature requires an OpenAI API key and will consume API credits based on usage.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Rich Text Editor:** TipTap
- **AI Integration:** OpenAI GPT-3.5 Turbo
- **Icons:** Lucide React

## Troubleshooting

### Common Issues

1. **"supabaseUrl is required" error:**
   - Make sure your `.env.local` file has the correct Supabase credentials
   - Restart the development server after adding environment variables

2. **"OpenAI API key not configured" error:**
   - Add your `OPENAI_API_KEY` to `.env.local`
   - Ensure you have credits in your OpenAI account

3. **Image upload fails:**
   - Check that the storage bucket is created in Supabase
   - Verify RLS policies are set correctly

4. **Styling issues:**
   - Clear the `.next` cache: `rm -rf .next`
   - Restart the development server

### Getting Help

- Check the browser console for error messages
- Verify all environment variables are set correctly
- Ensure your Supabase project is active and not paused
- Check that your OpenAI API key is valid and has credits

## Development

- **Build:** `npm run build`
- **Start production:** `npm start`
- **Lint:** `npm run lint`
- **Type check:** `npm run type-check`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
