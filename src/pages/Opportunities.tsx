import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigate, Link } from "react-router-dom";
import { 
  Search, MapPin, Clock, Calendar, Users, Briefcase, 
  Filter, ChevronDown, Building2, Globe, Sparkles 
} from "lucide-react";
import { calculateSkillMatch, getMatchLevel } from "@/lib/skillMatching";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Tables } from "@/integrations/supabase/types";

type Opportunity = Tables<"opportunities"> & {
  profiles?: { organization_name: string | null; avatar_url: string | null } | null;
};

export default function Opportunities() {
  const { profile, loading, user } = useAuth();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [commitmentFilter, setCommitmentFilter] = useState<string>("all");
  const [remoteFilter, setRemoteFilter] = useState<string>("all");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [highMatchOnly, setHighMatchOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const allSkills = [
    "Web Development", "Mobile Development", "Data Analysis", "Marketing",
    "Content Writing", "Graphic Design", "Project Management", "Teaching",
    "Healthcare", "Legal Aid", "Environmental", "Community Outreach"
  ];

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select(`*, profiles:ngo_id(organization_name, avatar_url)`)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load opportunities",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (opportunityId: string) => {
    if (!profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to apply for opportunities",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("applications").insert({
        opportunity_id: opportunityId,
        volunteer_id: profile.id,
      });

      if (error) throw error;

      toast({
        title: "Application submitted!",
        description: "The NGO will review your application soon.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    }
  };

  // Calculate skill match for each opportunity
  const opportunitiesWithMatch = useMemo(() => {
    return opportunities.map((opp) => ({
      ...opp,
      matchPercentage: calculateSkillMatch(profile?.skills, opp.skills_required),
    }));
  }, [opportunities, profile?.skills]);

  const filteredOpportunities = useMemo(() => {
    const filtered = opportunitiesWithMatch.filter((opp) => {
      const matchesSearch =
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCommitment =
        commitmentFilter === "all" || opp.commitment_type === commitmentFilter;

      const matchesRemote =
        remoteFilter === "all" ||
        (remoteFilter === "remote" && opp.is_remote) ||
        (remoteFilter === "onsite" && !opp.is_remote);

      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.some((skill) => opp.skills_required?.includes(skill));

      const matchesHighMatch = !highMatchOnly || opp.matchPercentage >= 80;

      return matchesSearch && matchesCommitment && matchesRemote && matchesSkills && matchesHighMatch;
    });

    // Sort by match percentage (highest first)
    return filtered.sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [opportunitiesWithMatch, searchQuery, commitmentFilter, remoteFilter, selectedSkills, highMatchOnly]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">Browse Opportunities</h1>
          <p className="text-muted-foreground">
            Find volunteer opportunities that match your skills and interests
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={commitmentFilter} onValueChange={setCommitmentFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Commitment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="one-time">One Time</SelectItem>
              <SelectItem value="short-term">Short Term</SelectItem>
              <SelectItem value="long-term">Long Term</SelectItem>
            </SelectContent>
          </Select>

          <Select value={remoteFilter} onValueChange={setRemoteFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="remote">Remote Only</SelectItem>
              <SelectItem value="onsite">On-site Only</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Skills
                {selectedSkills.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedSkills.length}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {allSkills.map((skill) => (
                <DropdownMenuCheckboxItem
                  key={skill}
                  checked={selectedSkills.includes(skill)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedSkills([...selectedSkills, skill]);
                    } else {
                      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
                    }
                  }}
                >
                  {skill}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {profile?.skills && profile.skills.length > 0 && (
            <Button
              variant={highMatchOnly ? "default" : "outline"}
              className="gap-2"
              onClick={() => setHighMatchOnly(!highMatchOnly)}
            >
              <Sparkles className="h-4 w-4" />
              Best Matches
              {highMatchOnly && (
                <Badge variant="secondary" className="ml-1 bg-primary-foreground/20 text-primary-foreground">
                  80%+
                </Badge>
              )}
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredOpportunities.length} opportunities
          </p>
        </div>

        {/* Opportunities Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => {
              const matchLevel = getMatchLevel(opportunity.matchPercentage);
              return (
                <Card key={opportunity.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-soft">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {opportunity.profiles?.organization_name || "Organization"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {profile?.skills && profile.skills.length > 0 && (
                          <Badge variant={matchLevel.variant} className="gap-1">
                            <Sparkles className="h-3 w-3" />
                            {opportunity.matchPercentage}% Match
                          </Badge>
                        )}
                        {opportunity.is_remote && (
                          <Badge variant="outline" className="gap-1">
                            <Globe className="h-3 w-3" />
                            Remote
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="mt-3">{opportunity.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {opportunity.description}
                    </CardDescription>
                  </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {opportunity.skills_required?.slice(0, 3).map((skill, i) => (
                      <Badge key={i} variant="skill">
                        {skill}
                      </Badge>
                    ))}
                    {opportunity.skills_required && opportunity.skills_required.length > 3 && (
                      <Badge variant="outline">+{opportunity.skills_required.length - 3}</Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {opportunity.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {opportunity.hours_per_week} hours/week • {opportunity.commitment_type}
                    </div>
                    {opportunity.spots_available && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {opportunity.spots_available} spots available
                      </div>
                    )}
                  </div>
                </CardContent>
                  <CardFooter className="pt-4 border-t">
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => handleApply(opportunity.id)}
                    >
                      Apply Now
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
