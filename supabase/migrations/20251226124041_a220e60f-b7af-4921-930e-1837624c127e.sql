-- Create a helper function to check if user owns a profile ID (for messages)
CREATE OR REPLACE FUNCTION public.user_owns_profile(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = profile_id
      AND profiles.user_id = auth.uid()
  )
$$;

-- Drop existing message policies
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;

-- Recreate policies using the security definer function
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (public.user_owns_profile(sender_id));

CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (
  public.user_owns_profile(sender_id) OR 
  public.user_owns_profile(receiver_id)
);

CREATE POLICY "Users can update their received messages"
ON public.messages
FOR UPDATE
USING (public.user_owns_profile(receiver_id));