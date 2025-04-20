import { NextRequest, NextResponse } from "next/server";
import {
  mockCreateAuthenticatedOctokit,
  mockOctokit,
  mockFetchRepositories,
  mockFetchAppRepositories,
  mockFetchCommitsForRepositoriesWithOctokit,
  createApiHandlerTestHelper,
  mockGetServerSession,
} from "../../api-test-utils";
import {
  mockRepositories,
  mockActivityCommits,
  mockSession,
} from "../../test-utils";
import { z } from "zod";
import { dateSchema, cursorSchema, limitSchema } from "@/lib/validation";

// Create a mock handler for the my-activity API route with validation
const mockMyActivityHandler = async (req: NextRequest) => {
  const session = await mockGetServerSession();

  // Return 401 if no session
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the URL parameters
  const url = new URL(req.url || "https://example.com");
  // Use the actual URL from the request if available
  const urlParams = req.nextUrl?.searchParams || url.searchParams;

  // Define validation schema
  const activityParamsSchema = z.object({
    since: dateSchema.optional(),
    until: dateSchema.optional(),
    cursor: cursorSchema,
    limit: limitSchema.optional(),
  });

  // Convert URLSearchParams to object
  const params = Object.fromEntries(urlParams.entries());

  // Validate parameters
  try {
    activityParamsSchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: `Validation error: ${error.errors[0].message}`,
          code: "VALIDATION_ERROR",
          details: `Invalid parameter: ${error.errors[0].path.join(".")}`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  // For test purposes, return a success response with validated parameters
  return NextResponse.json(
    {
      success: true,
      validatedParams: params,
    },
    { status: 200 },
  );
};

// Create test helper
const myActivityValidationTestHelper = createApiHandlerTestHelper(
  mockMyActivityHandler,
);

describe("API Input Validation: /api/my-activity", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up default session mock
    mockGetServerSession.mockResolvedValue(mockSession);
  });

  it("should accept valid date format parameters", async () => {
    const response = await myActivityValidationTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        since: "2023-01-01",
        until: "2023-12-31",
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it("should reject invalid date format parameters", async () => {
    const response = await myActivityValidationTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        since: "01/01/2023", // Invalid format
        until: "2023-12-31",
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Validation error");
    expect(response.data.code).toBe("VALIDATION_ERROR");
  });

  it("should accept valid limit parameter", async () => {
    const response = await myActivityValidationTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        limit: "50",
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it("should reject limit parameter outside allowed range", async () => {
    const response = await myActivityValidationTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        limit: "150", // Exceeds maximum of 100
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Validation error");
    expect(response.data.code).toBe("VALIDATION_ERROR");
  });

  it("should reject non-numeric limit parameter", async () => {
    const response = await myActivityValidationTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        limit: "abc", // Not a number
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Validation error");
    expect(response.data.code).toBe("VALIDATION_ERROR");
  });

  it("should accept any string as cursor", async () => {
    const response = await myActivityValidationTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        cursor: "abcdef123",
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it("should handle multiple invalid parameters correctly", async () => {
    const response = await myActivityValidationTestHelper.callHandler(
      "/api/my-activity",
      "GET",
      {
        since: "01/01/2023", // Invalid
        limit: "-5", // Invalid
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Validation error");
    expect(response.data.code).toBe("VALIDATION_ERROR");
  });
});
