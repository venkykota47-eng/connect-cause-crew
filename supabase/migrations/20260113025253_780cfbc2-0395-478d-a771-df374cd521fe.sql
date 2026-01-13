-- Fix the overly permissive notifications INSERT policy
-- Allow users to only create notifications for themselves
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can create notifications for themselves"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);