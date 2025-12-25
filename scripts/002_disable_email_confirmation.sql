-- Disable email confirmation requirement
-- Note: This should be set in Supabase dashboard under Authentication > Providers > Email
-- Set "Confirm email" to disabled

-- This script ensures the trigger works even without email confirmation
-- The trigger will fire immediately upon signup

-- Verify the trigger exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        RAISE EXCEPTION 'Trigger on_auth_user_created does not exist. Please run 001_create_user_tables.sql first.';
    END IF;
END $$;
