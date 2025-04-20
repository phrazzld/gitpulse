import { NextRequest, NextResponse } from "next/server";
import {
  createApiHandlerTestHelper,
  mockGetServerSession,
} from "../../api-test-utils";
import { mockSession } from "../../test-utils";
import { z } from "zod";
import { installationIdSchema } from "@/lib/validation";

// Create a mock handler for the repos API validation
const mockReposHandler = async (req: NextRequest) => {
  const session = await mockGetServerSession();

  // Return 401 if no session
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the URL parameters
  const url = new URL(req.url || "https://example.com");
  // Use the actual URL from the request if available
  const urlParams = req.nextUrl?.searchParams || url.searchParams;
  const requestedInstallationId = urlParams.get("installation_id");

  // Set default installation ID from session
  let installationId = session.installationId;

  // If installation_id is provided in the query, validate it
  if (requestedInstallationId) {
    try {
      const validationSchema = z.object({
        installation_id: installationIdSchema,
      });

      const validationResult = validationSchema.safeParse({
        installation_id: requestedInstallationId,
      });

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: `Validation error: ${validationResult.error.errors[0].message}`,
            code: "VALIDATION_ERROR",
            details:
              "The installation_id parameter must be a positive integer.",
          },
          { status: 400 },
        );
      }

      installationId = validationResult.data.installation_id;
    } catch (error) {
      return NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }
  }

  // For test purposes, return a success response with validated parameters
  return NextResponse.json(
    {
      success: true,
      installationId,
    },
    { status: 200 },
  );
};

// Create test helper
const reposValidationTestHelper = createApiHandlerTestHelper(mockReposHandler);

describe("API Input Validation: /api/repos", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up default session mock with installation ID
    mockGetServerSession.mockResolvedValue({
      ...mockSession,
      installationId: 12345,
    });
  });

  it("should accept valid installation ID", async () => {
    const response = await reposValidationTestHelper.callHandler(
      "/api/repos",
      "GET",
      {
        installation_id: "67890",
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.installationId).toBe(67890);
  });

  it("should use session installation ID when none provided", async () => {
    const response = await reposValidationTestHelper.callHandler(
      "/api/repos",
      "GET",
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.installationId).toBe(12345); // From session
  });

  it("should reject non-integer installation ID", async () => {
    const response = await reposValidationTestHelper.callHandler(
      "/api/repos",
      "GET",
      {
        installation_id: "123.45",
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Validation error");
    expect(response.data.code).toBe("VALIDATION_ERROR");
  });

  it("should reject negative installation ID", async () => {
    const response = await reposValidationTestHelper.callHandler(
      "/api/repos",
      "GET",
      {
        installation_id: "-5",
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Validation error");
    expect(response.data.code).toBe("VALIDATION_ERROR");
  });

  it("should reject non-numeric installation ID", async () => {
    const response = await reposValidationTestHelper.callHandler(
      "/api/repos",
      "GET",
      {
        installation_id: "abc",
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.error).toContain("Validation error");
    expect(response.data.code).toBe("VALIDATION_ERROR");
  });

  it("should return 401 when no session exists", async () => {
    // Mock no session
    mockGetServerSession.mockResolvedValueOnce(null);

    const response = await reposValidationTestHelper.callHandler(
      "/api/repos",
      "GET",
      {
        installation_id: "12345",
      },
    );

    expect(response.status).toBe(401);
    expect(response.data.error).toBe("Unauthorized");
  });
});
