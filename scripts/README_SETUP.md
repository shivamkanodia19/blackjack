# Supabase Database Setup Guide

## Quick Setup

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `kwxizhqopblmkaddxade`
3. **Navigate to SQL Editor**: Click on "SQL Editor" in the left sidebar
4. **Run the setup script**: 
   - Click "New query"
   - Copy and paste the contents of `scripts/setup_database.sql`
   - Click "Run" to execute the script

## What Gets Created

The setup script creates:

1. **`profiles` table**: User profile information
   - `id` (UUID, primary key)
   - `clerk_user_id` (text, unique) - For Clerk integration later
   - `name`, `email`, `avatar_url`
   - Timestamps

2. **`game_stats` table**: Game statistics per user
   - Tracks bankroll, hands played/won/lost/pushed
   - Strategy decision tracking
   - Streak tracking

3. **`game_sessions` table**: Individual game session history
   - Session start/end times
   - Bankroll changes per session
   - Net results

4. **Row Level Security (RLS)**: Enabled on all tables
   - Currently allows all operations (will be updated when Clerk is integrated)

5. **Triggers**: 
   - Auto-creates game stats when profile is created
   - Auto-updates `updated_at` timestamps

## Environment Variables

The `.env.local` file has been created with:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon public key

## Next Steps (When Integrating Clerk)

1. Update RLS policies to check Clerk user ID:
   \`\`\`sql
   -- Example for profiles
   create policy "profiles_select_own"
     on public.profiles for select
     using (auth.jwt() ->> 'clerk_user_id' = clerk_user_id);
   \`\`\`

2. Update the `handle_new_profile` function if needed

3. Update server actions to use Clerk user ID instead of Supabase auth

## Testing

After running the SQL script, you can test the connection by:
1. Restarting your dev server: `npm run dev`
2. The app should now be able to connect to Supabase
3. Database operations will work (though auth is disabled until Clerk is integrated)
