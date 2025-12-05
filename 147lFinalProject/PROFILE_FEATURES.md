# Profile Features Documentation

## Overview
This document describes the newly implemented profile features for the meet-up activities app.

## Features Implemented

### 1. Create Profile Screen (`/create-profile`)
A dedicated onboarding screen for new users to set up their profile.

**Features:**
- **Name Input**: Required field for user's display name (max 50 characters)
- **Bio Input**: Optional bio section (max 200 characters) with character counter
- **Interest Selection**: Multi-select chips for activity interests
  - Food & Dining
  - Hiking
  - Movies
  - Concerts
  - Sports
  - Gaming
  - Art & Museums
  - Coffee & Cafes
- **Validation**: Ensures name and at least one interest is selected
- **Supabase Integration**: Saves profile to `profiles` table

**How to Access:**
- Navigate to `/create-profile` route
- Or tap "Create Profile" button on the Profile tab when no profile exists

### 2. My Profile Page (`/(tabs)/profile`)
A comprehensive profile page with display, editing, and media gallery features.

**Features:**

#### Profile Display Section
- **Profile Picture**: Circular avatar with user's initial
- **Name & Bio**: Display user information
- **Interest Tags**: Visual chips showing selected interests
- **Edit Profile Button**: Opens modal to edit profile information

#### Edit Profile Modal
- Update name and bio
- Cancel or Save changes
- Real-time Supabase updates

#### Meet-ups Gallery Section
- **Grid Layout**: 2-column responsive grid for photos
- **Add Media Button**: Upload photos from meet-ups
- **Image Display**: Shows images with optional captions
- **Empty State**: Friendly message when no photos exist

#### Add Media Modal
- **Image URL Input**: Enter image URL
- **Caption Input**: Optional caption for the photo
- **Supabase Integration**: Saves to `user_media` table

**How to Access:**
- Tap the "Profile" tab in the bottom navigation

## Database Schema

### Required Supabase Tables

Run the SQL commands in `supabase_schema.sql` to create the necessary tables:

#### 1. `profiles` Table
```sql
- user_id (TEXT, PRIMARY KEY)
- name (TEXT, NOT NULL)
- bio (TEXT)
- interests (TEXT[], NOT NULL)
- profile_picture_url (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. `user_media` Table
```sql
- id (UUID, PRIMARY KEY)
- user_id (TEXT, NOT NULL)
- media_url (TEXT, NOT NULL)
- media_type (TEXT, CHECK: 'image' or 'video')
- caption (TEXT)
- activity_id (TEXT)
- created_at (TIMESTAMP)
```

## Setup Instructions

### 1. Create Database Tables
1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `supabase_schema.sql`
4. Run the SQL commands

### 2. Test the Features
1. Start the Expo development server: `npm start`
2. Open the app in Expo Go
3. Navigate to the Profile tab
4. Create a new profile
5. Edit profile information
6. Add media to your gallery

## User Flow

### First-Time User
1. User opens app for the first time
2. Navigates to Profile tab
3. Sees "No Profile Found" message
4. Taps "Create Profile" button
5. Fills in name, bio, and selects interests
6. Taps "Create Profile"
7. Redirected to completed profile page

### Existing User
1. User opens Profile tab
2. Sees their profile information
3. Can edit profile by tapping "Edit Profile"
4. Can add photos by tapping "+ Add" in gallery section
5. Views photo gallery with all their meet-up photos

## Technical Details

### State Management
- Uses React hooks (`useState`, `useEffect`) for local state
- Async/await for Supabase operations
- Loading states with ActivityIndicator

### Styling
- Consistent with existing app design (blue: #007AFF)
- Responsive layouts
- Modal overlays for editing
- Grid layout for gallery

### Error Handling
- Alert dialogs for user feedback
- Console error logging for debugging
- Graceful handling of missing data
- Supabase error code handling (PGRST116 for no rows)

### Navigation
- Uses `expo-router` for navigation
- Push navigation to create-profile
- Replace navigation after profile creation
- Tab navigation for main screens

## Current User ID
The app currently uses a hardcoded test user ID: `test_user_id_A`

**To change this:**
1. Update `CURRENT_USER_ID` constant in:
   - `app/create-profile.tsx`
   - `app/(tabs)/profile.tsx`
   - `app/(tabs)/messages/index.tsx`
   - `app/(tabs)/messages/[chat_id].tsx`

**For production:**
- Implement proper authentication (e.g., Supabase Auth)
- Replace hardcoded ID with authenticated user ID
- Add user context/provider for global user state

## Existing Functionalities Preserved

All existing functionalities remain intact:

✅ **Map Tab** - Activity map placeholder (ready for implementation)
✅ **Feed Tab** - Feed placeholder (ready for implementation)
✅ **Messages Tab** - Real-time messaging with Supabase
  - Chat list view
  - Individual chat rooms
  - Real-time message updates
  - Send/receive messages
✅ **Navigation** - Tab-based navigation working
✅ **Supabase Integration** - Database connection working

## Future Enhancements

Potential improvements for the profile features:

1. **Profile Picture Upload**:
   - Use Expo ImagePicker
   - Upload to Supabase Storage
   - Display actual photos instead of initials

2. **Activity History**:
   - Link media to specific activities
   - Show completed activities count
   - Activity timeline view

3. **Edit Interests**:
   - Allow editing interests after profile creation
   - Add custom interests

4. **Delete Media**:
   - Long press to delete photos
   - Confirmation dialog

5. **Media Detail View**:
   - Full-screen image view
   - Swipe through gallery
   - Show activity details

6. **Privacy Settings**:
   - Control profile visibility
   - Public/private toggle

## Testing Checklist

- [ ] Create a new profile with all fields
- [ ] Create a profile with only required fields
- [ ] View profile information
- [ ] Edit profile name
- [ ] Edit profile bio
- [ ] Add a photo with caption
- [ ] Add a photo without caption
- [ ] View multiple photos in gallery
- [ ] Navigate between tabs
- [ ] Check messages still work
- [ ] Verify Supabase data storage

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify Supabase tables exist
3. Check Supabase credentials in `.env`
4. Ensure network connection is active
