# Supabase Project Setup Guide

## If You Can't Find Your Supabase Project

### Option 1: Create a New Supabase Project

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Sign in** with your account (or create one if needed)
3. **Click "New Project"**
4. **Fill in project details**:
   - Organization: Select or create one
   - Name: `blackjack` (or any name you prefer)
   - Database Password: Choose a strong password (save it!)
   - Region: Choose closest to you
   - Pricing Plan: Free tier is fine for development
5. **Click "Create new project"** (takes 1-2 minutes)

### Option 2: Find Your Existing Project

1. **Check all organizations**:
   - In Supabase dashboard, check if you have multiple organizations
   - Switch between organizations in the top-left dropdown
   
2. **Search by project name**:
   - Look for projects named "blackjack" or similar
   
3. **Check your email**:
   - Look for Supabase welcome emails that might have project links
   
4. **Try the project ID from README**:
   - The setup docs mention project ID: `kwxizhqopblmkaddxade`
   - Try going to: `https://supabase.com/dashboard/project/kwxizhqopblmkaddxade`

## After You Have a Project

### Step 1: Get Your Project Credentials

1. Go to your project dashboard
2. Click on **Settings** (gear icon) in the left sidebar
3. Click on **API** under Project Settings
4. You'll find:
   - **Project URL**: Something like `https://xxxxx.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`

### Step 2: Create .env.local File

Create a file named `.env.local` in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Replace the values with your actual project URL and anon key from Step 1.

### Step 3: Disable Email Confirmation

1. In your Supabase project dashboard
2. Go to **Authentication** → **Providers** (in left sidebar)
3. Click on **Email**
4. Find **"Confirm email"** toggle
5. **Turn it OFF**
6. Click **Save**

### Step 4: Set Up Database

1. Go to **SQL Editor** in left sidebar
2. Click **New query**
3. Copy and paste the contents of `scripts/setup_database.sql`
4. Click **Run** (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

## Verify Setup

1. Restart your development server: `npm run dev` or `pnpm dev`
2. Try accessing the app
3. If you see errors about missing env variables, make sure `.env.local` is in the project root

## Troubleshooting

- **Can't find project**: Create a new one - it's free and takes 2 minutes
- **Wrong account**: Make sure you're logged into the correct Supabase account
- **Missing credentials**: They're in Settings → API in your project dashboard
- **Environment variables not working**: Make sure `.env.local` is in the project root, not in a subfolder

