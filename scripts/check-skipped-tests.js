#!/usr/bin/env node

/**
 * Checks for skipped tests in the codebase and outputs warnings.
 *
 * This script detects:
 * - Explicit skipped tests (xit, xdescribe, it.skip, describe.skip, test.skip)
 * - Commented-out tests (// it, // test, // describe)
 *
 * For proper justification, add: // SKIP-REASON: explanation
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const glob = require("glob");

// Configuration
const JUSTIFICATION_PATTERN = /SKIP-REASON:(.+)$/;
const EXIT_WITH_ERROR = process.env.CI === "true"; // Only return non-zero exit code in CI
const PATTERNS = [
  {
    regex: /\b(xit|xdescribe|it\.skip|describe\.skip|test\.skip)/g,
    type: "Skipped test",
  },
  {
    regex: /\/\/\s*(it|describe|test)(\(|\s)/g,
    type: "Commented-out test",
  },
  {
    regex: /\/\*\s*(it|describe|test)(\(|\s)/g,
    type: "Block-commented test",
  },
];

// Find all test files in the project
function findTestFiles() {
  try {
    // Use file system glob to find all test files
    // This will automatically exclude node_modules if we run from the project root
    const patterns = [
      "src/**/__tests__/**/*.{js,jsx,ts,tsx}",
      "src/**/*.test.{js,jsx,ts,tsx}",
    ];

    const allFiles = new Set();
    patterns.forEach((pattern) => {
      // Using sync glob for simplicity
      const files = glob.sync(pattern, { ignore: "node_modules/**" });
      files.forEach((file) => allFiles.add(file));
    });

    return Array.from(allFiles);
  } catch (error) {
    console.error("Error finding test files:", error.message);
    return [];
  }
}

// Check a file for skipped tests
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const issues = [];

    // Check each line for patterns
    lines.forEach((line, index) => {
      for (const pattern of PATTERNS) {
        const matches = line.match(pattern.regex);
        if (matches) {
          // Check if there's a justification comment
          const justification = line.match(JUSTIFICATION_PATTERN);
          const justified = !!justification;

          issues.push({
            line: index + 1,
            content: line.trim(),
            type: pattern.type,
            justified,
            justification: justified ? justification[1].trim() : null,
          });
        }
      }
    });

    return issues;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

// Main function
function main() {
  const testFiles = findTestFiles();
  console.log(`Found ${testFiles.length} test files:`);
  testFiles.forEach((file) => console.log(`- ${file}`));

  const fileIssues = {};
  let totalIssues = 0;
  let unjustifiedIssues = 0;

  // Check each test file
  testFiles.forEach((filePath) => {
    const issues = checkFile(filePath);
    if (issues.length > 0) {
      fileIssues[filePath] = issues;
      totalIssues += issues.length;
      unjustifiedIssues += issues.filter((issue) => !issue.justified).length;
    }
  });

  // Display results
  if (totalIssues > 0) {
    console.log("\n🧪 Skipped Test Analysis");
    console.log("=======================");
    console.log(
      `Found ${totalIssues} skipped or commented-out tests in ${Object.keys(fileIssues).length} files.`,
    );
    console.log(`${unjustifiedIssues} issues have no justification.`);
    console.log(
      `${totalIssues - unjustifiedIssues} issues are justified with SKIP-REASON comments.\n`,
    );

    // Display issues by file
    Object.entries(fileIssues).forEach(([file, issues]) => {
      console.log(`📁 ${file}`);
      issues.forEach((issue) => {
        const icon = issue.justified ? "✅" : "❌";
        console.log(`  ${icon} Line ${issue.line}: ${issue.type}`);
        console.log(
          `     ${issue.content.substring(0, 100)}${issue.content.length > 100 ? "..." : ""}`,
        );
        if (issue.justified) {
          console.log(`     Reason: ${issue.justification}`);
        } else {
          console.log(
            '     No justification provided. Add "// SKIP-REASON: explanation" to the same line.',
          );
        }
      });
      console.log("");
    });

    if (unjustifiedIssues > 0) {
      console.log("\n⚠️  INSTRUCTIONS:");
      console.log("  1. For each skipped test without justification, either:");
      console.log("     - Re-enable the test by removing the skip");
      console.log(
        '     - Add justification with "// SKIP-REASON: explanation" on the same line',
      );
      console.log(
        "     - Remove the commented-out test if it's no longer needed",
      );
      console.log("  2. Commit your changes");

      if (EXIT_WITH_ERROR) {
        console.log("\n❌ CI CHECK FAILED: Unjustified skipped tests found");
        process.exit(1);
      } else {
        console.log("\n⚠️  This is a warning. The commit will proceed.");
      }
    } else {
      console.log("✅ All skipped tests have proper justification.");
    }
  } else {
    console.log("✅ No skipped tests detected.");
  }

  if (!EXIT_WITH_ERROR) {
    process.exit(0);
  }
}

// Run the script
main();
