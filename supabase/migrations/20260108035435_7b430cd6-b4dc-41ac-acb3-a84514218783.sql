-- Create mock interview sessions table
CREATE TABLE public.mock_interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_role TEXT NOT NULL,
  company TEXT,
  difficulty TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  interview_type TEXT NOT NULL DEFAULT 'TECHNICAL' CHECK (interview_type IN ('TECHNICAL', 'HR', 'BEHAVIORAL', 'MIXED')),
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  overall_score INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mock interview messages table
CREATE TABLE public.mock_interview_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mock_interview_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('AI', 'STUDENT')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mock interview feedback table
CREATE TABLE public.mock_interview_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE REFERENCES public.mock_interview_sessions(id) ON DELETE CASCADE,
  communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 10),
  technical_score INTEGER CHECK (technical_score >= 1 AND technical_score <= 10),
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),
  problem_solving_score INTEGER CHECK (problem_solving_score >= 1 AND problem_solving_score <= 10),
  strengths TEXT[],
  improvements TEXT[],
  final_verdict TEXT CHECK (final_verdict IN ('READY', 'NEEDS_PRACTICE')),
  improvement_advice TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mock_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interview_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interview_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mock_interview_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.mock_interview_sessions 
FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = mock_interview_sessions.user_id));

CREATE POLICY "Users can create their own sessions" 
ON public.mock_interview_sessions 
FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = mock_interview_sessions.user_id));

CREATE POLICY "Users can update their own sessions" 
ON public.mock_interview_sessions 
FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = mock_interview_sessions.user_id));

-- RLS Policies for mock_interview_messages
CREATE POLICY "Users can view their session messages" 
ON public.mock_interview_messages 
FOR SELECT 
USING (session_id IN (
  SELECT id FROM public.mock_interview_sessions 
  WHERE user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
));

CREATE POLICY "Users can create messages for their sessions" 
ON public.mock_interview_messages 
FOR INSERT 
WITH CHECK (session_id IN (
  SELECT id FROM public.mock_interview_sessions 
  WHERE user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
));

-- RLS Policies for mock_interview_feedback
CREATE POLICY "Users can view their session feedback" 
ON public.mock_interview_feedback 
FOR SELECT 
USING (session_id IN (
  SELECT id FROM public.mock_interview_sessions 
  WHERE user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
));

CREATE POLICY "Users can create feedback for their sessions" 
ON public.mock_interview_feedback 
FOR INSERT 
WITH CHECK (session_id IN (
  SELECT id FROM public.mock_interview_sessions 
  WHERE user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
));

-- Create trigger for updating timestamps
CREATE TRIGGER update_mock_interview_sessions_updated_at
BEFORE UPDATE ON public.mock_interview_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();