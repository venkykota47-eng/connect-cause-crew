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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, messages, conversation, jobRole, company, difficulty, interviewType }: InterviewRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt: string;
    let requestMessages: { role: string; content: string }[];

    if (type === "feedback") {
      // Generate feedback from the conversation
      systemPrompt = `You are a placement evaluation expert.

Analyze the following mock interview conversation and provide structured feedback.

Evaluate on a scale of 1–10:
- Communication skills
- Technical knowledge
- Confidence
- Problem-solving ability

Also provide:
- Key strengths (3-5 bullet points)
- Areas of improvement (3-5 bullet points)
- Overall readiness verdict (READY or NEEDS_PRACTICE)
- Short improvement advice (max 5 lines)

Respond ONLY in valid JSON format with this structure:
{
  "communication": number,
  "technical": number,
  "confidence": number,
  "problemSolving": number,
  "strengths": string[],
  "improvements": string[],
  "finalVerdict": "READY" | "NEEDS_PRACTICE",
  "improvementAdvice": string
}`;

      const conversationText = conversation?.map(m => 
        `${m.role === "AI" ? "Interviewer" : "Candidate"}: ${m.content}`
      ).join("\n\n");

      requestMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Conversation:\n${conversationText}` }
      ];

    } else {
      // Interview mode
      systemPrompt = `You are an experienced technical placement interviewer from a top MNC.

Your role:
- Conduct a professional mock interview for a student.
- Ask one question at a time.
- Wait for the student's response before asking the next question.
- Adjust difficulty based on the student's answers.
- Mix technical, problem-solving, and behavioral questions based on the interview type.
- Be polite, realistic, and interview-focused (not teaching).

Interview context:
- Job Role: ${jobRole}
- Company: ${company || "A top tech company"}
- Difficulty: ${difficulty}
- Interview Type: ${interviewType}

Rules:
1. Do NOT give answers unless explicitly asked.
2. Do NOT reveal evaluation during the interview.
3. Ask follow-up questions if the answer is shallow.
4. Keep responses concise and professional.
5. Start with a brief introduction and a warm greeting.
6. Ask about 5-7 questions before wrapping up.
7. If the user says they want to end the interview, respond with exactly: "INTERVIEW_COMPLETED"

For Technical interviews: Focus on coding, algorithms, system design, and technical concepts.
For HR interviews: Focus on behavioral questions, career goals, and company fit.
For Behavioral interviews: Focus on situational questions, teamwork, and leadership.
For Mixed interviews: Combine all types of questions.`;

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
