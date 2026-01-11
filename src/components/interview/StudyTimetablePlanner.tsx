import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";

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

          {/* Compact Progress Overview */}
          {totalTasks > 0 && (
            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">Progress</span>
                    <span className="text-xs text-muted-foreground">
                      {completedTasks}/{totalTasks}
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">{Math.round(progress)}%</span>
                  {studyPlan.examDate && (
                    <p className="text-[10px] text-muted-foreground">
                      {Math.ceil(
                        (new Date(studyPlan.examDate).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}d left
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

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
