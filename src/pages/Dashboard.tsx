import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { Briefcase, Users, MessageSquare, TrendingUp, PlusCircle, Search, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { profile, loading } = useAuth();

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
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">
            Welcome back, {profile.full_name}! 👋
          </h1>
          <p className="text-muted-foreground">
            {isNGO 
              ? "Manage your opportunities and connect with skilled volunteers." 
              : "Discover opportunities that match your skills and make an impact."}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary-soft">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">
                    {isNGO ? "Active Opportunities" : "Applications"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-secondary-soft">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">
                    {isNGO ? "Total Applicants" : "Matches"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <MessageSquare className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-100">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0%</p>
                  <p className="text-sm text-muted-foreground">Profile Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isNGO ? (
                  <>
                    <PlusCircle className="w-5 h-5 text-primary" />
                    Post New Opportunity
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 text-primary" />
                    Browse Opportunities
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {isNGO 
                  ? "Create a new volunteer opportunity and find skilled volunteers for your cause."
                  : "Discover opportunities that match your skills and interests."}
              </p>
              <Link to={isNGO ? "/opportunities/create" : "/opportunities"}>
                <Button variant="hero" className="gap-2">
                  {isNGO ? "Create Opportunity" : "Find Opportunities"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-secondary/30 hover:border-secondary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-secondary" />
                Complete Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {isNGO 
                  ? "Add more details about your organization to attract the best volunteers."
                  : "Add your skills and experience to get better opportunity matches."}
              </p>
              <Link to="/profile">
                <Button variant="secondary" className="gap-2">
                  Edit Profile
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Skills Section for Volunteers */}
        {!isNGO && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Skills</CardTitle>
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
    </Layout>
  );
}
