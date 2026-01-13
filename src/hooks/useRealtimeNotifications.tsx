import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageSquare, UserCheck, Bell } from "lucide-react";

// Helper to send notification emails
const sendNotificationEmail = async (
  type: "new_application" | "application_status" | "new_message",
  recipientEmail: string,
  recipientName: string,
  data: Record<string, string | undefined>
) => {
  try {
    await supabase.functions.invoke("send-notification-email", {
      body: { type, recipientEmail, recipientName, data },
    });
    console.log(`Email notification sent: ${type}`);
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
};

export function useRealtimeNotifications() {
  const { profile } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!profile) return;

    const isNGO = profile.role === "ngo";

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel("realtime-notifications");

    // Listen for new messages
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${profile.id}`,
      },
      async (payload) => {
        const message = payload.new as { sender_id: string; content: string };
        
        // Fetch sender info (use safe_profiles view to avoid exposing sensitive data)
        const { data: sender } = await supabase
          .from("safe_profiles" as any)
          .select("full_name")
          .eq("id", message.sender_id)
          .maybeSingle() as { data: { full_name: string } | null };

        toast.info(`New message from ${sender?.full_name || "Someone"}`, {
          description: message.content.slice(0, 50) + (message.content.length > 50 ? "..." : ""),
          icon: <MessageSquare className="w-4 h-4" />,
          action: {
            label: "View",
            onClick: () => window.location.href = "/messages",
          },
        });

        // Send email notification if preference enabled
        if (profile.email && profile.email_new_messages) {
          sendNotificationEmail("new_message", profile.email, profile.full_name, {
            senderName: sender?.full_name || "Someone",
            messagePreview: message.content.slice(0, 100),
          });
        }
      }
    );

    // Listen for new applications (for NGOs)
    if (isNGO) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "applications",
        },
        async (payload) => {
          const application = payload.new as { 
            opportunity_id: string; 
            volunteer_id: string;
          };

          // Check if this application is for one of our opportunities
          const { data: opportunity } = await supabase
            .from("opportunities")
            .select("title, ngo_id")
            .eq("id", application.opportunity_id)
            .maybeSingle();

          if (opportunity?.ngo_id === profile.id) {
            // Fetch volunteer info (use safe_profiles to avoid exposing sensitive data)
            const { data: volunteer } = await supabase
              .from("safe_profiles" as any)
              .select("full_name")
              .eq("id", application.volunteer_id)
              .maybeSingle() as { data: { full_name: string } | null };

            toast.success("New Application Received!", {
              description: `${volunteer?.full_name || "A volunteer"} applied for "${opportunity.title}"`,
              icon: <UserCheck className="w-4 h-4" />,
              action: {
                label: "Review",
                onClick: () => window.location.href = `/opportunities/${application.opportunity_id}/applications`,
              },
            });

            // Send email notification to NGO if preference enabled
            if (profile.email && profile.email_new_applications) {
              sendNotificationEmail("new_application", profile.email, profile.full_name, {
                opportunityTitle: opportunity.title,
                applicantName: volunteer?.full_name || "A volunteer",
              });
            }
          }
        }
      );
    }

    // Listen for application status updates (for volunteers)
    if (!isNGO) {
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `volunteer_id=eq.${profile.id}`,
        },
        async (payload) => {
          const application = payload.new as { 
            opportunity_id: string; 
            status: string;
          };
          const oldApplication = payload.old as { status: string };

          // Only notify if status changed
          if (application.status !== oldApplication.status) {
            const { data: opportunity } = await supabase
              .from("opportunities")
              .select("title")
              .eq("id", application.opportunity_id)
              .maybeSingle();

            const statusMessages: Record<string, { title: string; variant: "success" | "info" | "warning" }> = {
              accepted: { title: "Application Accepted!", variant: "success" },
              rejected: { title: "Application Not Selected", variant: "info" },
              pending: { title: "Application Status Updated", variant: "info" },
            };

            const statusInfo = statusMessages[application.status] || statusMessages.pending;

            toast[statusInfo.variant === "success" ? "success" : "info"](statusInfo.title, {
              description: `Your application for "${opportunity?.title}" has been updated`,
              icon: <Bell className="w-4 h-4" />,
              action: {
                label: "View",
                onClick: () => window.location.href = "/applications",
              },
            });

            // Send email notification to volunteer if preference enabled
            if (profile.email && profile.email_application_updates) {
              sendNotificationEmail("application_status", profile.email, profile.full_name, {
                opportunityTitle: opportunity?.title,
                status: application.status,
              });
            }
          }
        }
      );
    }

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("Realtime notifications connected");
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [profile?.id, profile?.role, profile?.email_new_messages, profile?.email_new_applications, profile?.email_application_updates]);
}
