import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InterviewRequest {
  type: "interview" | "feedback";
  messages?: { role: string; content: string }[];
  conversation?: { role: string; content: string }[];
  jobRole: string;
  company?: string;
  difficulty: string;
  interviewType: string;
  voiceEnabled?: boolean;
  voiceMetrics?: {
    hesitationCount: number;
    wordsPerMinute: number;
    totalWords: number;
    durationMinutes: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, messages, conversation, jobRole, company, difficulty, interviewType, voiceEnabled, voiceMetrics }: InterviewRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt: string;
    let requestMessages: { role: string; content: string }[];

    if (type === "feedback") {
      // Generate feedback from the conversation
      const voiceMetricsInfo = voiceEnabled && voiceMetrics 
        ? `\n\nVoice Interview Metrics:
- Hesitations detected: ${voiceMetrics.hesitationCount}
- Speaking speed: ${voiceMetrics.wordsPerMinute} words per minute
- Total words spoken: ${voiceMetrics.totalWords}
- Interview duration: ${voiceMetrics.durationMinutes.toFixed(1)} minutes`
        : "";

      const voiceFeedbackSchema = voiceEnabled 
        ? `,
  "voiceFeedback": {
    "fluencyScore": number (1-10, how smoothly they speak),
    "grammarScore": number (1-10, grammatical correctness),
    "fearReductionScore": number (1-10, confidence improvement observed),
    "hesitationCount": number (filler words like um, uh, like detected),
    "wordsPerMinute": number (speaking pace),
    "voiceClarityScore": number (1-10, how clear and articulate)
  }`
        : "";

      systemPrompt = `You are a placement evaluation expert specializing in interview assessment.

Analyze the following mock interview conversation and provide structured feedback.
${voiceMetricsInfo}

Evaluate on a scale of 1–10:
- Communication skills (clarity, articulation, listening)
- Technical knowledge (accuracy, depth, relevance)
- Confidence (composure, self-assurance, handling pressure)
- Problem-solving ability (analytical thinking, approach, creativity)
${voiceEnabled ? `
Also evaluate voice/speaking skills:
- Fluency (smooth flow of speech without breaks)
- Grammar accuracy (correct sentence structure)
- Fear reduction progress (improvement in nervousness)
- Voice clarity (articulation and pronunciation)` : ""}

Also provide:
- Key strengths (3-5 specific, actionable bullet points)
- Areas of improvement (3-5 specific, actionable bullet points)
- Overall readiness verdict (READY if scores average 7+ otherwise NEEDS_PRACTICE)
- Short improvement advice (max 5 lines, practical and encouraging)

Respond ONLY in valid JSON format with this structure:
{
  "communication": number,
  "technical": number,
  "confidence": number,
  "problemSolving": number,
  "strengths": string[],
  "improvements": string[],
  "finalVerdict": "READY" | "NEEDS_PRACTICE",
  "improvementAdvice": string${voiceFeedbackSchema}
}`;

      const conversationText = conversation?.map(m => 
        `${m.role === "AI" ? "Interviewer" : "Candidate"}: ${m.content}`
      ).join("\n\n");

      requestMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Conversation:\n${conversationText}` }
      ];

    } else {
      // Interview mode - build system prompt based on interview type
      let interviewModePrompt = "";
      
      if (interviewType === "ENGLISH_COMMUNICATION") {
        interviewModePrompt = `You are a friendly English communication coach for job interviews.

Your goal:
- Improve spoken English
- Improve sentence clarity
- Improve confidence while speaking

Rules:
1. Let the student speak freely.
2. Never mock or criticize.
3. After each answer:
   - Gently correct any grammar or pronunciation hints
   - Suggest better phrasing when appropriate
4. Encourage the student to speak more.
5. Ask follow-up questions to practice conversation.

Keep your tone calm, motivating, and supportive.
Speak slowly and clearly.
Focus on: Job Role: ${jobRole}, Company: ${company || "A top company"}`;

      } else if (interviewType === "CONFIDENCE_BUILDING") {
        interviewModePrompt = `You are a calm and supportive interview mentor.

The student feels nervous and lacks confidence.

Your task:
- Help reduce interview fear
- Encourage speaking without fear of mistakes
- Ask simple questions first
- Gradually increase difficulty
- Praise effort, not perfection
- Be warm and reassuring

Never judge.
Never rush.
Always motivate.

Your goal is confidence, not correctness.
Focus on: Job Role: ${jobRole}, Company: ${company || "A top company"}`;

      } else {
        // Standard interview modes (TECHNICAL, HR, BEHAVIORAL, MIXED)
        interviewModePrompt = `You are an experienced placement interviewer from a top MNC.

Your role:
- Conduct a professional mock interview for a student.
- Ask one question at a time.
- Wait for the student's response before asking the next question.
- Adjust difficulty based on the student's answers.
- Be polite, realistic, and interview-focused (not teaching).

Interview context:
- Job Role: ${jobRole}
- Company: ${company || "A top tech company"}
- Difficulty: ${difficulty}
- Interview Type: ${interviewType}

For Technical interviews: Focus on coding, algorithms, system design, and technical concepts.
For HR interviews: Focus on behavioral questions, career goals, and company fit.
For Behavioral interviews: Focus on situational questions, teamwork, and leadership.
For Mixed interviews: Combine all types of questions.`;
      }

      systemPrompt = `${interviewModePrompt}

Rules:
1. Do NOT give answers unless explicitly asked.
2. Do NOT reveal evaluation during the interview.
3. Ask follow-up questions if the answer is shallow.
4. Keep responses concise and professional.
5. Start with a brief introduction and a warm greeting.
6. Ask about 5-7 questions before wrapping up.
7. If the user says they want to end the interview, respond with exactly: "INTERVIEW_COMPLETED"`;

      requestMessages = [
        { role: "system", content: systemPrompt },
        ...(messages || []).map(m => ({
          role: m.role === "AI" ? "assistant" : "user",
          content: m.content
        }))
      ];

      // If no messages, start the interview
      if (!messages || messages.length === 0) {
        requestMessages.push({
          role: "user",
          content: "Start the interview now."
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: requestMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (type === "feedback") {
      // Parse the JSON feedback
      try {
        // Extract JSON from the response (handle markdown code blocks)
        let jsonStr = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
        const feedback = JSON.parse(jsonStr.trim());
        return new Response(JSON.stringify({ feedback }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (parseError) {
        console.error("Failed to parse feedback JSON:", parseError, content);
        return new Response(JSON.stringify({ 
          feedback: {
            communication: 7,
            technical: 7,
            confidence: 7,
            problemSolving: 7,
            strengths: ["Good effort", "Participated actively"],
            improvements: ["Could provide more detailed answers"],
            finalVerdict: "NEEDS_PRACTICE",
            improvementAdvice: "Keep practicing and focus on providing structured answers."
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ message: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Mock interview error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
