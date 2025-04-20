import { z } from "zod";

// Define reusable validation schemas for common patterns
export const emailSchema = z
  .string()
  .email("Please enter a valid email address");

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(50, "Username cannot exceed 50 characters")
  .regex(
    /^[a-zA-Z0-9-]+$/,
    "Username can only contain letters, numbers, and hyphens",
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^a-zA-Z0-9]/,
    "Password must contain at least one special character",
  );

// Date validation schemas
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const dateRangeSchema = z
  .object({
    since: dateSchema,
    until: dateSchema,
  })
  .refine((data) => new Date(data.since) <= new Date(data.until), {
    message: "Start date must be before or equal to end date",
    path: ["since"], // Highlight the since field for this error
  });

// Search query validation
export const searchQuerySchema = z
  .string()
  .trim()
  .min(2, "Search query must be at least 2 characters")
  .max(100, "Search query cannot exceed 100 characters");

// Repository validation
export const repoNameSchema = z
  .string()
  .min(1, "Repository name is required")
  .max(100, "Repository name cannot exceed 100 characters")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Repository name can only contain letters, numbers, periods, underscores, and hyphens",
  );

// Installation ID validation
export const installationIdSchema = z.coerce
  .number()
  .int("Installation ID must be an integer")
  .positive("Installation ID must be positive");

// Pagination cursor validation
export const cursorSchema = z.string().optional();

// Pagination limit validation
export const limitSchema = z.coerce
  .number()
  .int("Limit must be an integer")
  .min(1, "Limit must be at least 1")
  .max(100, "Limit cannot exceed 100")
  .default(50);

// Contributors validation (array of contributor IDs or usernames)
export const contributorsSchema = z
  .string()
  .transform((val) => val.split(",").map((v) => v.trim()))
  .or(z.array(z.string()))
  .optional();

// Repositories validation (array of repository names)
export const repositoriesSchema = z
  .string()
  .transform((val) => val.split(",").map((v) => v.trim()))
  .or(z.array(z.string()))
  .optional();

// Organizations validation (array of organization names)
export const organizationsSchema = z
  .string()
  .transform((val) => val.split(",").map((v) => v.trim()))
  .or(z.array(z.string()))
  .optional();

// Utility function for validating any schema
export function validateSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    return {
      success: false,
      error: "Validation failed",
    };
  }
}

// Utility function to validate URL query parameters
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodType<T>,
): {
  success: boolean;
  data?: T;
  error?: string;
} {
  // Convert URLSearchParams to object
  const params = Object.fromEntries(searchParams.entries());
  return validateSchema(schema, params);
}

// Input validation
export const validateInput = (
  value: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    customValidator?: (value: string) => string | null;
  },
): string | null => {
  const { required, minLength, maxLength, pattern, customValidator } = options;

  // Required check
  if (required && !value.trim()) {
    return "This field is required";
  }

  // Length checks
  if (minLength !== undefined && value.length < minLength) {
    return `Must be at least ${minLength} characters`;
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return `Cannot exceed ${maxLength} characters`;
  }

  // Pattern check
  if (pattern && !pattern.test(value)) {
    return "Invalid format";
  }

  // Custom validation
  if (customValidator) {
    return customValidator(value);
  }

  return null;
};
