import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Navigate } from "react-router-dom";
import { User, Building2, MapPin, Globe, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { volunteerProfileSchema, ngoProfileSchema, validateForm } from "@/lib/validations";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { SkillsTagInput } from "@/components/profile/SkillsTagInput";
import { AvailabilityPicker } from "@/components/profile/AvailabilityPicker";

export default function Profile() {
  const { profile, user, updateProfile, loading } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    location: "",
    phone: "",
    skills: [] as string[],
    experience_years: 0,
    availability: "",
    organization_name: "",
    website: "",
    mission: "",
    founded_year: new Date().getFullYear(),
    team_size: 0,
    avatar_url: null as string | null,
    email_new_messages: true,
    email_new_applications: true,
    email_application_updates: true,
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        phone: profile.phone || "",
        skills: profile.skills || [],
        experience_years: profile.experience_years || 0,
        availability: profile.availability || "",
        organization_name: profile.organization_name || "",
        website: profile.website || "",
        mission: profile.mission || "",
        founded_year: profile.founded_year || new Date().getFullYear(),
        team_size: profile.team_size || 0,
        avatar_url: profile.avatar_url || null,
        email_new_messages: profile.email_new_messages ?? true,
        email_new_applications: profile.email_new_applications ?? true,
        email_application_updates: profile.email_application_updates ?? true,
      });
    }
  }, [profile]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile || !user) {
    return <Navigate to="/auth" replace />;
  }

  const isNGO = profile.role === "ngo";

  const handleSave = async () => {
    const schema = isNGO ? ngoProfileSchema : volunteerProfileSchema;
    const dataToValidate = isNGO 
      ? {
          full_name: formData.full_name,
          bio: formData.bio,
          location: formData.location,
          phone: formData.phone,
          organization_name: formData.organization_name,
          website: formData.website,
          mission: formData.mission,
          founded_year: formData.founded_year,
          team_size: formData.team_size,
        }
      : {
          full_name: formData.full_name,
          bio: formData.bio,
          location: formData.location,
          phone: formData.phone,
          skills: formData.skills,
          experience_years: formData.experience_years,
          availability: formData.availability,
        };
    
    const validation = validateForm(schema, dataToValidate);
    if (!validation.success) {
      setErrors(validation.errors);
      toast({
        title: "Validation Error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
      return;
    }
    
    setErrors({});
    setSaving(true);
    try {
      await updateProfile(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (url: string) => {
    setFormData({ ...formData, avatar_url: url });
    // Also save immediately
    updateProfile({ avatar_url: url });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Update your profile information</p>
        </div>

        <div className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <AvatarUpload
                userId={user.id}
                currentAvatarUrl={formData.avatar_url}
                fullName={formData.full_name}
                onAvatarChange={handleAvatarChange}
              />
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                  {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* NGO-specific fields */}
          {isNGO && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={formData.organization_name}
                      onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://yourorg.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="foundedYear">Founded Year</Label>
                    <Input
                      id="foundedYear"
                      type="number"
                      value={formData.founded_year}
                      onChange={(e) => setFormData({ ...formData, founded_year: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamSize">Team Size</Label>
                    <Input
                      id="teamSize"
                      type="number"
                      value={formData.team_size}
                      onChange={(e) => setFormData({ ...formData, team_size: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mission">Mission Statement</Label>
                  <Textarea
                    id="mission"
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    placeholder="Describe your organization's mission..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Volunteer-specific fields */}
          {!isNGO && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillsTagInput
                    skills={formData.skills}
                    onChange={(skills) => setFormData({ ...formData, skills })}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AvailabilityPicker
                    value={formData.availability}
                    onChange={(availability) => setFormData({ ...formData, availability })}
                  />
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={50}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Email Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Choose which email notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-messages">New Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails when someone sends you a message
                  </p>
                </div>
                <Switch
                  id="email-messages"
                  checked={formData.email_new_messages}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, email_new_messages: checked })
                  }
                />
              </div>
              
              {isNGO ? (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-applications">New Applications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails when volunteers apply to your opportunities
                    </p>
                  </div>
                  <Switch
                    id="email-applications"
                    checked={formData.email_new_applications}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, email_new_applications: checked })
                    }
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-status">Application Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails when your application status changes
                    </p>
                  </div>
                  <Switch
                    id="email-status"
                    checked={formData.email_application_updates}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, email_application_updates: checked })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} variant="hero" size="lg" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
