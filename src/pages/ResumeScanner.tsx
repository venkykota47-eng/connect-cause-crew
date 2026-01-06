import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";

interface ATSResult {
  score: number;
  keywords: { found: string[]; missing: string[] };
  suggestions: string[];
  formatting: { score: number; issues: string[] };
  sections: { name: string; present: boolean; score: number }[];
}

const ResumeScanner = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeText, setResumeText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // For demonstration, we'll read text files. In production, you'd use a PDF parser
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setResumeText(text);
      setEditedText(text);
      setAtsResult(null);
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
    
    // Simulate ATS analysis
    setTimeout(() => {
      const text = isEditing ? editedText : resumeText;
      const lowerText = text.toLowerCase();
      
      // Keywords commonly looked for
      const commonKeywords = [
        "leadership", "teamwork", "communication", "project management",
        "problem solving", "analytical", "technical", "programming",
        "collaboration", "innovation", "results-driven", "detail-oriented"
      ];
      
      const foundKeywords = commonKeywords.filter(kw => lowerText.includes(kw));
      const missingKeywords = commonKeywords.filter(kw => !lowerText.includes(kw)).slice(0, 5);

      // Check for common sections
      const sections = [
        { name: "Contact Information", keywords: ["email", "phone", "@", "linkedin"] },
        { name: "Work Experience", keywords: ["experience", "work", "employment", "job"] },
        { name: "Education", keywords: ["education", "university", "degree", "bachelor", "master"] },
        { name: "Skills", keywords: ["skills", "technologies", "proficiencies", "competencies"] },
        { name: "Summary", keywords: ["summary", "objective", "profile", "about"] },
      ];

      const sectionResults = sections.map(section => {
        const present = section.keywords.some(kw => lowerText.includes(kw));
        return {
          name: section.name,
          present,
          score: present ? 85 + Math.random() * 15 : 0,
        };
      });

      // Calculate formatting score
      const hasProperLength = text.length > 500 && text.length < 5000;
      const hasNumbers = /\d+/.test(text);
      const hasBulletPatterns = /[-•*]/.test(text);
      
      const formattingIssues: string[] = [];
      if (!hasProperLength) formattingIssues.push("Resume length should be between 500-5000 characters");
      if (!hasNumbers) formattingIssues.push("Include quantifiable achievements with numbers");
      if (!hasBulletPatterns) formattingIssues.push("Use bullet points to organize information");

      const formattingScore = 100 - (formattingIssues.length * 15);

      // Calculate overall score
      const keywordScore = (foundKeywords.length / commonKeywords.length) * 100;
      const sectionScore = (sectionResults.filter(s => s.present).length / sections.length) * 100;
      const overallScore = Math.round((keywordScore * 0.3 + sectionScore * 0.4 + formattingScore * 0.3));

      const suggestions = [
        "Add more action verbs to describe your achievements",
        "Include specific metrics and quantifiable results",
        "Tailor your resume to include job-specific keywords",
        "Ensure consistent formatting throughout the document",
        "Add a professional summary at the top",
      ].filter(() => Math.random() > 0.4);

      setAtsResult({
        score: overallScore,
        keywords: { found: foundKeywords, missing: missingKeywords },
        suggestions: suggestions.length > 0 ? suggestions : ["Your resume looks great! Consider minor optimizations."],
        formatting: { score: formattingScore, issues: formattingIssues },
        sections: sectionResults,
      });
      
      setIsAnalyzing(false);
    }, 2000);
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
      description: "Your resume has been updated.",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
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
        <div className="max-w-4xl mx-auto">
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
              Upload your resume to get instant ATS compatibility score, keyword analysis, 
              and actionable suggestions to improve your chances.
            </p>
          </div>

          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                Upload your resume file (.txt, .doc, .docx, .pdf) to analyze
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
                  accept=".txt,.doc,.docx,.pdf"
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
                    <p className="text-sm text-muted-foreground mt-1">Supports TXT, DOC, DOCX, PDF</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 justify-center">
                <Button onClick={analyzeResume} disabled={!resumeText || isAnalyzing}>
                  <Target className="w-4 h-4 mr-2" />
                  {isAnalyzing ? "Analyzing..." : "Scan Resume"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(true)} disabled={!resumeText}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Resume
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
                    Edit Resume
                  </CardTitle>
                  <CardDescription>Make changes to your resume content</CardDescription>
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
                  placeholder="Paste or edit your resume content here..."
                />
                <div className="flex gap-3 mt-4">
                  <Button onClick={handleSaveEdit}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
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
                <p className="text-muted-foreground">Analyzing your resume...</p>
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
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${(atsResult.score / 100) * 352} 352`}
                          className={getScoreColor(atsResult.score)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-3xl font-bold ${getScoreColor(atsResult.score)}`}>
                          {atsResult.score}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${getScoreColor(atsResult.score)}`}>
                        {getScoreLabel(atsResult.score)}
                      </p>
                      <p className="text-muted-foreground mt-1">
                        Your resume is {atsResult.score >= 60 ? "well-optimized" : "needs improvement"} for ATS systems
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                      <div key={section.name} className="flex items-center gap-4">
                        <div className="w-40 flex items-center gap-2">
                          {section.present ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm font-medium">{section.name}</span>
                        </div>
                        <div className="flex-1">
                          <Progress value={section.score} className="h-2" />
                        </div>
                        <span className="text-sm text-muted-foreground w-12">
                          {Math.round(section.score)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Keywords */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-500">
                      <CheckCircle className="w-5 h-5" />
                      Keywords Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {atsResult.keywords.found.length > 0 ? (
                        atsResult.keywords.found.map((keyword) => (
                          <Badge key={keyword} variant="skill" className="capitalize">
                            {keyword}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No common keywords found</p>
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
                  </CardContent>
                </Card>
              </div>

              {/* Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-500">
                      <AlertCircle className="w-5 h-5" />
                      Formatting Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {atsResult.formatting.issues.map((issue, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <X className="w-4 h-4 text-red-500" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResumeScanner;
