export interface Circle {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'themed';
  theme?: string;
  cover_image_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  recipe_count: number;
}

export interface CircleMembership {
  id: string;
  circle_id: string;
  user_id: string;
  role: 'creator' | 'admin' | 'member';
  joined_at: string;
  invited_by?: string;
  status: 'active' | 'pending' | 'left';
}

export interface CircleInvitation {
  id: string;
  circle_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  expires_at: string;
}

export interface CircleActivity {
  id: string;
  circle_id: string;
  user_id: string;
  activity_type: 'recipe_posted' | 'member_joined' | 'challenge_created' | 'recipe_liked';
  related_id?: string; // recipe_id, challenge_id, etc.
  created_at: string;
}

export interface CircleChallenge {
  id: string;
  circle_id: string;
  created_by: string;
  title: string;
  description: string;
  theme: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  participant_count: number;
}

export interface Member {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  role: 'creator' | 'admin' | 'member';
  joined_at: string;
  circle_id?: string;
  circle_name?: string;
  circle_type?: string;
}

// SQL Schema for Supabase
export const CIRCLES_SQL_SCHEMA = `
-- Circles table
CREATE TABLE circles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'public' CHECK (type IN ('public', 'private', 'themed')),
  theme VARCHAR(50),
  cover_image_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  member_count INTEGER DEFAULT 1,
  recipe_count INTEGER DEFAULT 0
);

-- Circle memberships table
CREATE TABLE circle_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES profiles(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'left')),
  UNIQUE(circle_id, user_id)
);

-- Circle invitations table
CREATE TABLE circle_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(circle_id, invitee_id)
);

-- Circle activities table
CREATE TABLE circle_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circle challenges table
CREATE TABLE circle_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  theme VARCHAR(100),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add circle_id to recipes table for circle-specific recipes
ALTER TABLE recipes ADD COLUMN circle_id UUID REFERENCES circles(id);

-- RLS Policies
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_challenges ENABLE ROW LEVEL SECURITY;

-- Circles policies
CREATE POLICY "Public circles are viewable by everyone" ON circles
  FOR SELECT USING (type = 'public');

CREATE POLICY "Private circles are viewable by members" ON circles
  FOR SELECT USING (
    type = 'private' AND id IN (
      SELECT circle_id FROM circle_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create circles" ON circles
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Circle creators and admins can update circles" ON circles
  FOR UPDATE USING (
    id IN (
      SELECT circle_id FROM circle_memberships 
      WHERE user_id = auth.uid() AND role IN ('creator', 'admin') AND status = 'active'
    )
  );

-- Circle memberships policies
CREATE POLICY "Users can view memberships of their circles" ON circle_memberships
  FOR SELECT USING (
    circle_id IN (
      SELECT circle_id FROM circle_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can join circles" ON circle_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave circles" ON circle_memberships
  FOR UPDATE USING (auth.uid() = user_id);

-- Circle invitations policies
CREATE POLICY "Users can view their invitations" ON circle_invitations
  FOR SELECT USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Circle members can invite others" ON circle_invitations
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id AND
    circle_id IN (
      SELECT circle_id FROM circle_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Circle activities policies
CREATE POLICY "Circle members can view activities" ON circle_activities
  FOR SELECT USING (
    circle_id IN (
      SELECT circle_id FROM circle_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Circle members can create activities" ON circle_activities
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    circle_id IN (
      SELECT circle_id FROM circle_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Circle challenges policies
CREATE POLICY "Circle members can view challenges" ON circle_challenges
  FOR SELECT USING (
    circle_id IN (
      SELECT circle_id FROM circle_memberships 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Circle admins can create challenges" ON circle_challenges
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    circle_id IN (
      SELECT circle_id FROM circle_memberships 
      WHERE user_id = auth.uid() AND role IN ('creator', 'admin') AND status = 'active'
    )
  );

-- Indexes for performance
CREATE INDEX idx_circles_type ON circles(type);
CREATE INDEX idx_circles_created_by ON circles(created_by);
CREATE INDEX idx_circle_memberships_user_id ON circle_memberships(user_id);
CREATE INDEX idx_circle_memberships_circle_id ON circle_memberships(circle_id);
CREATE INDEX idx_circle_memberships_status ON circle_memberships(status);
CREATE INDEX idx_circle_invitations_invitee_id ON circle_invitations(invitee_id);
CREATE INDEX idx_circle_activities_circle_id ON circle_activities(circle_id);
CREATE INDEX idx_circle_activities_created_at ON circle_activities(created_at);
CREATE INDEX idx_recipes_circle_id ON recipes(circle_id);

-- Functions to update counters
CREATE OR REPLACE FUNCTION update_circle_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE circles SET member_count = member_count + 1 WHERE id = NEW.circle_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' THEN
    UPDATE circles SET member_count = member_count + 1 WHERE id = NEW.circle_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active' THEN
    UPDATE circles SET member_count = member_count - 1 WHERE id = NEW.circle_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE circles SET member_count = member_count - 1 WHERE id = OLD.circle_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_circle_member_count
  AFTER INSERT OR UPDATE OR DELETE ON circle_memberships
  FOR EACH ROW EXECUTE FUNCTION update_circle_member_count();

CREATE OR REPLACE FUNCTION update_circle_recipe_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.circle_id IS NOT NULL THEN
    UPDATE circles SET recipe_count = recipe_count + 1 WHERE id = NEW.circle_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.circle_id IS DISTINCT FROM NEW.circle_id THEN
    IF OLD.circle_id IS NOT NULL THEN
      UPDATE circles SET recipe_count = recipe_count - 1 WHERE id = OLD.circle_id;
    END IF;
    IF NEW.circle_id IS NOT NULL THEN
      UPDATE circles SET recipe_count = recipe_count + 1 WHERE id = NEW.circle_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.circle_id IS NOT NULL THEN
    UPDATE circles SET recipe_count = recipe_count - 1 WHERE id = OLD.circle_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_circle_recipe_count
  AFTER INSERT OR UPDATE OR DELETE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_circle_recipe_count();
`;
