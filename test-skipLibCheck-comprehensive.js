/**
 * Comprehensive TypeScript Type Checking Test with/without skipLibCheck
 *
 * This script tests TypeScript type checking in various scenarios to evaluate
 * the impact and necessity of the skipLibCheck flag.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Create temporary tsconfig files for testing
function createTemporaryConfigs() {
  // Create a temporary tsconfig for source files only
  const srcConfig = {
    extends: "./tsconfig.json",
    include: ["src/**/*.ts", "src/**/*.tsx"],
    exclude: ["node_modules"],
  };
  fs.writeFileSync("tsconfig.src.json", JSON.stringify(srcConfig, null, 2));

  // Create a temporary tsconfig for node_modules only
  const nodeModulesConfig = {
    extends: "./tsconfig.json",
    include: ["node_modules/**/*.d.ts"],
    exclude: ["src"],
  };
  fs.writeFileSync(
    "tsconfig.node_modules.json",
    JSON.stringify(nodeModulesConfig, null, 2),
  );
}

// Remove temporary files after testing
function cleanupTemporaryFiles() {
  try {
    fs.unlinkSync("tsconfig.src.json");
    fs.unlinkSync("tsconfig.node_modules.json");
    console.log("Temporary tsconfig files removed");
  } catch (error) {
    console.error("Error removing temporary files:", error.message);
  }
}

// Configuration
const TEST_CASES = [
  {
    name: "Full Project (with skipLibCheck)",
    command: "npx tsc --noEmit --skipLibCheck --project tsconfig.json",
    description:
      "Type checking the entire project with skipLibCheck enabled (current configuration)",
  },
  {
    name: "Full Project (without skipLibCheck)",
    command: "npx tsc --noEmit --project tsconfig.json",
    description: "Type checking the entire project with skipLibCheck disabled",
  },
  {
    name: "Source Code Only (with skipLibCheck)",
    command: "npx tsc --noEmit --skipLibCheck --project tsconfig.src.json",
    description:
      "Type checking only the source code (excluding node_modules) with skipLibCheck enabled",
  },
  {
    name: "Source Code Only (without skipLibCheck)",
    command: "npx tsc --noEmit --project tsconfig.src.json",
    description:
      "Type checking only the source code (excluding node_modules) with skipLibCheck disabled",
  },
  {
    name: "Node Modules Only (with skipLibCheck)",
    command:
      "npx tsc --noEmit --skipLibCheck --project tsconfig.node_modules.json",
    description:
      "Type checking only the node_modules declarations with skipLibCheck enabled",
  },
  {
    name: "Node Modules Only (without skipLibCheck)",
    command: "npx tsc --noEmit --project tsconfig.node_modules.json",
    description:
      "Type checking only the node_modules declarations with skipLibCheck disabled",
  },
];

// Results container
const results = {
  timestamp: new Date().toISOString(),
  system: {
    platform: process.platform,
    nodeVersion: process.version,
    cpuCores: require("os").cpus().length,
  },
  testCases: [],
};

// Function to run a command and capture detailed output
function runCommand(testCase) {
  console.log(`\n🔍 RUNNING TEST: ${testCase.name}`);
  console.log(`Description: ${testCase.description}`);
  console.log(`Command: ${testCase.command}\n`);

  const result = {
    name: testCase.name,
    command: testCase.command,
    success: false,
    duration: 0,
    output: "",
    errorCount: 0,
    errorSample: [],
  };

  const start = Date.now();

  try {
    // Execute the command and capture its output
    const output = execSync(testCase.command, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    const end = Date.now();
    result.duration = (end - start) / 1000;
    result.success = true;
    result.output = output;

    console.log(
      `✅ Test completed successfully in ${result.duration.toFixed(2)} seconds`,
    );
    return result;
  } catch (error) {
    const end = Date.now();
    result.duration = (end - start) / 1000;
    result.success = false;

    // Parse error output
    if (error.stdout) result.output += error.stdout;
    if (error.stderr) result.output += error.stderr;

    // Count errors and extract samples
    const errorLines = result.output
      .split("\n")
      .filter((line) => line.includes("error TS"));
    result.errorCount = errorLines.length;

    // Get first 5 errors for sample
    result.errorSample = errorLines.slice(0, 5);

    // Categorize errors by module/file
    const errorsByModule = {};
    errorLines.forEach((line) => {
      // Extract module name from error line
      const match = line.match(/node_modules\/([@\w-]+)\/|src\/([\/\w-]+)\//);
      if (match) {
        const module = match[1] || match[2] || "unknown";
        errorsByModule[module] = (errorsByModule[module] || 0) + 1;
      }
    });

    result.errorsByModule = Object.entries(errorsByModule)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10 modules with errors

    console.log(`❌ Test failed after ${result.duration.toFixed(2)} seconds`);
    console.log(`   Found ${result.errorCount} type errors`);

    if (result.errorsByModule.length > 0) {
      console.log("   Top modules with errors:");
      result.errorsByModule.forEach(([module, count]) => {
        console.log(`   - ${module}: ${count} errors`);
      });
    }

    return result;
  }
}

// Run all test cases
async function runTests() {
  console.log("🚀 Starting comprehensive TypeScript type checking tests\n");

  // Create temporary config files
  createTemporaryConfigs();

  try {
    for (const testCase of TEST_CASES) {
      const result = runCommand(testCase);
      results.testCases.push(result);
    }

    // Calculate comparative metrics
    const withSkip = results.testCases.find(
      (tc) => tc.name === "Full Project (with skipLibCheck)",
    );
    const withoutSkip = results.testCases.find(
      (tc) => tc.name === "Full Project (without skipLibCheck)",
    );

    if (withSkip && withoutSkip) {
      results.comparison = {
        performanceDifference: withoutSkip.duration / withSkip.duration,
        errorDifference: withoutSkip.errorCount - withSkip.errorCount,
      };
    }

    // Generate node_modules specific comparison
    const nodeModulesWithSkip = results.testCases.find(
      (tc) => tc.name === "Node Modules Only (with skipLibCheck)",
    );
    const nodeModulesWithoutSkip = results.testCases.find(
      (tc) => tc.name === "Node Modules Only (without skipLibCheck)",
    );

    if (nodeModulesWithSkip && nodeModulesWithoutSkip) {
      results.nodeModulesComparison = {
        performanceDifference:
          nodeModulesWithoutSkip.duration / nodeModulesWithSkip.duration,
        errorDifference:
          nodeModulesWithoutSkip.errorCount - nodeModulesWithSkip.errorCount,
      };
    }

    // Generate report
    const reportPath = "skipLibCheck-comprehensive-results.json";
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📊 Results saved to ${reportPath}`);

    // Generate summary report in markdown format
    generateMarkdownReport(results);
  } finally {
    // Clean up temporary files
    cleanupTemporaryFiles();
  }
}

// Generate a markdown summary report
function generateMarkdownReport(results) {
  const reportPath = "skipLibCheck-test-report.md";

  let markdown = `# TypeScript skipLibCheck Testing Report\n\n`;
  markdown += `Generated: ${new Date().toISOString()}\n\n`;

  markdown += `## System Information\n\n`;
  markdown += `- Platform: ${results.system.platform}\n`;
  markdown += `- Node.js: ${results.system.nodeVersion}\n`;
  markdown += `- CPU Cores: ${results.system.cpuCores}\n\n`;

  markdown += `## Test Results Summary\n\n`;
  markdown += `| Test Case | Duration | Success | Error Count |\n`;
  markdown += `|-----------|----------|---------|-------------|\n`;

  results.testCases.forEach((tc) => {
    markdown += `| ${tc.name} | ${tc.duration.toFixed(2)}s | ${tc.success ? "✅" : "❌"} | ${tc.errorCount || 0} |\n`;
  });

  // Add comparison details
  if (results.comparison) {
    markdown += `\n## Comparison: With vs. Without skipLibCheck\n\n`;

    const performanceImpact = results.comparison.performanceDifference;
    if (performanceImpact > 1.05) {
      markdown += `- Performance: Without skipLibCheck is **${performanceImpact.toFixed(2)}x slower**\n`;
    } else if (performanceImpact < 0.95) {
      markdown += `- Performance: Without skipLibCheck is **${(1 / performanceImpact).toFixed(2)}x faster**\n`;
    } else {
      markdown += `- Performance: No significant difference\n`;
    }

    markdown += `- Errors: Without skipLibCheck produces **${results.comparison.errorDifference}** more errors\n\n`;
  }

  // Add node_modules specific comparison
  if (results.nodeModulesComparison) {
    markdown += `\n## Node Modules Comparison: With vs. Without skipLibCheck\n\n`;

    const performanceImpact =
      results.nodeModulesComparison.performanceDifference;
    if (performanceImpact > 1.05) {
      markdown += `- Performance: Without skipLibCheck is **${performanceImpact.toFixed(2)}x slower**\n`;
    } else if (performanceImpact < 0.95) {
      markdown += `- Performance: Without skipLibCheck is **${(1 / performanceImpact).toFixed(2)}x faster**\n`;
    } else {
      markdown += `- Performance: No significant difference\n`;
    }

    markdown += `- Errors: Without skipLibCheck produces **${results.nodeModulesComparison.errorDifference}** more errors\n\n`;
  }

  // Add error samples for node_modules
  const nodeModulesWithoutSkip = results.testCases.find(
    (tc) => tc.name === "Node Modules Only (without skipLibCheck)",
  );
  if (nodeModulesWithoutSkip && nodeModulesWithoutSkip.errorCount > 0) {
    markdown += `\n## Error Samples for Node Modules Without skipLibCheck\n\n`;

    if (
      nodeModulesWithoutSkip.errorsByModule &&
      nodeModulesWithoutSkip.errorsByModule.length > 0
    ) {
      markdown += `### Top Modules With Errors\n\n`;
      markdown += `| Module | Error Count |\n`;
      markdown += `|--------|-------------|\n`;
      nodeModulesWithoutSkip.errorsByModule.forEach(([module, count]) => {
        markdown += `| ${module} | ${count} |\n`;
      });
    }

    if (nodeModulesWithoutSkip.errorSample.length > 0) {
      markdown += `\n### Sample Error Messages\n\n`;
      markdown += "```\n";
      nodeModulesWithoutSkip.errorSample.forEach((error) => {
        markdown += error + "\n";
      });
      markdown += "```\n";
    }
  }

  // Recommendations based on test results
  markdown += `\n## Recommendations\n\n`;

  // Check if node_modules has errors without skipLibCheck
  const hasNodeModulesErrors =
    nodeModulesWithoutSkip && nodeModulesWithoutSkip.errorCount > 0;

  if (hasNodeModulesErrors) {
    markdown += `- **Keep skipLibCheck enabled** - Type checking fails for node_modules without it\n`;
    markdown += `- Found ${nodeModulesWithoutSkip.errorCount} type errors in node_modules when skipLibCheck is disabled\n`;
  } else if (
    results.nodeModulesComparison &&
    results.nodeModulesComparison.performanceDifference > 1.5
  ) {
    markdown += `- **Keep skipLibCheck enabled** - Significant performance benefit (${results.nodeModulesComparison.performanceDifference.toFixed(2)}x faster) when checking node_modules\n`;
  } else {
    markdown += `- **Consider disabling skipLibCheck** - Tests pass without it, with minimal performance impact\n`;
    markdown += `- Disabling skipLibCheck would provide more thorough type checking of dependencies\n`;
  }

  fs.writeFileSync(reportPath, markdown);
  console.log(`📝 Markdown report saved to ${reportPath}`);
}

// Run the tests
runTests();
