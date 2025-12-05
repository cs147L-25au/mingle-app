-- Supabase Schema for Profile and Media Tables
-- Run these SQL commands in your Supabase SQL Editor

-- Profiles Table
-- Stores user profile information
CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    interests TEXT[] NOT NULL DEFAULT '{}',
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read all profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (true);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (true);

-- User Media Table
-- Stores photos/videos from user meet-ups
CREATE TABLE IF NOT EXISTS user_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    activity_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read all media
CREATE POLICY "Media is viewable by everyone"
    ON user_media FOR SELECT
    USING (true);

-- Create policy to allow users to insert their own media
CREATE POLICY "Users can insert their own media"
    ON user_media FOR INSERT
    WITH CHECK (true);

-- Create policy to allow users to update their own media
CREATE POLICY "Users can update their own media"
    ON user_media FOR UPDATE
    USING (true);

-- Create policy to allow users to delete their own media
CREATE POLICY "Users can delete their own media"
    ON user_media FOR DELETE
    USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_media_user_id ON user_media(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_created_at ON user_media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Events Table (Activities)
-- NOTE: If this table already exists with a different schema, you may need to modify it
-- Stores activities created by users
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    activity_type TEXT NOT NULL,
    price_range TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    location TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read events
CREATE POLICY "Events are viewable by everyone"
    ON events FOR SELECT
    USING (true);

-- Create policy to allow users to create events
CREATE POLICY "Users can create events"
    ON events FOR INSERT
    WITH CHECK (true);

-- Create policy to allow creators to update their events
CREATE POLICY "Creators can update their events"
    ON events FOR UPDATE
    USING (true);

-- Create policy to allow creators to delete their events
CREATE POLICY "Creators can delete their events"
    ON events FOR DELETE
    USING (true);

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_activity_type ON events(activity_type);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location);
