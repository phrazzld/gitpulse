import { NextRequest } from "next/server";
import {
  resolveInstallationId,
  resolveMultipleInstallationIds,
  requireInstallationId,
  InstallationIdSource,
} from "@/lib/auth/installationHelper";
import { SessionInfo } from "@/types/api";
import { AppInstallation } from "@/lib/auth/githubAuth";

// Mock the logger to avoid console output during tests
jest.mock("@/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Helper function to create a mock NextRequest with query parameters and cookie header
function createMockRequest(
  params: Record<string, string> = {},
  cookies: string = "",
): NextRequest {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, value);
  });

  return {
    nextUrl: {
      searchParams,
    },
    headers: {
      get: (name: string) => {
        if (name === "cookie") return cookies;
        return null;
      },
    },
  } as unknown as NextRequest;
}

// Helper function to create a mock session
function createMockSession(installationId?: number): SessionInfo {
  return {
    user: { email: "test@example.com", name: "Test User" },
    installationId,
    accessToken: "mock-access-token",
    expires: "2025-12-31T23:59:59.999Z",
  } as SessionInfo;
}

// Helper function to create mock installations
function createMockInstallations(ids: number[]): AppInstallation[] {
  return ids.map(
    (id) =>
      ({
        id,
        account: {
          login: `account-${id}`,
          avatarUrl: `https://example.com/avatar-${id}`,
          type: "Organization",
        },
        appId: 12345,
        targetType: "Organization",
      }) as unknown as AppInstallation,
  );
}

describe("Installation ID Resolution Options", () => {
  describe("resolveInstallationId with custom options", () => {
    it("should use custom query parameter name when specified", () => {
      // Arrange
      const req = createMockRequest({ customParam: "12345" });
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveInstallationId({
        req,
        availableInstallations,
        queryParamName: "customParam",
      });

      // Assert
      expect(result.id).toBe(12345);
      expect(result.source).toBe(InstallationIdSource.QUERY);
      expect(result.isValid).toBe(true);
    });

    it("should use custom cookie name when specified", () => {
      // Arrange
      const req = createMockRequest({}, "customCookie=12345; other=value");
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveInstallationId({
        req,
        availableInstallations,
        cookieName: "customCookie",
      });

      // Assert
      expect(result.id).toBe(12345);
      expect(result.source).toBe(InstallationIdSource.COOKIE);
      expect(result.isValid).toBe(true);
    });

    it("should handle multiple cookies correctly", () => {
      // Arrange
      const req = createMockRequest(
        {},
        "first=value1; github_installation_id=12345; other=value2",
      );
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveInstallationId({
        req,
        availableInstallations,
      });

      // Assert
      expect(result.id).toBe(12345);
      expect(result.source).toBe(InstallationIdSource.COOKIE);
      expect(result.isValid).toBe(true);
    });

    it("should handle non-integer cookie values", () => {
      // Arrange
      const req = createMockRequest(
        {},
        "github_installation_id=invalid; other=value",
      );

      // Act
      const result = resolveInstallationId({
        req,
      });

      // Assert
      expect(result.id).toBeUndefined();
      expect(result.source).toBe(InstallationIdSource.COOKIE);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle undefined URL in request", () => {
      // Arrange
      const req = {
        headers: {
          get: (name: string) => {
            if (name === "cookie") return "github_installation_id=12345";
            return null;
          },
        },
      } as unknown as NextRequest;

      // Act
      const result = resolveInstallationId({
        req,
      });

      // Assert
      expect(result.id).toBe(12345);
      expect(result.source).toBe(InstallationIdSource.COOKIE);
      expect(result.isValid).toBe(true);
    });

    it("should handle invalid session IDs", () => {
      // Arrange
      const session = {
        user: { email: "test@example.com" },
        installationId: -123, // Invalid negative ID
      } as unknown as SessionInfo;

      // Act
      const result = resolveInstallationId({
        session,
      });

      // Assert
      expect(result.id).toBeUndefined();
      expect(result.source).toBe(InstallationIdSource.SESSION);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("resolveMultipleInstallationIds with custom options", () => {
    it("should use custom query parameter name", () => {
      // Arrange
      const req = createMockRequest({ customIds: "12345,67890" });

      // Act
      const result = resolveMultipleInstallationIds({
        req,
        queryParamName: "customIds",
      });

      // Assert
      expect(result).toEqual([12345, 67890]);
    });

    it("should filter out non-numeric values from query parameter", () => {
      // Arrange
      const req = createMockRequest({ installationIds: "12345,invalid,67890" });

      // Act
      const result = resolveMultipleInstallationIds({
        req,
      });

      // Assert
      expect(result).toEqual([12345, 67890]);
    });

    it("should respect installation availability validation when enabled", () => {
      // Arrange
      const req = createMockRequest({ installationIds: "12345,99999,67890" });
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveMultipleInstallationIds({
        req,
        availableInstallations,
        validateAgainstAvailable: true,
      });

      // Assert
      expect(result).toEqual([12345, 67890]);
      // 99999 should be filtered out as it's not in availableInstallations
    });

    it("should not validate against available installations when disabled", () => {
      // Arrange
      const req = createMockRequest({ installationIds: "12345,99999,67890" });
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveMultipleInstallationIds({
        req,
        availableInstallations,
        validateAgainstAvailable: false,
      });

      // Assert
      expect(result).toEqual([12345, 99999, 67890]);
      // All valid numbers should be included regardless of availability
    });

    it("should use session ID when no query parameter is provided", () => {
      // Arrange
      const req = createMockRequest({}); // No installation_ids parameter
      const session = createMockSession(12345);

      // Act
      const result = resolveMultipleInstallationIds({
        req,
        session,
      });

      // Assert
      expect(result).toEqual([12345]);
    });

    it("should use cookie when no query parameter or session ID is provided", () => {
      // Arrange
      const req = createMockRequest(
        {}, // No installation_ids parameter
        "github_installation_id=12345; other=value",
      );

      // Act
      const result = resolveMultipleInstallationIds({
        req,
      });

      // Assert
      expect(result).toEqual([12345]);
    });

    it("should use first available installation as fallback when enabled", () => {
      // Arrange
      const req = createMockRequest({}); // No installation_ids parameter
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveMultipleInstallationIds({
        req,
        availableInstallations,
        useFirstAvailableAsFallback: true,
      });

      // Assert
      expect(result).toEqual([12345]);
    });

    it("should return empty array when no ID is found and fallback is disabled", () => {
      // Arrange
      const req = createMockRequest({}); // No installation_ids parameter
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveMultipleInstallationIds({
        req,
        availableInstallations,
        useFirstAvailableAsFallback: false,
      });

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("requireInstallationId behavior", () => {
    it("should return installation ID when valid", () => {
      // Arrange
      const req = createMockRequest({ installationId: "12345" });

      // Act
      const result = requireInstallationId({
        req,
      });

      // Assert
      expect(result).toBe(12345);
    });

    it("should throw error with proper metadata when invalid", () => {
      // Arrange
      const req = createMockRequest({ installationId: "invalid" });

      // Act & Assert
      try {
        requireInstallationId({
          req,
        });
        fail("Expected error to be thrown");
      } catch (error) {
        // Assert
        expect(error instanceof Error).toBe(true);
        const typedError = error as Error & {
          code: string;
          needsInstallation: boolean;
          source: string;
        };
        expect(typedError.code).toBe("INSTALLATION_ID_REQUIRED");
        expect(typedError.needsInstallation).toBe(true);
        expect(typedError.source).toBe(InstallationIdSource.QUERY);
      }
    });

    it("should throw error when no installation ID found", () => {
      // Arrange
      const req = createMockRequest({});

      // Act & Assert
      try {
        requireInstallationId({
          req,
          useFirstAvailableAsFallback: false,
        });
        fail("Expected error to be thrown");
      } catch (error) {
        // Assert
        expect(error instanceof Error).toBe(true);
        const typedError = error as Error & {
          code: string;
          needsInstallation: boolean;
          source: string;
        };
        expect(typedError.code).toBe("INSTALLATION_ID_REQUIRED");
        expect(typedError.needsInstallation).toBe(true);
        expect(typedError.source).toBe(InstallationIdSource.NONE);
      }
    });

    it("should return fallback installation ID when enabled", () => {
      // Arrange
      const req = createMockRequest({}); // No installation_id parameter
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = requireInstallationId({
        req,
        availableInstallations,
        useFirstAvailableAsFallback: true,
      });

      // Assert
      expect(result).toBe(12345);
    });
  });
});
