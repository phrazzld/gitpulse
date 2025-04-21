import { NextApiHandler } from "next";
import { z } from "zod";
import {
  dateSchema,
  limitSchema,
  installationIdSchema,
  validateSchema,
  validateQueryParams,
} from "@/lib/validation";

// Note: This is an integration-style test that tests the validation functionality
// with real schemas but in a simpler context than the full API routes.

describe("Integration validation for API routes", () => {
  it("should validate date parameters for activity routes", () => {
    // Create a schema similar to what the API routes use
    const activityParamsSchema = z.object({
      since: dateSchema.optional(),
      until: dateSchema.optional(),
      limit: limitSchema.optional(),
    });

    // Test with valid parameters
    const validParams = {
      since: "2023-01-01",
      until: "2023-12-31",
      limit: "30",
    };
    const validResult = validateSchema(activityParamsSchema, validParams);
    expect(validResult.success).toBe(true);
    expect(validResult.data).toEqual({
      since: "2023-01-01",
      until: "2023-12-31",
      limit: 30, // Note the coercion to number
    });

    // Test with invalid date format
    const invalidDateParams = {
      since: "01/01/2023", // Wrong format
      until: "2023-12-31",
    };
    const invalidDateResult = validateSchema(
      activityParamsSchema,
      invalidDateParams,
    );
    expect(invalidDateResult.success).toBe(false);
    expect(invalidDateResult.error).toContain("format");

    // Test with invalid limit
    const invalidLimitParams = {
      since: "2023-01-01",
      until: "2023-12-31",
      limit: "200", // Exceeds maximum of 100
    };
    const invalidLimitResult = validateSchema(
      activityParamsSchema,
      invalidLimitParams,
    );
    expect(invalidLimitResult.success).toBe(false);
    expect(invalidLimitResult.error).toContain("exceed 100");

    // Test with non-numeric limit
    const nonNumericLimitParams = {
      since: "2023-01-01",
      until: "2023-12-31",
      limit: "abc", // Not a number
    };
    const nonNumericLimitResult = validateSchema(
      activityParamsSchema,
      nonNumericLimitParams,
    );
    expect(nonNumericLimitResult.success).toBe(false);
    expect(nonNumericLimitResult.error).toBeDefined();
  });

  it("should validate installation ID parameters", () => {
    // Create a schema similar to what the API routes use
    const installationSchema = z.object({
      installation_id: installationIdSchema,
    });

    // Test with valid installation ID
    const validParams = {
      installation_id: "12345",
    };
    const validResult = validateSchema(installationSchema, validParams);
    expect(validResult.success).toBe(true);
    expect(validResult.data).toEqual({
      installation_id: 12345, // Coerced to number
    });

    // Test with negative installation ID
    const negativeParams = {
      installation_id: "-5",
    };
    const negativeResult = validateSchema(installationSchema, negativeParams);
    expect(negativeResult.success).toBe(false);
    expect(negativeResult.error).toContain("positive");

    // Test with non-integer installation ID
    const nonIntegerParams = {
      installation_id: "123.45",
    };
    const nonIntegerResult = validateSchema(
      installationSchema,
      nonIntegerParams,
    );
    expect(nonIntegerResult.success).toBe(false);
    expect(nonIntegerResult.error).toContain("integer");

    // Test with non-numeric installation ID
    const nonNumericParams = {
      installation_id: "abc",
    };
    const nonNumericResult = validateSchema(
      installationSchema,
      nonNumericParams,
    );
    expect(nonNumericResult.success).toBe(false);
    expect(nonNumericResult.error).toBeDefined();
  });

  it("should validate URLSearchParams objects with validateQueryParams", () => {
    // Create a schema for testing
    const testSchema = z.object({
      since: dateSchema,
      until: dateSchema,
      limit: limitSchema.optional(),
    });

    // Create a URLSearchParams object with valid data
    const validSearchParams = new URLSearchParams();
    validSearchParams.append("since", "2023-01-01");
    validSearchParams.append("until", "2023-12-31");
    validSearchParams.append("limit", "25");

    // Validate with valid parameters
    const validResult = validateQueryParams(validSearchParams, testSchema);
    expect(validResult.success).toBe(true);
    expect(validResult.data).toEqual({
      since: "2023-01-01",
      until: "2023-12-31",
      limit: 25,
    });

    // Create a URLSearchParams object with invalid data
    const invalidSearchParams = new URLSearchParams();
    invalidSearchParams.append("since", "2023-01-01");
    // Missing required 'until' parameter

    // Validate with missing required parameter
    const invalidResult = validateQueryParams(invalidSearchParams, testSchema);
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toBeDefined();
  });

  it("should handle parameter transformations correctly", () => {
    // Create a schema with transforms like the actual API schemas
    const summaryParamsSchema = z.object({
      repositories: z
        .string()
        .transform((val) => val.split(",").map((v) => v.trim()))
        .or(z.array(z.string()))
        .optional(),
      installation_ids: z
        .string()
        .transform((val) =>
          val
            .split(",")
            .map((v) => parseInt(v.trim(), 10))
            .filter((id) => !isNaN(id)),
        )
        .optional(),
    });

    // Test with comma-separated values
    const commaParams = {
      repositories: "repo1,repo2,repo3",
      installation_ids: "123,456,789",
    };
    const commaResult = validateSchema(summaryParamsSchema, commaParams);
    expect(commaResult.success).toBe(true);
    expect(commaResult.data).toEqual({
      repositories: ["repo1", "repo2", "repo3"],
      installation_ids: [123, 456, 789],
    });

    // Test with array values
    const arrayParams = {
      repositories: ["repo1", "repo2", "repo3"],
    };
    const arrayResult = validateSchema(summaryParamsSchema, arrayParams);
    expect(arrayResult.success).toBe(true);
    expect(arrayResult.data?.repositories).toEqual(["repo1", "repo2", "repo3"]);

    // Test with mixed valid and invalid IDs
    const mixedParams = {
      installation_ids: "123,abc,456", // 'abc' is invalid and should be filtered out
    };
    const mixedResult = validateSchema(summaryParamsSchema, mixedParams);
    expect(mixedResult.success).toBe(true);
    expect(mixedResult.data?.installation_ids).toEqual([123, 456]);
  });
});
