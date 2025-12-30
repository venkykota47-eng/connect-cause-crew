import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertCircle, CheckCircle2, Lightbulb, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SkillGapAnalysisProps {
  userSkills: string[] | null | undefined;
}

interface SkillDemand {
  skill: string;
  count: number;
  hasSkill: boolean;
}

export function SkillGapAnalysis({ userSkills }: SkillGapAnalysisProps) {
  const [demandedSkills, setDemandedSkills] = useState<SkillDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [coveragePercent, setCoveragePercent] = useState(0);

  useEffect(() => {
    analyzeSkillGap();
  }, [userSkills]);

  const analyzeSkillGap = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("skills_required")
        .eq("status", "open");

      if (error) throw error;

      // Count skill frequency across all opportunities
      const skillCounts: Record<string, number> = {};
      (data || []).forEach((opp) => {
        (opp.skills_required || []).forEach((skill) => {
          const normalizedSkill = skill.toLowerCase().trim();
          skillCounts[normalizedSkill] = (skillCounts[normalizedSkill] || 0) + 1;
        });
      });

      // Normalize user skills for comparison
      const normalizedUserSkills = (userSkills || []).map((s) => s.toLowerCase().trim());

      // Create sorted skill demand list
      const sortedSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([skill, count]) => ({
          skill: skill.charAt(0).toUpperCase() + skill.slice(1),
          count,
          hasSkill: normalizedUserSkills.some(
            (userSkill) => userSkill.includes(skill) || skill.includes(userSkill)
          ),
        }));

      setDemandedSkills(sortedSkills);

      // Calculate coverage percentage
      const matchedCount = sortedSkills.filter((s) => s.hasSkill).length;
      const coverage = sortedSkills.length > 0 
        ? Math.round((matchedCount / sortedSkills.length) * 100) 
        : 0;
      setCoveragePercent(coverage);
    } catch (error) {
      console.error("Error analyzing skill gap:", error);
    } finally {
      setLoading(false);
    }
  };

  const missingSkills = demandedSkills.filter((s) => !s.hasSkill);
  const matchedSkills = demandedSkills.filter((s) => s.hasSkill);

  if (!userSkills || userSkills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Skill Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircle className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Add skills to your profile to see gap analysis</p>
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
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Skill Gap Analysis
        </CardTitle>
        <CardDescription>
          Based on {demandedSkills.reduce((acc, s) => acc + s.count, 0)} opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <div className="animate-pulse h-4 bg-muted rounded w-full"></div>
            <div className="animate-pulse h-20 bg-muted rounded"></div>
          </div>
        ) : (
          <>
            {/* Coverage Score */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Market Coverage</span>
                <span className="text-sm font-bold text-primary">{coveragePercent}%</span>
              </div>
              <Progress value={coveragePercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                You match {matchedSkills.length} of {demandedSkills.length} most in-demand skills
              </p>
            </div>

            {/* Matched Skills */}
            {matchedSkills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium">Your Matching Skills</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchedSkills.map((skill) => (
                    <Badge key={skill.skill} variant="default" className="gap-1">
                      {skill.skill}
                      <span className="text-xs opacity-70">({skill.count})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {missingSkills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium">Skills to Consider</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.slice(0, 5).map((skill) => (
                    <Badge key={skill.skill} variant="outline" className="gap-1">
                      {skill.skill}
                      <span className="text-xs opacity-70">({skill.count})</span>
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Adding these skills could increase your match rate
                </p>
              </div>
            )}

            <Link to="/profile">
              <Button variant="outline" size="sm" className="w-full mt-2">
                Update Skills <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
