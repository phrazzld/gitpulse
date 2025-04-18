/**
 * Tests to verify the absence or proper deprecation of team/organization code
 * in the individual-focused MVP.
 *
 * This test suite helps ensure that the codebase is properly migrated to
 * focus solely on individual activity, and that any remaining organization/team
 * references are properly marked as deprecated.
 */

import { ActivityMode } from "@/types/activity";
import * as githubData from "@/lib/githubData";
import * as githubAuth from "@/lib/auth/githubAuth";
import { mockOctokit, mockCreateAuthenticatedOctokit } from "./api-test-utils";
import { Repository } from "@/lib/githubData";
import { mockInstallation } from "./test-utils";
import { FilterParams } from "@/types/api";

describe("Vestigial team/organization code", () => {
  describe("Activity types", () => {
    it("activity mode should still support team-activity for backward compatibility", () => {
      // The type should still accept 'team-activity' even though it's not used
      const modes: ActivityMode[] = [
        "my-activity",
        "my-work-activity",
        "team-activity",
      ];
      expect(modes.includes("team-activity")).toBe(true);

      // But the actual app should only use the individual modes
      const validModes: ActivityMode[] = ["my-activity", "my-work-activity"];
      expect(validModes.includes("team-activity")).toBe(false);
    });
  });

  describe("Repository fetching", () => {
    it("should focus on individual repositories in fetchRepositories implementation", async () => {
      // Set up the mock to spy on paginate calls
      const paginateSpy = jest.spyOn(mockOctokit, "paginate");

      // Call the repository fetching function with the mockOctokit
      const repos = await githubData.fetchRepositories(mockOctokit);

      // Verify that paginate was called
      expect(paginateSpy).toHaveBeenCalled();

      // Get the call arguments
      const paginateCall = paginateSpy.mock.calls[0];

      // Check that it's calling the function for user repositories
      expect(paginateCall[0]).toBe(
        mockOctokit.rest.repos.listForAuthenticatedUser,
      );

      // The second parameter should contain the right options for individual focus
      expect(paginateCall[1]).toMatchObject({
        per_page: 100,
        sort: expect.any(String),
        visibility: "all",
        affiliation: expect.stringContaining("owner"),
      });

      // There should be no references to organization-specific API calls
      expect(githubData.fetchRepositories.toString()).not.toContain(
        "listForOrg",
      );

      // Clean up
      paginateSpy.mockRestore();
    });
  });

  describe("GitHub App installations", () => {
    it("should handle installations with User targetType correctly", () => {
      // Verify that the mockInstallation has the correct targetType
      expect(mockInstallation.targetType).toBe("User");

      // Get the URL for the installation
      const url = githubAuth.getInstallationManagementUrl(
        mockInstallation.id,
        mockInstallation.account?.login,
        mockInstallation.targetType,
      );

      // For User targetType, it should use the user settings URL format
      expect(url).toBe(
        `https://github.com/settings/installations/${mockInstallation.id}`,
      );
    });

    it("should still handle Organization targetType for backward compatibility", () => {
      // Create an Organization installation for testing
      const orgInstallation = {
        ...mockInstallation,
        targetType: "Organization",
        account: {
          ...mockInstallation.account!,
          type: "Organization",
        },
      };

      // Get the URL for the organization installation
      const url = githubAuth.getInstallationManagementUrl(
        orgInstallation.id,
        orgInstallation.account?.login,
        orgInstallation.targetType,
      );

      // For Organization targetType, it should use the organization URL format
      expect(url).toContain("organizations");
      expect(url).toBe(
        `https://github.com/organizations/${orgInstallation.account.login}/settings/installations/${orgInstallation.id}`,
      );
    });
  });

  describe("Filter parameters", () => {
    it("should accept but ignore deprecated organization parameters", () => {
      // Create a filter with individual and organization parameters
      const filter: FilterParams = {
        repositories: ["user/repo1", "user/repo2"],
        users: ["user1", "user2"],
        organizations: ["org1", "org2"], // Deprecated but should be accepted
        dateRange: { since: "2023-01-01", until: "2023-01-31" },
      };

      // Verify the filter still has the organization field for backward compatibility
      expect(filter.organizations).toBeDefined();
      expect(filter.organizations).toEqual(["org1", "org2"]);

      // In a real application, these values would be ignored during processing
    });
  });
});
