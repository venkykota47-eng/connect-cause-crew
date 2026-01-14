-- Harden profiles SELECT policy to explicitly require authentication
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.profiles;

CREATE POLICY "Users can view their own full profile"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- (Optional hardening) Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;