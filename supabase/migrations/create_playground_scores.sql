-- ======================================================
-- Playground Scores Table
-- Persists game scores for the Playground feature
-- ======================================================

-- Create the playground_scores table
CREATE TABLE IF NOT EXISTS playground_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL,        -- 'trivia', 'wheel', 'memory', 'typerace', 'roles', 'simulator', 'xoxo'
  score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE playground_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own scores
CREATE POLICY "Users can view own scores"
  ON playground_scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own scores
CREATE POLICY "Users can insert own scores"
  ON playground_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view all scores for the leaderboard
CREATE POLICY "Users can view all scores for leaderboard"
  ON playground_scores
  FOR SELECT
  USING (true);

-- Index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_playground_scores_user_id ON playground_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_scores_total_score ON playground_scores(total_score DESC);
