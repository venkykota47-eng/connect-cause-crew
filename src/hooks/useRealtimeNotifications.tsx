import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MessageSquare, UserCheck, Bell } from "lucide-react";

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
        
        // Fetch sender info
        const { data: sender } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", message.sender_id)
          .maybeSingle();

        toast.info(`New message from ${sender?.full_name || "Someone"}`, {
          description: message.content.slice(0, 50) + (message.content.length > 50 ? "..." : ""),
          icon: <MessageSquare className="w-4 h-4" />,
          action: {
            label: "View",
            onClick: () => window.location.href = "/messages",
          },
        });
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
            // Fetch volunteer info
            const { data: volunteer } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", application.volunteer_id)
              .maybeSingle();

            toast.success("New Application Received!", {
              description: `${volunteer?.full_name || "A volunteer"} applied for "${opportunity.title}"`,
              icon: <UserCheck className="w-4 h-4" />,
              action: {
                label: "Review",
                onClick: () => window.location.href = `/opportunities/${application.opportunity_id}/applications`,
              },
            });
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
  }, [profile?.id, profile?.role]);
}
