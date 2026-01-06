import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { ArrowRight, Users, Building2, Sparkles, Heart, Globe, Award, FileText, Target, TrendingUp } from "lucide-react";

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-soft via-background to-secondary-soft" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-soft" />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="skill" className="px-4 py-1.5 text-sm">
              <Sparkles className="w-4 h-4 mr-1" />
              Skill-Based Volunteer Matching
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold font-display leading-tight">
              Bridge Your Skills to{" "}
              <span className="gradient-text">Meaningful Impact</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with NGOs that need your unique talents. Whether you're a developer, designer, or mentor, 
              find volunteer opportunities that match your skills and passion.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup&role=volunteer">
                <Button variant="hero" size="xl" className="gap-2">
                  Start Volunteering
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/auth?mode=signup&role=ngo">
                <Button variant="hero-outline" size="xl" className="gap-2">
                  <Building2 className="w-5 h-5" />
                  Register Your NGO
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold font-display text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Volunteers</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold font-display text-secondary">120+</p>
                <p className="text-sm text-muted-foreground">NGOs</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold font-display gradient-text">1K+</p>
                <p className="text-sm text-muted-foreground">Matches</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              How SkillBridge Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A simple, powerful platform connecting volunteers with organizations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Create Your Profile</h3>
              <p className="text-muted-foreground">
                Share your skills, experience, and availability. Our smart matching system will find perfect opportunities for you.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl gradient-secondary flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Discover Opportunities</h3>
              <p className="text-muted-foreground">
                Browse opportunities from verified NGOs. Filter by skills, location, and commitment type to find your match.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Make an Impact</h3>
              <p className="text-muted-foreground">
                Connect directly with NGOs, apply to opportunities, and start making a real difference in your community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Resume Scanner Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="skill" className="mb-4 px-4 py-1.5">
                <FileText className="w-4 h-4 mr-1" />
                AI-Powered Tool
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Resume Scanner & <span className="gradient-text">ATS Score Checker</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Get your resume analyzed instantly with our AI-powered scanner. Check ATS compatibility, 
                identify missing keywords, and receive actionable suggestions to improve your chances.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">ATS Compatibility Score</h4>
                    <p className="text-sm text-muted-foreground">See how well your resume performs with Applicant Tracking Systems</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-secondary flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Keyword Analysis</h4>
                    <p className="text-sm text-muted-foreground">Identify important keywords you're missing and those you have</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Edit & Download</h4>
                    <p className="text-sm text-muted-foreground">Make improvements directly and download your optimized resume</p>
                  </div>
                </div>
              </div>

              <Link to="/resume-scanner">
                <Button variant="hero" size="lg" className="gap-2">
                  Scan Your Resume
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-2xl" />
              <div className="relative bg-card rounded-2xl p-8 shadow-xl border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold">Resume Analysis</h3>
                    <p className="text-sm text-muted-foreground">Instant ATS Check</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">ATS Score</span>
                    <span className="text-2xl font-bold text-green-500">85%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "85%" }} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">12</p>
                      <p className="text-xs text-muted-foreground">Keywords Found</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-secondary">5</p>
                      <p className="text-xs text-muted-foreground">Sections OK</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 gradient-hero opacity-90" />
            <div className="relative px-8 py-16 md:py-20 text-center text-primary-foreground">
              <Award className="w-16 h-16 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Ready to Make a Difference?
              </h2>
              <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">
                Join thousands of volunteers and NGOs already creating impact together.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="xl" className="bg-card text-foreground hover:bg-card/90 shadow-xl">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
