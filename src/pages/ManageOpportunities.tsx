import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigate, Link } from "react-router-dom";
import { 
  PlusCircle, MapPin, Clock, Users, Edit2, Trash2, Eye, EyeOff,
  Briefcase, Calendar, ChevronRight
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { opportunitySchema, validateForm } from "@/lib/validations";

type Opportunity = Tables<"opportunities"> & {
  applications_count?: number;
};

const allSkills = [
  "Web Development", "Mobile Development", "Data Analysis", "Marketing",
  "Content Writing", "Graphic Design", "Project Management", "Teaching",
  "Healthcare", "Legal Aid", "Environmental", "Community Outreach"
];

export default function ManageOpportunities() {
  const { profile, loading, user } = useAuth();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile?.id) {
      fetchOpportunities();
    }
  }, [profile?.id]);

  const fetchOpportunities = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select(`*`)
        .eq("ngo_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get application counts for each opportunity
      const opportunitiesWithCounts = await Promise.all(
        (data || []).map(async (opp) => {
          const { count } = await supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("opportunity_id", opp.id);
          return { ...opp, applications_count: count || 0 };
        })
      );

      setOpportunities(opportunitiesWithCounts);
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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("opportunities")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setOpportunities(opportunities.filter((opp) => opp.id !== id));
      toast({
        title: "Opportunity deleted",
        description: "The opportunity has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete opportunity",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string | null) => {
    const newStatus = currentStatus === "open" ? "closed" : "open";
    try {
      const { error } = await supabase
        .from("opportunities")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      setOpportunities(
        opportunities.map((opp) =>
          opp.id === id ? { ...opp, status: newStatus } : opp
        )
      );
      toast({
        title: newStatus === "open" ? "Opportunity opened" : "Opportunity closed",
        description: newStatus === "open" 
          ? "Volunteers can now apply." 
          : "No new applications will be accepted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpportunity) return;

    // Validate form data
    const formDataToValidate = {
      title: editingOpportunity.title,
      description: editingOpportunity.description,
      location: editingOpportunity.location,
      commitment_type: editingOpportunity.commitment_type as "one-time" | "short-term" | "long-term",
      hours_per_week: editingOpportunity.hours_per_week || 1,
      spots_available: editingOpportunity.spots_available || 1,
      is_remote: editingOpportunity.is_remote || false,
      start_date: editingOpportunity.start_date || "",
      end_date: editingOpportunity.end_date || "",
      skills_required: editingOpportunity.skills_required || [],
    };

    const validation = validateForm(opportunitySchema, formDataToValidate);
    if (!validation.success) {
      setEditErrors(validation.errors);
      toast({
        title: "Validation Error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
      return;
    }
    
    setEditErrors({});
    try {
      const { error } = await supabase
        .from("opportunities")
        .update({
          title: validation.data!.title,
          description: validation.data!.description,
          location: validation.data!.location,
          commitment_type: validation.data!.commitment_type,
          hours_per_week: validation.data!.hours_per_week,
          spots_available: validation.data!.spots_available,
          is_remote: validation.data!.is_remote,
          start_date: validation.data!.start_date || null,
          end_date: validation.data!.end_date || null,
          skills_required: validation.data!.skills_required,
        })
        .eq("id", editingOpportunity.id);

      if (error) throw error;

      setOpportunities(
        opportunities.map((opp) =>
          opp.id === editingOpportunity.id ? { ...editingOpportunity } : opp
        )
      );
      setIsEditDialogOpen(false);
      setEditingOpportunity(null);
      toast({
        title: "Opportunity updated",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update opportunity",
        variant: "destructive",
      });
    }
  };

  const addSkill = (skill: string) => {
    if (editingOpportunity && !editingOpportunity.skills_required?.includes(skill)) {
      setEditingOpportunity({
        ...editingOpportunity,
        skills_required: [...(editingOpportunity.skills_required || []), skill],
      });
    }
  };

  const removeSkill = (skill: string) => {
    if (editingOpportunity) {
      setEditingOpportunity({
        ...editingOpportunity,
        skills_required: editingOpportunity.skills_required?.filter((s) => s !== skill) || [],
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display mb-2">My Opportunities</h1>
            <p className="text-muted-foreground">
              Manage your volunteer opportunities and view applications
            </p>
          </div>
          <Link to="/opportunities/create">
            <Button variant="hero" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create New
            </Button>
          </Link>
        </div>

        {/* Opportunities List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Briefcase className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No opportunities yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first volunteer opportunity to start connecting with skilled volunteers
              </p>
              <Link to="/opportunities/create">
                <Button variant="hero" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create Your First Opportunity
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opportunity) => (
              <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Main Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{opportunity.title}</h3>
                        <Badge
                          variant={opportunity.status === "open" ? "default" : "outline"}
                          className={opportunity.status === "open" ? "bg-green-500" : ""}
                        >
                          {opportunity.status === "open" ? "Open" : "Closed"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 mb-3">
                        {opportunity.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {opportunity.location}
                          {opportunity.is_remote && " (Remote)"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {opportunity.hours_per_week}h/week
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {opportunity.applications_count} application(s)
                        </span>
                        {opportunity.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Starts {new Date(opportunity.start_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(opportunity.id, opportunity.status)}
                        className="gap-1"
                      >
                        {opportunity.status === "open" ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Close
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Open
                          </>
                        )}
                      </Button>

                      <Dialog open={isEditDialogOpen && editingOpportunity?.id === opportunity.id} onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) setEditingOpportunity(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => setEditingOpportunity(opportunity)}
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Opportunity</DialogTitle>
                            <DialogDescription>
                              Make changes to your opportunity
                            </DialogDescription>
                          </DialogHeader>
                          {editingOpportunity && (
                            <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-title">Title</Label>
                                <Input
                                  id="edit-title"
                                  value={editingOpportunity.title}
                                  onChange={(e) => setEditingOpportunity({ ...editingOpportunity, title: e.target.value })}
                                  required
                                />
                                {editErrors.title && <p className="text-sm text-destructive">{editErrors.title}</p>}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                  id="edit-description"
                                  value={editingOpportunity.description}
                                  onChange={(e) => setEditingOpportunity({ ...editingOpportunity, description: e.target.value })}
                                  rows={4}
                                  required
                                />
                                {editErrors.description && <p className="text-sm text-destructive">{editErrors.description}</p>}
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-location">Location</Label>
                                  <Input
                                    id="edit-location"
                                    value={editingOpportunity.location}
                                    onChange={(e) => setEditingOpportunity({ ...editingOpportunity, location: e.target.value })}
                                    required
                                  />
                                  {editErrors.location && <p className="text-sm text-destructive">{editErrors.location}</p>}
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                  <Label htmlFor="edit-remote">Remote</Label>
                                  <Switch
                                    id="edit-remote"
                                    checked={editingOpportunity.is_remote || false}
                                    onCheckedChange={(checked) =>
                                      setEditingOpportunity({ ...editingOpportunity, is_remote: checked })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Commitment</Label>
                                  <Select
                                    value={editingOpportunity.commitment_type}
                                    onValueChange={(value) =>
                                      setEditingOpportunity({ ...editingOpportunity, commitment_type: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="one-time">One Time</SelectItem>
                                      <SelectItem value="short-term">Short Term</SelectItem>
                                      <SelectItem value="long-term">Long Term</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-hours">Hours/Week</Label>
                                  <Input
                                    id="edit-hours"
                                    type="number"
                                    min="1"
                                    value={editingOpportunity.hours_per_week || 5}
                                    onChange={(e) =>
                                      setEditingOpportunity({ ...editingOpportunity, hours_per_week: parseInt(e.target.value) || 1 })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Skills</Label>
                                <Select onValueChange={addSkill}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Add skills..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allSkills
                                      .filter((skill) => !editingOpportunity.skills_required?.includes(skill))
                                      .map((skill) => (
                                        <SelectItem key={skill} value={skill}>
                                          {skill}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                {editingOpportunity.skills_required && editingOpportunity.skills_required.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {editingOpportunity.skills_required.map((skill) => (
                                      <Badge key={skill} variant="skill" className="gap-1 pr-1">
                                        {skill}
                                        <button
                                          type="button"
                                          onClick={() => removeSkill(skill)}
                                          className="ml-1 p-0.5 hover:bg-primary/20 rounded"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-4 pt-4">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit" variant="hero" className="flex-1">
                                  Save Changes
                                </Button>
                              </div>
                            </form>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Link to={`/opportunities/${opportunity.id}/applications`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          View Applications
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Opportunity?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this opportunity and all associated applications. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(opportunity.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
