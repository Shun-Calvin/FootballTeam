-- Enable RLS

-- Create users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL, -- Keeping username for display/unique identifier, but email will be for login
  email VARCHAR(255) UNIQUE NOT NULL, -- New: Email for login
  full_name VARCHAR(100) NOT NULL,
  jersey_number INTEGER,
  position VARCHAR(50),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  home_jersey_color VARCHAR(50),
  away_jersey_color VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent_team VARCHAR(100) NOT NULL,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(200) NOT NULL,
  home_jersey_color VARCHAR(50),
  away_jersey_color VARCHAR(50),
  is_home_game BOOLEAN DEFAULT true,
  video_link TEXT,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, ongoing, completed, cancelled
  final_score_home INTEGER DEFAULT 0,
  final_score_away INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_participants table
CREATE TABLE IF NOT EXISTS match_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined
  is_key_player BOOLEAN DEFAULT false,
  position_played VARCHAR(50),
  minutes_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- Create match_events table
CREATE TABLE IF NOT EXISTS match_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id),
  event_type VARCHAR(50) NOT NULL, -- goal, assist, yellow_card, red_card, substitution, water_break, halftime, game_start, game_end
  event_time INTEGER NOT NULL, -- minutes from start
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_ratings table
CREATE TABLE IF NOT EXISTS player_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  rated_player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rater_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, rated_player_id, rater_id)
);

-- Create availability table
CREATE TABLE IF NOT EXISTS availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  event_type VARCHAR(50) DEFAULT 'training', -- training, match
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, date, event_type)
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- Allow anon role to insert their own profile after signup, matching auth.uid() and auth.email()
CREATE POLICY "Allow anon insert for own profile" ON profiles FOR INSERT TO anon WITH CHECK (id = auth.uid() AND email = auth.email());


CREATE POLICY "Users can view all teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Users can create teams" ON teams FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view all matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Users can create matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update matches they created" ON matches FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can view all match participants" ON match_participants FOR SELECT USING (true);
CREATE POLICY "Users can manage match participants" ON match_participants FOR ALL USING (true);

CREATE POLICY "Users can view all match events" ON match_events FOR SELECT USING (true);
CREATE POLICY "Users can create match events" ON match_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view all player ratings" ON player_ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings" ON player_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "Users can update own ratings" ON player_ratings FOR UPDATE USING (auth.uid() = rater_id);

CREATE POLICY "Users can manage own availability" ON availability FOR ALL USING (auth.uid() = player_id);
CREATE POLICY "Users can view all availability" ON availability FOR SELECT USING (true);
