import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, Clock, Calendar, Users, Building2, Globe, Sparkles, X 
} from "lucide-react";
import { getMatchLevel } from "@/lib/skillMatching";
import type { Tables } from "@/integrations/supabase/types";

type OpportunityWithMatch = Tables<"opportunities"> & {
  profiles?: { organization_name: string | null; avatar_url: string | null } | null;
  matchPercentage: number;
};

interface OpportunityComparisonProps {
  opportunities: OpportunityWithMatch[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
  userHasSkills: boolean;
}

export function OpportunityComparison({
  opportunities,
  open,
  onOpenChange,
  onRemove,
  userHasSkills,
}: OpportunityComparisonProps) {
  if (opportunities.length === 0) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Flexible";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">
            Compare Opportunities ({opportunities.length})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground w-40">
                    Attribute
                  </th>
                  {opportunities.map((opp) => (
                    <th key={opp.id} className="p-4 text-left min-w-[280px]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground">
                              {opp.profiles?.organization_name || "Organization"}
                            </span>
                          </div>
                          <h3 className="font-semibold text-foreground line-clamp-2">
                            {opp.title}
                          </h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => onRemove(opp.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Match Percentage */}
                {userHasSkills && (
                  <tr className="border-b">
                    <td className="p-4 font-medium text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Skill Match
                      </div>
                    </td>
                    {opportunities.map((opp) => {
                      const matchLevel = getMatchLevel(opp.matchPercentage);
                      return (
                        <td key={opp.id} className="p-4">
                          <Badge variant={matchLevel.variant} className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            {opp.matchPercentage}% Match
                          </Badge>
                        </td>
                      );
                    })}
                  </tr>
                )}

                {/* Location */}
                <tr className="border-b">
                  <td className="p-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </div>
                  </td>
                  {opportunities.map((opp) => (
                    <td key={opp.id} className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{opp.location}</span>
                        {opp.is_remote && (
                          <Badge variant="outline" className="gap-1">
                            <Globe className="h-3 w-3" />
                            Remote
                          </Badge>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Commitment */}
                <tr className="border-b">
                  <td className="p-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Commitment
                    </div>
                  </td>
                  {opportunities.map((opp) => (
                    <td key={opp.id} className="p-4">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="capitalize">
                          {opp.commitment_type.replace("-", " ")}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {opp.hours_per_week} hours/week
                        </p>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Duration */}
                <tr className="border-b">
                  <td className="p-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Duration
                    </div>
                  </td>
                  {opportunities.map((opp) => (
                    <td key={opp.id} className="p-4">
                      <p className="text-sm">
                        {formatDate(opp.start_date)} - {formatDate(opp.end_date)}
                      </p>
                    </td>
                  ))}
                </tr>

                {/* Spots Available */}
                <tr className="border-b">
                  <td className="p-4 font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Spots Available
                    </div>
                  </td>
                  {opportunities.map((opp) => (
                    <td key={opp.id} className="p-4">
                      <span className="font-medium">
                        {opp.spots_available || "Unlimited"}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Skills Required */}
                <tr className="border-b">
                  <td className="p-4 font-medium text-muted-foreground align-top">
                    Skills Required
                  </td>
                  {opportunities.map((opp) => (
                    <td key={opp.id} className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {opp.skills_required?.map((skill, i) => (
                          <Badge key={i} variant="skill" className="text-xs">
                            {skill}
                          </Badge>
                        )) || (
                          <span className="text-muted-foreground text-sm">
                            No specific skills required
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Description */}
                <tr className="border-b">
                  <td className="p-4 font-medium text-muted-foreground align-top">
                    Description
                  </td>
                  {opportunities.map((opp) => (
                    <td key={opp.id} className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {opp.description}
                      </p>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
