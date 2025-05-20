const {
  detectStagedStoryFiles,
  runAccessibilityCheck,
  parseViolations,
} = require("../check-a11y-staged-stories");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Mock external dependencies
jest.mock("child_process");
jest.mock("fs");
jest.mock("../check-a11y-staged-stories-server", () => ({
  startStaticServer: jest
    .fn()
    .mockResolvedValue({
      server: { close: jest.fn((cb) => cb()) },
      port: 3001,
    }),
  getRelevantStoryIds: jest.fn().mockReturnValue(null),
  cleanupAndExit: jest.fn().mockImplementation((code) => process.exit(code)),
  setGlobalServer: jest.fn(),
}));

describe("check-a11y-staged-stories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.A11Y_SKIP;
  });

  describe("detectStagedStoryFiles", () => {
    test("should detect staged story files correctly", () => {
      execSync.mockReturnValue(
        "A\tsrc/components/Button.stories.tsx\n" +
          "M\tsrc/components/Card.tsx\n" +
          "A\tsrc/components/Modal.stories.js\n" +
          "M\tdocs/README.md\n",
      );

      const result = detectStagedStoryFiles();

      expect(result).toEqual([
        "src/components/Button.stories.tsx",
        "src/components/Modal.stories.js",
      ]);
    });

    test("should return empty array when no story files are staged", () => {
      execSync.mockReturnValue(
        "M\tsrc/components/Card.tsx\n" + "A\tdocs/README.md\n",
      );

      const result = detectStagedStoryFiles();

      expect(result).toEqual([]);
    });

    test("should handle empty git diff output", () => {
      execSync.mockReturnValue("");

      const result = detectStagedStoryFiles();

      expect(result).toEqual([]);
    });

    test("should exclude deleted files from results", () => {
      execSync.mockReturnValue(
        "A\tsrc/components/Button.stories.tsx\n" +
          "D\tsrc/components/DeletedComponent.stories.tsx\n" +
          "M\tsrc/components/Modal.stories.js\n" +
          "D\tsrc/components/OldComponent.stories.js\n",
      );

      const result = detectStagedStoryFiles();

      expect(result).toEqual([
        "src/components/Button.stories.tsx",
        "src/components/Modal.stories.js",
      ]);
    });

    test("should handle filenames with tabs", () => {
      execSync.mockReturnValue(
        "A\tsrc/components/Button\twith\ttabs.stories.tsx\n" +
          "M\tsrc/components/Normal.stories.js\n",
      );

      const result = detectStagedStoryFiles();

      expect(result).toEqual([
        "src/components/Button\twith\ttabs.stories.tsx",
        "src/components/Normal.stories.js",
      ]);
    });
  });

  describe("runAccessibilityCheck", () => {
    const mockStorybookPath = "/path/to/storybook-static";

    test("should skip check when A11Y_SKIP is set", () => {
      process.env.A11Y_SKIP = "1";
      const mockExit = jest.spyOn(process, "exit").mockImplementation();
      const mockLog = jest.spyOn(console, "log").mockImplementation();

      runAccessibilityCheck(["test.stories.tsx"], mockStorybookPath);

      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining("⚠️  Accessibility checks skipped"),
      );
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    test("should run test-storybook for staged files", async () => {
      const storyFiles = ["src/components/Button.stories.tsx"];
      execSync.mockImplementation((cmd) => {
        if (cmd.includes("test-storybook")) {
          return "";
        }
      });

      await runAccessibilityCheck(storyFiles, mockStorybookPath);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("test-storybook"),
        expect.objectContaining({ stdio: "pipe" }),
      );
    });

    test("should handle test failures and display violations", async () => {
      const storyFiles = ["src/components/Button.stories.tsx"];
      const mockExit = jest.spyOn(process, "exit").mockImplementation();
      const mockError = jest.spyOn(console, "error").mockImplementation();

      execSync.mockImplementation((cmd) => {
        if (cmd.includes("test-storybook")) {
          const error = new Error("Test failed");
          error.stdout = "Accessibility violations detected";
          error.status = 1;
          throw error;
        }
      });

      await runAccessibilityCheck(storyFiles, mockStorybookPath);

      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining("Accessibility violations found"),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe("parseViolations", () => {
    test("should parse test-storybook output for violations", () => {
      const output = `
        FAIL browser: chromium src/components/Button.stories.tsx
          Button
            Primary
              ✕ smoke-test (100 ms)

          ● Button › Primary › smoke-test

            2 accessibility violations were detected
            
            ┌─────────┬─────────────┬────────────┬───────────────────────────────┬───────┐
            │ (index) │ id          │ impact     │ description                   │ nodes │
            ├─────────┼─────────────┼────────────┼───────────────────────────────┼───────┤
            │ 0       │ 'image-alt' │ 'critical' │ 'Images must have alt text'   │ 1     │
            └─────────┴─────────────┴────────────┴───────────────────────────────┴───────┘
      `;

      const result = parseViolations(output);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        file: "src/components/Button.stories.tsx",
        violations: expect.arrayContaining([
          expect.objectContaining({
            id: "image-alt",
            impact: "critical",
            description: "Images must have alt text",
          }),
        ]),
      });
    });
  });

  describe("main function", () => {
    test("should exit early when no story files are staged", async () => {
      execSync.mockReturnValue("src/components/utils.ts\n");
      const mockExit = jest.spyOn(process, "exit").mockImplementation();
      const mockLog = jest.spyOn(console, "log").mockImplementation();

      // Import the module and run main function
      const { main } = require("../check-a11y-staged-stories");
      await main();

      // Check for the new log message (it may be called multiple times)
      expect(mockLog).toHaveBeenCalledWith(
        "✅ No staged Storybook files to check for accessibility.",
      );
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });
});
