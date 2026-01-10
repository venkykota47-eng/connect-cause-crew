-- Add voice feedback metrics to mock_interview_feedback table
ALTER TABLE public.mock_interview_feedback
ADD COLUMN IF NOT EXISTS fluency_score integer,
ADD COLUMN IF NOT EXISTS grammar_score integer,
ADD COLUMN IF NOT EXISTS fear_reduction_score integer,
ADD COLUMN IF NOT EXISTS hesitation_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS words_per_minute integer,
ADD COLUMN IF NOT EXISTS voice_clarity_score integer;

-- Add voice_enabled column to mock_interview_sessions
ALTER TABLE public.mock_interview_sessions
ADD COLUMN IF NOT EXISTS voice_enabled boolean DEFAULT false;