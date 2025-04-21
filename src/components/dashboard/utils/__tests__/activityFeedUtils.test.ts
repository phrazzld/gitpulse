import {
  formatCommitDate,
  calculateListHeight,
  extractCommitTitle,
} from "../activityFeedUtils";

describe("activityFeedUtils", () => {
  describe("formatCommitDate", () => {
    it("formats date string correctly", () => {
      const dateString = "2023-01-01T12:30:45Z";
      const formattedDate = formatCommitDate(dateString);

      // Exact format may vary by environment, but check general structure
      expect(formattedDate).toContain("Jan 1, 2023");
    });

    it("handles different date formats", () => {
      const dates = [
        "2023-01-01",
        "2023-01-01T00:00:00Z",
        "2023-01-01T00:00:00.000Z",
      ];

      // All should produce consistent output
      const results = dates.map(formatCommitDate);
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });
  });

  describe("calculateListHeight", () => {
    it("calculates height based on item count and truncation", () => {
      // Test with truncated mode
      const truncatedHeight = calculateListHeight(10, 50, true);

      // Test with full mode
      const fullHeight = calculateListHeight(10, 50, false);

      // Should respect max height limits
      expect(truncatedHeight).toBeLessThanOrEqual(300);
      expect(fullHeight).toBeLessThanOrEqual(600);

      // Truncated should be smaller than full
      expect(truncatedHeight).toBeLessThan(fullHeight);
    });

    it("respects minimum height", () => {
      // Test with very few items
      const height = calculateListHeight(1, 50, false);

      // Should not go below minimum height
      expect(height).toBeGreaterThanOrEqual(200);
    });

    it("handles maxItems limit", () => {
      // Without maxItems
      const heightWithoutMax = calculateListHeight(10, 50, true);

      // With maxItems less than actual items
      const heightWithMax = calculateListHeight(10, 50, true, 5);

      // Should respect maxItems limit
      expect(heightWithMax).toBeLessThan(heightWithoutMax);
    });
  });

  describe("extractCommitTitle", () => {
    it("extracts first line from commit message", () => {
      const message =
        "Fix bug in login form\n\nThis commit fixes a critical bug in the login form where users could not log in.";
      const title = extractCommitTitle(message);

      expect(title).toBe("Fix bug in login form");
    });

    it("returns entire message if no newlines", () => {
      const message = "Simple commit message";
      const title = extractCommitTitle(message);

      expect(title).toBe("Simple commit message");
    });

    it("handles empty message", () => {
      const title = extractCommitTitle("");

      expect(title).toBe("");
    });
  });
});
