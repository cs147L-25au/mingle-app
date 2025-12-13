-- Cleanup Script: Remove all activities, photos, and messages
-- This will delete all data created by users but keep profiles intact
-- Run this in your Supabase SQL Editor

-- Delete all messages (will be deleted automatically when chats are deleted, but doing explicitly for clarity)
DELETE FROM messages;

-- Delete all chat participants
DELETE FROM chat_participants;

-- Delete all chats
DELETE FROM chats;

-- Delete all event attendees
DELETE FROM event_attendees;

-- Delete all organizer ratings
DELETE FROM organizer_ratings;

-- Delete all user media (photos)
DELETE FROM user_media;

-- Delete all events (activities)
DELETE FROM events;

-- Verify cleanup
SELECT 'events' as table_name, COUNT(*) as remaining_rows FROM events
UNION ALL
SELECT 'user_media', COUNT(*) FROM user_media
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'chats', COUNT(*) FROM chats
UNION ALL
SELECT 'chat_participants', COUNT(*) FROM chat_participants
UNION ALL
SELECT 'event_attendees', COUNT(*) FROM event_attendees
UNION ALL
SELECT 'organizer_ratings', COUNT(*) FROM organizer_ratings
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;
