import { useState, useRef, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type InterviewType = "TECHNICAL" | "HR" | "BEHAVIORAL" | "MIXED";
type SessionStatus = "idle" | "configuring" | "in_progress" | "generating_feedback" | "completed";

interface Message {
  id: string;
  sender: "AI" | "STUDENT";
  content: string;
  timestamp: Date;
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
  
  // Session state
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  
  // History state
  const [pastSessions, setPastSessions] = useState<InterviewSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchPastSessions();
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
        .limit(10);

      if (error) throw error;
      setPastSessions((data as InterviewSession[]) || []);
    } catch (error) {
      console.error("Error fetching past sessions:", error);
    } finally {
      setLoadingHistory(false);
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

      toast({
        title: "Interview Started",
        description: "Good luck! Answer the interviewer's questions.",
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

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "STUDENT",
      content: inputMessage,
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
        message: inputMessage,
      });

      // Check if user wants to end the interview
      const lowerInput = inputMessage.toLowerCase();
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

  const endInterview = async (conversationMessages?: Message[]) => {
    if (!sessionId) return;

    setSessionStatus("generating_feedback");
    setIsLoading(true);

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
        },
      });

      if (error) throw error;

      const feedbackData: Feedback = data.feedback;
      setFeedback(feedbackData);

      // Calculate overall score
      const overallScore = Math.round(
        (feedbackData.communication + 
         feedbackData.technical + 
         feedbackData.confidence + 
         feedbackData.problemSolving) / 4 * 10
      );

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
      });

      setSessionStatus("completed");
      fetchPastSessions();

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
  };

  const downloadReport = () => {
    if (!feedback) return;

    const reportContent = `
MOCK INTERVIEW REPORT
=====================

Interview Details
-----------------
Job Role: ${jobRole}
Company: ${company || "Not specified"}
Difficulty: ${difficulty}
Interview Type: ${interviewType}
Date: ${new Date().toLocaleDateString()}

Evaluation Scores
-----------------
Communication: ${feedback.communication}/10
Technical Knowledge: ${feedback.technical}/10
Confidence: ${feedback.confidence}/10
Problem Solving: ${feedback.problemSolving}/10

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
    if (score >= 8) return "bg-green-100";
    if (score >= 6) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            AI Mock Interview
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Practice interviews with our AI interviewer. Get real-time questions, 
            feedback, and a detailed performance report.
          </p>
        </div>

        <Tabs defaultValue="interview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="interview" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Interview
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Past Sessions
            </TabsTrigger>
          </TabsList>

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
                          <SelectItem value="TECHNICAL">Technical</SelectItem>
                          <SelectItem value="HR">HR / Cultural Fit</SelectItem>
                          <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
                          <SelectItem value="MIXED">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

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
                        <Play className="h-4 w-4 mr-2" />
                        Start Mock Interview
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
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type your answer..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                            disabled={isLoading}
                          />
                          <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Tip: Say "end interview" when you're ready to finish and get feedback.
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
                      <span>Avoid one-word answers</span>
                    </div>
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
                          {jobRole} {company && `at ${company}`}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={downloadReport}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Report
                        </Button>
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

                    {/* Scores Grid */}
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
