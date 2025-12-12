-- Migration: Add completed column to event_attendees table
-- Run this in your Supabase SQL Editor if you already have an existing event_attendees table

-- Add completed column if it doesn't exist
ALTER TABLE event_attendees
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;

-- Add index for the completed column
CREATE INDEX IF NOT EXISTS idx_event_attendees_completed ON event_attendees(completed);

-- Update existing records to have completed = false
UPDATE event_attendees SET completed = FALSE WHERE completed IS NULL;
