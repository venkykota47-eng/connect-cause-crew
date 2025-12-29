-- Add email preferences columns to profiles
ALTER TABLE public.profiles
ADD COLUMN email_new_messages boolean DEFAULT true,
ADD COLUMN email_new_applications boolean DEFAULT true,
ADD COLUMN email_application_updates boolean DEFAULT true;

-- Allow system to insert notifications (via service role or triggers)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (user_owns_notification(user_id));