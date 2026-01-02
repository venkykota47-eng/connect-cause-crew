import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculateSkillMatch } from "@/lib/skillMatching";
import { toast } from "sonner";

interface UseSmartMatchNotificationsProps {
  profileId: string | undefined;
  userSkills: string[] | null | undefined;
  userEmail: string | undefined;
  userName: string | undefined;
  enabled: boolean;
}

export function useSmartMatchNotifications({
  profileId,
  userSkills,
  userEmail,
  userName,
  enabled,
}: UseSmartMatchNotificationsProps) {
  const processedOpportunities = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !profileId || !userSkills || userSkills.length === 0) {
      return;
    }

    // Subscribe to new opportunities
    const channel = supabase
      .channel("smart-match-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "opportunities",
        },
        async (payload) => {
          const newOpportunity = payload.new as any;

          // Avoid duplicate processing
          if (processedOpportunities.current.has(newOpportunity.id)) {
            return;
          }
          processedOpportunities.current.add(newOpportunity.id);

          // Calculate match percentage
          const matchPercentage = calculateSkillMatch(
            userSkills,
            newOpportunity.skills_required
          );

          // Only notify for high matches (80%+)
          if (matchPercentage >= 80) {
            // Fetch organization name
            const { data: profile } = await supabase
              .from("profiles")
              .select("organization_name")
              .eq("id", newOpportunity.ngo_id)
              .single();

            const orgName = profile?.organization_name || "An organization";

            // Show toast notification
            toast.success(`New opportunity matches your skills!`, {
              description: `${newOpportunity.title} by ${orgName} - ${matchPercentage}% match`,
              action: {
                label: "View",
                onClick: () => {
                  window.location.href = "/opportunities";
                },
              },
              duration: 10000,
            });

            // Create in-app notification
            await supabase.from("notifications").insert({
              user_id: profileId,
              type: "smart_match",
              title: "New Opportunity Match!",
              message: `"${newOpportunity.title}" by ${orgName} is a ${matchPercentage}% match for your skills.`,
              related_id: newOpportunity.id,
            });

            // Send email notification if user has email
            if (userEmail && userName) {
              try {
                await supabase.functions.invoke("send-notification-email", {
                  body: {
                    type: "smart_match",
                    recipientEmail: userEmail,
                    recipientName: userName,
                    data: {
                      opportunityTitle: newOpportunity.title,
                      organizationName: orgName,
                      matchPercentage,
                    },
                  },
                });
                console.log("Smart match email sent successfully");
              } catch (error) {
                console.error("Failed to send smart match email:", error);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, profileId, userSkills, userEmail, userName]);
}
