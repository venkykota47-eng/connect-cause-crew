import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { signInSchema, signUpSchema, validateForm } from "@/lib/validations";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  
  const [mode, setMode] = useState<"signin" | "signup">(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [role, setRole] = useState<"volunteer" | "ngo">(
    (searchParams.get("role") as "volunteer" | "ngo") || "volunteer"
  );
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    if (mode === "signin") {
      const result = validateForm(signInSchema, { email, password });
      setErrors(result.errors);
      return result.success;
    } else {
      const result = validateForm(signUpSchema, { email, password, fullName, role, orgName });
      setErrors(result.errors);
      return result.success;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password, role, fullName, orgName);
      }
      navigate("/dashboard");
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-soft via-background to-secondary-soft p-4">
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md relative">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <Link to="/" className="flex items-center justify-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                <span className="text-xl font-bold text-primary-foreground">S</span>
              </div>
            </Link>
            <CardTitle className="text-2xl font-display">
              {mode === "signin" ? "Welcome Back" : "Join SkillBridge"}
            </CardTitle>
            <CardDescription>
              {mode === "signin" 
                ? "Sign in to continue your journey" 
                : "Create an account to get started"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    {/* Role Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={role === "volunteer" ? "default" : "outline"}
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => setRole("volunteer")}
                      >
                        <Users className="w-5 h-5" />
                        <span>Volunteer</span>
                      </Button>
                      <Button
                        type="button"
                        variant={role === "ngo" ? "secondary" : "outline"}
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => setRole("ngo")}
                      >
                        <Building2 className="w-5 h-5" />
                        <span>NGO</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                      />
                      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                    </div>
                    
                    {role === "ngo" && (
                      <div className="space-y-2">
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input
                          id="orgName"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="Your NGO Name"
                        />
                        {errors.orgName && <p className="text-sm text-destructive">{errors.orgName}</p>}
                      </div>
                    )}
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                
                <Button type="submit" className="w-full" variant="hero" disabled={loading}>
                  {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
