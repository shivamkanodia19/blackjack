# Disable Email Confirmation in Supabase

To remove the email confirmation requirement for sign-ups, you need to disable it in your Supabase dashboard:

## Steps:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Click on **Email**
4. Find the **"Confirm email"** toggle
5. **Turn it OFF** (disable it)
6. Save the changes

## What this does:

- Users will be signed up and signed in immediately after registration
- No confirmation email will be sent
- No email verification step is required
- The user's account is active right away

## Note:

The code in `app/auth/sign-up/page.tsx` is already configured to work without email confirmation. Once you disable email confirmation in the Supabase dashboard, sign-ups will work immediately without requiring email verification.

