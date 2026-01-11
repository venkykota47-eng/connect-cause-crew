import { useState, useRef, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceInterview } from "@/hooks/useVoiceInterview";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import {
  MessageCircle,
  Send,
  Play,
  Square,
  Download,
  User,
  Bot,
  Briefcase,
  Target,
  Award,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  History,
  Star,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Heart,
  BookOpen,
  BarChart3,
  Brain,
  Zap,
  Clock,
  Languages,
  GraduationCap,
  Building2,
  Calendar,
} from "lucide-react";
import { PDFReportGenerator } from "@/components/interview/PDFReportGenerator";
import { StudyTimetablePlanner } from "@/components/interview/StudyTimetablePlanner";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type InterviewType = "TECHNICAL" | "HR" | "BEHAVIORAL" | "MIXED" | "ENGLISH_COMMUNICATION" | "CONFIDENCE_BUILDING" | "APTITUDE_GOVERNMENT" | "APTITUDE_IT";
type SessionStatus = "idle" | "configuring" | "in_progress" | "generating_feedback" | "completed";

interface Message {
  id: string;
  sender: "AI" | "STUDENT";
  content: string;
  timestamp: Date;
}

interface VoiceFeedback {
  fluencyScore: number;
  grammarScore: number;
  fearReductionScore: number;
  hesitationCount: number;
  wordsPerMinute: number;
  voiceClarityScore: number;
}

interface Feedback {
  communication: number;
  technical: number;
  confidence: number;
  problemSolving: number;
  strengths: string[];
  improvements: string[];
  finalVerdict: "READY" | "NEEDS_PRACTICE";
  improvementAdvice: string;
  voiceFeedback?: VoiceFeedback;
}

interface InterviewSession {
  id: string;
  job_role: string;
  company: string | null;
  difficulty: Difficulty;
  interview_type: InterviewType;
  status: string;
  overall_score: number | null;
  started_at: string;
  ended_at: string | null;
  voice_enabled?: boolean;
}

interface InterviewFeedback {
  id: string;
  session_id: string;
  communication_score: number | null;
  technical_score: number | null;
  confidence_score: number | null;
  problem_solving_score: number | null;
  fluency_score: number | null;
  grammar_score: number | null;
  fear_reduction_score: number | null;
  hesitation_count: number | null;
  words_per_minute: number | null;
  voice_clarity_score: number | null;
  created_at: string;
}

const MockInterview = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Configuration state
  const [jobRole, setJobRole] = useState("");
  const [company, setCompany] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [interviewType, setInterviewType] = useState<InterviewType>("TECHNICAL");
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice enabled by default
  const [readQuestionsAloud, setReadQuestionsAloud] = useState(true); // Optional TTS for questions
  
  // Session state
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  
  // Voice metrics tracking
  const [voiceStartTime, setVoiceStartTime] = useState<number | null>(null);
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [hesitationCount, setHesitationCount] = useState(0);
  
  // History state
  const [pastSessions, setPastSessions] = useState<InterviewSession[]>([]);
  const [pastFeedbacks, setPastFeedbacks] = useState<InterviewFeedback[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Voice interview hook
  const {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported: voiceSupported,
    error: voiceError,
  } = useVoiceInterview({
    onTranscript: (text) => {
      if (voiceEnabled && sessionStatus === "in_progress") {
        setInputMessage(text);
        // Track word count for WPM calculation
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        setTotalWordCount(prev => prev + words.length);
        // Detect hesitations (repeated words, filler words)
        const hesitations = (text.match(/\b(um|uh|er|like|you know|basically)\b/gi) || []).length;
        if (hesitations > 0) {
          setHesitationCount(prev => prev + hesitations);
        }
      }
    },
    onSpeechEnd: () => {
      // Auto-submit when speech ends in voice mode
      if (voiceEnabled && sessionStatus === "in_progress" && inputMessage.trim()) {
        setTimeout(() => {
          sendMessage();
        }, 500);
      }
    },
  });

  // Show voice error
  useEffect(() => {
    if (voiceError) {
      toast({
        title: "Voice Error",
        description: voiceError,
        variant: "destructive",
      });
    }
  }, [voiceError, toast]);

  useEffect(() => {
    if (profile?.id) {
      fetchPastSessions();
      fetchPastFeedbacks();
    }
  }, [profile?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchPastSessions = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("mock_interview_sessions")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPastSessions((data as InterviewSession[]) || []);
    } catch (error) {
      console.error("Error fetching past sessions:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchPastFeedbacks = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("mock_interview_feedback")
        .select(`
          *,
          mock_interview_sessions!inner(user_id)
        `)
        .eq("mock_interview_sessions.user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPastFeedbacks((data as unknown as InterviewFeedback[]) || []);
    } catch (error) {
      console.error("Error fetching past feedbacks:", error);
    }
  };

  const startInterview = async () => {
    if (!jobRole.trim()) {
      toast({
        title: "Job Role Required",
        description: "Please enter a job role to start the interview.",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start a mock interview.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSessionStatus("configuring");
    setVoiceStartTime(Date.now());
    setTotalWordCount(0);
    setHesitationCount(0);

    try {
      // Create session in database
      const { data: session, error: sessionError } = await supabase
        .from("mock_interview_sessions")
        .insert({
          user_id: profile.id,
          job_role: jobRole,
          company: company || null,
          difficulty,
          interview_type: interviewType,
          status: "IN_PROGRESS",
          voice_enabled: voiceEnabled,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSessionId(session.id);
      setSessionStatus("in_progress");

      // Get initial AI message
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          type: "interview",
          messages: [],
          jobRole,
          company,
          difficulty,
          interviewType,
          voiceEnabled,
        },
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: "AI",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages([aiMessage]);

      // Save AI message to database
      await supabase.from("mock_interview_messages").insert({
        session_id: session.id,
        sender: "AI",
        message: data.message,
      });

      // Speak AI message if read aloud is enabled
      if (readQuestionsAloud && voiceSupported) {
        speak(data.message);
      }

      toast({
        title: voiceEnabled ? "Voice Interview Started" : "Interview Started",
        description: voiceEnabled 
          ? "Click the microphone to answer when ready."
          : "Good luck! Answer the interviewer's questions.",
      });

    } catch (error) {
      console.error("Error starting interview:", error);
      toast({
        title: "Failed to Start Interview",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setSessionStatus("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !sessionId) return;

    const messageText = inputMessage;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "STUDENT",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Save user message to database
      await supabase.from("mock_interview_messages").insert({
        session_id: sessionId,
        sender: "STUDENT",
        message: messageText,
      });

      // Check if user wants to end the interview
      const lowerInput = messageText.toLowerCase();
      const wantsToEnd = lowerInput.includes("end interview") || 
                         lowerInput.includes("stop interview") ||
                         lowerInput.includes("finish interview") ||
                         lowerInput.includes("that's all") ||
                         lowerInput.includes("i'm done");

      // Get AI response
      const allMessages = [...messages, userMessage].map((m) => ({
        role: m.sender,
        content: m.content,
      }));

      if (wantsToEnd) {
        allMessages.push({ role: "STUDENT", content: "I would like to end the interview now." });
      }

      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          type: "interview",
          messages: allMessages,
          jobRole,
          company,
          difficulty,
          interviewType,
          voiceEnabled,
        },
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: "AI",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Save AI message to database
      await supabase.from("mock_interview_messages").insert({
        session_id: sessionId,
        sender: "AI",
        message: data.message,
      });

      // Speak AI message if read aloud is enabled
      if (readQuestionsAloud && voiceSupported) {
        speak(data.message);
      }

      // Check if interview is completed
      if (data.message.includes("INTERVIEW_COMPLETED") || wantsToEnd) {
        await endInterview([...messages, userMessage, aiMessage]);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to Send Message",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
  };

  const endInterview = async (conversationMessages?: Message[]) => {
    if (!sessionId) return;

    setSessionStatus("generating_feedback");
    setIsLoading(true);

    // Calculate voice metrics
    const duration = voiceStartTime ? (Date.now() - voiceStartTime) / 60000 : 5; // minutes
    const wpm = Math.round(totalWordCount / Math.max(duration, 1));

    try {
      const conversation = (conversationMessages || messages).map((m) => ({
        role: m.sender,
        content: m.content,
      }));

      // Get feedback from AI
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          type: "feedback",
          conversation,
          jobRole,
          company,
          difficulty,
          interviewType,
          voiceEnabled,
          voiceMetrics: voiceEnabled ? {
            hesitationCount,
            wordsPerMinute: wpm,
            totalWords: totalWordCount,
            durationMinutes: duration,
          } : null,
        },
      });

      if (error) throw error;

      const feedbackData: Feedback = data.feedback;
      setFeedback(feedbackData);

      // Calculate overall score
      const baseScores = [
        feedbackData.communication,
        feedbackData.technical,
        feedbackData.confidence,
        feedbackData.problemSolving,
      ];
      
      const voiceScores = feedbackData.voiceFeedback ? [
        feedbackData.voiceFeedback.fluencyScore,
        feedbackData.voiceFeedback.grammarScore,
        feedbackData.voiceFeedback.voiceClarityScore,
      ] : [];

      const allScores = [...baseScores, ...voiceScores];
      const overallScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length * 10);

      // Update session in database
      await supabase
        .from("mock_interview_sessions")
        .update({
          status: "COMPLETED",
          overall_score: overallScore,
          ended_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      // Save feedback to database
      await supabase.from("mock_interview_feedback").insert({
        session_id: sessionId,
        communication_score: feedbackData.communication,
        technical_score: feedbackData.technical,
        confidence_score: feedbackData.confidence,
        problem_solving_score: feedbackData.problemSolving,
        strengths: feedbackData.strengths,
        improvements: feedbackData.improvements,
        final_verdict: feedbackData.finalVerdict,
        improvement_advice: feedbackData.improvementAdvice,
        fluency_score: feedbackData.voiceFeedback?.fluencyScore || null,
        grammar_score: feedbackData.voiceFeedback?.grammarScore || null,
        fear_reduction_score: feedbackData.voiceFeedback?.fearReductionScore || null,
        hesitation_count: feedbackData.voiceFeedback?.hesitationCount || hesitationCount,
        words_per_minute: feedbackData.voiceFeedback?.wordsPerMinute || wpm,
        voice_clarity_score: feedbackData.voiceFeedback?.voiceClarityScore || null,
      });

      setSessionStatus("completed");
      fetchPastSessions();
      fetchPastFeedbacks();

      toast({
        title: "Interview Completed!",
        description: "Your feedback report is ready.",
      });

    } catch (error) {
      console.error("Error generating feedback:", error);
      toast({
        title: "Failed to Generate Feedback",
        description: "The interview ended but feedback generation failed.",
        variant: "destructive",
      });
      setSessionStatus("completed");
    } finally {
      setIsLoading(false);
    }
  };

  const resetInterview = () => {
    setSessionStatus("idle");
    setSessionId(null);
    setMessages([]);
    setFeedback(null);
    setJobRole("");
    setCompany("");
    setDifficulty("MEDIUM");
    setInterviewType("TECHNICAL");
    setVoiceStartTime(null);
    setTotalWordCount(0);
    setHesitationCount(0);
  };

  const downloadReport = () => {
    if (!feedback) return;

    const voiceSection = feedback.voiceFeedback ? `
Voice Metrics
-------------
Fluency Score: ${feedback.voiceFeedback.fluencyScore}/10
Grammar Accuracy: ${feedback.voiceFeedback.grammarScore}/10
Voice Clarity: ${feedback.voiceFeedback.voiceClarityScore}/10
Fear Reduction Progress: ${feedback.voiceFeedback.fearReductionScore}/10
Speaking Speed: ${feedback.voiceFeedback.wordsPerMinute} WPM
Hesitations Detected: ${feedback.voiceFeedback.hesitationCount}
` : "";

    const reportContent = `
MOCK INTERVIEW REPORT
=====================

Interview Details
-----------------
Job Role: ${jobRole}
Company: ${company || "Not specified"}
Difficulty: ${difficulty}
Interview Type: ${interviewType}
Voice Mode: ${voiceEnabled ? "Enabled" : "Disabled"}
Date: ${new Date().toLocaleDateString()}

Core Evaluation Scores
-----------------------
Communication: ${feedback.communication}/10
Technical Knowledge: ${feedback.technical}/10
Confidence: ${feedback.confidence}/10
Problem Solving: ${feedback.problemSolving}/10
${voiceSection}
Overall Score: ${Math.round((feedback.communication + feedback.technical + feedback.confidence + feedback.problemSolving) / 4 * 10)}%

Key Strengths
-------------
${feedback.strengths.map((s) => `• ${s}`).join("\n")}

Areas of Improvement
--------------------
${feedback.improvements.map((i) => `• ${i}`).join("\n")}

Final Verdict: ${feedback.finalVerdict === "READY" ? "✅ READY FOR INTERVIEWS" : "⚠️ NEEDS MORE PRACTICE"}

Improvement Advice
------------------
${feedback.improvementAdvice}

Interview Transcript
--------------------
${messages.map((m) => `${m.sender === "AI" ? "Interviewer" : "Candidate"}: ${m.content}`).join("\n\n")}
    `.trim();

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mock-interview-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: "Your interview report has been downloaded.",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-green-100 dark:bg-green-950/30";
    if (score >= 6) return "bg-yellow-100 dark:bg-yellow-950/30";
    return "bg-red-100 dark:bg-red-950/30";
  };

  // Analytics data preparation
  const getAnalyticsData = () => {
    const completedSessions = pastSessions.filter(s => s.status === "COMPLETED" && s.overall_score);
    
    // Progress over time
    const progressData = completedSessions
      .slice(0, 10)
      .reverse()
      .map((session, index) => ({
        session: `#${index + 1}`,
        score: session.overall_score || 0,
        date: new Date(session.started_at).toLocaleDateString(),
        type: session.interview_type,
      }));

    // Score by interview type
    const typeScores: Record<string, { total: number; count: number }> = {};
    completedSessions.forEach(session => {
      const type = session.interview_type;
      if (!typeScores[type]) {
        typeScores[type] = { total: 0, count: 0 };
      }
      typeScores[type].total += session.overall_score || 0;
      typeScores[type].count += 1;
    });

    const typeData = Object.entries(typeScores).map(([type, data]) => ({
      type,
      average: Math.round(data.total / data.count),
    }));

    // Skills radar data from latest feedback
    const latestFeedback = pastFeedbacks[0];
    const radarData = latestFeedback ? [
      { skill: "Communication", value: latestFeedback.communication_score || 0, fullMark: 10 },
      { skill: "Technical", value: latestFeedback.technical_score || 0, fullMark: 10 },
      { skill: "Confidence", value: latestFeedback.confidence_score || 0, fullMark: 10 },
      { skill: "Problem Solving", value: latestFeedback.problem_solving_score || 0, fullMark: 10 },
      { skill: "Fluency", value: latestFeedback.fluency_score || 5, fullMark: 10 },
      { skill: "Grammar", value: latestFeedback.grammar_score || 5, fullMark: 10 },
    ] : [];

    // Voice metrics trends
    const voiceData = pastFeedbacks
      .filter(f => f.fluency_score !== null)
      .slice(0, 10)
      .reverse()
      .map((feedback, index) => ({
        session: `#${index + 1}`,
        fluency: feedback.fluency_score || 0,
        grammar: feedback.grammar_score || 0,
        clarity: feedback.voice_clarity_score || 0,
        wpm: feedback.words_per_minute || 0,
      }));

    return { progressData, typeData, radarData, voiceData };
  };

  const { progressData, typeData, radarData, voiceData } = getAnalyticsData();

  // Calculate summary stats
  const completedCount = pastSessions.filter(s => s.status === "COMPLETED").length;
  const averageScore = completedCount > 0
    ? Math.round(pastSessions.filter(s => s.status === "COMPLETED" && s.overall_score).reduce((acc, s) => acc + (s.overall_score || 0), 0) / completedCount)
    : 0;
  const readyCount = pastFeedbacks.filter(f => (f as any).final_verdict === "READY").length;
  const improvementRate = completedCount > 1 && progressData.length >= 2
    ? progressData[progressData.length - 1]?.score - progressData[0]?.score
    : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            AI Mock Interview
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Practice interviews with our AI interviewer. Get real-time questions, 
            voice feedback, and detailed performance analytics.
          </p>
        </div>

        <Tabs defaultValue="interview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="interview" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Interview
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Study Plan
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="study">
            <StudyTimetablePlanner />
          </TabsContent>

          <TabsContent value="interview">
            {sessionStatus === "idle" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Start New Interview
                  </CardTitle>
                  <CardDescription>
                    Configure your mock interview session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="jobRole">Job Role *</Label>
                      <Input
                        id="jobRole"
                        placeholder="e.g., Software Engineer, Data Analyst"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input
                        id="company"
                        placeholder="e.g., Google, Microsoft"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Difficulty Level</Label>
                      <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Easy - Entry Level</SelectItem>
                          <SelectItem value="MEDIUM">Medium - Mid Level</SelectItem>
                          <SelectItem value="HARD">Hard - Senior Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Interview Type</Label>
                      <Select value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TECHNICAL">
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Technical
                            </span>
                          </SelectItem>
                          <SelectItem value="HR">
                            <span className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              HR / Cultural Fit
                            </span>
                          </SelectItem>
                          <SelectItem value="BEHAVIORAL">
                            <span className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Behavioral
                            </span>
                          </SelectItem>
                          <SelectItem value="MIXED">
                            <span className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              Mixed
                            </span>
                          </SelectItem>
                          <SelectItem value="ENGLISH_COMMUNICATION">
                            <span className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              English Communication
                            </span>
                          </SelectItem>
                          <SelectItem value="CONFIDENCE_BUILDING">
                            <span className="flex items-center gap-2">
                              <Heart className="h-4 w-4" />
                              Confidence Building
                            </span>
                          </SelectItem>
                          <SelectItem value="APTITUDE_GOVERNMENT">
                            <span className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              Aptitude - Govt Exams
                            </span>
                          </SelectItem>
                          <SelectItem value="APTITUDE_IT">
                            <span className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Aptitude - IT Companies
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Voice Settings */}
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
                    <h4 className="font-medium flex items-center gap-2">
                      <Mic className="h-4 w-4 text-primary" />
                      Voice Settings
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Voice Input Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                        <div className="space-y-0.5">
                          <Label htmlFor="voice-mode" className="font-medium text-sm">Voice Input</Label>
                          <p className="text-xs text-muted-foreground">
                            {voiceSupported 
                              ? "Speak your answers (primary input)"
                              : "Not supported in this browser"}
                          </p>
                        </div>
                        <Switch
                          id="voice-mode"
                          checked={voiceEnabled}
                          onCheckedChange={setVoiceEnabled}
                          disabled={!voiceSupported}
                        />
                      </div>

                      {/* Read Questions Aloud Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                        <div className="space-y-0.5">
                          <Label htmlFor="read-aloud" className="font-medium text-sm">Read Questions Aloud</Label>
                          <p className="text-xs text-muted-foreground">
                            AI speaks questions (optional)
                          </p>
                        </div>
                        <Switch
                          id="read-aloud"
                          checked={readQuestionsAloud}
                          onCheckedChange={setReadQuestionsAloud}
                          disabled={!voiceSupported}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interview Type Description */}
                  {(interviewType === "ENGLISH_COMMUNICATION" || interviewType === "CONFIDENCE_BUILDING") && (
                    <div className={`p-4 rounded-lg border ${
                      interviewType === "CONFIDENCE_BUILDING" 
                        ? "bg-pink-50 border-pink-200 dark:bg-pink-950/20 dark:border-pink-800" 
                        : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                    }`}>
                      <div className="flex items-start gap-3">
                        {interviewType === "CONFIDENCE_BUILDING" ? (
                          <Heart className="h-5 w-5 text-pink-600 mt-0.5" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                        )}
                        <div>
                          <h4 className="font-medium text-sm">
                            {interviewType === "CONFIDENCE_BUILDING" 
                              ? "Confidence Building Mode"
                              : "English Communication Practice"}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {interviewType === "CONFIDENCE_BUILDING"
                              ? "The AI will be encouraging and supportive, helping reduce interview anxiety with simple questions that gradually increase in difficulty."
                              : "Focus on improving your spoken English fluency. The AI will gently correct grammar and suggest better phrasing while keeping you motivated."}
                          </p>
                          {!voiceEnabled && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                              💡 Tip: Enable Voice Input for the best experience!
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={startInterview} 
                    disabled={isLoading || !jobRole.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Starting Interview...
                      </>
                    ) : (
                      <>
                        {voiceEnabled ? <Mic className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                        Start {voiceEnabled ? "Voice " : ""}Mock Interview
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {(sessionStatus === "in_progress" || sessionStatus === "generating_feedback") && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          {jobRole}
                        </CardTitle>
                        <CardDescription>
                          {company && `${company} • `}{difficulty} • {interviewType}
                          {voiceEnabled && " • 🎤 Voice Mode"}
                        </CardDescription>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => endInterview()}
                        disabled={isLoading || sessionStatus === "generating_feedback"}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        End Interview
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              message.sender === "STUDENT" ? "flex-row-reverse" : ""
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                message.sender === "AI"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-secondary-foreground"
                              }`}
                            >
                              {message.sender === "AI" ? (
                                <Bot className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.sender === "AI"
                                  ? "bg-muted"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <p className="text-xs opacity-60 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isLoading && sessionStatus === "in_progress" && (
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <Bot className="h-4 w-4" />
                            </div>
                            <div className="bg-muted rounded-lg p-3">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {sessionStatus === "generating_feedback" ? (
                      <div className="p-4 border-t bg-muted/50">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Generating your feedback report...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border-t space-y-3">
                        {/* Voice Controls - Primary */}
                        {voiceEnabled && (
                          <div className="flex items-center justify-center gap-4 pb-3 border-b">
                            {isSpeaking && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleStopSpeaking}
                                className="gap-2"
                              >
                                <VolumeX className="h-4 w-4" />
                                Stop Speaking
                              </Button>
                            )}
                            <Button
                              variant={isListening ? "destructive" : "default"}
                              size="lg"
                              onClick={handleVoiceToggle}
                              disabled={isLoading || isSpeaking}
                              className="gap-2 min-w-[180px]"
                            >
                              {isListening ? (
                                <>
                                  <MicOff className="h-5 w-5" />
                                  Stop & Send
                                </>
                              ) : (
                                <>
                                  <Mic className="h-5 w-5" />
                                  🎤 Speak Answer
                                </>
                              )}
                            </Button>
                            {isListening && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                Listening...
                              </div>
                            )}
                          </div>
                        )}

                        {/* Live Transcript */}
                        {voiceEnabled && transcript && (
                          <div className="p-2 bg-muted/50 rounded text-sm text-muted-foreground italic">
                            "{transcript}"
                          </div>
                        )}

                        {/* Text Input - Secondary when voice enabled */}
                        <div className="flex gap-2">
                          <Input
                            placeholder={voiceEnabled ? "Or type here..." : "Type your answer..."}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                            disabled={isLoading}
                          />
                          <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {voiceEnabled 
                            ? "💡 Click '🎤 Speak Answer' to record. Say 'end interview' when done."
                            : "Tip: Say 'end interview' when you're ready to finish and get feedback."}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Interview Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Take your time to think before answering</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Structure your answers clearly</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Give specific examples when possible</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Ask clarifying questions if needed</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span>Avoid filler words (um, uh, like)</span>
                    </div>
                    {voiceEnabled && (
                      <>
                        <div className="flex items-start gap-2">
                          <Mic className="h-4 w-4 text-primary mt-0.5" />
                          <span>Speak clearly and at a steady pace</span>
                        </div>
                        <div className="border-t pt-3 mt-3">
                          <p className="text-xs text-muted-foreground">
                            <strong>Voice Stats:</strong><br />
                            Words spoken: {totalWordCount}<br />
                            Hesitations: {hesitationCount}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {sessionStatus === "completed" && feedback && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Interview Feedback Report
                        </CardTitle>
                        <CardDescription>
                          {jobRole} {company && `at ${company}`} {voiceEnabled && "• 🎤 Voice Interview"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <PDFReportGenerator
                          feedback={feedback}
                          messages={messages}
                          jobRole={jobRole}
                          company={company}
                          difficulty={difficulty}
                          interviewType={interviewType}
                          voiceEnabled={voiceEnabled}
                        />
                        <Button onClick={resetInterview}>
                          <Play className="h-4 w-4 mr-2" />
                          New Interview
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Verdict Badge */}
                    <div className="flex justify-center mb-6">
                      <Badge
                        variant={feedback.finalVerdict === "READY" ? "default" : "secondary"}
                        className={`text-lg px-6 py-2 ${
                          feedback.finalVerdict === "READY"
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-yellow-500 hover:bg-yellow-600"
                        }`}
                      >
                        {feedback.finalVerdict === "READY" ? (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            READY FOR INTERVIEWS
                          </>
                        ) : (
                          <>
                            <TrendingUp className="h-5 w-5 mr-2" />
                            NEEDS MORE PRACTICE
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Core Scores Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: "Communication", score: feedback.communication, icon: MessageCircle },
                        { label: "Technical", score: feedback.technical, icon: FileText },
                        { label: "Confidence", score: feedback.confidence, icon: Star },
                        { label: "Problem Solving", score: feedback.problemSolving, icon: Target },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`p-4 rounded-lg text-center ${getScoreBg(item.score)}`}
                        >
                          <item.icon className={`h-6 w-6 mx-auto mb-2 ${getScoreColor(item.score)}`} />
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                            {item.score}/10
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Voice Feedback Metrics */}
                    {feedback.voiceFeedback && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Mic className="h-4 w-4 text-primary" />
                          Voice Feedback Metrics
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                          <div className={`p-3 rounded-lg text-center ${getScoreBg(feedback.voiceFeedback.fluencyScore)}`}>
                            <Languages className={`h-5 w-5 mx-auto mb-1 ${getScoreColor(feedback.voiceFeedback.fluencyScore)}`} />
                            <p className="text-xs text-muted-foreground">Fluency</p>
                            <p className={`text-xl font-bold ${getScoreColor(feedback.voiceFeedback.fluencyScore)}`}>
                              {feedback.voiceFeedback.fluencyScore}/10
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg text-center ${getScoreBg(feedback.voiceFeedback.grammarScore)}`}>
                            <BookOpen className={`h-5 w-5 mx-auto mb-1 ${getScoreColor(feedback.voiceFeedback.grammarScore)}`} />
                            <p className="text-xs text-muted-foreground">Grammar</p>
                            <p className={`text-xl font-bold ${getScoreColor(feedback.voiceFeedback.grammarScore)}`}>
                              {feedback.voiceFeedback.grammarScore}/10
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg text-center ${getScoreBg(feedback.voiceFeedback.voiceClarityScore)}`}>
                            <Volume2 className={`h-5 w-5 mx-auto mb-1 ${getScoreColor(feedback.voiceFeedback.voiceClarityScore)}`} />
                            <p className="text-xs text-muted-foreground">Clarity</p>
                            <p className={`text-xl font-bold ${getScoreColor(feedback.voiceFeedback.voiceClarityScore)}`}>
                              {feedback.voiceFeedback.voiceClarityScore}/10
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg text-center ${getScoreBg(feedback.voiceFeedback.fearReductionScore)}`}>
                            <Heart className={`h-5 w-5 mx-auto mb-1 ${getScoreColor(feedback.voiceFeedback.fearReductionScore)}`} />
                            <p className="text-xs text-muted-foreground">Confidence</p>
                            <p className={`text-xl font-bold ${getScoreColor(feedback.voiceFeedback.fearReductionScore)}`}>
                              {feedback.voiceFeedback.fearReductionScore}/10
                            </p>
                          </div>
                          <div className="p-3 rounded-lg text-center bg-muted">
                            <Zap className="h-5 w-5 mx-auto mb-1 text-primary" />
                            <p className="text-xs text-muted-foreground">Speed</p>
                            <p className="text-xl font-bold text-foreground">
                              {feedback.voiceFeedback.wordsPerMinute} WPM
                            </p>
                          </div>
                          <div className={`p-3 rounded-lg text-center ${feedback.voiceFeedback.hesitationCount <= 3 ? "bg-green-100 dark:bg-green-950/30" : feedback.voiceFeedback.hesitationCount <= 6 ? "bg-yellow-100 dark:bg-yellow-950/30" : "bg-red-100 dark:bg-red-950/30"}`}>
                            <Clock className={`h-5 w-5 mx-auto mb-1 ${feedback.voiceFeedback.hesitationCount <= 3 ? "text-green-600" : feedback.voiceFeedback.hesitationCount <= 6 ? "text-yellow-600" : "text-red-600"}`} />
                            <p className="text-xs text-muted-foreground">Hesitations</p>
                            <p className={`text-xl font-bold ${feedback.voiceFeedback.hesitationCount <= 3 ? "text-green-600" : feedback.voiceFeedback.hesitationCount <= 6 ? "text-yellow-600" : "text-red-600"}`}>
                              {feedback.voiceFeedback.hesitationCount}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Overall Score */}
                    <div className="text-center mb-6">
                      <p className="text-sm text-muted-foreground mb-2">Overall Performance</p>
                      <div className="relative w-32 h-32 mx-auto">
                        <Progress 
                          value={Math.round((feedback.communication + feedback.technical + feedback.confidence + feedback.problemSolving) / 4 * 10)} 
                          className="h-32 w-32 [&>div]:rounded-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold">
                            {Math.round((feedback.communication + feedback.technical + feedback.confidence + feedback.problemSolving) / 4 * 10)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Strengths and Improvements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Key Strengths
                        </h4>
                        <ul className="space-y-2">
                          {feedback.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-green-500">•</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-yellow-500" />
                          Areas for Improvement
                        </h4>
                        <ul className="space-y-2">
                          {feedback.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-yellow-500">•</span>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Improvement Advice */}
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">💡 Improvement Advice</h4>
                      <p className="text-sm text-muted-foreground">{feedback.improvementAdvice}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{completedCount}</p>
                        <p className="text-sm text-muted-foreground">Interviews</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{averageScore}%</p>
                        <p className="text-sm text-muted-foreground">Avg Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/30">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{readyCount}</p>
                        <p className="text-sm text-muted-foreground">Ready</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${improvementRate >= 0 ? "bg-green-100 dark:bg-green-950/30" : "bg-red-100 dark:bg-red-950/30"}`}>
                        <TrendingUp className={`h-5 w-5 ${improvementRate >= 0 ? "text-green-600" : "text-red-600"}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{improvementRate >= 0 ? "+" : ""}{improvementRate}%</p>
                        <p className="text-sm text-muted-foreground">Growth</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {completedCount === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-medium mb-2">No Analytics Data Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete your first interview to see performance analytics.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Progress Over Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Progress Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={progressData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="session" className="text-xs" />
                          <YAxis domain={[0, 100]} className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary))" 
                            fillOpacity={0.2}
                            name="Score %"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Score by Interview Type */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Average by Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={typeData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" domain={[0, 100]} className="text-xs" />
                          <YAxis dataKey="type" type="category" width={100} className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="average" fill="hsl(var(--primary))" name="Avg Score %" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Skills Radar */}
                  {radarData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          Skills Assessment
                        </CardTitle>
                        <CardDescription>Latest interview performance</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="skill" className="text-xs" />
                            <PolarRadiusAxis domain={[0, 10]} />
                            <Radar 
                              name="Score" 
                              dataKey="value" 
                              stroke="hsl(var(--primary))" 
                              fill="hsl(var(--primary))" 
                              fillOpacity={0.3}
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Voice Metrics Trend */}
                  {voiceData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Mic className="h-4 w-4" />
                          Voice Metrics Trend
                        </CardTitle>
                        <CardDescription>Speaking performance over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={voiceData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="session" className="text-xs" />
                            <YAxis domain={[0, 10]} className="text-xs" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="fluency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Fluency" />
                            <Area type="monotone" dataKey="grammar" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Grammar" />
                            <Area type="monotone" dataKey="clarity" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} name="Clarity" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Past Interview Sessions
                </CardTitle>
                <CardDescription>
                  View your previous mock interview sessions and scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : pastSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No past sessions yet.</p>
                    <p className="text-sm">Start your first mock interview to see your history here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          {session.voice_enabled && (
                            <Mic className="h-4 w-4 text-primary mt-1" />
                          )}
                          <div>
                            <h4 className="font-medium">{session.job_role}</h4>
                            <p className="text-sm text-muted-foreground">
                              {session.company && `${session.company} • `}
                              {session.difficulty} • {session.interview_type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.started_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {session.status === "COMPLETED" && session.overall_score ? (
                            <div>
                              <Badge variant={session.overall_score >= 70 ? "default" : "secondary"}>
                                {session.overall_score}%
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline">{session.status}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MockInterview;