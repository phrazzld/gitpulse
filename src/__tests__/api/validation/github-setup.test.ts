import { NextRequest, NextResponse } from "next/server";
import {
  createApiHandlerTestHelper,
  mockGetServerSession,
} from "../../api-test-utils";
import { mockSession } from "../../test-utils";
import { z } from "zod";
import { installationIdSchema } from "@/lib/validation";

// Create a mock handler for GitHub setup validation
const mockGitHubSetupHandler = async (req: NextRequest) => {
  const session = await mockGetServerSession();

  // Return redirect if no session
  if (!session) {
    return NextResponse.redirect(new URL("/", "https://example.com"));
  }

  // Get the URL parameters
  const url = new URL(req.url || "https://example.com");
  // Use the actual URL from the request if available
  const urlParams = req.nextUrl?.searchParams || url.searchParams;

  // Define validation schema
  const setupParamsSchema = z.object({
    installation_id: installationIdSchema,
  });

  // Convert URLSearchParams to object
  const params = Object.fromEntries(urlParams.entries());

  // Validate parameters
  try {
    setupParamsSchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=invalid_installation_id&message=${error.errors[0].message}`,
          "https://example.com",
        ),
      );
    }

    return NextResponse.redirect(
      new URL(
        "/dashboard?error=invalid_installation_id",
        "https://example.com",
      ),
    );
  }

  // For test purposes, we're not actually going to set cookies or do full redirect
  // But we'll return a mock response indicating success
  return NextResponse.json(
    {
      success: true,
      installationId: Number(params.installation_id),
      redirectTo: "/dashboard",
    },
    { status: 200 },
  );
};

// Create test helper
const githubSetupTestHelper = createApiHandlerTestHelper(
  mockGitHubSetupHandler,
);

describe("API Input Validation: /api/github/setup", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up default session mock
    mockGetServerSession.mockResolvedValue(mockSession);
  });

  it("should validate positive integer installation IDs", async () => {
    const response = await githubSetupTestHelper.callHandler(
      "/api/github/setup",
      "GET",
      {
        installation_id: "12345",
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.installationId).toBe(12345);
  });

  it("should redirect with error for non-integer installation IDs", async () => {
    const response = await githubSetupTestHelper.callHandler(
      "/api/github/setup",
      "GET",
      {
        installation_id: "123.45",
      },
    );

    expect(response.status).toBe(302); // Redirect status
    expect(response.headers.location).toContain(
      "/dashboard?error=invalid_installation_id",
    );
  });

  it("should redirect with error for negative installation IDs", async () => {
    const response = await githubSetupTestHelper.callHandler(
      "/api/github/setup",
      "GET",
      {
        installation_id: "-5",
      },
    );

    expect(response.status).toBe(302); // Redirect status
    expect(response.headers.location).toContain(
      "/dashboard?error=invalid_installation_id",
    );
  });

  it("should redirect with error for non-numeric installation IDs", async () => {
    const response = await githubSetupTestHelper.callHandler(
      "/api/github/setup",
      "GET",
      {
        installation_id: "abc",
      },
    );

    expect(response.status).toBe(302); // Redirect status
    expect(response.headers.location).toContain(
      "/dashboard?error=invalid_installation_id",
    );
  });

  it("should redirect with error for missing installation ID", async () => {
    const response = await githubSetupTestHelper.callHandler(
      "/api/github/setup",
      "GET",
      {},
    );

    expect(response.status).toBe(302); // Redirect status
    expect(response.headers.location).toContain(
      "/dashboard?error=invalid_installation_id",
    );
  });

  it("should redirect to homepage when no session exists", async () => {
    // Mock no session
    mockGetServerSession.mockResolvedValueOnce(null);

    const response = await githubSetupTestHelper.callHandler(
      "/api/github/setup",
      "GET",
      {
        installation_id: "12345",
      },
    );

    expect(response.status).toBe(302); // Redirect status
    expect(response.headers.location).toBe("https://example.com/");
  });
});
