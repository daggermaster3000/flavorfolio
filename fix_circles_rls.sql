-- Fix circles table RLS policies to allow proper access
-- Run this SQL in your Supabase SQL Editor

-- First, let's check what policies exist and drop them all to start fresh
DROP POLICY IF EXISTS "Public circles are viewable by everyone" ON circles;
DROP POLICY IF EXISTS "Private circles are viewable by members" ON circles;
DROP POLICY IF EXISTS "Users can create circles" ON circles;
DROP POLICY IF EXISTS "Circle creators and admins can update circles" ON circles;

-- Create simpler, working policies for circles table

-- 1. Allow everyone to view public circles
CREATE POLICY "Anyone can view public circles" ON circles
  FOR SELECT USING (type = 'public');

-- 2. Allow authenticated users to view all circles (for now, we'll restrict later)
CREATE POLICY "Authenticated users can view all circles" ON circles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Allow authenticated users to create circles
CREATE POLICY "Authenticated users can create circles" ON circles
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Also ensure we have proper INSERT policies for circle_memberships
DROP POLICY IF EXISTS "Users can create memberships" ON circle_memberships;
CREATE POLICY "Users can create memberships" ON circle_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Allow circle creators to update their circles
CREATE POLICY "Circle creators can update their circles" ON circles
  FOR UPDATE USING (auth.uid() = created_by);

-- Also ensure the helper functions exist
CREATE OR REPLACE FUNCTION user_is_circle_member(circle_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM circle_memberships 
    WHERE circle_id = circle_uuid 
    AND user_id = user_uuid 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_is_circle_admin(circle_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM circle_memberships 
    WHERE circle_id = circle_uuid 
    AND user_id = user_uuid 
    AND role IN ('creator', 'admin') 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix circle_memberships policies to be less restrictive initially
DROP POLICY IF EXISTS "Users can view their own memberships" ON circle_memberships;
DROP POLICY IF EXISTS "Users can view memberships of circles they belong to" ON circle_memberships;
DROP POLICY IF EXISTS "Users can join circles" ON circle_memberships;
DROP POLICY IF EXISTS "Users can leave circles" ON circle_memberships;

-- Simpler membership policies
CREATE POLICY "Users can view all memberships" ON circle_memberships
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create memberships" ON circle_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships" ON circle_memberships
  FOR UPDATE USING (auth.uid() = user_id);

-- Test query to verify access
-- You can run this after the above to test:
-- SELECT id, name, type FROM circles LIMIT 5;
