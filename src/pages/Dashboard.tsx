import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, Navigate } from "react-router-dom";
import { 
  Briefcase, Users, MessageSquare, TrendingUp, PlusCircle, Search, 
  ArrowRight, Bell, CheckCircle, Clock, Calendar, Sparkles, User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BestMatchesWidget } from "@/components/dashboard/BestMatchesWidget";
import { SkillGapAnalysis } from "@/components/dashboard/SkillGapAnalysis";
import { SmartRecommendations } from "@/components/dashboard/SmartRecommendations";
import { TrendingSkills } from "@/components/dashboard/TrendingSkills";
import { useSmartMatchNotifications } from "@/hooks/useSmartMatchNotifications";

interface DashboardStats {
  opportunities: number;
  applications: number;
  messages: number;
  profileCompletion: number;
}

interface ActivityItem {
  id: string;
  type: "application" | "message" | "opportunity";
  title: string;
  description: string;
  time: string;
}

export default function Dashboard() {
  const { profile, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    opportunities: 0,
    applications: 0,
    messages: 0,
    profileCompletion: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Enable smart match notifications for volunteers
  useSmartMatchNotifications({
    profileId: profile?.id,
    userSkills: profile?.skills,
    userEmail: profile?.email,
    userName: profile?.full_name,
    enabled: profile?.role === "volunteer",
  });

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;
    
    setLoadingStats(true);
    try {
      const isNGO = profile.role === "ngo";
      
      // Fetch opportunities count
      let opportunitiesCount = 0;
      if (isNGO) {
        const { count } = await supabase
          .from("opportunities")
          .select("*", { count: "exact", head: true })
          .eq("ngo_id", profile.id)
          .eq("status", "open");
        opportunitiesCount = count || 0;
      }
      
      // Fetch applications count
      let applicationsCount = 0;
      if (isNGO) {
        // NGO sees total applicants across their opportunities
        const { data: opportunities } = await supabase
          .from("opportunities")
          .select("id")
          .eq("ngo_id", profile.id);
        
        if (opportunities && opportunities.length > 0) {
          const oppIds = opportunities.map(o => o.id);
          const { count } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .in("opportunity_id", oppIds);
          applicationsCount = count || 0;
        }
      } else {
        const { count } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("volunteer_id", profile.id);
        applicationsCount = count || 0;
      }
      
      // Fetch unread messages count
      const { count: messagesCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", profile.id)
        .eq("is_read", false);
      
      // Calculate profile completion
      const profileFields = isNGO 
        ? ["full_name", "bio", "location", "organization_name", "website", "mission", "avatar_url"]
        : ["full_name", "bio", "location", "skills", "availability", "avatar_url"];
      
      const filledFields = profileFields.filter(field => {
        const value = profile[field as keyof typeof profile];
        if (Array.isArray(value)) return value.length > 0;
        return !!value;
      });
      const profileCompletion = Math.round((filledFields.length / profileFields.length) * 100);
      
      setStats({
        opportunities: opportunitiesCount,
        applications: applicationsCount,
        messages: messagesCount || 0,
        profileCompletion,
      });
      
      // Fetch recent activity
      const activities: ActivityItem[] = [];
      
      // Recent applications
      if (isNGO) {
        const { data: opportunities } = await supabase
          .from("opportunities")
          .select("id")
          .eq("ngo_id", profile.id);
        
        if (opportunities && opportunities.length > 0) {
          const { data: recentApps } = await supabase
            .from("applications")
            .select("id, created_at, status, opportunity_id, opportunities(title)")
            .in("opportunity_id", opportunities.map(o => o.id))
            .order("created_at", { ascending: false })
            .limit(3);
          
          recentApps?.forEach(app => {
            activities.push({
              id: app.id,
              type: "application",
              title: "New Application",
              description: `Someone applied to "${(app.opportunities as any)?.title || "an opportunity"}"`,
              time: formatTimeAgo(app.created_at),
            });
          });
        }
      } else {
        const { data: recentApps } = await supabase
          .from("applications")
          .select("id, created_at, status, opportunities(title)")
          .eq("volunteer_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(3);
        
        recentApps?.forEach(app => {
          activities.push({
            id: app.id,
            type: "application",
            title: `Application ${app.status}`,
            description: (app.opportunities as any)?.title || "Opportunity",
            time: formatTimeAgo(app.created_at),
          });
        });
      }
      
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  const isNGO = profile.role === "ngo";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header with Avatar */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
          <Avatar className="w-16 h-16 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
            <AvatarFallback className="text-lg bg-primary text-primary-foreground">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold font-display mb-1">
              Welcome back, {profile.full_name.split(" ")[0]}! 
            </h1>
            <p className="text-muted-foreground">
              {isNGO 
                ? "Manage your opportunities and connect with skilled volunteers." 
                : "Discover opportunities that match your skills and make an impact."}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/notifications">
              <Button variant="outline" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                {stats.messages > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {stats.messages}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="outline" size="icon">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {loadingStats ? "..." : isNGO ? stats.opportunities : stats.applications}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isNGO ? "Active Opportunities" : "Applications"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {loadingStats ? "..." : isNGO ? stats.applications : profile.skills?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isNGO ? "Total Applicants" : "Skills Added"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <MessageSquare className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loadingStats ? "..." : stats.messages}</p>
                  <p className="text-sm text-muted-foreground">Unread Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loadingStats ? "..." : `${stats.profileCompletion}%`}</p>
                  <p className="text-sm text-muted-foreground">Profile Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Link to={isNGO ? "/opportunities/create" : "/opportunities"} className="block">
                    <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        {isNGO ? (
                          <PlusCircle className="w-8 h-8 text-primary" />
                        ) : (
                          <Search className="w-8 h-8 text-primary" />
                        )}
                        <div>
                          <p className="font-semibold">{isNGO ? "Post Opportunity" : "Find Opportunities"}</p>
                          <p className="text-xs text-muted-foreground">
                            {isNGO ? "Create a new listing" : "Browse and apply"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link to="/profile" className="block">
                    <div className="p-4 rounded-xl border-2 border-dashed border-secondary/30 hover:border-secondary/50 hover:bg-secondary/5 transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-8 h-8 text-secondary" />
                        <div>
                          <p className="font-semibold">Edit Profile</p>
                          <p className="text-xs text-muted-foreground">
                            {stats.profileCompletion < 100 ? "Complete your profile" : "Update details"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link to="/messages" className="block">
                    <div className="p-4 rounded-xl border-2 border-dashed border-muted hover:border-muted-foreground/30 hover:bg-muted/50 transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">Messages</p>
                          <p className="text-xs text-muted-foreground">
                            {stats.messages > 0 ? `${stats.messages} unread` : "Check inbox"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link to={isNGO ? "/opportunities/manage" : "/applications"} className="block">
                    <div className="p-4 rounded-xl border-2 border-dashed border-muted hover:border-muted-foreground/30 hover:bg-muted/50 transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">{isNGO ? "Manage Listings" : "My Applications"}</p>
                          <p className="text-xs text-muted-foreground">
                            {isNGO ? "View & edit opportunities" : "Track your applications"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Smart Recommendations for Volunteers */}
            {!isNGO && (
              <SmartRecommendations userSkills={profile.skills} profileId={profile.id} />
            )}

            {/* Best Matches Widget for Volunteers */}
            {!isNGO && (
              <BestMatchesWidget userSkills={profile.skills} />
            )}

            {/* Skills Section for Volunteers */}
            {!isNGO && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Your Skills</CardTitle>
                  <Link to="/profile">
                    <Button variant="ghost" size="sm">
                      Edit <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="skill">{skill}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No skills added yet.{" "}
                      <Link to="/profile" className="text-primary hover:underline">
                        Add your skills
                      </Link>{" "}
                      to get better matches.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Activity Feed */}
          <div className="space-y-6">
            {/* Trending Skills */}
            <TrendingSkills userSkills={profile.skills} />

            {/* Skill Gap Analysis for Volunteers */}
            {!isNGO && (
              <SkillGapAnalysis userSkills={profile.skills} />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          activity.type === "application" 
                            ? "bg-primary/10 text-primary" 
                            : activity.type === "message"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-secondary/10 text-secondary"
                        }`}>
                          {activity.type === "application" && <CheckCircle className="w-4 h-4" />}
                          {activity.type === "message" && <MessageSquare className="w-4 h-4" />}
                          {activity.type === "opportunity" && <Briefcase className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your activity will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Completion Card */}
            {stats.profileCompletion < 100 && (
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Complete Your Profile</CardTitle>
                  <CardDescription>
                    {100 - stats.profileCompletion}% left to complete
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all" 
                      style={{ width: `${stats.profileCompletion}%` }}
                    />
                  </div>
                  <Link to="/profile">
                    <Button variant="secondary" size="sm" className="w-full">
                      Complete Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
