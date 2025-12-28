import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

const SUGGESTED_SKILLS = [
  "Web Development",
  "Graphic Design",
  "Social Media",
  "Writing",
  "Photography",
  "Video Editing",
  "Teaching",
  "Fundraising",
  "Event Planning",
  "Marketing",
  "Data Analysis",
  "Translation",
  "Project Management",
  "Legal",
  "Accounting",
  "Healthcare",
];

interface SkillsTagInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillsTagInput({ skills, onChange }: SkillsTagInputProps) {
  const [newSkill, setNewSkill] = useState("");

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter((skill) => skill !== skillToRemove));
  };

  const availableSuggestions = SUGGESTED_SKILLS.filter(
    (s) => !skills.includes(s)
  );

  return (
    <div className="space-y-4">
      {/* Current skills */}
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {skills.length === 0 && (
          <p className="text-sm text-muted-foreground">No skills added yet</p>
        )}
        {skills.map((skill, index) => (
          <Badge key={index} variant="skill" className="gap-1 pr-1">
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="ml-1 hover:text-destructive rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Add new skill */}
      <div className="flex gap-2">
        <Input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Type a skill and press Enter..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSkill(newSkill);
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => addSkill(newSkill)}
          disabled={!newSkill.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggestions */}
      {availableSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Suggested skills:</p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.slice(0, 8).map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => addSkill(skill)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
