import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, MessageSquare, Mail, Phone, MapPin } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Application = Tables<"applications"> & {
  profiles?: Tables<"profiles"> | null;
};

type Opportunity = Tables<"opportunities">;

export default function OpportunityApplications() {
  const { id } = useParams<{ id: string }>();
  const { profile, loading, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch opportunity
      const { data: oppData, error: oppError } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (oppError) throw oppError;
      setOpportunity(oppData);

      // Fetch applications with volunteer profiles
      const { data: appData, error: appError } = await supabase
        .from("applications")
        .select(`*, profiles:volunteer_id(*)`)
        .eq("opportunity_id", id)
        .order("created_at", { ascending: false });

      if (appError) throw appError;
      setApplications(appData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      setApplications(
        applications.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      toast({
        title: `Application ${newStatus}`,
        description: `The volunteer has been notified.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update application",
        variant: "destructive",
      });
    }
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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== "ngo") {
    return <Navigate to="/dashboard" replace />;
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "accepted":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate("/opportunities/manage")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Opportunities
        </Button>

        {/* Opportunity Header */}
        {opportunity && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-display">{opportunity.title}</CardTitle>
              <p className="text-muted-foreground">{opportunity.description}</p>
            </CardHeader>
          </Card>
        )}

        {/* Applications */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Applications ({applications.length})</h2>
          <p className="text-muted-foreground">Review and manage volunteer applications</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No applications received yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Volunteer Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={application.profiles?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {application.profiles?.full_name?.charAt(0) || "V"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">
                            {application.profiles?.full_name || "Unknown Volunteer"}
                          </h3>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status || "pending"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {application.profiles?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {application.profiles.email}
                            </div>
                          )}
                          {application.profiles?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {application.profiles.phone}
                            </div>
                          )}
                          {application.profiles?.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {application.profiles.location}
                            </div>
                          )}
                        </div>

                        {/* Skills */}
                        {application.profiles?.skills && application.profiles.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {application.profiles.skills.map((skill, i) => (
                              <Badge key={i} variant="skill">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Cover Letter */}
                        {application.cover_letter && (
                          <div className="mt-4 p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">Cover Letter</p>
                            <p className="text-sm text-muted-foreground">
                              {application.cover_letter}
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-3">
                          Applied {new Date(application.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {application.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-green-600 hover:text-green-600 hover:bg-green-50"
                            onClick={() => handleUpdateStatus(application.id, "accepted")}
                          >
                            <Check className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-red-600 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleUpdateStatus(application.id, "rejected")}
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      {application.status === "accepted" && application.profiles?.id && (
                        <Button
                          variant="hero"
                          size="sm"
                          className="gap-1"
                          onClick={() => navigate(`/messages?recipient=${application.profiles?.id}`)}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
