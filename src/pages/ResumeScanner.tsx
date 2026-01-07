import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Image,
  FileImage,
  Loader2,
  RefreshCw,
  Eye,
  Languages,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type ExperienceLevel = "fresher" | "experienced";
type FileType = "text" | "pdf" | "image";

interface ExtractedInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
  website: string | null;
  education: { degree: string; institution: string; year: string; gpa?: string }[];
  experience: { title: string; company: string; duration: string; description: string[] }[];
  skills: { technical: string[]; soft: string[]; languages: string[] };
  certifications: string[];
  projects: { name: string; description: string; technologies: string[] }[];
  summary: string | null;
  totalYearsExperience: number;
  languages: string[];
}

interface SectionAnalysis {
  name: string;
  present: boolean;
  score: number;
  details: string;
  icon: React.ReactNode;
  weight: number;
}

interface ATSResult {
  score: number;
  extractedInfo: ExtractedInfo;
  keywords: { found: string[]; missing: string[]; relevanceScore: number };
  suggestions: { priority: "high" | "medium" | "low"; text: string }[];
  formatting: { score: number; issues: string[]; strengths: string[] };
  sections: SectionAnalysis[];
  actionVerbs: { found: string[]; missing: string[] };
  quantifiableAchievements: string[];
  readabilityScore: number;
  bulletPointCount: number;
  wordCount: number;
}

// Comprehensive keyword lists
const TECHNICAL_KEYWORDS = [
  "javascript", "python", "java", "react", "node.js", "sql", "aws", "docker",
  "kubernetes", "git", "html", "css", "typescript", "mongodb", "postgresql",
  "api", "rest", "graphql", "machine learning", "data analysis", "cloud",
  "agile", "scrum", "devops", "ci/cd", "linux", "azure", "gcp", "redis",
  "elasticsearch", "microservices", "terraform", "jenkins", "ansible",
  "react native", "flutter", "swift", "kotlin", "go", "rust", "scala",
  "spark", "hadoop", "tableau", "power bi", "excel", "jira", "confluence"
];

const SOFT_SKILLS = [
  "leadership", "teamwork", "communication", "problem-solving", "analytical",
  "collaboration", "innovation", "detail-oriented", "time management",
  "adaptability", "critical thinking", "creativity", "interpersonal",
  "negotiation", "presentation", "mentoring", "strategic planning",
  "project management", "decision making", "conflict resolution",
  "emotional intelligence", "customer service", "multitasking"
];

const ACTION_VERBS = [
  "achieved", "developed", "implemented", "managed", "led", "created",
  "designed", "improved", "increased", "reduced", "delivered", "launched",
  "optimized", "streamlined", "spearheaded", "coordinated", "established",
  "executed", "generated", "initiated", "maintained", "negotiated",
  "organized", "oversaw", "produced", "resolved", "supervised", "trained",
  "analyzed", "built", "collaborated", "contributed", "drove", "enabled",
  "facilitated", "grew", "guided", "influenced", "integrated", "mentored",
  "pioneered", "restructured", "scaled", "transformed", "unified"
];

const FRESHER_KEYWORDS = [
  "internship", "projects", "coursework", "academic", "gpa", "cgpa",
  "graduate", "undergraduate", "thesis", "research", "extracurricular",
  "volunteer", "certification", "training", "workshop", "competition",
  "hackathon", "capstone", "laboratory", "dissertation", "scholarship"
];

const EXPERIENCED_KEYWORDS = [
  "years of experience", "senior", "lead", "manager", "director",
  "architect", "principal", "team lead", "budget", "revenue", "p&l",
  "stakeholder", "strategy", "roadmap", "growth", "transformation",
  "enterprise", "portfolio", "cross-functional", "c-level", "executive"
];

const PROGRAMMING_LANGUAGES = [
  "english", "spanish", "french", "german", "chinese", "mandarin",
  "hindi", "arabic", "portuguese", "japanese", "korean", "russian",
  "italian", "dutch", "swedish", "polish", "turkish", "vietnamese"
];

const ResumeScanner = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeText, setResumeText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("fresher");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Enhanced text extraction from PDF
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        setExtractionProgress((i / pdf.numPages) * 100);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n\n";
      }
      
      return fullText.trim();
    } catch (error) {
      console.error("PDF extraction error:", error);
      throw new Error("Failed to extract text from PDF");
    }
  };

  // Extract text from image using OCR
  const extractTextFromImage = async (file: File): Promise<string> => {
    try {
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setExtractionProgress(m.progress * 100);
          }
        },
      });
      return result.data.text;
    } catch (error) {
      console.error("OCR error:", error);
      throw new Error("Failed to extract text from image");
    }
  };

  // Enhanced contact extraction with more patterns
  const extractContactInfo = useCallback((text: string): Partial<ExtractedInfo> => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin:?\s*)([a-zA-Z0-9-]+)/gi;
    const githubRegex = /(?:github\.com\/|github:?\s*)([a-zA-Z0-9-]+)/gi;
    const websiteRegex = /(?:website|portfolio|blog)?:?\s*(https?:\/\/[^\s]+)/gi;
    
    const emails = text.match(emailRegex);
    const phones = text.match(phoneRegex);
    const linkedinMatch = linkedinRegex.exec(text);
    const githubMatch = githubRegex.exec(text);
    const websiteMatch = websiteRegex.exec(text);

    // Extract name - improved logic
    const lines = text.split('\n').filter(l => l.trim());
    let name = null;
    
    // Look for name patterns
    const namePatterns = [
      /^(?:name:?\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/m,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/m,
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        name = match[1].trim();
        break;
      }
    }
    
    // Fallback: check first few lines
    if (!name) {
      for (const line of lines.slice(0, 5)) {
        const cleaned = line.trim();
        if (/^[A-Za-z\s]{3,50}$/.test(cleaned) && 
            cleaned.split(/\s+/).length >= 2 && 
            cleaned.split(/\s+/).length <= 4 &&
            !cleaned.toLowerCase().includes("resume") &&
            !cleaned.toLowerCase().includes("curriculum")) {
          name = cleaned;
          break;
        }
      }
    }

    // Extract location with multiple patterns
    const locationPatterns = [
      /(?:address|location|city|based in):\s*([^\n,]+(?:,\s*[^\n]+)?)/i,
      /([A-Za-z\s]+,\s*[A-Za-z]{2,}\s*(?:\d{5,6})?)/,
      /([A-Za-z\s]+,\s*[A-Za-z\s]+,?\s*[A-Za-z]+)/,
    ];
    let location = null;
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]?.trim().length > 3) {
        location = match[1].trim();
        break;
      }
    }

    return {
      name,
      email: emails?.[0] || null,
      phone: phones?.[0]?.replace(/[^\d+\-.\s()]/g, '') || null,
      location,
      linkedin: linkedinMatch?.[1] || null,
      github: githubMatch?.[1] || null,
      website: websiteMatch?.[1] || null,
    };
  }, []);

  // Enhanced education extraction
  const extractEducation = useCallback((text: string): ExtractedInfo["education"] => {
    const education: ExtractedInfo["education"] = [];
    const lowerText = text.toLowerCase();
    
    // Find education section
    const educationSectionMatch = text.match(/(?:education|academic|qualification)[s]?[:\s]*\n?([\s\S]*?)(?=\n\s*(?:experience|skills|projects|certifications|work|employment)|$)/i);
    const educationText = educationSectionMatch?.[1] || text;
    
    const degreePatterns = [
      { pattern: /(?:ph\.?d\.?|doctorate)\s*(?:in|of)?\s*([a-z\s,]+)/gi, type: "Ph.D." },
      { pattern: /(?:master'?s?|m\.?s\.?|m\.?a\.?|m\.?e\.?|m\.?tech|msc|ma|mba)\s*(?:in|of)?\s*([a-z\s,]+)/gi, type: "Master's" },
      { pattern: /(?:bachelor'?s?|b\.?s\.?|b\.?a\.?|b\.?e\.?|b\.?tech|bsc|ba|b\.?com)\s*(?:in|of)?\s*([a-z\s,]+)/gi, type: "Bachelor's" },
      { pattern: /(?:associate'?s?|a\.?s\.?|a\.?a\.?)\s*(?:in|of)?\s*([a-z\s,]+)/gi, type: "Associate's" },
      { pattern: /(?:diploma|certificate)\s*(?:in|of)?\s*([a-z\s,]+)/gi, type: "Diploma" },
    ];

    for (const { pattern, type } of degreePatterns) {
      let match;
      while ((match = pattern.exec(educationText)) !== null) {
        const field = match[1]?.trim().slice(0, 50);
        if (field && field.length > 2) {
          education.push({
            degree: `${type} in ${field}`,
            institution: "Institution identified",
            year: "",
          });
        }
      }
    }

    // Extract institutions
    const universityPattern = /(?:university|college|institute|school|academy)\s*(?:of)?\s*[a-z\s]+/gi;
    const unis = educationText.match(universityPattern);
    if (unis && education.length > 0) {
      unis.forEach((uni, idx) => {
        if (education[idx]) {
          education[idx].institution = uni.trim();
        }
      });
    }

    // Extract years
    const yearPattern = /(?:20|19)\d{2}(?:\s*[-–to]+\s*(?:20|19)?\d{2,4}|(?:\s*[-–]\s*)?present)?/gi;
    const years = educationText.match(yearPattern);
    if (years && education.length > 0) {
      years.forEach((year, idx) => {
        if (education[idx]) {
          education[idx].year = year.trim();
        }
      });
    }

    // Extract GPA
    const gpaMatch = educationText.match(/(?:gpa|cgpa|grade|average):\s*([0-9.]+)(?:\s*\/\s*([0-9.]+))?/i);
    if (gpaMatch && education.length > 0) {
      education[0].gpa = gpaMatch[2] ? `${gpaMatch[1]}/${gpaMatch[2]}` : gpaMatch[1];
    }

    return education.slice(0, 5);
  }, []);

  // Enhanced experience extraction
  const extractExperience = useCallback((text: string): ExtractedInfo["experience"] => {
    const experience: ExtractedInfo["experience"] = [];
    
    // Find experience section
    const experienceSectionMatch = text.match(/(?:experience|employment|work\s*history|professional\s*background)[s]?[:\s]*\n?([\s\S]*?)(?=\n\s*(?:education|skills|projects|certifications)|$)/i);
    const experienceText = experienceSectionMatch?.[1] || text;
    
    // Job title patterns
    const titlePatterns = [
      /(?:software|senior|junior|lead|principal|staff|associate|chief|head|vice|assistant)?\s*(?:engineer|developer|architect|manager|analyst|designer|consultant|specialist|director|coordinator|administrator|executive|officer)/gi,
      /(?:project|product|program|technical|engineering|it|data|business|marketing|sales|hr|finance|operations)?\s*(?:manager|lead|director|analyst|engineer|specialist)/gi,
      /(?:intern|trainee|fellow|apprentice)/gi,
    ];

    // Duration patterns
    const durationPattern = /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.\s]*(?:20|19)?\d{2}\s*[-–to]+\s*(?:present|current|ongoing|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.\s]*(?:20|19)?\d{2,4})/gi;
    
    const durations = experienceText.match(durationPattern) || [];
    const foundTitles: string[] = [];
    
    for (const pattern of titlePatterns) {
      let match;
      while ((match = pattern.exec(experienceText)) !== null) {
        if (!foundTitles.includes(match[0].toLowerCase())) {
          foundTitles.push(match[0].toLowerCase());
          
          // Try to find company name near the title
          const titleIndex = experienceText.indexOf(match[0]);
          const nearbyText = experienceText.slice(Math.max(0, titleIndex - 100), titleIndex + 100);
          
          // Look for company indicators
          const companyMatch = nearbyText.match(/(?:at|@|,)\s*([A-Z][a-zA-Z\s&.]+(?:Inc|LLC|Ltd|Corp|Company|Co|Technologies|Tech|Solutions)?)/);
          
          experience.push({
            title: match[0].trim(),
            company: companyMatch?.[1]?.trim() || "Company identified",
            duration: durations[experience.length] || "Duration found",
            description: [],
          });
        }
      }
    }

    // Extract bullet points for each position
    const bulletPoints = experienceText.match(/[•\-\*]\s*[A-Z][^•\-\*\n]{20,}/g) || [];
    if (experience.length > 0 && bulletPoints.length > 0) {
      const pointsPerJob = Math.ceil(bulletPoints.length / experience.length);
      experience.forEach((exp, idx) => {
        exp.description = bulletPoints.slice(idx * pointsPerJob, (idx + 1) * pointsPerJob).map(b => b.replace(/^[•\-\*]\s*/, ''));
      });
    }

    return experience.slice(0, 6);
  }, []);

  // Enhanced skills extraction with categorization
  const extractSkills = useCallback((text: string): ExtractedInfo["skills"] => {
    const lowerText = text.toLowerCase();
    const technical: string[] = [];
    const soft: string[] = [];
    const languages: string[] = [];

    TECHNICAL_KEYWORDS.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        technical.push(skill);
      }
    });

    SOFT_SKILLS.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        soft.push(skill);
      }
    });

    PROGRAMMING_LANGUAGES.forEach(lang => {
      if (lowerText.includes(lang.toLowerCase())) {
        languages.push(lang);
      }
    });

    return { technical: [...new Set(technical)], soft: [...new Set(soft)], languages: [...new Set(languages)] };
  }, []);

  // Extract projects
  const extractProjects = useCallback((text: string): ExtractedInfo["projects"] => {
    const projects: ExtractedInfo["projects"] = [];
    
    const projectSectionMatch = text.match(/(?:projects?|portfolio|personal\s*projects?)[:\s]*\n?([\s\S]*?)(?=\n\s*(?:experience|education|skills|certifications)|$)/i);
    const projectText = projectSectionMatch?.[1] || "";
    
    if (!projectText) return projects;
    
    // Split by common project delimiters
    const projectBlocks = projectText.split(/\n(?=[A-Z][^a-z]*:|\d+\.|•|\-)/);
    
    for (const block of projectBlocks) {
      if (block.trim().length < 20) continue;
      
      const lines = block.split('\n');
      const name = lines[0]?.replace(/[•\-\d.]/g, '').trim();
      
      if (name && name.length > 3 && name.length < 100) {
        const description = lines.slice(1).join(' ').trim();
        const techMatch = block.match(/(?:technologies?|tech\s*stack|built\s*with|using)[:\s]*([^.\n]+)/i);
        
        projects.push({
          name,
          description: description.slice(0, 200),
          technologies: techMatch?.[1]?.split(/[,|]/).map(t => t.trim()).filter(t => t.length > 1) || [],
        });
      }
    }
    
    return projects.slice(0, 5);
  }, []);

  // Extract certifications
  const extractCertifications = useCallback((text: string): string[] => {
    const certs: string[] = [];
    const certPatterns = [
      /(?:aws|azure|google|cisco|oracle|microsoft|pmp|scrum|agile|comptia|salesforce)\s*(?:certified|certification)?[a-z\s-]*/gi,
      /certified\s+[a-z\s-]+(?:professional|associate|expert|specialist|master)?/gi,
      /(?:cpa|cfa|cissp|ceh|ccna|ccnp|mcsa|mcse|itil|prince2|six\s*sigma)[a-z\s]*/gi,
    ];

    for (const pattern of certPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim();
          if (cleaned.length > 3 && !certs.includes(cleaned.toLowerCase())) {
            certs.push(cleaned);
          }
        });
      }
    }

    return [...new Set(certs)].slice(0, 8);
  }, []);

  // Extract quantifiable achievements with better parsing
  const extractQuantifiableAchievements = useCallback((text: string): string[] => {
    const achievements: string[] = [];
    
    const sentences = text.split(/[.!?\n]/);
    const achievementPatterns = [
      /\d+[%$€£]\s*[a-z]/i,
      /\$\d+(?:k|m|b|,\d+)?/i,
      /\d+(?:x|\s*times?)\s/i,
      /(?:saved|reduced|increased|improved|generated|grew|achieved|delivered|managed)\s*(?:\$|€|£)?\d+/i,
      /\d+\s*(?:percent|%|users|customers|clients|projects|employees|team\s*members)/i,
      /(?:top|first|#1|number\s*one)\s*\d*/i,
    ];
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 30 && trimmed.length < 200) {
        for (const pattern of achievementPatterns) {
          if (pattern.test(trimmed)) {
            achievements.push(trimmed);
            break;
          }
        }
      }
    });

    return [...new Set(achievements)].slice(0, 8);
  }, []);

  // Calculate years of experience
  const calculateYearsExperience = useCallback((text: string): number => {
    const lowerText = text.toLowerCase();
    
    // Direct mention
    const yearsMatch = lowerText.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i);
    if (yearsMatch) {
      return parseInt(yearsMatch[1]);
    }

    // Calculate from job durations
    const durationPattern = /(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.\s]*(\d{2,4})\s*[-–to]+\s*(?:present|current|ongoing|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.\s]*(\d{2,4}))/gi;
    let totalMonths = 0;
    let match;
    
    while ((match = durationPattern.exec(text)) !== null) {
      let startYear = parseInt(match[1]);
      let endYear = match[2] ? parseInt(match[2]) : new Date().getFullYear();
      
      if (startYear < 100) startYear = startYear > 50 ? 1900 + startYear : 2000 + startYear;
      if (endYear < 100) endYear = endYear > 50 ? 1900 + endYear : 2000 + endYear;
      
      totalMonths += Math.max(0, (endYear - startYear) * 12 + 6);
    }

    return Math.round(totalMonths / 12);
  }, []);

  // Calculate readability score
  const calculateReadabilityScore = useCallback((text: string): number => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((count, word) => {
      return count + (word.match(/[aeiouy]+/gi)?.length || 1);
    }, 0);
    
    if (sentences.length === 0 || words.length === 0) return 50;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Flesch Reading Ease adapted for resumes
    const score = Math.max(0, Math.min(100, 
      206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
    ));
    
    // Resumes should be concise, so moderate this score
    return Math.round((score + 50) / 1.5);
  }, []);

  // Main analysis function
  const analyzeResume = useCallback(() => {
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
      const projects = extractProjects(text);
      const quantifiableAchievements = extractQuantifiableAchievements(text);
      const totalYearsExperience = calculateYearsExperience(text);
      const readabilityScore = calculateReadabilityScore(text);

      // Extract summary
      const summaryPatterns = [
        /(?:summary|objective|profile|about\s*me|professional\s*summary)[:\s]*\n?([^]*?)(?=\n\s*(?:experience|education|skills|work|employment)|\n\n)/i,
      ];
      let summary = null;
      for (const pattern of summaryPatterns) {
        const match = text.match(pattern);
        if (match && match[1]?.trim().length > 30) {
          summary = match[1].trim().slice(0, 400);
          break;
        }
      }

      const extractedInfo: ExtractedInfo = {
        name: contactInfo.name || null,
        email: contactInfo.email || null,
        phone: contactInfo.phone || null,
        location: contactInfo.location || null,
        linkedin: contactInfo.linkedin || null,
        github: contactInfo.github || null,
        website: contactInfo.website || null,
        education,
        experience,
        skills,
        certifications,
        projects,
        summary,
        totalYearsExperience,
        languages: skills.languages,
      };

      // Keywords analysis based on experience level
      const relevantKeywords = experienceLevel === "fresher" 
        ? [...FRESHER_KEYWORDS, ...TECHNICAL_KEYWORDS.slice(0, 20), ...SOFT_SKILLS.slice(0, 10)]
        : [...EXPERIENCED_KEYWORDS, ...TECHNICAL_KEYWORDS, ...SOFT_SKILLS];

      const foundKeywords = relevantKeywords.filter(kw => lowerText.includes(kw.toLowerCase()));
      const missingKeywords = relevantKeywords
        .filter(kw => !lowerText.includes(kw.toLowerCase()))
        .slice(0, 10);
      const keywordRelevanceScore = Math.min(100, (foundKeywords.length / Math.min(relevantKeywords.length, 25)) * 100);

      // Action verbs analysis
      const foundActionVerbs = ACTION_VERBS.filter(verb => 
        new RegExp(`\\b${verb}(?:ed|ing|s)?\\b`, 'i').test(text)
      );
      const missingActionVerbs = ACTION_VERBS.filter(verb => 
        !new RegExp(`\\b${verb}(?:ed|ing|s)?\\b`, 'i').test(text)
      ).slice(0, 8);

      // Section analysis with weights
      const sections: SectionAnalysis[] = [
        {
          name: "Contact Information",
          present: !!(contactInfo.email || contactInfo.phone),
          score: [contactInfo.email, contactInfo.phone, contactInfo.location, contactInfo.linkedin, contactInfo.github].filter(Boolean).length * 20,
          details: contactInfo.email && contactInfo.phone ? "Complete contact information found" : "Missing some contact details",
          icon: <Mail className="w-4 h-4" />,
          weight: 0.15,
        },
        {
          name: "Professional Summary",
          present: !!summary,
          score: summary ? (summary.length > 150 ? 100 : summary.length > 80 ? 75 : 50) : 0,
          details: summary ? `${summary.length} characters - ${summary.length > 150 ? "Good length" : "Could be more detailed"}` : "Add a professional summary",
          icon: <User className="w-4 h-4" />,
          weight: experienceLevel === "fresher" ? 0.10 : 0.15,
        },
        {
          name: experienceLevel === "fresher" ? "Projects & Internships" : "Work Experience",
          present: experience.length > 0 || projects.length > 0,
          score: Math.min((experience.length * 25) + (projects.length * 15) + (quantifiableAchievements.length * 5), 100),
          details: `${experience.length} positions, ${projects.length} projects, ${quantifiableAchievements.length} achievements`,
          icon: <Briefcase className="w-4 h-4" />,
          weight: experienceLevel === "fresher" ? 0.25 : 0.30,
        },
        {
          name: "Education",
          present: education.length > 0,
          score: Math.min(education.length * 35, 100),
          details: education.length > 0 ? `${education.length} qualifications found${education[0]?.gpa ? ` (GPA: ${education[0].gpa})` : ""}` : "Add education details",
          icon: <GraduationCap className="w-4 h-4" />,
          weight: experienceLevel === "fresher" ? 0.20 : 0.10,
        },
        {
          name: "Technical Skills",
          present: skills.technical.length > 0,
          score: Math.min(skills.technical.length * 6, 100),
          details: skills.technical.length > 0 ? `${skills.technical.length} technical skills identified` : "Add relevant technical skills",
          icon: <Target className="w-4 h-4" />,
          weight: 0.15,
        },
        {
          name: "Soft Skills",
          present: skills.soft.length > 0,
          score: Math.min(skills.soft.length * 12, 100),
          details: skills.soft.length > 0 ? `${skills.soft.length} soft skills identified` : "Add soft skills",
          icon: <TrendingUp className="w-4 h-4" />,
          weight: 0.05,
        },
        {
          name: "Certifications",
          present: certifications.length > 0,
          score: Math.min(certifications.length * 30, 100),
          details: certifications.length > 0 ? `${certifications.length} certifications found` : "Consider adding relevant certifications",
          icon: <Award className="w-4 h-4" />,
          weight: 0.05,
        },
        {
          name: "Languages",
          present: skills.languages.length > 0,
          score: Math.min(skills.languages.length * 40, 100),
          details: skills.languages.length > 0 ? `${skills.languages.length} languages listed` : "Consider adding language proficiencies",
          icon: <Languages className="w-4 h-4" />,
          weight: 0.05,
        },
      ];

      // Formatting analysis
      const formattingIssues: string[] = [];
      const formattingStrengths: string[] = [];
      const wordCount = text.split(/\s+/).length;
      const bulletPointCount = (text.match(/[•\-\*]\s*[A-Z]/g) || []).length;
      
      if (wordCount < 200) formattingIssues.push("Resume is too short (< 200 words). Add more details.");
      else if (wordCount < 400) formattingIssues.push("Resume could use more content (300-600 words recommended).");
      else if (wordCount > 1200) formattingIssues.push("Resume is too long (> 1200 words). Keep it to 1-2 pages.");
      else formattingStrengths.push(`Good length: ${wordCount} words`);
      
      if (bulletPointCount < 5) formattingIssues.push("Use more bullet points to highlight achievements.");
      else if (bulletPointCount >= 8) formattingStrengths.push(`Good use of ${bulletPointCount} bullet points`);
      
      if (foundActionVerbs.length < 5) formattingIssues.push("Use more action verbs (achieved, developed, managed, etc.).");
      else formattingStrengths.push(`Strong action verbs used (${foundActionVerbs.length} found)`);
      
      if (quantifiableAchievements.length < 2) formattingIssues.push("Add quantifiable achievements with numbers and metrics.");
      else formattingStrengths.push(`${quantifiableAchievements.length} quantifiable achievements`);
      
      if (!contactInfo.email) formattingIssues.push("Email address not found.");
      if (!contactInfo.phone) formattingIssues.push("Phone number not found.");
      if (!contactInfo.linkedin) formattingIssues.push("LinkedIn profile not found.");
      
      if (skills.technical.length < 5) formattingIssues.push("Add more technical skills for better keyword matching.");
      else formattingStrengths.push(`Rich skills section (${skills.technical.length} technical skills)`);
      
      if (experienceLevel === "fresher") {
        if (projects.length < 2) formattingIssues.push("As a fresher, highlight more projects.");
        if (!education[0]?.gpa) formattingIssues.push("Consider adding your GPA if it's strong (3.0+).");
      } else {
        if (totalYearsExperience === 0) formattingIssues.push("Clearly mention your years of experience.");
        if (quantifiableAchievements.length < 4) formattingIssues.push("Experienced professionals should highlight more measurable achievements.");
      }

      const formattingScore = Math.max(0, 100 - (formattingIssues.length * 8) + (formattingStrengths.length * 5));

      // Calculate overall weighted score
      const sectionScore = sections.reduce((sum, s) => sum + (s.score * s.weight), 0);
      const keywordScore = keywordRelevanceScore * 0.15;
      const actionVerbScore = Math.min((foundActionVerbs.length / 12) * 100, 100) * 0.10;
      const achievementScore = Math.min(quantifiableAchievements.length * 12, 100) * 0.10;
      const readabilityBonus = readabilityScore * 0.05;
      
      const overallScore = Math.round(
        sectionScore + keywordScore + actionVerbScore + achievementScore + readabilityBonus + (formattingScore * 0.05)
      );

      // Generate prioritized suggestions
      const suggestions: ATSResult["suggestions"] = [];
      
      if (!summary) {
        suggestions.push({ priority: "high", text: "Add a compelling professional summary at the top (3-4 sentences about your key strengths)." });
      }
      if (!contactInfo.email || !contactInfo.phone) {
        suggestions.push({ priority: "high", text: "Include complete contact information (email, phone, location)." });
      }
      if (quantifiableAchievements.length < 3) {
        suggestions.push({ priority: "high", text: "Quantify your achievements with numbers (e.g., 'Increased sales by 25%', 'Managed team of 8')." });
      }
      if (foundActionVerbs.length < 6) {
        suggestions.push({ priority: "medium", text: `Use more action verbs: ${missingActionVerbs.slice(0, 4).join(", ")}.` });
      }
      if (missingKeywords.length > 5) {
        suggestions.push({ priority: "medium", text: `Add relevant keywords: ${missingKeywords.slice(0, 5).join(", ")}.` });
      }
      if (skills.technical.length < 8) {
        suggestions.push({ priority: "medium", text: "Expand your technical skills section with more relevant technologies." });
      }
      if (!contactInfo.linkedin) {
        suggestions.push({ priority: "low", text: "Add your LinkedIn profile URL for better networking." });
      }
      if (experienceLevel === "fresher" && certifications.length === 0) {
        suggestions.push({ priority: "low", text: "Add relevant certifications or online courses to strengthen your profile." });
      }
      if (skills.soft.length < 3) {
        suggestions.push({ priority: "low", text: "Mention soft skills like leadership, teamwork, or communication." });
      }

      setAtsResult({
        score: Math.min(overallScore, 100),
        extractedInfo,
        keywords: { found: foundKeywords, missing: missingKeywords, relevanceScore: keywordRelevanceScore },
        suggestions: suggestions.length > 0 ? suggestions : [{ priority: "low", text: "Your resume looks well-optimized!" }],
        formatting: { score: formattingScore, issues: formattingIssues, strengths: formattingStrengths },
        sections,
        actionVerbs: { found: foundActionVerbs, missing: missingActionVerbs },
        quantifiableAchievements,
        readabilityScore,
        bulletPointCount,
        wordCount,
      });
      
      setIsAnalyzing(false);
    }, 1000);
  }, [resumeText, editedText, isEditing, experienceLevel, extractContactInfo, extractEducation, extractExperience, extractSkills, extractCertifications, extractProjects, extractQuantifiableAchievements, calculateYearsExperience, calculateReadabilityScore, toast]);

  // Handle file upload with format detection
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    setAtsResult(null);
    setIsExtracting(true);
    setExtractionProgress(0);

    try {
      let extractedText = "";
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      // Determine file type and extract text
      if (fileExtension === "pdf") {
        setFileType("pdf");
        extractedText = await extractTextFromPDF(file);
      } else if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff"].includes(fileExtension || "")) {
        setFileType("image");
        // Create preview URL for images
        setPreviewUrl(URL.createObjectURL(file));
        extractedText = await extractTextFromImage(file);
      } else if (["txt", "doc", "docx", "rtf"].includes(fileExtension || "")) {
        setFileType("text");
        extractedText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      } else {
        throw new Error("Unsupported file format");
      }

      if (extractedText.trim().length < 50) {
        toast({
          title: "Low text content",
          description: "Very little text was extracted. Please ensure the resume is readable.",
          variant: "destructive",
        });
      }

      setResumeText(extractedText);
      setEditedText(extractedText);
      
      toast({
        title: "Resume uploaded",
        description: `${file.name} processed successfully. ${extractedText.split(/\s+/).length} words extracted.`,
      });
    } catch (error) {
      console.error("File processing error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
      setExtractionProgress(0);
    }
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
    a.download = fileName?.replace(/\.[^/.]+$/, ".txt") || "resume.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your resume text has been downloaded.",
    });
  };

  const handleSaveEdit = () => {
    setResumeText(editedText);
    setIsEditing(false);
    setAtsResult(null);
    toast({
      title: "Changes saved",
      description: "Your resume has been updated. Click 'Analyze Resume' to re-scan.",
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
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Needs Improvement";
    return "Poor";
  };

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    if (priority === "high") return "bg-red-500/10 text-red-600 border-red-500/20";
    if (priority === "medium") return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    return "bg-green-500/10 text-green-600 border-green-500/20";
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
              Upload PDF, images (JPG, PNG), or text files. Get real-time ATS analysis with 
              keyword extraction and personalized suggestions.
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
                Select your experience level for tailored analysis criteria
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
                  <RadioGroupItem value="fresher" id="fresher" className="peer sr-only" />
                  <Label
                    htmlFor="fresher"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <GraduationCap className="mb-3 h-8 w-8 text-primary" />
                    <span className="font-semibold">Fresher / Entry Level</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      Students, graduates, 0-2 years experience
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="experienced" id="experienced" className="peer sr-only" />
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
                Supports PDF, Images (JPG, PNG, WEBP), and Text files
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
                  accept=".txt,.pdf,.doc,.docx,.rtf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {isExtracting ? (
                  <div className="py-4">
                    <Loader2 className="w-12 h-12 mx-auto text-primary mb-4 animate-spin" />
                    <p className="font-medium text-primary mb-2">Processing {fileType === "image" ? "image with OCR" : fileType}...</p>
                    <Progress value={extractionProgress} className="max-w-xs mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">{Math.round(extractionProgress)}% complete</p>
                  </div>
                ) : fileName ? (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {fileType === "pdf" && <FileText className="w-8 h-8 text-red-500" />}
                      {fileType === "image" && <FileImage className="w-8 h-8 text-blue-500" />}
                      {fileType === "text" && <FileText className="w-8 h-8 text-green-500" />}
                    </div>
                    <p className="font-medium text-primary">{fileName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {resumeText.split(/\s+/).length} words extracted • Click to upload different file
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-center gap-4 mb-4">
                      <div className="flex flex-col items-center">
                        <FileText className="w-10 h-10 text-red-500 mb-1" />
                        <span className="text-xs text-muted-foreground">PDF</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Image className="w-10 h-10 text-blue-500 mb-1" />
                        <span className="text-xs text-muted-foreground">JPG/PNG</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <FileText className="w-10 h-10 text-green-500 mb-1" />
                        <span className="text-xs text-muted-foreground">TXT/DOC</span>
                      </div>
                    </div>
                    <p className="font-medium">Drop your resume here or click to browse</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports PDF, images (with OCR), and text files
                    </p>
                  </div>
                )}
              </div>

              {/* Image Preview */}
              {previewUrl && fileType === "image" && (
                <div className="mt-4 p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Image Preview
                  </p>
                  <img src={previewUrl} alt="Resume preview" className="max-h-48 mx-auto rounded border" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 justify-center">
                <Button onClick={analyzeResume} disabled={!resumeText || isAnalyzing || isExtracting} size="lg">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Analyze Resume
                    </>
                  )}
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
                {atsResult && (
                  <Button variant="outline" onClick={() => {
                    setAtsResult(null);
                    analyzeResume();
                  }}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-scan
                  </Button>
                )}
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
                    {resumeText ? "Edit Resume Content" : "Paste Your Resume"}
                  </CardTitle>
                  <CardDescription>Edit or paste your resume content for analysis</CardDescription>
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
                  placeholder={`Paste your resume content here...

Example format:
JOHN DOE
john.doe@email.com | +1 234-567-8900 | linkedin.com/in/johndoe | github.com/johndoe
New York, NY

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years of expertise in building scalable web applications...

EXPERIENCE
Senior Software Engineer at ABC Technologies (Jan 2020 - Present)
• Led development of microservices architecture, reducing response time by 40%
• Managed team of 5 developers and delivered 3 major product launches
• Implemented CI/CD pipeline reducing deployment time by 60%

Software Engineer at XYZ Corp (Jun 2018 - Dec 2019)
• Developed React-based frontend serving 100k+ daily users
• Optimized database queries improving performance by 35%

EDUCATION
Bachelor of Science in Computer Science
University of Technology (2014-2018)
GPA: 3.8/4.0

SKILLS
Technical: JavaScript, React, Node.js, Python, AWS, Docker, Kubernetes, SQL, MongoDB
Soft Skills: Leadership, Communication, Problem-solving, Team Collaboration

CERTIFICATIONS
• AWS Certified Solutions Architect
• Scrum Master Certified`}
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    {editedText.split(/\s+/).filter(w => w).length} words
                  </div>
                  <div className="flex gap-3">
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
                  Scanning for {experienceLevel === "fresher" ? "projects, education, and skills" : "experience, achievements, and leadership"}
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
                        <span className="text-sm text-muted-foreground">ATS Score</span>
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <p className={`text-2xl font-bold ${getScoreColor(atsResult.score)}`}>
                        {getScoreLabel(atsResult.score)}
                      </p>
                      <p className="text-muted-foreground mt-2">
                        Your resume {atsResult.score >= 70 ? "is well-optimized" : "needs improvement"} for Applicant Tracking Systems.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xl font-bold text-primary">{atsResult.wordCount}</p>
                          <p className="text-xs text-muted-foreground">Words</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xl font-bold text-secondary">{atsResult.keywords.found.length}</p>
                          <p className="text-xs text-muted-foreground">Keywords</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xl font-bold gradient-text">{atsResult.actionVerbs.found.length}</p>
                          <p className="text-xs text-muted-foreground">Action Verbs</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-xl font-bold text-green-500">{atsResult.quantifiableAchievements.length}</p>
                          <p className="text-xs text-muted-foreground">Achievements</p>
                        </div>
                      </div>
                      {atsResult.extractedInfo.totalYearsExperience > 0 && (
                        <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {atsResult.extractedInfo.totalYearsExperience} years of experience detected
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for detailed analysis */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="extracted">Extracted</TabsTrigger>
                  <TabsTrigger value="keywords">Keywords</TabsTrigger>
                  <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  {/* Section Analysis */}
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

                  {/* Formatting Strengths & Issues */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {atsResult.formatting.strengths.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-green-500">
                            <CheckCircle className="w-5 h-5" />
                            Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {atsResult.formatting.strengths.map((strength, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    {atsResult.formatting.issues.length > 0 && (
                      <Card className="border-yellow-500/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-yellow-500">
                            <AlertCircle className="w-5 h-5" />
                            Areas to Improve
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {atsResult.formatting.issues.map((issue, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Extracted Information Tab */}
                <TabsContent value="extracted" className="space-y-6 mt-6">
                  {/* Contact & Personal Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Extracted Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Contact */}
                      <div>
                        <p className="text-sm font-medium mb-3">Contact Information</p>
                        <div className="grid md:grid-cols-2 gap-3">
                          {atsResult.extractedInfo.name && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{atsResult.extractedInfo.name}</span>
                            </div>
                          )}
                          {atsResult.extractedInfo.email && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span>{atsResult.extractedInfo.email}</span>
                            </div>
                          )}
                          {atsResult.extractedInfo.phone && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{atsResult.extractedInfo.phone}</span>
                            </div>
                          )}
                          {atsResult.extractedInfo.location && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{atsResult.extractedInfo.location}</span>
                            </div>
                          )}
                          {atsResult.extractedInfo.linkedin && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                              <Linkedin className="w-4 h-4 text-muted-foreground" />
                              <span>linkedin.com/in/{atsResult.extractedInfo.linkedin}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Skills */}
                      {(atsResult.extractedInfo.skills.technical.length > 0 || atsResult.extractedInfo.skills.soft.length > 0) && (
                        <div>
                          <p className="text-sm font-medium mb-3">Skills Identified</p>
                          {atsResult.extractedInfo.skills.technical.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-muted-foreground mb-2">Technical Skills</p>
                              <div className="flex flex-wrap gap-2">
                                {atsResult.extractedInfo.skills.technical.map((skill) => (
                                  <Badge key={skill} variant="skill" className="capitalize">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {atsResult.extractedInfo.skills.soft.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Soft Skills</p>
                              <div className="flex flex-wrap gap-2">
                                {atsResult.extractedInfo.skills.soft.map((skill) => (
                                  <Badge key={skill} variant="outline" className="capitalize">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Education */}
                      {atsResult.extractedInfo.education.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-3">Education</p>
                          <div className="space-y-2">
                            {atsResult.extractedInfo.education.map((edu, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                                <GraduationCap className="w-4 h-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="font-medium text-sm">{edu.degree}</p>
                                  <p className="text-xs text-muted-foreground">{edu.institution} {edu.year && `• ${edu.year}`}</p>
                                  {edu.gpa && <p className="text-xs text-green-600">GPA: {edu.gpa}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Certifications */}
                      {atsResult.extractedInfo.certifications.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-3">Certifications</p>
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

                      {/* Quantifiable Achievements */}
                      {atsResult.quantifiableAchievements.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-3">Quantifiable Achievements Found</p>
                          <ul className="space-y-2">
                            {atsResult.quantifiableAchievements.map((achievement, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm p-2 bg-green-500/5 rounded">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{achievement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Keywords Tab */}
                <TabsContent value="keywords" className="space-y-6 mt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-500">
                          <CheckCircle className="w-5 h-5" />
                          Keywords Found ({atsResult.keywords.found.length})
                        </CardTitle>
                        <CardDescription>
                          Relevance Score: {Math.round(atsResult.keywords.relevanceScore)}%
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.keywords.found.length > 0 ? (
                            atsResult.keywords.found.slice(0, 20).map((keyword) => (
                              <Badge key={keyword} variant="skill" className="capitalize">{keyword}</Badge>
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
                        <CardDescription>
                          Consider adding these if relevant
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.keywords.missing.map((keyword) => (
                            <Badge key={keyword} variant="outline" className="capitalize">{keyword}</Badge>
                          ))}
                        </div>
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
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-medium text-green-500 mb-2">✓ Found ({atsResult.actionVerbs.found.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {atsResult.actionVerbs.found.length > 0 ? (
                              atsResult.actionVerbs.found.map((verb) => (
                                <Badge key={verb} className="capitalize bg-green-500/10 text-green-600 border-green-500/20">{verb}</Badge>
                              ))
                            ) : (
                              <p className="text-muted-foreground text-sm">No action verbs found</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Consider using:</p>
                          <div className="flex flex-wrap gap-2">
                            {atsResult.actionVerbs.missing.map((verb) => (
                              <Badge key={verb} variant="outline" className="capitalize">{verb}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Suggestions Tab */}
                <TabsContent value="suggestions" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Improvement Suggestions
                      </CardTitle>
                      <CardDescription>
                        Prioritized recommendations to improve your ATS score
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {atsResult.suggestions.map((suggestion, idx) => (
                          <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${getPriorityColor(suggestion.priority)}`}>
                            <div className="flex-shrink-0">
                              <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                                {suggestion.priority.charAt(0).toUpperCase() + suggestion.priority.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm">{suggestion.text}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Edit & Re-scan Button */}
              <div className="text-center pt-4">
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
