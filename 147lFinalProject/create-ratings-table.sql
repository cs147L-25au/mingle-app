-- Create organizer_ratings table
CREATE TABLE IF NOT EXISTS organizer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL,
  rater_id UUID NOT NULL,
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, rater_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_organizer_ratings_organizer ON organizer_ratings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_ratings_event ON organizer_ratings(event_id);
