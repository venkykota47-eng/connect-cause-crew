import { z } from "zod";

// Sanitize string by trimming and removing potentially dangerous characters
const sanitizeString = (val: string) => val.trim();

// Base schemas with sanitization
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(255, "Email must be less than 255 characters")
  .email("Please enter a valid email address")
  .transform(sanitizeString);

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password must be less than 128 characters");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .transform(sanitizeString);

export const textSchema = z
  .string()
  .trim()
  .max(500, "Text must be less than 500 characters")
  .transform(sanitizeString);

export const longTextSchema = z
  .string()
  .trim()
  .max(5000, "Text must be less than 5000 characters")
  .transform(sanitizeString);

export const phoneSchema = z
  .string()
  .trim()
  .max(20, "Phone must be less than 20 characters")
  .regex(/^[\d\s\-+()]*$/, "Phone can only contain numbers, spaces, and +()-")
  .optional()
  .or(z.literal(""))
  .transform((val) => val?.trim() || "");

export const urlSchema = z
  .string()
  .trim()
  .max(500, "URL must be less than 500 characters")
  .url("Please enter a valid URL")
  .optional()
  .or(z.literal(""))
  .transform((val) => val?.trim() || "");

export const positiveIntSchema = z
  .number()
  .int("Must be a whole number")
  .min(0, "Must be 0 or greater")
  .max(10000, "Value too large");

export const yearSchema = z
  .number()
  .int("Must be a whole number")
  .min(1800, "Year must be after 1800")
  .max(new Date().getFullYear() + 1, "Year cannot be in the future");

// Auth schemas
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  role: z.enum(["volunteer", "ngo"]),
  orgName: z.string().trim().max(200, "Organization name must be less than 200 characters").optional(),
}).refine(
  (data) => data.role !== "ngo" || (data.orgName && data.orgName.trim().length > 0),
  { message: "Organization name is required for NGOs", path: ["orgName"] }
);

// Profile schemas
export const volunteerProfileSchema = z.object({
  full_name: nameSchema,
  bio: longTextSchema.optional().or(z.literal("")),
  location: textSchema.optional().or(z.literal("")),
  phone: phoneSchema,
  skills: z.array(z.string().trim().max(50)).max(20, "Maximum 20 skills allowed"),
  experience_years: positiveIntSchema.optional(),
  availability: textSchema.optional().or(z.literal("")),
});

export const ngoProfileSchema = z.object({
  full_name: nameSchema,
  bio: longTextSchema.optional().or(z.literal("")),
  location: textSchema.optional().or(z.literal("")),
  phone: phoneSchema,
  organization_name: z.string().trim().min(1, "Organization name is required").max(200),
  website: urlSchema,
  mission: longTextSchema.optional().or(z.literal("")),
  founded_year: yearSchema.optional(),
  team_size: positiveIntSchema.optional(),
});

// Opportunity schema
export const opportunitySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters"),
  location: z
    .string()
    .trim()
    .min(1, "Location is required")
    .max(200, "Location must be less than 200 characters"),
  commitment_type: z.enum(["one-time", "short-term", "long-term"]),
  hours_per_week: z
    .number()
    .int()
    .min(1, "Hours must be at least 1")
    .max(168, "Hours cannot exceed 168 per week"),
  spots_available: z
    .number()
    .int()
    .min(1, "At least 1 spot required")
    .max(1000, "Maximum 1000 spots"),
  is_remote: z.boolean(),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  skills_required: z.array(z.string().trim().max(50)).max(10, "Maximum 10 skills"),
});

// Message schema
export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(10000, "Message must be less than 10000 characters"),
});

// Application schema
export const applicationSchema = z.object({
  cover_letter: z
    .string()
    .trim()
    .max(5000, "Cover letter must be less than 5000 characters")
    .optional()
    .or(z.literal("")),
});

// Helper type exports
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type VolunteerProfileFormData = z.infer<typeof volunteerProfileSchema>;
export type NgoProfileFormData = z.infer<typeof ngoProfileSchema>;
export type OpportunityFormData = z.infer<typeof opportunitySchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type ApplicationFormData = z.infer<typeof applicationSchema>;

// Validation helper function
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  errors: Record<string, string> 
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }
  
  const errors: Record<string, string> = {};
  for (const error of result.error.errors) {
    const path = error.path.join(".");
    if (!errors[path]) {
      errors[path] = error.message;
    }
  }
  
  return { success: false, errors };
}
