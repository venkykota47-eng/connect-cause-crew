import { jsPDF } from "jspdf";
import { Download, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

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

interface Message {
  id: string;
  sender: "AI" | "STUDENT";
  content: string;
  timestamp: Date;
}

interface PDFReportGeneratorProps {
  feedback: Feedback | null;
  messages: Message[];
  jobRole: string;
  company: string;
  difficulty: string;
  interviewType: string;
  voiceEnabled: boolean;
  onImport?: (data: any) => void;
}

export const PDFReportGenerator = ({
  feedback,
  messages,
  jobRole,
  company,
  difficulty,
  interviewType,
  voiceEnabled,
  onImport,
}: PDFReportGeneratorProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToPDF = () => {
    if (!feedback) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Helper function to add text with word wrap
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246); // Primary blue
    doc.text("MOCK INTERVIEW REPORT", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Subtitle line
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 15;

    // Interview Details Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Interview Details", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Job Role: ${jobRole}`, 20, yPos);
    yPos += 6;
    doc.text(`Company: ${company || "Not specified"}`, 20, yPos);
    yPos += 6;
    doc.text(`Difficulty: ${difficulty}`, 20, yPos);
    yPos += 6;
    doc.text(`Interview Type: ${interviewType}`, 20, yPos);
    yPos += 6;
    doc.text(`Voice Mode: ${voiceEnabled ? "Enabled" : "Disabled"}`, 20, yPos);
    yPos += 6;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 12;

    // Overall Verdict
    const overallScore = Math.round((feedback.communication + feedback.technical + feedback.confidence + feedback.problemSolving) / 4 * 10);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    if (feedback.finalVerdict === "READY") {
      doc.setTextColor(34, 197, 94); // Green
      doc.text(`✓ READY FOR INTERVIEWS (${overallScore}%)`, pageWidth / 2, yPos, { align: "center" });
    } else {
      doc.setTextColor(234, 179, 8); // Yellow
      doc.text(`⚡ NEEDS MORE PRACTICE (${overallScore}%)`, pageWidth / 2, yPos, { align: "center" });
    }
    yPos += 15;

    // Core Evaluation Scores
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Core Evaluation Scores", 20, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const scores = [
      { label: "Communication", score: feedback.communication },
      { label: "Technical Knowledge", score: feedback.technical },
      { label: "Confidence", score: feedback.confidence },
      { label: "Problem Solving", score: feedback.problemSolving },
    ];

    scores.forEach((item) => {
      const barWidth = (item.score / 10) * 100;
      const color = item.score >= 8 ? [34, 197, 94] : item.score >= 6 ? [234, 179, 8] : [239, 68, 68];
      
      doc.text(`${item.label}: ${item.score}/10`, 20, yPos);
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(100, yPos - 4, barWidth, 5, "F");
      doc.setDrawColor(200, 200, 200);
      doc.rect(100, yPos - 4, 100, 5, "S");
      yPos += 8;
    });

    // Voice Feedback (if available)
    if (feedback.voiceFeedback) {
      yPos += 5;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Voice Feedback Metrics", 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      const voiceScores = [
        { label: "Fluency", score: feedback.voiceFeedback.fluencyScore },
        { label: "Grammar", score: feedback.voiceFeedback.grammarScore },
        { label: "Voice Clarity", score: feedback.voiceFeedback.voiceClarityScore },
        { label: "Fear Reduction", score: feedback.voiceFeedback.fearReductionScore },
      ];

      voiceScores.forEach((item) => {
        const barWidth = (item.score / 10) * 100;
        const color = item.score >= 8 ? [34, 197, 94] : item.score >= 6 ? [234, 179, 8] : [239, 68, 68];
        
        doc.text(`${item.label}: ${item.score}/10`, 20, yPos);
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(100, yPos - 4, barWidth, 5, "F");
        doc.setDrawColor(200, 200, 200);
        doc.rect(100, yPos - 4, 100, 5, "S");
        yPos += 8;
      });

      doc.text(`Speaking Speed: ${feedback.voiceFeedback.wordsPerMinute} WPM`, 20, yPos);
      yPos += 6;
      doc.text(`Hesitations Detected: ${feedback.voiceFeedback.hesitationCount}`, 20, yPos);
      yPos += 10;
    }

    // Key Strengths
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94);
    doc.text("Key Strengths", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    feedback.strengths.forEach((strength) => {
      yPos = addWrappedText(`• ${strength}`, 25, yPos, pageWidth - 45);
      yPos += 2;
    });

    // Areas of Improvement
    yPos += 8;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(234, 179, 8);
    doc.text("Areas of Improvement", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    feedback.improvements.forEach((improvement) => {
      yPos = addWrappedText(`• ${improvement}`, 25, yPos, pageWidth - 45);
      yPos += 2;
    });

    // Improvement Advice
    yPos += 8;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text("Improvement Advice", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    yPos = addWrappedText(feedback.improvementAdvice, 20, yPos, pageWidth - 40);

    // New page for conversation transcript
    doc.addPage();
    yPos = 20;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text("Interview Transcript", 20, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    messages.forEach((message) => {
      const sender = message.sender === "AI" ? "Interviewer" : "Candidate";
      const prefix = `[${sender}]: `;
      
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text(prefix, 20, yPos);
      doc.setFont("helvetica", "normal");
      
      const textWidth = doc.getTextWidth(prefix);
      yPos = addWrappedText(message.content, 20 + textWidth, yPos, pageWidth - 40 - textWidth, 5);
      yPos += 5;
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated by AI Mock Interview | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Save PDF
    doc.save(`mock-interview-report-${new Date().toISOString().split("T")[0]}.pdf`);

    toast({
      title: "PDF Report Downloaded",
      description: "Your detailed interview report has been saved.",
    });
  };

  const exportToJSON = () => {
    if (!feedback) return;

    const reportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      interview: {
        jobRole,
        company,
        difficulty,
        interviewType,
        voiceEnabled,
      },
      feedback,
      messages: messages.map((m) => ({
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mock-interview-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "Interview data exported as JSON for import later.",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.version && data.interview && data.feedback) {
          onImport?.(data);
          toast({
            title: "Report Imported",
            description: "Previous interview data loaded successfully.",
          });
        } else {
          throw new Error("Invalid format");
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid file format. Please use a valid JSON export.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {feedback && (
        <>
          <Button variant="outline" onClick={exportToPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={exportToJSON} className="gap-2">
            <FileText className="h-4 w-4" />
            Export JSON
          </Button>
        </>
      )}
      <input
        type="file"
        accept=".json"
        onChange={handleImport}
        ref={fileInputRef}
        className="hidden"
      />
      <Button
        variant="ghost"
        onClick={() => fileInputRef.current?.click()}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import Report
      </Button>
    </div>
  );
};
