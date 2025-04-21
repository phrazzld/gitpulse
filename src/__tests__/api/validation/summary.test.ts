import { NextRequest, NextResponse } from "next/server";
import {
  createApiHandlerTestHelper,
  mockGetServerSession,
} from "../../api-test-utils";
import { mockSession } from "../../test-utils";
import { z } from "zod";
import {
  dateSchema,
  contributorsSchema,
  repositoriesSchema,
  organizationsSchema,
} from "@/lib/validation";

// Mock the installation helper
jest.mock("@/lib/auth/installationHelper", () => ({
  resolveInstallationId: jest.fn().mockImplementation(() => ({
    isValid: true,
    id: 123456,
    source: "query",
  })),
  resolveMultipleInstallationIds: jest.fn().mockImplementation(() => [123456]),
  requireInstallationId: jest.fn().mockImplementation(() => 123456),
  InstallationIdSource: {
    QUERY: "query",
    SESSION: "session",
    COOKIE: "cookie",
    AVAILABLE_INSTALLATIONS: "available_installations",
    FALLBACK: "fallback",
    NONE: "none",
  },
}));

// Create a mock handler for the summary API validation
const mockSummaryHandler = async (req: NextRequest) => {
  const session = await mockGetServerSession();

  // Return 401 if no session
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the URL parameters
  const url = new URL(req.url || "https://example.com");
  // Use the actual URL from the request if available
  const urlParams = req.nextUrl?.searchParams || url.searchParams;

  // Define validation schema
  const summaryParamsSchema = z.object({
    since: dateSchema,
    until: dateSchema,
    contributors: contributorsSchema,
    repositories: repositoriesSchema,
    organizations: organizationsSchema,
    groupBy: z
      .enum(["chronological", "repository", "contributor", "organization"])
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

  // Convert URLSearchParams to object
  const params = Object.fromEntries(urlParams.entries());

  // Parse URL parameters for validation

  // Validate parameters
  try {
    const validationResult = summaryParamsSchema.safeParse(params);

    if (!validationResult.success) {
      // Validation failed, return error response

      return NextResponse.json(
        {
          error: `Validation error: ${validationResult.error.errors[0].message}`,
          code: "VALIDATION_ERROR",
          details: `Invalid parameter: ${validationResult.error.errors[0].path.join(".")}`,
        },
        { status: 400 },
      );
    }

    // For test purposes, return a success response with validated parameters
    // Validation succeeded, return success response with validated data

    return NextResponse.json(
      {
        success: true,
        validatedParams: validationResult.data,
      },
      { status: 200 },
    );
  } catch (error) {
    // Unexpected error occurred during validation

    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }
};

// Create test helper
const summaryValidationTestHelper =
  createApiHandlerTestHelper(mockSummaryHandler);

describe("API Input Validation: /api/summary", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up default session mock
    mockGetServerSession.mockResolvedValue(mockSession);
  });

  it("should accept valid required date parameters", async () => {
    const response = await summaryValidationTestHelper.callHandler(
      "/api/summary",
      "GET",
      {
        since: "2023-01-01",
        until: "2023-12-31",
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.validatedParams.since).toBe("2023-01-01");
    expect(response.data.validatedParams.until).toBe("2023-12-31");
  });

  it("should reject missing required date parameters", async () => {
    const response = await summaryValidationTestHelper.callHandler(
      "/api/summary",
      "GET",
      {
        until: "2023-12-31", // missing 'since'
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Validation error");
    expect(response.data.code).toBe("VALIDATION_ERROR");
  });

  it("should reject invalid date format", async () => {
    const response = await summaryValidationTestHelper.callHandler(
      "/api/summary",
      "GET",
      {
        since: "01/01/2023", // Wrong format
        until: "2023-12-31",
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Validation error");
    expect(response.data.code).toBe("VALIDATION_ERROR");
  });

  it("should validate and transform comma-separated contributors", async () => {
    const response = await summaryValidationTestHelper.callHandler(
      "/api/summary",
      "GET",
      {
        since: "2023-01-01",
        until: "2023-12-31",
        contributors: "user1,user2,user3",
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.validatedParams.contributors).toEqual([
      "user1",
      "user2",
      "user3",
    ]);
  });

  it("should validate and transform comma-separated repositories", async () => {
    const response = await summaryValidationTestHelper.callHandler(
      "/api/summary",
      "GET",
      {
        since: "2023-01-01",
        until: "2023-12-31",
        repositories: "repo1,repo2,repo3",
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.validatedParams.repositories).toEqual([
      "repo1",
      "repo2",
      "repo3",
    ]);
  });

  it("should validate and transform comma-separated organizations", async () => {
    const response = await summaryValidationTestHelper.callHandler(
      "/api/summary",
      "GET",
      {
        since: "2023-01-01",
        until: "2023-12-31",
        organizations: "org1,org2,org3",
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.validatedParams.organizations).toEqual([
      "org1",
      "org2",
      "org3",
    ]);
  });

  it("should validate and transform comma-separated installation_ids", async () => {
    const response = await summaryValidationTestHelper.callHandler(
      "/api/summary",
      "GET",
      {
        since: "2023-01-01",
        until: "2023-12-31",
        installation_ids: "123,456,789",
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.validatedParams.installation_ids).toEqual([
      123, 456, 789,
    ]);
  });

  it("should validate groupBy parameter", async () => {
    const response = await summaryValidationTestHelper.callHandler(
      "/api/summary",
      "GET",
      {
        since: "2023-01-01",
        until: "2023-12-31",
        groupBy: "chronological",
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.validatedParams.groupBy).toBe("chronological");
  });

  it("should reject invalid groupBy parameter", async () => {
    const response = await summaryValidationTestHelper.callHandler(
      "/api/summary",
      "GET",
      {
        since: "2023-01-01",
        until: "2023-12-31",
        groupBy: "invalid-group", // Not in the allowed values
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Validation error");
    expect(response.data.code).toBe("VALIDATION_ERROR");
  });

  it("should handle multiple parameters together", async () => {
    const response = await summaryValidationTestHelper.callHandler(
      "/api/summary",
      "GET",
      {
        since: "2023-01-01",
        until: "2023-12-31",
        contributors: "user1,user2",
        repositories: "repo1,repo2",
        organizations: "org1",
        groupBy: "repository",
        installation_ids: "123,456",
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.validatedParams.since).toBe("2023-01-01");
    expect(response.data.validatedParams.until).toBe("2023-12-31");
    expect(response.data.validatedParams.contributors).toEqual([
      "user1",
      "user2",
    ]);
    expect(response.data.validatedParams.repositories).toEqual([
      "repo1",
      "repo2",
    ]);
    expect(response.data.validatedParams.organizations).toEqual(["org1"]);
    expect(response.data.validatedParams.groupBy).toBe("repository");
    expect(response.data.validatedParams.installation_ids).toEqual([123, 456]);
  });

  it("should return 401 when no session exists", async () => {
    // Mock no session
    mockGetServerSession.mockResolvedValueOnce(null);

    const response = await summaryValidationTestHelper.callHandler(
      "/api/summary",
      "GET",
      {
        since: "2023-01-01",
        until: "2023-12-31",
      },
    );

    expect(response.status).toBe(401);
    expect(response.data.error).toBe("Unauthorized");
  });
});
