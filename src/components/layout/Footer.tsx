import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                <span className="text-lg font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-xl font-bold font-display gradient-text">SkillBridge</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting passionate volunteers with impactful NGOs to create meaningful change together.
            </p>
          </div>

          {/* For Volunteers */}
          <div className="space-y-4">
            <h4 className="font-semibold font-display">For Volunteers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/opportunities" className="hover:text-primary transition-colors">
                  Browse Opportunities
                </Link>
              </li>
              <li>
                <Link to="/auth?mode=signup&role=volunteer" className="hover:text-primary transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* For NGOs */}
          <div className="space-y-4">
            <h4 className="font-semibold font-display">For Organizations</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/auth?mode=signup&role=ngo" className="hover:text-secondary transition-colors">
                  Register Your NGO
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-secondary transition-colors">
                  Post Opportunities
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-secondary transition-colors">
                  Find Volunteers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold font-display">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="#" className="hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SkillBridge. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-primary fill-primary" /> for social impact
          </p>
        </div>
      </div>
    </footer>
  );
}
