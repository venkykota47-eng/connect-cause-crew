import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Edit3,
  Target,
  TrendingUp,
  Sparkles,
  X,
  Save,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Award,
  Calendar,
  User,
} from "lucide-react";

type ExperienceLevel = "fresher" | "experienced";

interface ExtractedInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  education: string[];
  experience: { title: string; company: string; duration: string }[];
  skills: string[];
  certifications: string[];
  summary: string | null;
  totalYearsExperience: number;
}

interface SectionAnalysis {
  name: string;
  present: boolean;
  score: number;
  details: string;
  icon: React.ReactNode;
}

interface ATSResult {
  score: number;
  extractedInfo: ExtractedInfo;
  keywords: { found: string[]; missing: string[] };
  suggestions: string[];
  formatting: { score: number; issues: string[] };
  sections: SectionAnalysis[];
  actionVerbs: { found: string[]; missing: string[] };
  quantifiableAchievements: string[];
}

// Comprehensive keyword lists
const TECHNICAL_KEYWORDS = [
  "javascript", "python", "java", "react", "node.js", "sql", "aws", "docker",
  "kubernetes", "git", "html", "css", "typescript", "mongodb", "postgresql",
  "api", "rest", "graphql", "machine learning", "data analysis", "cloud",
  "agile", "scrum", "devops", "ci/cd", "linux", "azure", "gcp"
];

const SOFT_SKILLS = [
  "leadership", "teamwork", "communication", "problem-solving", "analytical",
  "collaboration", "innovation", "detail-oriented", "time management",
  "adaptability", "critical thinking", "creativity", "interpersonal",
  "negotiation", "presentation", "mentoring", "strategic planning"
];

const ACTION_VERBS = [
  "achieved", "developed", "implemented", "managed", "led", "created",
  "designed", "improved", "increased", "reduced", "delivered", "launched",
  "optimized", "streamlined", "spearheaded", "coordinated", "established",
  "executed", "generated", "initiated", "maintained", "negotiated",
  "organized", "oversaw", "produced", "resolved", "supervised", "trained"
];

const FRESHER_KEYWORDS = [
  "internship", "projects", "coursework", "academic", "gpa", "cgpa",
  "graduate", "undergraduate", "thesis", "research", "extracurricular",
  "volunteer", "certification", "training", "workshop", "competition"
];

const EXPERIENCED_KEYWORDS = [
  "years of experience", "senior", "lead", "manager", "director",
  "architect", "principal", "team lead", "budget", "revenue", "p&l",
  "stakeholder", "strategy", "roadmap", "growth", "transformation"
];

const ResumeScanner = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeText, setResumeText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("fresher");

  const extractContactInfo = (text: string): Partial<ExtractedInfo> => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin:?\s*)([a-zA-Z0-9-]+)/gi;
    
    const emails = text.match(emailRegex);
    const phones = text.match(phoneRegex);
    const linkedinMatch = linkedinRegex.exec(text);

    // Extract name (usually at the top, first line with just text)
    const lines = text.split('\n').filter(l => l.trim());
    let name = null;
    for (const line of lines.slice(0, 5)) {
      const cleaned = line.trim();
      // Name is usually 2-4 words, no special characters except spaces
      if (/^[A-Za-z\s]{3,50}$/.test(cleaned) && cleaned.split(/\s+/).length <= 4) {
        name = cleaned;
        break;
      }
    }

    // Extract location
    const locationPatterns = [
      /(?:address|location|city):\s*([^\n]+)/i,
      /([A-Za-z\s]+,\s*[A-Za-z\s]+,?\s*(?:\d{5,6})?)/,
    ];
    let location = null;
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        location = match[1]?.trim() || match[0]?.trim();
        break;
      }
    }

    return {
      name,
      email: emails?.[0] || null,
      phone: phones?.[0] || null,
      location,
      linkedin: linkedinMatch?.[1] || null,
    };
  };

  const extractEducation = (text: string): string[] => {
    const education: string[] = [];
    const lowerText = text.toLowerCase();
    
    const degreePatterns = [
      /(?:bachelor|b\.?s\.?|b\.?a\.?|b\.?e\.?|b\.?tech|bsc|ba)\s*(?:of|in)?\s*[a-z\s]+/gi,
      /(?:master|m\.?s\.?|m\.?a\.?|m\.?e\.?|m\.?tech|msc|ma|mba)\s*(?:of|in)?\s*[a-z\s]+/gi,
      /(?:ph\.?d\.?|doctorate)\s*(?:in)?\s*[a-z\s]+/gi,
      /(?:diploma|certificate)\s*(?:in)?\s*[a-z\s]+/gi,
    ];

    for (const pattern of degreePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        education.push(...matches.map(m => m.trim()));
      }
    }

    // Check for universities
    const universityPattern = /(?:university|college|institute|school)\s*(?:of)?\s*[a-z\s]+/gi;
    const unis = text.match(universityPattern);
    if (unis) {
      education.push(...unis.slice(0, 2).map(u => u.trim()));
    }

    // Check for GPA/CGPA
    const gpaMatch = text.match(/(?:gpa|cgpa|grade):\s*([0-9.]+)/i);
    if (gpaMatch) {
      education.push(`GPA: ${gpaMatch[1]}`);
    }

    return [...new Set(education)].slice(0, 5);
  };

  const extractExperience = (text: string): { title: string; company: string; duration: string }[] => {
    const experience: { title: string; company: string; duration: string }[] = [];
    
    // Common job titles
    const titlePatterns = [
      /(?:software|senior|junior|lead|principal|staff)?\s*(?:engineer|developer|architect|manager|analyst|designer|consultant|specialist)/gi,
      /(?:project|product|program|technical|engineering)\s*(?:manager|lead|director)/gi,
      /(?:intern|trainee|associate|executive)/gi,
    ];

    // Duration patterns
    const durationPattern = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{2,4}\s*[-–to]+\s*(?:present|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{0,4}/gi;
    
    const durations = text.match(durationPattern) || [];
    
    for (const pattern of titlePatterns) {
      const titles = text.match(pattern);
      if (titles) {
        titles.forEach((title, idx) => {
          experience.push({
            title: title.trim(),
            company: "Company identified",
            duration: durations[idx] || "Duration found",
          });
        });
      }
    }

    return experience.slice(0, 5);
  };

  const extractSkills = (text: string): string[] => {
    const skills: string[] = [];
    const lowerText = text.toLowerCase();

    // Check for technical skills
    TECHNICAL_KEYWORDS.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });

    // Check for soft skills
    SOFT_SKILLS.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });

    return [...new Set(skills)];
  };

  const extractCertifications = (text: string): string[] => {
    const certs: string[] = [];
    const certPatterns = [
      /(?:aws|azure|google|cisco|oracle|microsoft|pmp|scrum|agile)\s*(?:certified|certification)?[a-z\s]*/gi,
      /certified\s+[a-z\s]+/gi,
    ];

    for (const pattern of certPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        certs.push(...matches.map(m => m.trim()));
      }
    }

    return [...new Set(certs)].slice(0, 5);
  };

  const extractQuantifiableAchievements = (text: string): string[] => {
    const achievements: string[] = [];
    
    // Look for sentences with numbers
    const sentences = text.split(/[.!?]/);
    const numberPattern = /\d+[%$kmb]?|\$\d+|\d+\s*(?:percent|million|billion|thousand|users|customers|clients|projects|years)/i;
    
    sentences.forEach(sentence => {
      if (numberPattern.test(sentence) && sentence.trim().length > 20) {
        achievements.push(sentence.trim());
      }
    });

    return achievements.slice(0, 6);
  };

  const calculateYearsExperience = (text: string): number => {
    const lowerText = text.toLowerCase();
    
    // Direct mention
    const yearsMatch = lowerText.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i);
    if (yearsMatch) {
      return parseInt(yearsMatch[1]);
    }

    // Count job durations
    const durationPattern = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{2,4})\s*[-–to]+\s*(?:present|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{2,4}))/gi;
    let totalMonths = 0;
    let match;
    
    while ((match = durationPattern.exec(text)) !== null) {
      const startYear = parseInt(match[1]);
      const endYear = match[2] ? parseInt(match[2]) : new Date().getFullYear();
      const normalizedStart = startYear < 100 ? 2000 + startYear : startYear;
      const normalizedEnd = endYear < 100 ? 2000 + endYear : endYear;
      totalMonths += (normalizedEnd - normalizedStart) * 12;
    }

    return Math.round(totalMonths / 12);
  };

  const analyzeResume = () => {
    if (!resumeText) {
      toast({
        title: "No resume",
        description: "Please upload a resume first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    setTimeout(() => {
      const text = isEditing ? editedText : resumeText;
      const lowerText = text.toLowerCase();
      
      // Extract all information
      const contactInfo = extractContactInfo(text);
      const education = extractEducation(text);
      const experience = extractExperience(text);
      const skills = extractSkills(text);
      const certifications = extractCertifications(text);
      const quantifiableAchievements = extractQuantifiableAchievements(text);
      const totalYearsExperience = calculateYearsExperience(text);

      // Extract summary
      const summaryPatterns = [
        /(?:summary|objective|profile|about me)[:\s]*([^]*?)(?=\n\n|experience|education|skills)/i,
      ];
      let summary = null;
      for (const pattern of summaryPatterns) {
        const match = text.match(pattern);
        if (match && match[1]?.trim().length > 20) {
          summary = match[1].trim().slice(0, 300);
          break;
        }
      }

      const extractedInfo: ExtractedInfo = {
        name: contactInfo.name || null,
        email: contactInfo.email || null,
        phone: contactInfo.phone || null,
        location: contactInfo.location || null,
        linkedin: contactInfo.linkedin || null,
        education,
        experience,
        skills,
        certifications,
        summary,
        totalYearsExperience,
      };

      // Keywords analysis based on experience level
      const relevantKeywords = experienceLevel === "fresher" 
        ? [...FRESHER_KEYWORDS, ...TECHNICAL_KEYWORDS.slice(0, 15), ...SOFT_SKILLS.slice(0, 8)]
        : [...EXPERIENCED_KEYWORDS, ...TECHNICAL_KEYWORDS, ...SOFT_SKILLS];

      const foundKeywords = relevantKeywords.filter(kw => lowerText.includes(kw.toLowerCase()));
      const missingKeywords = relevantKeywords
        .filter(kw => !lowerText.includes(kw.toLowerCase()))
        .slice(0, 8);

      // Action verbs analysis
      const foundActionVerbs = ACTION_VERBS.filter(verb => lowerText.includes(verb));
      const missingActionVerbs = ACTION_VERBS.filter(verb => !lowerText.includes(verb)).slice(0, 6);

      // Section analysis
      const sections: SectionAnalysis[] = [
        {
          name: "Contact Information",
          present: !!(contactInfo.email || contactInfo.phone),
          score: [contactInfo.email, contactInfo.phone, contactInfo.location, contactInfo.linkedin].filter(Boolean).length * 25,
          details: contactInfo.email && contactInfo.phone ? "Email and phone found" : "Missing contact details",
          icon: <Mail className="w-4 h-4" />,
        },
        {
          name: "Professional Summary",
          present: !!summary || lowerText.includes("summary") || lowerText.includes("objective"),
          score: summary ? (summary.length > 100 ? 90 : 60) : (lowerText.includes("summary") ? 40 : 0),
          details: summary ? "Summary section found" : "Add a professional summary",
          icon: <User className="w-4 h-4" />,
        },
        {
          name: experienceLevel === "fresher" ? "Projects/Internships" : "Work Experience",
          present: experience.length > 0 || lowerText.includes("experience") || lowerText.includes("project"),
          score: Math.min(experience.length * 20 + (quantifiableAchievements.length * 10), 100),
          details: experience.length > 0 ? `${experience.length} positions found` : "Add work experience",
          icon: <Briefcase className="w-4 h-4" />,
        },
        {
          name: "Education",
          present: education.length > 0,
          score: Math.min(education.length * 30, 100),
          details: education.length > 0 ? `${education.length} qualifications found` : "Add education details",
          icon: <GraduationCap className="w-4 h-4" />,
        },
        {
          name: "Skills",
          present: skills.length > 0,
          score: Math.min(skills.length * 8, 100),
          details: skills.length > 0 ? `${skills.length} skills identified` : "Add relevant skills",
          icon: <Target className="w-4 h-4" />,
        },
        {
          name: "Certifications",
          present: certifications.length > 0 || lowerText.includes("certified"),
          score: Math.min(certifications.length * 25, 100),
          details: certifications.length > 0 ? `${certifications.length} certifications found` : "Consider adding certifications",
          icon: <Award className="w-4 h-4" />,
        },
      ];

      // Formatting analysis
      const formattingIssues: string[] = [];
      const wordCount = text.split(/\s+/).length;
      
      if (wordCount < 150) formattingIssues.push("Resume is too short. Add more details about your experience and skills.");
      if (wordCount > 1000) formattingIssues.push("Resume is too long. Keep it concise (ideally 1-2 pages).");
      if (foundActionVerbs.length < 3) formattingIssues.push("Use more action verbs (achieved, developed, managed, etc.).");
      if (quantifiableAchievements.length < 2) formattingIssues.push("Add quantifiable achievements with numbers and metrics.");
      if (!contactInfo.email) formattingIssues.push("Email address not found. Add contact information.");
      if (!contactInfo.phone) formattingIssues.push("Phone number not found. Add contact information.");
      if (skills.length < 5) formattingIssues.push("Add more relevant skills to improve keyword matching.");
      
      if (experienceLevel === "fresher") {
        if (!lowerText.includes("project") && !lowerText.includes("internship")) {
          formattingIssues.push("As a fresher, highlight projects and internships.");
        }
        if (!lowerText.includes("gpa") && !lowerText.includes("cgpa") && !lowerText.includes("grade")) {
          formattingIssues.push("Consider adding your GPA/CGPA if it's strong.");
        }
      } else {
        if (totalYearsExperience === 0) {
          formattingIssues.push("Clearly mention your years of experience.");
        }
        if (quantifiableAchievements.length < 3) {
          formattingIssues.push("Experienced professionals should highlight measurable achievements.");
        }
      }

      const formattingScore = Math.max(100 - (formattingIssues.length * 12), 0);

      // Calculate overall score
      const sectionScore = sections.reduce((sum, s) => sum + s.score, 0) / sections.length;
      const keywordScore = (foundKeywords.length / relevantKeywords.length) * 100;
      const actionVerbScore = (foundActionVerbs.length / 10) * 100;
      const achievementScore = Math.min(quantifiableAchievements.length * 15, 100);

      // Weighted scoring based on experience level
      let overallScore: number;
      if (experienceLevel === "fresher") {
        overallScore = Math.round(
          sectionScore * 0.35 +
          keywordScore * 0.25 +
          formattingScore * 0.20 +
          actionVerbScore * 0.10 +
          achievementScore * 0.10
        );
      } else {
        overallScore = Math.round(
          sectionScore * 0.25 +
          keywordScore * 0.20 +
          formattingScore * 0.15 +
          actionVerbScore * 0.15 +
          achievementScore * 0.25
        );
      }

      // Generate smart suggestions
      const suggestions: string[] = [];
      
      if (!summary) {
        suggestions.push("Add a compelling professional summary at the top highlighting your key strengths.");
      }
      if (foundActionVerbs.length < 5) {
        suggestions.push(`Use more action verbs like: ${missingActionVerbs.slice(0, 3).join(", ")}.`);
      }
      if (quantifiableAchievements.length < 3) {
        suggestions.push("Quantify your achievements with numbers (e.g., 'Increased sales by 25%').");
      }
      if (missingKeywords.length > 0) {
        suggestions.push(`Consider adding keywords: ${missingKeywords.slice(0, 4).join(", ")}.`);
      }
      if (skills.length < 8) {
        suggestions.push("Expand your skills section with more relevant technical and soft skills.");
      }
      if (experienceLevel === "fresher" && certifications.length === 0) {
        suggestions.push("Add relevant certifications or online courses to strengthen your profile.");
      }
      if (experienceLevel === "experienced" && !lowerText.includes("leadership")) {
        suggestions.push("Highlight leadership experience and team management skills.");
      }
      if (!contactInfo.linkedin) {
        suggestions.push("Add your LinkedIn profile URL for better networking opportunities.");
      }

      setAtsResult({
        score: Math.min(overallScore, 100),
        extractedInfo,
        keywords: { found: foundKeywords, missing: missingKeywords },
        suggestions: suggestions.length > 0 ? suggestions : ["Your resume looks well-optimized!"],
        formatting: { score: formattingScore, issues: formattingIssues },
        sections,
        actionVerbs: { found: foundActionVerbs, missing: missingActionVerbs },
        quantifiableAchievements,
      });
      
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setAtsResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setResumeText(text);
      setEditedText(text);
      toast({
        title: "Resume uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Failed to read the file. Please try again.",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const text = isEditing ? editedText : resumeText;
    if (!text) {
      toast({
        title: "No resume",
        description: "Please upload or create a resume first.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "resume.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your resume is being downloaded.",
    });
  };

  const handleSaveEdit = () => {
    setResumeText(editedText);
    setIsEditing(false);
    setAtsResult(null);
    toast({
      title: "Changes saved",
      description: "Your resume has been updated. Click 'Scan Resume' to analyze again.",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Improvement";
    return "Poor";
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="skill" className="mb-4 px-4 py-1.5">
              <Sparkles className="w-4 h-4 mr-1" />
              AI-Powered Analysis
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Resume Scanner & <span className="gradient-text">ATS Score Checker</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get real-time resume analysis with ATS compatibility scoring, keyword extraction, 
              and personalized suggestions based on your experience level.
            </p>
          </div>

          {/* Experience Level Selection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Experience Level
              </CardTitle>
              <CardDescription>
                Select your experience level for tailored analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={experienceLevel}
                onValueChange={(value) => {
                  setExperienceLevel(value as ExperienceLevel);
                  setAtsResult(null);
                }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="fresher"
                    id="fresher"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="fresher"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <GraduationCap className="mb-3 h-8 w-8 text-primary" />
                    <span className="font-semibold">Fresher / Entry Level</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      Students, recent graduates, 0-2 years experience
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="experienced"
                    id="experienced"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="experienced"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Briefcase className="mb-3 h-8 w-8 text-secondary" />
                    <span className="font-semibold">Experienced Professional</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      3+ years of work experience
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                Upload your resume file (.txt) to analyze. Paste text content for best results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                {fileName ? (
                  <div>
                    <p className="font-medium text-primary">{fileName}</p>
                    <p className="text-sm text-muted-foreground mt-1">Click to upload a different file</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Drop your resume here or click to browse</p>
                    <p className="text-sm text-muted-foreground mt-1">Supports TXT files • Or paste content in edit mode</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 justify-center">
                <Button onClick={analyzeResume} disabled={!resumeText || isAnalyzing} size="lg">
                  <Target className="w-4 h-4 mr-2" />
                  {isAnalyzing ? "Analyzing..." : "Scan Resume"}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsEditing(true);
                  if (!resumeText) setEditedText("");
                }}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  {resumeText ? "Edit Resume" : "Paste Resume"}
                </Button>
                <Button variant="outline" onClick={handleDownload} disabled={!resumeText}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Edit Mode */}
          {isEditing && (
            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5" />
                    {resumeText ? "Edit Resume" : "Paste Your Resume"}
                  </CardTitle>
                  <CardDescription>Paste or edit your resume content for analysis</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Paste your resume content here...

Example format:
John Doe
john.doe@email.com | +1 234-567-8900 | linkedin.com/in/johndoe

SUMMARY
Experienced software developer with 5+ years...

EXPERIENCE
Software Engineer at ABC Company (Jan 2020 - Present)
- Developed features that increased user engagement by 40%
- Led a team of 5 developers...

EDUCATION
Bachelor of Science in Computer Science
University of Example (2016-2020)
GPA: 3.8

SKILLS
JavaScript, React, Node.js, Python, SQL, AWS..."
                />
                <div className="flex gap-3 mt-4">
                  <Button onClick={handleSaveEdit} disabled={!editedText.trim()}>
                    <Save className="w-4 h-4 mr-2" />
                    Save & Continue
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setEditedText(resumeText);
                    setIsEditing(false);
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Loading */}
          {isAnalyzing && (
            <Card className="mb-8">
              <CardContent className="py-12 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Analyzing your resume...</p>
                <p className="text-muted-foreground text-sm">
                  Checking for {experienceLevel === "fresher" ? "projects, education, and skills" : "experience, achievements, and leadership"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ATS Results */}
          {atsResult && !isAnalyzing && (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    ATS Compatibility Score
                    <Badge variant="outline" className="ml-2">
                      {experienceLevel === "fresher" ? "Fresher" : "Experienced"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative w-40 h-40">
                      <svg className="w-40 h-40 transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${(atsResult.score / 100) * 440} 440`}
                          className={getScoreColor(atsResult.score)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold ${getScoreColor(atsResult.score)}`}>
                          {atsResult.score}%
                        </span>
                        <span className="text-sm text-muted-foreground">Score</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className={`text-2xl font-bold ${getScoreColor(atsResult.score)}`}>
                        {getScoreLabel(atsResult.score)}
                      </p>
                      <p className="text-muted-foreground mt-2">
                        Your resume {atsResult.score >= 70 ? "is well-optimized" : "needs improvement"} for Applicant Tracking Systems.
                        {atsResult.extractedInfo.totalYearsExperience > 0 && (
                          <span className="block mt-1">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {atsResult.extractedInfo.totalYearsExperience} years of experience detected
                          </span>
                        )}
                      </p>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xl font-bold text-primary">{atsResult.keywords.found.length}</p>
                          <p className="text-xs text-muted-foreground">Keywords Found</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xl font-bold text-secondary">{atsResult.actionVerbs.found.length}</p>
                          <p className="text-xs text-muted-foreground">Action Verbs</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xl font-bold gradient-text">{atsResult.quantifiableAchievements.length}</p>
                          <p className="text-xs text-muted-foreground">Achievements</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Extracted Information */}
              {(atsResult.extractedInfo.name || atsResult.extractedInfo.email || atsResult.extractedInfo.skills.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Extracted Information
                    </CardTitle>
                    <CardDescription>What we found in your resume</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Contact Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {atsResult.extractedInfo.name && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{atsResult.extractedInfo.name}</span>
                        </div>
                      )}
                      {atsResult.extractedInfo.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{atsResult.extractedInfo.email}</span>
                        </div>
                      )}
                      {atsResult.extractedInfo.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{atsResult.extractedInfo.phone}</span>
                        </div>
                      )}
                      {atsResult.extractedInfo.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{atsResult.extractedInfo.location}</span>
                        </div>
                      )}
                      {atsResult.extractedInfo.linkedin && (
                        <div className="flex items-center gap-2">
                          <Linkedin className="w-4 h-4 text-muted-foreground" />
                          <span>linkedin.com/in/{atsResult.extractedInfo.linkedin}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {atsResult.extractedInfo.skills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Skills Identified:</p>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.extractedInfo.skills.map((skill) => (
                            <Badge key={skill} variant="skill" className="capitalize">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {atsResult.extractedInfo.education.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Education Found:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {atsResult.extractedInfo.education.map((edu, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4" />
                              {edu}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Certifications */}
                    {atsResult.extractedInfo.certifications.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Certifications:</p>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.extractedInfo.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="outline" className="capitalize">
                              <Award className="w-3 h-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Sections Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Section Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {atsResult.sections.map((section) => (
                      <div key={section.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {section.present ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm font-medium">{section.name}</span>
                          </div>
                          <span className={`text-sm font-medium ${getScoreColor(section.score)}`}>
                            {Math.round(section.score)}%
                          </span>
                        </div>
                        <Progress value={section.score} className="h-2" />
                        <p className="text-xs text-muted-foreground">{section.details}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Keywords & Action Verbs */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-500">
                      <CheckCircle className="w-5 h-5" />
                      Keywords Found ({atsResult.keywords.found.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {atsResult.keywords.found.length > 0 ? (
                        atsResult.keywords.found.slice(0, 15).map((keyword) => (
                          <Badge key={keyword} variant="skill" className="capitalize">
                            {keyword}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No keywords matched</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-500">
                      <AlertCircle className="w-5 h-5" />
                      Missing Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {atsResult.keywords.missing.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="capitalize">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Consider adding these keywords if relevant to your profile
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Action Verbs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Action Verbs Analysis
                  </CardTitle>
                  <CardDescription>
                    Strong action verbs make your achievements stand out
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-green-500 mb-2">
                        ✓ Found in your resume:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {atsResult.actionVerbs.found.length > 0 ? (
                          atsResult.actionVerbs.found.map((verb) => (
                            <Badge key={verb} className="capitalize bg-green-500/10 text-green-600 border-green-500/20">
                              {verb}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-sm">No action verbs found</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Consider using:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {atsResult.actionVerbs.missing.map((verb) => (
                          <Badge key={verb} variant="outline" className="capitalize">
                            {verb}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quantifiable Achievements */}
              {atsResult.quantifiableAchievements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Quantifiable Achievements Found
                    </CardTitle>
                    <CardDescription>
                      Great! These measurable achievements strengthen your resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {atsResult.quantifiableAchievements.map((achievement, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Improvement Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {atsResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-primary">{index + 1}</span>
                        </div>
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Formatting Issues */}
              {atsResult.formatting.issues.length > 0 && (
                <Card className="border-yellow-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-500">
                      <AlertCircle className="w-5 h-5" />
                      Formatting Issues ({atsResult.formatting.issues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {atsResult.formatting.issues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Re-scan Button */}
              <div className="text-center">
                <Button onClick={() => setIsEditing(true)} variant="outline" size="lg">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit & Re-scan Resume
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResumeScanner;
