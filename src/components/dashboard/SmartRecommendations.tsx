import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, MapPin, Building2, TrendingUp, History, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateSkillMatch, getMatchLevel } from "@/lib/skillMatching";
import type { Tables } from "@/integrations/supabase/types";

type Opportunity = Tables<"opportunities"> & {
  profiles?: { organization_name: string | null } | null;
};

interface SmartRecommendationsProps {
  userSkills: string[] | null | undefined;
  profileId: string | undefined;
}

interface RecommendedOpportunity extends Opportunity {
  matchPercentage: number;
  recommendationScore: number;
  recommendationReason: "skills" | "history" | "both";
}

export function SmartRecommendations({ userSkills, profileId }: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileId) {
      fetchSmartRecommendations();
    }
  }, [userSkills, profileId]);

  const fetchSmartRecommendations = async () => {
    try {
      // Fetch user's application history
      const { data: applications, error: appError } = await supabase
        .from("applications")
        .select(`
          opportunity_id,
          opportunities:opportunity_id(
            skills_required,
            location,
            commitment_type,
            is_remote,
            ngo_id
          )
        `)
        .eq("volunteer_id", profileId!);

      if (appError) throw appError;

      // Analyze application history patterns
      const appliedOpportunityIds = new Set(applications?.map((a) => a.opportunity_id) || []);
      const appliedNgoIds = new Set<string>();
      const appliedSkills = new Set<string>();
      const appliedLocations = new Set<string>();
      const appliedCommitmentTypes = new Set<string>();
      let prefersRemote = 0;

      applications?.forEach((app) => {
        const opp = app.opportunities as any;
        if (opp) {
          if (opp.ngo_id) appliedNgoIds.add(opp.ngo_id);
          if (opp.location) appliedLocations.add(opp.location.toLowerCase());
          if (opp.commitment_type) appliedCommitmentTypes.add(opp.commitment_type);
          if (opp.is_remote) prefersRemote++;
          opp.skills_required?.forEach((skill: string) => appliedSkills.add(skill.toLowerCase()));
        }
      });

      const remotePreference = applications?.length ? prefersRemote / applications.length > 0.5 : false;

      // Fetch available opportunities
      const { data: opportunities, error: oppError } = await supabase
        .from("opportunities")
        .select(`*, profiles:ngo_id(organization_name)`)
        .eq("status", "open")
        .limit(50);

      if (oppError) throw oppError;

      // Score each opportunity based on skills and history patterns
      const scored = (opportunities || [])
        .filter((opp) => !appliedOpportunityIds.has(opp.id)) // Exclude already applied
        .map((opp) => {
          const skillMatch = calculateSkillMatch(userSkills, opp.skills_required);
          
          // Calculate history-based score
          let historyScore = 0;
          let historyFactors = 0;

          // Similar organization bonus
          if (appliedNgoIds.has(opp.ngo_id)) {
            historyScore += 20;
            historyFactors++;
          }

          // Similar location bonus
          if (opp.location && appliedLocations.has(opp.location.toLowerCase())) {
            historyScore += 15;
            historyFactors++;
          }

          // Similar commitment type bonus
          if (appliedCommitmentTypes.has(opp.commitment_type)) {
            historyScore += 15;
            historyFactors++;
          }

          // Remote preference bonus
          if (remotePreference && opp.is_remote) {
            historyScore += 10;
            historyFactors++;
          }

          // Skills from previous applications bonus
          const oppSkills = opp.skills_required?.map((s) => s.toLowerCase()) || [];
          const matchingHistorySkills = oppSkills.filter((s) => appliedSkills.has(s));
          if (matchingHistorySkills.length > 0) {
            historyScore += Math.min(matchingHistorySkills.length * 10, 30);
            historyFactors++;
          }

          // Combined score: weighted average of skill match and history score
          const hasHistory = applications && applications.length > 0;
          const recommendationScore = hasHistory
            ? skillMatch * 0.6 + historyScore * 0.4
            : skillMatch;

          // Determine recommendation reason
          let recommendationReason: "skills" | "history" | "both" = "skills";
          if (skillMatch >= 50 && historyFactors >= 2) {
            recommendationReason = "both";
          } else if (historyFactors >= 2 && skillMatch < 50) {
            recommendationReason = "history";
          }

          return {
            ...opp,
            matchPercentage: skillMatch,
            recommendationScore: Math.round(recommendationScore),
            recommendationReason,
          };
        })
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 5);

      setRecommendations(scored);
    } catch (error) {
      console.error("Error fetching smart recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getReasonIcon = (reason: "skills" | "history" | "both") => {
    switch (reason) {
      case "both":
        return <Brain className="w-3 h-3" />;
      case "history":
        return <History className="w-3 h-3" />;
      default:
        return <Sparkles className="w-3 h-3" />;
    }
  };

  const getReasonLabel = (reason: "skills" | "history" | "both") => {
    switch (reason) {
      case "both":
        return "Smart Match";
      case "history":
        return "Based on History";
      default:
        return "Skill Match";
    }
  };

  if (!profileId) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Recommended For You
        </CardTitle>
        <Link to="/opportunities">
          <Button variant="ghost" size="sm">
            Explore <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-3 rounded-lg bg-muted/50">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-4">
            <Brain className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Apply to opportunities to get personalized recommendations
            </p>
            <Link to="/opportunities">
              <Button variant="secondary" size="sm" className="mt-3">
                Browse Opportunities
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((opp) => {
              const matchLevel = getMatchLevel(opp.matchPercentage);
              return (
                <Link
                  key={opp.id}
                  to="/opportunities"
                  className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{opp.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate">
                          {opp.profiles?.organization_name || "Organization"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{opp.location}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <Badge variant="outline" className="text-xs gap-1">
                          {getReasonIcon(opp.recommendationReason)}
                          {getReasonLabel(opp.recommendationReason)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={matchLevel.variant} className="shrink-0 gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {opp.recommendationScore}%
                      </Badge>
                      {opp.recommendationReason !== "skills" && (
                        <span className="text-[10px] text-muted-foreground">
                          {opp.matchPercentage}% skills
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
