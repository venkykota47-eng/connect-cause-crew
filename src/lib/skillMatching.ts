/**
 * Calculate skill match percentage between user skills and required skills
 */
export function calculateSkillMatch(
  userSkills: string[] | null | undefined,
  requiredSkills: string[] | null | undefined
): number {
  if (!requiredSkills || requiredSkills.length === 0) {
    return 100; // No skills required means full match
  }

  if (!userSkills || userSkills.length === 0) {
    return 0; // No user skills means no match
  }

  // Normalize skills for comparison (lowercase, trim)
  const normalizedUserSkills = userSkills.map((s) => s.toLowerCase().trim());
  const normalizedRequiredSkills = requiredSkills.map((s) => s.toLowerCase().trim());

  // Count matching skills
  const matchingSkills = normalizedRequiredSkills.filter((required) =>
    normalizedUserSkills.some((userSkill) => 
      userSkill.includes(required) || required.includes(userSkill)
    )
  );

  return Math.round((matchingSkills.length / normalizedRequiredSkills.length) * 100);
}

/**
 * Get match level label based on percentage
 */
export function getMatchLevel(percentage: number): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (percentage >= 80) {
    return { label: "Excellent Match", variant: "default" };
  } else if (percentage >= 50) {
    return { label: "Good Match", variant: "secondary" };
  } else if (percentage >= 25) {
    return { label: "Partial Match", variant: "outline" };
  }
  return { label: "Low Match", variant: "destructive" };
}
