-- Enable realtime for applications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;

-- Set REPLICA IDENTITY FULL for complete row data
ALTER TABLE public.applications REPLICA IDENTITY FULL;