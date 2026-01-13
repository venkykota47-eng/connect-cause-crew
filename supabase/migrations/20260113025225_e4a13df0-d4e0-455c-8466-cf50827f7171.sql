-- Update the NGO profiles policy to require authentication
DROP POLICY IF EXISTS "Users can view NGO profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view NGO profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND role = 'ngo'::user_role
);

-- Update the volunteer profiles policy to also require authentication (it already checks for NGO ownership)
DROP POLICY IF EXISTS "NGOs can view volunteer profiles who applied to their opportunities" ON public.profiles;

CREATE POLICY "NGOs can view volunteer profiles who applied to their opportunities"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND role = 'volunteer'::user_role
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    JOIN profiles ngo_profile ON o.ngo_id = ngo_profile.id
    WHERE a.volunteer_id = profiles.id
    AND ngo_profile.user_id = auth.uid()
  )
);