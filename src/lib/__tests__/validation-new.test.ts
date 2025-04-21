import {
  validateSchema,
  validateQueryParams,
  installationIdSchema,
  cursorSchema,
  limitSchema,
  contributorsSchema,
  repositoriesSchema,
  organizationsSchema,
} from "../validation";
import { z } from "zod";

describe("Validation tests for API parameters", () => {
  describe("installationIdSchema", () => {
    it("should validate valid installation IDs", () => {
      expect(() => installationIdSchema.parse(123)).not.toThrow();
      expect(() => installationIdSchema.parse("456")).not.toThrow();

      // Test with coercion
      const result = installationIdSchema.parse("789");
      expect(typeof result).toBe("number");
      expect(result).toBe(789);
    });

    it("should reject invalid installation IDs", () => {
      expect(() => installationIdSchema.parse(-1)).toThrow();
      expect(() => installationIdSchema.parse(0)).toThrow();
      expect(() => installationIdSchema.parse("abc")).toThrow();
      expect(() => installationIdSchema.parse("1.5")).toThrow();
    });
  });

  describe("cursorSchema", () => {
    it("should validate valid cursors", () => {
      expect(() => cursorSchema.parse("abcdef123")).not.toThrow();
      expect(() => cursorSchema.parse("")).not.toThrow();
      expect(() => cursorSchema.parse(undefined)).not.toThrow();
    });
  });

  describe("limitSchema", () => {
    it("should validate valid limits", () => {
      expect(() => limitSchema.parse(10)).not.toThrow();
      expect(() => limitSchema.parse("20")).not.toThrow();

      // Test with coercion
      const result = limitSchema.parse("30");
      expect(typeof result).toBe("number");
      expect(result).toBe(30);
    });

    it("should apply default value when not specified", () => {
      const result = limitSchema.parse(undefined);
      expect(result).toBe(50); // default value
    });

    it("should reject invalid limits", () => {
      expect(() => limitSchema.parse(0)).toThrow();
      expect(() => limitSchema.parse(-5)).toThrow();
      expect(() => limitSchema.parse(101)).toThrow(); // exceeds max
      expect(() => limitSchema.parse("abc")).toThrow();
    });
  });

  describe("contributorsSchema", () => {
    it("should validate and transform comma-separated strings", () => {
      const result = contributorsSchema.parse("user1,user2,user3");
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["user1", "user2", "user3"]);
    });

    it("should handle arrays directly", () => {
      const result = contributorsSchema.parse(["user1", "user2"]);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["user1", "user2"]);
    });

    it("should allow empty or undefined values", () => {
      expect(() => contributorsSchema.parse(undefined)).not.toThrow();
      expect(() => contributorsSchema.parse("")).not.toThrow();
    });
  });

  describe("repositoriesSchema", () => {
    it("should validate and transform comma-separated strings", () => {
      const result = repositoriesSchema.parse("repo1,repo2,repo3");
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["repo1", "repo2", "repo3"]);
    });

    it("should handle arrays directly", () => {
      const result = repositoriesSchema.parse(["repo1", "repo2"]);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["repo1", "repo2"]);
    });

    it("should allow empty or undefined values", () => {
      expect(() => repositoriesSchema.parse(undefined)).not.toThrow();
      expect(() => repositoriesSchema.parse("")).not.toThrow();
    });
  });

  describe("organizationsSchema", () => {
    it("should validate and transform comma-separated strings", () => {
      const result = organizationsSchema.parse("org1,org2,org3");
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["org1", "org2", "org3"]);
    });

    it("should handle arrays directly", () => {
      const result = organizationsSchema.parse(["org1", "org2"]);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["org1", "org2"]);
    });

    it("should allow empty or undefined values", () => {
      expect(() => organizationsSchema.parse(undefined)).not.toThrow();
      expect(() => organizationsSchema.parse("")).not.toThrow();
    });
  });

  describe("validateQueryParams", () => {
    it("should validate query parameters using provided schema", () => {
      // Create a test schema
      const testSchema = z.object({
        id: z.coerce.number().int().positive(),
        name: z.string().optional(),
      });

      // Create a URLSearchParams object
      const searchParams = new URLSearchParams();
      searchParams.append("id", "123");
      searchParams.append("name", "test");

      // Validate the parameters
      const result = validateQueryParams(searchParams, testSchema);

      // Verify successful validation
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 123, name: "test" });
      expect(result.error).toBeUndefined();
    });

    it("should return validation error for invalid parameters", () => {
      // Create a test schema
      const testSchema = z.object({
        id: z.coerce.number().int().positive(),
        name: z.string().min(3),
      });

      // Create a URLSearchParams object with invalid data
      const searchParams = new URLSearchParams();
      searchParams.append("id", "-5"); // negative number, invalid
      searchParams.append("name", "a"); // too short, invalid

      // Validate the parameters
      const result = validateQueryParams(searchParams, testSchema);

      // Verify failed validation
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });
});
