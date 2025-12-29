import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  type: "new_application" | "application_status" | "new_message";
  recipientEmail: string;
  recipientName: string;
  data: {
    opportunityTitle?: string;
    applicantName?: string;
    status?: string;
    senderName?: string;
    messagePreview?: string;
  };
}

const getEmailContent = (type: string, recipientName: string, data: any) => {
  switch (type) {
    case "new_application":
      return {
        subject: `New Application for "${data.opportunityTitle}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">New Volunteer Application</h1>
            <p>Hello ${recipientName},</p>
            <p><strong>${data.applicantName}</strong> has applied for your opportunity: <strong>"${data.opportunityTitle}"</strong>.</p>
            <p>Log in to SkillBridge to review their application and connect with this volunteer.</p>
            <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">This is an automated notification from SkillBridge.</p>
            </div>
          </div>
        `,
      };
    case "application_status":
      const statusColor = data.status === "accepted" ? "#16a34a" : data.status === "rejected" ? "#dc2626" : "#f59e0b";
      const statusText = data.status === "accepted" ? "Accepted" : data.status === "rejected" ? "Not Selected" : "Under Review";
      return {
        subject: `Application Update: ${statusText}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Application Status Update</h1>
            <p>Hello ${recipientName},</p>
            <p>Your application for <strong>"${data.opportunityTitle}"</strong> has been updated.</p>
            <div style="margin: 24px 0; padding: 16px; background-color: ${statusColor}20; border-left: 4px solid ${statusColor}; border-radius: 4px;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${statusColor};">Status: ${statusText}</p>
            </div>
            ${data.status === "accepted" ? "<p>Congratulations! The organization will be in touch with next steps.</p>" : ""}
            <p>Log in to SkillBridge to view more details.</p>
            <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">This is an automated notification from SkillBridge.</p>
            </div>
          </div>
        `,
      };
    case "new_message":
      return {
        subject: `New Message from ${data.senderName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">New Message</h1>
            <p>Hello ${recipientName},</p>
            <p>You have received a new message from <strong>${data.senderName}</strong>:</p>
            <div style="margin: 24px 0; padding: 16px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #2563eb;">
              <p style="margin: 0; font-style: italic; color: #374151;">"${data.messagePreview}${data.messagePreview && data.messagePreview.length >= 100 ? "..." : ""}"</p>
            </div>
            <p>Log in to SkillBridge to reply.</p>
            <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">This is an automated notification from SkillBridge.</p>
            </div>
          </div>
        `,
      };
    default:
      return {
        subject: "SkillBridge Notification",
        html: `<p>You have a new notification on SkillBridge.</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipientEmail, recipientName, data }: NotificationEmailRequest = await req.json();

    console.log(`Sending ${type} email to ${recipientEmail}`);

    const { subject, html } = getEmailContent(type, recipientName, data);

    const emailResponse = await resend.emails.send({
      from: "SkillBridge <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
