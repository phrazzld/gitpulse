import { NextRequest } from "next/server";
import {
  resolveInstallationId,
  resolveMultipleInstallationIds,
  requireInstallationId,
  InstallationIdSource,
} from "../installationHelper";
import { SessionInfo } from "@/types/api";
import { AppInstallation } from "../githubAuth";

// Mock the logger to avoid console output during tests
jest.mock("../../logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Helper functions to create test objects
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

function createMockSession(installationId?: number): SessionInfo {
  return {
    user: { email: "test@example.com" },
    installationId,
  } as SessionInfo;
}

function createMockInstallations(ids: number[]): AppInstallation[] {
  return ids.map(
    (id) =>
      ({
        id,
        account: {
          login: `account-${id}`,
        },
      }) as unknown as AppInstallation,
  );
}

describe("installationHelper", () => {
  describe("resolveInstallationId", () => {
    it("should resolve installation ID from query parameters", () => {
      // Arrange
      const req = createMockRequest({ installation_id: "12345" });
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveInstallationId({
        req,
        availableInstallations,
      });

      // Assert
      expect(result.id).toBe(12345);
      expect(result.source).toBe(InstallationIdSource.QUERY);
      expect(result.isValid).toBe(true);
    });

    it("should return error for invalid query parameter", () => {
      // Arrange
      const req = createMockRequest({ installation_id: "invalid" });

      // Act
      const result = resolveInstallationId({ req });

      // Assert
      expect(result.id).toBeUndefined();
      expect(result.source).toBe(InstallationIdSource.QUERY);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should resolve installation ID from session", () => {
      // Arrange
      const session = createMockSession(12345);
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveInstallationId({
        session,
        availableInstallations,
      });

      // Assert
      expect(result.id).toBe(12345);
      expect(result.source).toBe(InstallationIdSource.SESSION);
      expect(result.isValid).toBe(true);
    });

    it("should return error for invalid session installation ID", () => {
      // Arrange
      const session = { installationId: -1 } as unknown as SessionInfo;

      // Act
      const result = resolveInstallationId({ session });

      // Assert
      expect(result.source).toBe(InstallationIdSource.SESSION);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should resolve installation ID from cookies", () => {
      // Arrange
      const req = createMockRequest(
        {},
        "github_installation_id=12345; other=value",
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

    it("should return error for invalid cookie installation ID", () => {
      // Arrange
      const req = createMockRequest(
        {},
        "github_installation_id=invalid; other=value",
      );

      // Act
      const result = resolveInstallationId({ req });

      // Assert
      expect(result.source).toBe(InstallationIdSource.COOKIE);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should fallback to first available installation when enabled", () => {
      // Arrange
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveInstallationId({
        availableInstallations,
        useFirstAvailableAsFallback: true,
      });

      // Assert
      expect(result.id).toBe(12345);
      expect(result.source).toBe(InstallationIdSource.AVAILABLE_INSTALLATIONS);
      expect(result.isValid).toBe(true);
    });

    it("should not fallback to first available installation when disabled", () => {
      // Arrange
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveInstallationId({
        availableInstallations,
        useFirstAvailableAsFallback: false,
      });

      // Assert
      expect(result.id).toBeUndefined();
      expect(result.source).toBe(InstallationIdSource.NONE);
      expect(result.isValid).toBe(false);
    });

    it("should validate installation ID against available installations", () => {
      // Arrange
      const req = createMockRequest({ installation_id: "99999" });
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveInstallationId({
        req,
        availableInstallations,
        validateAgainstAvailable: true,
      });

      // Assert
      expect(result.id).toBe(99999);
      expect(result.source).toBe(InstallationIdSource.QUERY);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should not validate against available installations when disabled", () => {
      // Arrange
      const req = createMockRequest({ installation_id: "99999" });
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveInstallationId({
        req,
        availableInstallations,
        validateAgainstAvailable: false,
      });

      // Assert
      expect(result.id).toBe(99999);
      expect(result.source).toBe(InstallationIdSource.QUERY);
      expect(result.isValid).toBe(true);
    });

    it("should respect priority order: query > session > cookie > fallback", () => {
      // Arrange
      const req = createMockRequest(
        { installation_id: "12345" },
        "github_installation_id=67890; other=value",
      );
      const session = createMockSession(54321);
      const availableInstallations = createMockInstallations([
        12345, 54321, 67890, 99999,
      ]);

      // Act
      const result = resolveInstallationId({
        req,
        session,
        availableInstallations,
      });

      // Assert
      expect(result.id).toBe(12345); // Should use query param
      expect(result.source).toBe(InstallationIdSource.QUERY);

      // Test without query param
      const reqWithoutQuery = createMockRequest(
        {},
        "github_installation_id=67890; other=value",
      );

      const resultWithoutQuery = resolveInstallationId({
        req: reqWithoutQuery,
        session,
        availableInstallations,
      });

      expect(resultWithoutQuery.id).toBe(54321); // Should use session
      expect(resultWithoutQuery.source).toBe(InstallationIdSource.SESSION);

      // Test without query param and session
      const resultWithoutQueryAndSession = resolveInstallationId({
        req: reqWithoutQuery,
        availableInstallations,
      });

      expect(resultWithoutQueryAndSession.id).toBe(67890); // Should use cookie
      expect(resultWithoutQueryAndSession.source).toBe(
        InstallationIdSource.COOKIE,
      );
    });

    it("should use custom query parameter name when specified", () => {
      // Arrange
      const req = createMockRequest({ custom_param: "12345" });
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveInstallationId({
        req,
        availableInstallations,
        queryParamName: "custom_param",
      });

      // Assert
      expect(result.id).toBe(12345);
      expect(result.source).toBe(InstallationIdSource.QUERY);
      expect(result.isValid).toBe(true);
    });

    it("should use custom cookie name when specified", () => {
      // Arrange
      const req = createMockRequest({}, "custom_cookie=12345; other=value");
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveInstallationId({
        req,
        availableInstallations,
        cookieName: "custom_cookie",
      });

      // Assert
      expect(result.id).toBe(12345);
      expect(result.source).toBe(InstallationIdSource.COOKIE);
      expect(result.isValid).toBe(true);
    });
  });

  describe("resolveMultipleInstallationIds", () => {
    it("should resolve multiple installation IDs from comma-separated query parameter", () => {
      // Arrange
      const req = createMockRequest({ installation_ids: "12345,67890" });
      const availableInstallations = createMockInstallations([
        12345, 67890, 99999,
      ]);

      // Act
      const result = resolveMultipleInstallationIds({
        req,
        availableInstallations,
      });

      // Assert
      expect(result).toEqual([12345, 67890]);
    });

    it("should filter out invalid IDs from query parameter", () => {
      // Arrange
      const req = createMockRequest({
        installation_ids: "12345,invalid,67890",
      });
      const availableInstallations = createMockInstallations([
        12345, 67890, 99999,
      ]);

      // Act
      const result = resolveMultipleInstallationIds({
        req,
        availableInstallations,
      });

      // Assert
      expect(result).toEqual([12345, 67890]);
    });

    it("should validate IDs against available installations when enabled", () => {
      // Arrange
      const req = createMockRequest({ installation_ids: "12345,88888,67890" });
      const availableInstallations = createMockInstallations([
        12345, 67890, 99999,
      ]);

      // Act
      const result = resolveMultipleInstallationIds({
        req,
        availableInstallations,
        validateAgainstAvailable: true,
      });

      // Assert
      expect(result).toEqual([12345, 67890]); // 88888 should be filtered out
    });

    it("should not validate IDs against available installations when disabled", () => {
      // Arrange
      const req = createMockRequest({ installation_ids: "12345,88888,67890" });
      const availableInstallations = createMockInstallations([
        12345, 67890, 99999,
      ]);

      // Act
      const result = resolveMultipleInstallationIds({
        req,
        availableInstallations,
        validateAgainstAvailable: false,
      });

      // Assert
      expect(result).toEqual([12345, 88888, 67890]); // All valid numbers should be included
    });

    it("should fallback to session installation ID if no query parameter", () => {
      // Arrange
      const req = createMockRequest({});
      const session = createMockSession(12345);
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveMultipleInstallationIds({
        req,
        session,
        availableInstallations,
      });

      // Assert
      expect(result).toEqual([12345]);
    });

    it("should fallback to cookie installation ID if no query parameter or session", () => {
      // Arrange
      const req = createMockRequest(
        {},
        "github_installation_id=12345; other=value",
      );
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = resolveMultipleInstallationIds({
        req,
        availableInstallations,
      });

      // Assert
      expect(result).toEqual([12345]);
    });

    it("should fallback to first available installation if enabled and no other IDs found", () => {
      // Arrange
      const req = createMockRequest({});
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

    it("should return empty array if no IDs found and fallback disabled", () => {
      // Arrange
      const req = createMockRequest({});
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

  describe("requireInstallationId", () => {
    it("should return installation ID when found", () => {
      // Arrange
      const req = createMockRequest({ installation_id: "12345" });
      const availableInstallations = createMockInstallations([12345, 67890]);

      // Act
      const result = requireInstallationId({
        req,
        availableInstallations,
      });

      // Assert
      expect(result).toBe(12345);
    });

    it("should throw error when no installation ID found", () => {
      // Arrange
      const req = createMockRequest({});

      // Act & Assert
      expect(() => {
        requireInstallationId({
          req,
          useFirstAvailableAsFallback: false,
        });
      }).toThrow();
    });

    it("should include proper error metadata when throwing", () => {
      // Arrange
      const req = createMockRequest({});

      // Act
      try {
        requireInstallationId({
          req,
          useFirstAvailableAsFallback: false,
        });
        fail("Expected error to be thrown");
      } catch (error) {
        // Assert
        expect(error instanceof Error).toBe(true);
        expect((error as any).code).toBe("INSTALLATION_ID_REQUIRED");
        expect((error as any).needsInstallation).toBe(true);
        expect((error as any).source).toBe(InstallationIdSource.NONE);
      }
    });
  });
});
