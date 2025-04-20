import {
  validateSchema,
  validateInput,
  emailSchema,
  usernameSchema,
  passwordSchema,
  dateSchema,
  dateRangeSchema,
  searchQuerySchema,
  repoNameSchema,
} from "../validation";
import { z } from "zod";

describe("Validation utilities", () => {
  describe("validateSchema", () => {
    it("should successfully validate valid data", () => {
      const testSchema = z.object({
        name: z.string().min(2),
        age: z.number().min(18),
      });

      const result = validateSchema(testSchema, { name: "Test", age: 25 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: "Test", age: 25 });
      expect(result.error).toBeUndefined();
    });

    it("should return an error for invalid data", () => {
      const testSchema = z.object({
        name: z.string().min(2),
        age: z.number().min(18),
      });

      const result = validateSchema(testSchema, { name: "T", age: 16 });

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe("validateInput", () => {
    it("should validate required fields", () => {
      expect(validateInput("", { required: true })).toBe(
        "This field is required",
      );
      expect(validateInput("test", { required: true })).toBeNull();
    });

    it("should validate minimum length", () => {
      expect(validateInput("ab", { minLength: 3 })).toBe(
        "Must be at least 3 characters",
      );
      expect(validateInput("abc", { minLength: 3 })).toBeNull();
    });

    it("should validate maximum length", () => {
      expect(validateInput("abcdef", { maxLength: 5 })).toBe(
        "Cannot exceed 5 characters",
      );
      expect(validateInput("abcde", { maxLength: 5 })).toBeNull();
    });

    it("should validate patterns", () => {
      expect(validateInput("abc", { pattern: /^\d+$/ })).toBe("Invalid format");
      expect(validateInput("123", { pattern: /^\d+$/ })).toBeNull();
    });

    it("should use custom validators", () => {
      const customValidator = (value: string) =>
        value === "valid" ? null : 'Value must be "valid"';

      expect(validateInput("invalid", { customValidator })).toBe(
        'Value must be "valid"',
      );
      expect(validateInput("valid", { customValidator })).toBeNull();
    });
  });

  describe("Email schema", () => {
    it("should validate valid emails", () => {
      expect(() => emailSchema.parse("test@example.com")).not.toThrow();
      expect(() =>
        emailSchema.parse("user.name+tag@example.co.uk"),
      ).not.toThrow();
    });

    it("should reject invalid emails", () => {
      expect(() => emailSchema.parse("notanemail")).toThrow();
      expect(() => emailSchema.parse("missing@.com")).toThrow();
      expect(() => emailSchema.parse("@example.com")).toThrow();
    });
  });

  describe("Username schema", () => {
    it("should validate valid usernames", () => {
      expect(() => usernameSchema.parse("user123")).not.toThrow();
      expect(() => usernameSchema.parse("developer-name")).not.toThrow();
    });

    it("should reject invalid usernames", () => {
      expect(() => usernameSchema.parse("ab")).toThrow(); // Too short
      expect(() => usernameSchema.parse("user_name")).toThrow(); // Has underscore
      expect(() => usernameSchema.parse("user name")).toThrow(); // Has space
    });
  });

  describe("Date schema", () => {
    it("should validate valid date strings", () => {
      expect(() => dateSchema.parse("2023-05-15")).not.toThrow();
    });

    it("should reject invalid date strings", () => {
      expect(() => dateSchema.parse("05/15/2023")).toThrow();
      expect(() => dateSchema.parse("2023/05/15")).toThrow();
      expect(() => dateSchema.parse("15-05-2023")).toThrow();
    });
  });

  describe("Date range schema", () => {
    it("should validate valid date ranges", () => {
      expect(() =>
        dateRangeSchema.parse({
          since: "2023-01-01",
          until: "2023-12-31",
        }),
      ).not.toThrow();

      expect(() =>
        dateRangeSchema.parse({
          since: "2023-05-15",
          until: "2023-05-15", // Same day is valid
        }),
      ).not.toThrow();
    });

    it("should reject invalid date ranges", () => {
      expect(() =>
        dateRangeSchema.parse({
          since: "2023-12-31",
          until: "2023-01-01", // End before start
        }),
      ).toThrow();

      expect(() =>
        dateRangeSchema.parse({
          since: "2023-05-15",
          until: "05/15/2023", // Wrong format for until
        }),
      ).toThrow();
    });
  });

  describe("Search query schema", () => {
    it("should validate valid search queries", () => {
      expect(() => searchQuerySchema.parse("search term")).not.toThrow();
    });

    it("should reject invalid search queries", () => {
      expect(() => searchQuerySchema.parse("a")).toThrow(); // Too short
      expect(() => searchQuerySchema.parse(" ")).toThrow(); // Just spaces
    });
  });

  describe("Repository name schema", () => {
    it("should validate valid repository names", () => {
      expect(() => repoNameSchema.parse("my-repo")).not.toThrow();
      expect(() => repoNameSchema.parse("project.api")).not.toThrow();
      expect(() => repoNameSchema.parse("app_v2")).not.toThrow();
    });

    it("should reject invalid repository names", () => {
      expect(() => repoNameSchema.parse("")).toThrow(); // Empty
      expect(() => repoNameSchema.parse("my repo")).toThrow(); // Has space
      expect(() => repoNameSchema.parse("repo$special")).toThrow(); // Has special char
    });
  });
});
