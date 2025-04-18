/**
 * Test file to verify test fixtures are aligned with individual-focused model
 *
 * This test suite verifies that our test fixtures properly reflect the individual-focused
 * model and don't contain improper organization/team references.
 */

import {
  mockSession,
  mockInstallation,
  mockRepositories,
  mockSummary,
  mockActivityCommits,
  mockActiveFilters,
  mockDateRange,
} from "./test-utils";

describe("Test fixtures alignment with individual-focused model", () => {
  describe("mockInstallation", () => {
    it("should be configured for individual user", () => {
      expect(mockInstallation.account.type).toBe("User");
      expect(mockInstallation.targetType).toBe("User");
    });
  });

  describe("mockActiveFilters", () => {
    it("should not contain organizations field", () => {
      // We're checking that our mock doesn't expose any organization fields
      expect(mockActiveFilters).not.toHaveProperty("organizations");
      expect(mockActiveFilters).not.toHaveProperty("contributors");
      // It should only have the repository filter
      expect(mockActiveFilters).toHaveProperty("repositories");
      expect(Object.keys(mockActiveFilters).length).toBe(1);
    });
  });

  describe("mockRepositories", () => {
    it("should contain repositories owned by an individual user", () => {
      // All repositories should have the same owner (individual user)
      const owners = new Set(mockRepositories.map((repo) => repo.owner.login));
      expect(owners.size).toBe(1); // Should be the same owner for all repos

      // Owner type check (if available)
      mockRepositories.forEach((repo) => {
        if (repo.owner.type) {
          expect(repo.owner.type).toBe("User");
        }
      });
    });
  });

  describe("mockSummary", () => {
    it("should not contain organizational filtering information", () => {
      // Note: Our current mockSummary doesn't have filterInfo at all,
      // which is fine in the individual-focused model
      expect(mockSummary).not.toHaveProperty("filterInfo");
    });

    it("should focus on individual user activity", () => {
      // Should have a user property (individual focus)
      expect(mockSummary).toHaveProperty("user");
    });
  });

  describe("mockActivityCommits", () => {
    it("should be associated with individual repositories", () => {
      mockActivityCommits.forEach((commit) => {
        if (commit.repository) {
          // Should be in format "username/repo"
          expect(commit.repository.full_name).toMatch(/^[^/]+\/[^/]+$/);

          // Repository should be owned by a user, not an org
          const owner = commit.repository.full_name.split("/")[0];
          expect(owner).not.toMatch(/^org-/); // Simple heuristic
        }
      });
    });

    it("should not have organization-specific fields", () => {
      mockActivityCommits.forEach((commit) => {
        // Check for organization fields at the root level
        expect(commit).not.toHaveProperty("organization");

        // If there's contributor info for backward compatibility, it should be marked deprecated in the code
        if (commit.contributor) {
          // We can't test JSDoc comments, but we can check values are for a user
          expect(commit.contributor.username).not.toMatch(/^org-/);
        }
      });
    });
  });
});
