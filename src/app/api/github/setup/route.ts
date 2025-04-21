import { NextRequest, NextResponse } from "next/server";
import { SessionInfo } from "@/types/api";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { logger } from "@/lib/logger";
import { resolveInstallationId } from "@/lib/auth/installationHelper";
import {
  withErrorHandling,
  createApiErrorResponse,
} from "@/lib/auth/apiErrorHandler";

const MODULE_NAME = "api:github:setup";

async function handleGET(request: NextRequest) {
  logger.debug(MODULE_NAME, "GET /api/github/setup request received", {
    url: request.url,
    searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
  });

  const session = (await getServerSession(
    authOptions,
  )) as unknown as SessionInfo;

  // Check if there's a valid session
  if (!session) {
    logger.warn(MODULE_NAME, "No valid session for GitHub App setup");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Use the centralized utility to validate the installation ID
  const installationResult = resolveInstallationId({
    req: request,
    session,
    validateAgainstAvailable: false, // No need to validate against available installations for setup
  });

  if (!installationResult.isValid || !installationResult.id) {
    logger.warn(MODULE_NAME, "Invalid installation ID provided", {
      error: installationResult.error,
      source: installationResult.source,
    });

    return NextResponse.redirect(
      new URL(
        `/dashboard?error=invalid_installation_id&message=${installationResult.error || "Invalid installation ID"}`,
        request.url,
      ),
    );
  }

  const installationId = installationResult.id.toString();

  logger.info(MODULE_NAME, "GitHub App installation ID received", {
    installationId,
    user: session.user?.name || "unknown",
  });

  // We'll store the installation ID in a cookie for now
  // In a production environment, you might want to store this in a database
  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  // Set the installation_id cookie - httpOnly:false so JS can read it
  response.cookies.set("github_installation_id", installationId, {
    path: "/",
    httpOnly: false,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  logger.debug(
    MODULE_NAME,
    "Redirecting to dashboard with installation_id cookie set",
  );

  return response;
}

// z is now imported via the installationHelper utility

// Wrap the handler with standardized error handling
export const GET = withErrorHandling(handleGET, MODULE_NAME);
