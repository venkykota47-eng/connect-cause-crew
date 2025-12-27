import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const requirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return 0;
    return requirements.filter((req) => req.test(password)).length;
  }, [password]);

  const strengthLabel = useMemo(() => {
    if (strength === 0) return "";
    if (strength <= 1) return "Weak";
    if (strength <= 2) return "Fair";
    if (strength <= 3) return "Good";
    return "Strong";
  }, [strength]);

  const strengthColor = useMemo(() => {
    if (strength <= 1) return "bg-destructive";
    if (strength <= 2) return "bg-orange-500";
    if (strength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  }, [strength]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                level <= strength ? strengthColor : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className={`text-xs font-medium ${
          strength <= 1 ? "text-destructive" : 
          strength <= 2 ? "text-orange-500" : 
          strength <= 3 ? "text-yellow-600" : "text-green-600"
        }`}>
          {strengthLabel}
        </p>
      </div>

      {/* Requirements list */}
      <ul className="space-y-1">
        {requirements.map((req, index) => {
          const passed = req.test(password);
          return (
            <li
              key={index}
              className={`flex items-center gap-2 text-xs transition-colors ${
                passed ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {passed ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
