import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, MapPin, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateSkillMatch, getMatchLevel } from "@/lib/skillMatching";
import type { Tables } from "@/integrations/supabase/types";

type Opportunity = Tables<"opportunities"> & {
  profiles?: { organization_name: string | null } | null;
};

interface BestMatchesWidgetProps {
  userSkills: string[] | null | undefined;
}

export function BestMatchesWidget({ userSkills }: BestMatchesWidgetProps) {
  const [opportunities, setOpportunities] = useState<(Opportunity & { matchPercentage: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBestMatches();
  }, [userSkills]);

  const fetchBestMatches = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select(`*, profiles:ngo_id(organization_name)`)
        .eq("status", "open")
        .limit(20);

      if (error) throw error;

      // Calculate match percentages and sort
      const withMatches = (data || [])
        .map((opp) => ({
          ...opp,
          matchPercentage: calculateSkillMatch(userSkills, opp.skills_required),
        }))
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, 3);

      setOpportunities(withMatches);
    } catch (error) {
      console.error("Error fetching best matches:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!userSkills || userSkills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Best Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Sparkles className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Add skills to your profile to see personalized matches</p>
            <Link to="/profile">
              <Button variant="secondary" size="sm" className="mt-3">
                Add Skills
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Best Matches
        </CardTitle>
        <Link to="/opportunities">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="w-4 h-4 ml-1" />
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
        ) : opportunities.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No opportunities available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp) => {
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
                        <span className="truncate">{opp.profiles?.organization_name || "Organization"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{opp.location}</span>
                      </div>
                    </div>
                    <Badge variant={matchLevel.variant} className="shrink-0 gap-1">
                      <Sparkles className="w-3 h-3" />
                      {opp.matchPercentage}%
                    </Badge>
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
