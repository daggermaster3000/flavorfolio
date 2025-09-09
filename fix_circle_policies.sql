-- Fix infinite recursion in circle_memberships policies
-- Run this SQL in your Supabase SQL Editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view memberships of their circles" ON circle_memberships;
DROP POLICY IF EXISTS "Users can view their invitations" ON circle_invitations;
DROP POLICY IF EXISTS "Circle members can invite others" ON circle_invitations;
DROP POLICY IF EXISTS "Circle members can view activities" ON circle_activities;
DROP POLICY IF EXISTS "Circle members can create activities" ON circle_activities;
DROP POLICY IF EXISTS "Circle members can view challenges" ON circle_challenges;
DROP POLICY IF EXISTS "Circle admins can create challenges" ON circle_challenges;

-- Create corrected policies without recursion

-- Allow users to view their own memberships
DROP POLICY IF EXISTS "Users can view their own memberships" ON circle_memberships;
CREATE POLICY "Users can view their own memberships" ON circle_memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to view memberships in circles they belong to (using a function to avoid recursion)
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

DROP POLICY IF EXISTS "Users can view memberships of circles they belong to" ON circle_memberships;
CREATE POLICY "Users can view memberships of circles they belong to" ON circle_memberships
  FOR SELECT USING (user_is_circle_member(circle_id, auth.uid()));

-- Circle invitations policies (fixed)
DROP POLICY IF EXISTS "Users can view their invitations" ON circle_invitations;
CREATE POLICY "Users can view their invitations" ON circle_invitations
  FOR SELECT USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

DROP POLICY IF EXISTS "Circle members can invite others" ON circle_invitations;
CREATE POLICY "Circle members can invite others" ON circle_invitations
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id AND
    user_is_circle_member(circle_id, auth.uid())
  );

-- Circle activities policies (fixed)
DROP POLICY IF EXISTS "Circle members can view activities" ON circle_activities;
CREATE POLICY "Circle members can view activities" ON circle_activities
  FOR SELECT USING (user_is_circle_member(circle_id, auth.uid()));

DROP POLICY IF EXISTS "Circle members can create activities" ON circle_activities;
CREATE POLICY "Circle members can create activities" ON circle_activities
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    user_is_circle_member(circle_id, auth.uid())
  );

-- Circle challenges policies (fixed)
DROP POLICY IF EXISTS "Circle members can view challenges" ON circle_challenges;
CREATE POLICY "Circle members can view challenges" ON circle_challenges
  FOR SELECT USING (user_is_circle_member(circle_id, auth.uid()));

-- Create function to check if user is admin/creator
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

DROP POLICY IF EXISTS "Circle admins can create challenges" ON circle_challenges;
CREATE POLICY "Circle admins can create challenges" ON circle_challenges
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    user_is_circle_admin(circle_id, auth.uid())
  );

-- Also fix the circles update policy
DROP POLICY IF EXISTS "Circle creators and admins can update circles" ON circles;

CREATE POLICY "Circle creators and admins can update circles" ON circles
  FOR UPDATE USING (user_is_circle_admin(id, auth.uid()));
