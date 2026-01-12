import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useToast } from "@/hooks/use-toast";
import { createWorker } from "tesseract.js";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import {
  Calendar,
  Clock,
  BookOpen,
  Target,
  Brain,
  Code,
  FileText,
  Users,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  Play,
  RotateCcw,
  Bell,
  BellOff,
  Upload,
  FileImage,
  FileType,
  Download,
  Flame,
  Trophy,
  Star,
  Award,
  Zap,
  Crown,
  Medal,
} from "lucide-react";

// Set PDF.js worker
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;

interface StudyTask {
  id: string;
  topic: string;
  duration: number; // in minutes
  category: "aptitude" | "technical" | "communication" | "behavioral" | "company";
  completed: boolean;
  day: string;
  time: string;
}

interface StudyPlan {
  examDate: string;
  hoursPerDay: number;
  focusAreas: string[];
  tasks: StudyTask[];
}

interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string | null;
  totalTasksCompleted: number;
  totalStudyMinutes: number;
  badges: string[];
}

interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  icon: typeof Flame;
  color: string;
  requirement: (streak: StreakData) => boolean;
}

const BADGES: BadgeInfo[] = [
  { id: "first_task", name: "First Step", description: "Complete your first task", icon: Star, color: "text-yellow-500", requirement: (s) => s.totalTasksCompleted >= 1 },
  { id: "streak_3", name: "Getting Started", description: "3 day streak", icon: Flame, color: "text-orange-500", requirement: (s) => s.bestStreak >= 3 },
  { id: "streak_7", name: "Week Warrior", description: "7 day streak", icon: Zap, color: "text-blue-500", requirement: (s) => s.bestStreak >= 7 },
  { id: "streak_14", name: "Fortnight Fighter", description: "14 day streak", icon: Trophy, color: "text-purple-500", requirement: (s) => s.bestStreak >= 14 },
  { id: "streak_30", name: "Monthly Master", description: "30 day streak", icon: Crown, color: "text-amber-500", requirement: (s) => s.bestStreak >= 30 },
  { id: "tasks_10", name: "Task Tackler", description: "Complete 10 tasks", icon: CheckCircle, color: "text-green-500", requirement: (s) => s.totalTasksCompleted >= 10 },
  { id: "tasks_50", name: "Half Century", description: "Complete 50 tasks", icon: Award, color: "text-indigo-500", requirement: (s) => s.totalTasksCompleted >= 50 },
  { id: "tasks_100", name: "Centurion", description: "Complete 100 tasks", icon: Medal, color: "text-rose-500", requirement: (s) => s.totalTasksCompleted >= 100 },
  { id: "hours_10", name: "Dedicated Learner", description: "Study for 10 hours", icon: Clock, color: "text-cyan-500", requirement: (s) => s.totalStudyMinutes >= 600 },
  { id: "hours_50", name: "Knowledge Seeker", description: "Study for 50 hours", icon: BookOpen, color: "text-teal-500", requirement: (s) => s.totalStudyMinutes >= 3000 },
];

const FOCUS_AREAS = [
  { id: "quantitative", label: "Quantitative Aptitude", icon: Brain },
  { id: "logical", label: "Logical Reasoning", icon: Target },
  { id: "verbal", label: "Verbal Ability", icon: BookOpen },
  { id: "technical", label: "Technical Skills", icon: Code },
  { id: "coding", label: "Coding Practice", icon: FileText },
  { id: "communication", label: "Communication", icon: Users },
];

const STUDY_TEMPLATES = {
  government: [
    { topic: "Number System & HCF/LCM", category: "aptitude" as const, duration: 60 },
    { topic: "Percentage & Profit/Loss", category: "aptitude" as const, duration: 60 },
    { topic: "Time & Work Problems", category: "aptitude" as const, duration: 45 },
    { topic: "Speed, Time & Distance", category: "aptitude" as const, duration: 45 },
    { topic: "Ratio & Proportion", category: "aptitude" as const, duration: 45 },
    { topic: "Simple & Compound Interest", category: "aptitude" as const, duration: 45 },
    { topic: "Blood Relations", category: "aptitude" as const, duration: 30 },
    { topic: "Syllogisms", category: "aptitude" as const, duration: 30 },
    { topic: "Coding-Decoding", category: "aptitude" as const, duration: 30 },
    { topic: "Seating Arrangement", category: "aptitude" as const, duration: 45 },
    { topic: "Data Interpretation", category: "aptitude" as const, duration: 60 },
    { topic: "Reading Comprehension", category: "communication" as const, duration: 45 },
    { topic: "Fill in the Blanks", category: "communication" as const, duration: 30 },
    { topic: "Error Spotting", category: "communication" as const, duration: 30 },
    { topic: "General Knowledge", category: "company" as const, duration: 30 },
    { topic: "Current Affairs", category: "company" as const, duration: 30 },
  ],
  it_company: [
    { topic: "Arrays & Strings", category: "technical" as const, duration: 60 },
    { topic: "Linked Lists", category: "technical" as const, duration: 60 },
    { topic: "Stacks & Queues", category: "technical" as const, duration: 45 },
    { topic: "Trees & Graphs", category: "technical" as const, duration: 90 },
    { topic: "Dynamic Programming", category: "technical" as const, duration: 90 },
    { topic: "Sorting & Searching", category: "technical" as const, duration: 45 },
    { topic: "SQL Queries", category: "technical" as const, duration: 45 },
    { topic: "OOP Concepts", category: "technical" as const, duration: 45 },
    { topic: "System Design Basics", category: "technical" as const, duration: 60 },
    { topic: "Quantitative Aptitude", category: "aptitude" as const, duration: 45 },
    { topic: "Logical Reasoning", category: "aptitude" as const, duration: 45 },
    { topic: "Verbal Ability", category: "aptitude" as const, duration: 30 },
    { topic: "HR Interview Prep", category: "behavioral" as const, duration: 45 },
    { topic: "Tell Me About Yourself", category: "behavioral" as const, duration: 30 },
    { topic: "Company Research", category: "company" as const, duration: 30 },
    { topic: "Mock Coding Round", category: "technical" as const, duration: 90 },
  ],
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "aptitude":
      return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
    case "technical":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
    case "communication":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
    case "behavioral":
      return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
    case "company":
      return "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "aptitude":
      return Brain;
    case "technical":
      return Code;
    case "communication":
      return BookOpen;
    case "behavioral":
      return Users;
    case "company":
      return Target;
    default:
      return FileText;
  }
};

export const StudyTimetablePlanner = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(() => {
    return localStorage.getItem("studyRemindersEnabled") === "true";
  });

  const [streakData, setStreakData] = useState<StreakData>(() => {
    const saved = localStorage.getItem("studyStreakData");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastStudyDate: null,
      totalTasksCompleted: 0,
      totalStudyMinutes: 0,
      badges: [],
    };
  });
  
  const [studyPlan, setStudyPlan] = useState<StudyPlan>(() => {
    const saved = localStorage.getItem("studyPlan");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      examDate: "",
      hoursPerDay: 4,
      focusAreas: [],
      tasks: [],
    };
  });

  const [newTask, setNewTask] = useState({
    topic: "",
    duration: 30,
    category: "aptitude" as const,
  });

  useEffect(() => {
    localStorage.setItem("studyPlan", JSON.stringify(studyPlan));
  }, [studyPlan]);

  // Save streak data
  useEffect(() => {
    localStorage.setItem("studyStreakData", JSON.stringify(streakData));
  }, [streakData]);

  // Check and update badges
  const checkAndAwardBadges = useCallback((currentStreakData: StreakData) => {
    const newBadges: string[] = [];
    BADGES.forEach((badge) => {
      if (!currentStreakData.badges.includes(badge.id) && badge.requirement(currentStreakData)) {
        newBadges.push(badge.id);
      }
    });
    return newBadges;
  }, []);

  // Update streak when task is completed
  const updateStreak = useCallback((taskDuration: number, isCompleting: boolean) => {
    const today = new Date().toISOString().split("T")[0];
    
    setStreakData((prev) => {
      let newStreak = { ...prev };
      
      if (isCompleting) {
        newStreak.totalTasksCompleted += 1;
        newStreak.totalStudyMinutes += taskDuration;
        
        if (prev.lastStudyDate === null) {
          // First ever task
          newStreak.currentStreak = 1;
          newStreak.bestStreak = 1;
        } else if (prev.lastStudyDate === today) {
          // Already studied today, streak stays same
        } else {
          const lastDate = new Date(prev.lastStudyDate);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // Consecutive day
            newStreak.currentStreak = prev.currentStreak + 1;
            newStreak.bestStreak = Math.max(newStreak.currentStreak, prev.bestStreak);
          } else if (diffDays > 1) {
            // Streak broken
            newStreak.currentStreak = 1;
          }
        }
        
        newStreak.lastStudyDate = today;
        
        // Check for new badges
        const newBadges = checkAndAwardBadges(newStreak);
        if (newBadges.length > 0) {
          newStreak.badges = [...prev.badges, ...newBadges];
          const badge = BADGES.find(b => b.id === newBadges[0]);
          if (badge) {
            toast({
              title: "🏆 New Badge Unlocked!",
              description: `${badge.name}: ${badge.description}`,
            });
          }
        }
      } else {
        // Uncompleting a task
        newStreak.totalTasksCompleted = Math.max(0, prev.totalTasksCompleted - 1);
        newStreak.totalStudyMinutes = Math.max(0, prev.totalStudyMinutes - taskDuration);
      }
      
      return newStreak;
    });
  }, [checkAndAwardBadges, toast]);

  // Check streak on load (reset if day was missed)
  useEffect(() => {
    if (streakData.lastStudyDate) {
      const lastDate = new Date(streakData.lastStudyDate);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1 && streakData.currentStreak > 0) {
        setStreakData(prev => ({ ...prev, currentStreak: 0 }));
        toast({
          title: "Streak Lost! 😢",
          description: "You missed a day. Start a new streak today!",
          variant: "destructive",
        });
      }
    }
  }, []);

  // Save reminders preference
  useEffect(() => {
    localStorage.setItem("studyRemindersEnabled", remindersEnabled.toString());
  }, [remindersEnabled]);

  // Request notification permission and set up reminders
  const enableReminders = useCallback(async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Notifications Not Supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setRemindersEnabled(true);
      toast({
        title: "Reminders Enabled",
        description: "You'll receive study reminders for your tasks.",
      });
      return true;
    } else {
      toast({
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const disableReminders = useCallback(() => {
    setRemindersEnabled(false);
    toast({
      title: "Reminders Disabled",
      description: "You won't receive study reminders anymore.",
    });
  }, [toast]);

  // Set up reminder intervals
  useEffect(() => {
    if (!remindersEnabled || studyPlan.tasks.length === 0) return;

    const checkAndNotify = () => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      const upcomingTasks = studyPlan.tasks.filter(
        (task) => task.day === today && !task.completed && task.time === currentTime
      );

      upcomingTasks.forEach((task) => {
        if (Notification.permission === "granted") {
          new Notification("📚 Study Time!", {
            body: `Time to study: ${task.topic} (${task.duration} minutes)`,
            icon: "/favicon.ico",
            tag: task.id,
          });
        }
      });
    };

    // Check every minute
    const interval = setInterval(checkAndNotify, 60000);
    // Also check immediately
    checkAndNotify();

    return () => clearInterval(interval);
  }, [remindersEnabled, studyPlan.tasks]);

  // File import handlers
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    
    try {
      let extractedText = "";
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      if (fileType === "text/plain" || fileName.endsWith(".txt")) {
        extractedText = await file.text();
      } else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
        extractedText = await extractTextFromPDF(file);
      } else if (fileType.startsWith("image/") || fileName.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
        extractedText = await extractTextFromImage(file);
      } else {
        throw new Error("Unsupported file type");
      }

      if (extractedText.trim()) {
        const tasks = parseTextToTasks(extractedText);
        if (tasks.length > 0) {
          setStudyPlan((prev) => ({
            ...prev,
            tasks: [...prev.tasks, ...tasks],
          }));
          toast({
            title: "Import Successful",
            description: `Added ${tasks.length} tasks from ${file.name}`,
          });
        } else {
          toast({
            title: "No Tasks Found",
            description: "Could not parse any study tasks from the file.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Empty File",
          description: "No text content found in the file.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("File import error:", error);
      toast({
        title: "Import Failed",
        description: "Could not process the file. Please try a different format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let text = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(" ");
      text += pageText + "\n";
    }
    
    return text;
  };

  const extractTextFromImage = async (file: File): Promise<string> => {
    const worker = await createWorker("eng");
    const imageUrl = URL.createObjectURL(file);
    
    try {
      const { data } = await worker.recognize(imageUrl);
      return data.text;
    } finally {
      await worker.terminate();
      URL.revokeObjectURL(imageUrl);
    }
  };

  const parseTextToTasks = (text: string): StudyTask[] => {
    const lines = text.split(/[\n\r]+/).filter((line) => line.trim().length > 3);
    const today = new Date();
    const tasks: StudyTask[] = [];

    lines.forEach((line, index) => {
      const cleanedLine = line.trim().replace(/^[-•*\d.)\]]+\s*/, "");
      if (cleanedLine.length < 3 || cleanedLine.length > 100) return;

      // Determine category based on keywords
      let category: StudyTask["category"] = "aptitude";
      const lowerLine = cleanedLine.toLowerCase();
      
      if (lowerLine.match(/code|program|algorithm|data structure|sql|api|system design/)) {
        category = "technical";
      } else if (lowerLine.match(/speak|present|communicate|english|verbal/)) {
        category = "communication";
      } else if (lowerLine.match(/interview|hr|behavior|tell me|strength|weakness/)) {
        category = "behavioral";
      } else if (lowerLine.match(/company|research|culture|about/)) {
        category = "company";
      }

      const taskDate = new Date(today.getTime() + Math.floor(index / 4) * 24 * 60 * 60 * 1000);
      
      tasks.push({
        id: crypto.randomUUID(),
        topic: cleanedLine.slice(0, 80),
        duration: 30,
        category,
        completed: false,
        day: taskDate.toISOString().split("T")[0],
        time: `${(9 + (index % 4) * 2).toString().padStart(2, "0")}:00`,
      });
    });

    return tasks.slice(0, 50); // Limit to 50 tasks
  };

  const exportPlan = () => {
    const content = studyPlan.tasks
      .map((task) => `${task.day} ${task.time} - ${task.topic} (${task.category}, ${task.duration}min)${task.completed ? " ✓" : ""}`)
      .join("\n");
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-plan-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Plan Exported",
      description: "Your study plan has been downloaded as a text file.",
    });
  };

  const generatePlan = (type: "government" | "it_company") => {
    const template = STUDY_TEMPLATES[type];
    const today = new Date();
    const examDate = studyPlan.examDate ? new Date(studyPlan.examDate) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dailyMinutes = studyPlan.hoursPerDay * 60;

    const tasks: StudyTask[] = [];
    let dayIndex = 0;
    let dailyTimeUsed = 0;

    template.forEach((item, index) => {
      if (dailyTimeUsed + item.duration > dailyMinutes) {
        dayIndex++;
        dailyTimeUsed = 0;
      }

      if (dayIndex < daysUntilExam) {
        const taskDate = new Date(today.getTime() + dayIndex * 24 * 60 * 60 * 1000);
        const startHour = 9 + Math.floor(dailyTimeUsed / 60);
        const startMinute = dailyTimeUsed % 60;

        tasks.push({
          id: crypto.randomUUID(),
          topic: item.topic,
          duration: item.duration,
          category: item.category,
          completed: false,
          day: taskDate.toISOString().split("T")[0],
          time: `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`,
        });

        dailyTimeUsed += item.duration;
      }
    });

    setStudyPlan((prev) => ({
      ...prev,
      tasks,
    }));

    toast({
      title: "Study Plan Generated",
      description: `Created ${tasks.length} study tasks for ${type === "government" ? "Government Exam" : "IT Company"} preparation.`,
    });
  };

  const addTask = () => {
    if (!newTask.topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for the study task.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const task: StudyTask = {
      id: crypto.randomUUID(),
      topic: newTask.topic,
      duration: newTask.duration,
      category: newTask.category,
      completed: false,
      day: today,
      time: "09:00",
    };

    setStudyPlan((prev) => ({
      ...prev,
      tasks: [...prev.tasks, task],
    }));

    setNewTask({ topic: "", duration: 30, category: "aptitude" });

    toast({
      title: "Task Added",
      description: `Added "${newTask.topic}" to your study plan.`,
    });
  };

  const toggleTaskCompletion = (taskId: string) => {
    const task = studyPlan.tasks.find((t) => t.id === taskId);
    if (task) {
      const isCompleting = !task.completed;
      updateStreak(task.duration, isCompleting);
    }
    
    setStudyPlan((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  const deleteTask = (taskId: string) => {
    setStudyPlan((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== taskId),
    }));
  };

  const resetPlan = () => {
    setStudyPlan({
      examDate: "",
      hoursPerDay: 4,
      focusAreas: [],
      tasks: [],
    });
    toast({
      title: "Plan Reset",
      description: "Your study plan has been cleared.",
    });
  };

  const completedTasks = studyPlan.tasks.filter((t) => t.completed).length;
  const totalTasks = studyPlan.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const todayTasks = studyPlan.tasks.filter(
    (t) => t.day === new Date().toISOString().split("T")[0]
  );

  const groupedByDay = studyPlan.tasks.reduce((acc, task) => {
    if (!acc[task.day]) {
      acc[task.day] = [];
    }
    acc[task.day].push(task);
    return acc;
  }, {} as Record<string, StudyTask[]>);

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Study Timetable Planner
          </CardTitle>
          <CardDescription>
            Plan your preparation for government exams or IT company interviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Exam/Interview Date</Label>
              <Input
                type="date"
                value={studyPlan.examDate}
                onChange={(e) =>
                  setStudyPlan((prev) => ({ ...prev, examDate: e.target.value }))
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Hours Per Day</Label>
              <Select
                value={studyPlan.hoursPerDay.toString()}
                onValueChange={(v) =>
                  setStudyPlan((prev) => ({ ...prev, hoursPerDay: parseInt(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Hours</SelectItem>
                  <SelectItem value="3">3 Hours</SelectItem>
                  <SelectItem value="4">4 Hours</SelectItem>
                  <SelectItem value="5">5 Hours</SelectItem>
                  <SelectItem value="6">6 Hours</SelectItem>
                  <SelectItem value="8">8 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quick Generate</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => generatePlan("government")}
                >
                  <Sparkles className="h-4 w-4" />
                  Govt Exam
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => generatePlan("it_company")}
                >
                  <Code className="h-4 w-4" />
                  IT Company
                </Button>
              </div>
            </div>
          </div>

          {/* Circular Progress & Reminders */}
          {totalTasks > 0 && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-6">
                <CircularProgress value={progress} size={70} strokeWidth={6}>
                  <div className="text-center">
                    <span className="text-sm font-bold">{Math.round(progress)}%</span>
                  </div>
                </CircularProgress>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tasks Completed</span>
                    <span className="text-sm text-muted-foreground">
                      {completedTasks}/{totalTasks}
                    </span>
                  </div>
                  {studyPlan.examDate && (
                    <p className="text-xs text-muted-foreground">
                      {Math.ceil(
                        (new Date(studyPlan.examDate).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )} days until exam
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="reminders" className="text-xs">Reminders</Label>
                    <Switch
                      id="reminders"
                      checked={remindersEnabled}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          enableReminders();
                        } else {
                          disableReminders();
                        }
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {remindersEnabled ? (
                      <><Bell className="h-3 w-3" /> Active</>
                    ) : (
                      <><BellOff className="h-3 w-3" /> Off</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Study Streak & Badges */}
          <div className="p-4 rounded-lg border bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Study Streak
              </h4>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <span className="text-2xl font-bold text-orange-600">{streakData.currentStreak}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Current</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <span className="text-2xl font-bold text-amber-600">{streakData.bestStreak}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Best</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
              <div className="p-2 rounded bg-background/60">
                <span className="font-semibold">{streakData.totalTasksCompleted}</span>
                <p className="text-muted-foreground">Tasks Done</p>
              </div>
              <div className="p-2 rounded bg-background/60">
                <span className="font-semibold">{Math.floor(streakData.totalStudyMinutes / 60)}h {streakData.totalStudyMinutes % 60}m</span>
                <p className="text-muted-foreground">Study Time</p>
              </div>
              <div className="p-2 rounded bg-background/60">
                <span className="font-semibold">{streakData.badges.length}/{BADGES.length}</span>
                <p className="text-muted-foreground">Badges</p>
              </div>
            </div>

            {/* Badges Display */}
            <div className="flex flex-wrap gap-2">
              {BADGES.map((badge) => {
                const isUnlocked = streakData.badges.includes(badge.id);
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all ${
                      isUnlocked
                        ? "bg-background border-primary/30"
                        : "bg-muted/50 border-transparent opacity-40"
                    }`}
                    title={`${badge.name}: ${badge.description}`}
                  >
                    <Icon className={`h-3 w-3 ${isUnlocked ? badge.color : "text-muted-foreground"}`} />
                    <span className={isUnlocked ? "font-medium" : "text-muted-foreground"}>
                      {badge.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-lg border">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import/Export Study Plan
            </h4>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.png,.jpg,.jpeg,.gif,.webp"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="gap-1"
              >
                {isProcessingFile ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import File
                  </>
                )}
              </Button>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileType className="h-3 w-3" /> TXT
                <FileText className="h-3 w-3 ml-1" /> PDF
                <FileImage className="h-3 w-3 ml-1" /> Images
              </div>
              {totalTasks > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportPlan}
                  className="gap-1 ml-auto"
                >
                  <Download className="h-4 w-4" />
                  Export TXT
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Import tasks from text files, PDFs, or images (OCR). One topic per line recommended.
            </p>
          </div>

          {/* Add Custom Task */}
          <div className="p-4 rounded-lg border">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Custom Task
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Topic name"
                value={newTask.topic}
                onChange={(e) => setNewTask((prev) => ({ ...prev, topic: e.target.value }))}
                className="md:col-span-2"
              />
              <Select
                value={newTask.category}
                onValueChange={(v: any) => setNewTask((prev) => ({ ...prev, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aptitude">Aptitude</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="company">Company Specific</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addTask} className="gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Play className="h-5 w-5 text-primary" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayTasks.map((task) => {
                const Icon = getCategoryIcon(task.category);
                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      task.completed ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" : "bg-background"
                    }`}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className={`flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                      {task.topic}
                    </span>
                    <Badge variant="outline" className={getCategoryColor(task.category)}>
                      {task.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.duration}m
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Schedule */}
      {Object.keys(groupedByDay).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Full Schedule
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetPlan} className="gap-1">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-6">
                {Object.entries(groupedByDay)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([day, tasks]) => {
                    const dayDate = new Date(day);
                    const isToday = day === new Date().toISOString().split("T")[0];
                    const isPast = dayDate < new Date(new Date().setHours(0, 0, 0, 0));
                    const dayCompleted = tasks.filter((t) => t.completed).length;

                    return (
                      <div key={day} className={`${isPast && !isToday ? "opacity-50" : ""}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">
                            {dayDate.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </h4>
                          {isToday && (
                            <Badge variant="default" className="text-xs">Today</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {dayCompleted}/{tasks.length} done
                          </span>
                        </div>
                        <div className="space-y-2 ml-4 border-l-2 border-muted pl-4">
                          {tasks.map((task) => {
                            const Icon = getCategoryIcon(task.category);
                            return (
                              <div
                                key={task.id}
                                className={`flex items-center gap-2 text-sm ${
                                  task.completed ? "text-muted-foreground" : ""
                                }`}
                              >
                                <Checkbox
                                  checked={task.completed}
                                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                                />
                                {task.completed ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Icon className="h-4 w-4" />
                                )}
                                <span className={task.completed ? "line-through" : ""}>
                                  {task.topic}
                                </span>
                                <Badge variant="outline" className={`text-xs ${getCategoryColor(task.category)}`}>
                                  {task.duration}m
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {totalTasks === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Study Plan Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Set your exam date and generate a personalized study timetable
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => generatePlan("government")}>
                <Sparkles className="h-4 w-4 mr-2" />
                Government Exam Plan
              </Button>
              <Button variant="outline" onClick={() => generatePlan("it_company")}>
                <Code className="h-4 w-4 mr-2" />
                IT Company Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
