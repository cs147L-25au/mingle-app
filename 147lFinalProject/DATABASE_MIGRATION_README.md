# Database Migration: Fix for Completed Activities

## Problem
When attendees marked activities as complete, the activities were being removed from their profile entirely instead of appearing in the "Completed Activities" section.

## Solution
Added a `completed` boolean column to the `event_attendees` table to track completion status without removing the attendee record.

## How to Apply This Migration

### Step 1: Run the Migration SQL

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** (left sidebar)
3. Create a new query
4. Copy and paste the contents of `migration_add_completed_to_attendees.sql`
5. Click **Run** to execute the migration

The migration will:
- Add a `completed` column to the `event_attendees` table
- Set all existing records to `completed = FALSE`
- Add an index for better query performance

### Step 2: Fix Missing Organizers

Some activities may be missing organizers from the event_attendees table. Run this to fix all of them:

```sql
-- Add all missing organizers to event_attendees
INSERT INTO event_attendees (event_id, user_id, completed)
SELECT e.id, e.organizer_id::uuid, false
FROM events e
WHERE NOT EXISTS (
  SELECT 1
  FROM event_attendees ea
  WHERE ea.event_id = e.id
  AND ea.user_id = e.organizer_id::uuid
)
ON CONFLICT (event_id, user_id) DO NOTHING;
```

### Step 3: Verify the Migration

After running the migration, you can verify it worked by running this query:

```sql
SELECT * FROM event_attendees LIMIT 5;
```

You should see a `completed` column in the results.

## What Changed in the Code

### Database Schema (`supabase_schema.sql`)
- Added `event_attendees` table definition with `completed` column

### Profile Page (`app/tabs/profile.tsx`)
- **Activity Interface**: Added `attendee_completed` and `organizer_id` fields
- **Completion Logic**: Now sets `completed = true` instead of deleting the attendee record
- **Fetch Logic**: Retrieves completion status for each activity
- **Helper Function**: `isActivityCompleted()` checks completion for both organizers and attendees
- **Filter Logic**: Shows activities in "Pending" or "Completed" based on:
  - Organizers: Event status (`status` column)
  - Attendees: Completion flag (`completed` column in event_attendees)
- **Sign-out Feature**: Added sign-out button for users without complete profiles

## Testing

After applying the migration:

1. Join an event as an attendee
2. Go to your Profile tab
3. Mark the activity as complete
4. The activity should now appear in your "Completed Activities" section
5. You can mark it as pending again to move it back to "Pending Activities"

## Rollback (if needed)

If you need to rollback this change:

```sql
-- Remove the completed column
ALTER TABLE event_attendees DROP COLUMN IF EXISTS completed;

-- Drop the index
DROP INDEX IF EXISTS idx_event_attendees_completed;
```

**Note**: Rollback will require reverting the code changes as well.
