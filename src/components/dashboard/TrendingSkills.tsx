import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Flame, ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TrendingSkill {
  skill: string;
  count: number;
  percentage: number;
  userHas: boolean;
}

interface TrendingSkillsProps {
  userSkills: string[] | null | undefined;
}

export function TrendingSkills({ userSkills }: TrendingSkillsProps) {
  const [trendingSkills, setTrendingSkills] = useState<TrendingSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalOpportunities, setTotalOpportunities] = useState(0);

  useEffect(() => {
    fetchTrendingSkills();
  }, [userSkills]);

  const fetchTrendingSkills = async () => {
    try {
      const { data: opportunities, error } = await supabase
        .from("opportunities")
        .select("skills_required")
        .eq("status", "open");

      if (error) throw error;

      setTotalOpportunities(opportunities?.length || 0);

      // Count skill occurrences
      const skillCounts: Record<string, number> = {};
      opportunities?.forEach((opp) => {
        opp.skills_required?.forEach((skill) => {
          const normalizedSkill = skill.toLowerCase().trim();
          skillCounts[normalizedSkill] = (skillCounts[normalizedSkill] || 0) + 1;
        });
      });

      // Normalize user skills for comparison
      const normalizedUserSkills = userSkills?.map((s) => s.toLowerCase().trim()) || [];

      // Sort by count and get top 8
      const sorted = Object.entries(skillCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([skill, count]) => ({
          skill: skill.charAt(0).toUpperCase() + skill.slice(1),
          count,
          percentage: Math.round((count / (opportunities?.length || 1)) * 100),
          userHas: normalizedUserSkills.some(
            (us) => us.includes(skill) || skill.includes(us)
          ),
        }));

      setTrendingSkills(sorted);
    } catch (error) {
      console.error("Error fetching trending skills:", error);
    } finally {
      setLoading(false);
    }
  };

  const userHasCount = trendingSkills.filter((s) => s.userHas).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Trending Skills
        </CardTitle>
        <Link to="/opportunities">
          <Button variant="ghost" size="sm">
            Browse <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : trendingSkills.length === 0 ? (
          <div className="text-center py-4">
            <TrendingUp className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No skill data available</p>
          </div>
        ) : (
          <>
            {userSkills && userSkills.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    You have {userHasCount} of {trendingSkills.length} trending skills
                  </span>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {Math.round((userHasCount / trendingSkills.length) * 100)}%
                  </Badge>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {trendingSkills.map((skill, index) => (
                <div key={skill.skill} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {index < 3 && (
                        <span className="text-xs font-bold text-orange-500">#{index + 1}</span>
                      )}
                      <span className="text-sm font-medium">{skill.skill}</span>
                      {skill.userHas && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {skill.count} {skill.count === 1 ? "opportunity" : "opportunities"}
                    </span>
                  </div>
                  <Progress value={skill.percentage} className="h-1.5" />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Based on {totalOpportunities} open opportunities
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
