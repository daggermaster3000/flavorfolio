-- Fix circle creation issues - simplified policies for testing
-- Run this SQL in your Supabase SQL Editor

-- Temporarily disable RLS to test if that's the issue
ALTER TABLE circles DISABLE ROW LEVEL SECURITY;
ALTER TABLE circle_memberships DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with very permissive policies
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_memberships ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view public circles" ON circles;
DROP POLICY IF EXISTS "Authenticated users can view all circles" ON circles;
DROP POLICY IF EXISTS "Authenticated users can create circles" ON circles;
DROP POLICY IF EXISTS "Circle creators can update their circles" ON circles;
DROP POLICY IF EXISTS "Users can view all memberships" ON circle_memberships;
DROP POLICY IF EXISTS "Users can create memberships" ON circle_memberships;
DROP POLICY IF EXISTS "Users can update their own memberships" ON circle_memberships;

-- Create very simple, permissive policies for testing
CREATE POLICY "Allow all authenticated users to do everything on circles" ON circles
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to do everything on memberships" ON circle_memberships
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Add policies for invitations table
ALTER TABLE circle_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all authenticated users to do everything on invitations" ON circle_invitations;
CREATE POLICY "Allow all authenticated users to do everything on invitations" ON circle_invitations
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Add policies for activities table  
ALTER TABLE circle_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all authenticated users to do everything on activities" ON circle_activities;
CREATE POLICY "Allow all authenticated users to do everything on activities" ON circle_activities
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Test the creation process with a simple query:
-- INSERT INTO circles (name, description, type, created_by) 
-- VALUES ('Test Circle', 'Test Description', 'public', auth.uid());
