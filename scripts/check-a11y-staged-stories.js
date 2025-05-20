#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const {
  startStaticServer,
  getRelevantStoryIds,
  cleanupAndExit,
  setGlobalServer,
} = require("./check-a11y-staged-stories-server");

// Check if storybook build is recent (within 5 minutes)
const STORYBOOK_BUILD_CACHE_MINUTES = 5;

function detectStagedStoryFiles() {
  try {
    // Get only added or modified files, not deleted ones
    const output = execSync("git diff --cached --name-status", {
      encoding: "utf-8",
    });
    const lines = output.trim().split("\n").filter(Boolean);

    // Filter for story files that are not deleted
    const storyFiles = [];
    for (const line of lines) {
      const [status, ...fileParts] = line.split("\t");
      const file = fileParts.join("\t"); // Handle filenames with tabs

      // Skip deleted files (status 'D')
      if (status !== "D" && /\.stories\.(js|jsx|ts|tsx)$/.test(file)) {
        storyFiles.push(file);
      }
    }

    return storyFiles;
  } catch (error) {
    console.error("Error detecting staged files:", error.message);
    return [];
  }
}

function isStorybookBuildRecent(storybookPath) {
  try {
    const indexPath = path.join(storybookPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      return false;
    }

    const stats = fs.statSync(indexPath);
    const ageInMinutes = (Date.now() - stats.mtime.getTime()) / (1000 * 60);

    return ageInMinutes < STORYBOOK_BUILD_CACHE_MINUTES;
  } catch (error) {
    return false;
  }
}

function buildStorybook() {
  console.log("Building Storybook for accessibility checks...");
  try {
    execSync("npm run build-storybook", { stdio: "inherit" });
    return true;
  } catch (error) {
    console.error("Failed to build Storybook:", error.message);
    return false;
  }
}

async function runAccessibilityCheck(storyFiles, storybookPath) {
  // Check for skip flag
  if (process.env.A11Y_SKIP === "1") {
    console.log("⚠️  Accessibility checks skipped via A11Y_SKIP=1");
    console.log(
      "   Please create a follow-up task to fix accessibility issues.",
    );
    process.exit(0);
  }

  const projectRoot = path.resolve(__dirname, "..");
  let storybookServer = null;

  try {
    // Start the static server
    const absoluteStorybookPath = path.resolve(storybookPath);
    console.log("Starting HTTP server for Storybook static build...");

    // Filter stories if possible
    const relevantStoryIds = getRelevantStoryIds(
      storyFiles,
      absoluteStorybookPath,
    );
    let filterArg = "";

    if (relevantStoryIds) {
      filterArg = `--filter "^(${relevantStoryIds.join("|")})$"`;
      console.log(`Testing ${relevantStoryIds.length} relevant stories`);
    }

    // Start server with dynamic port
    const { server, port } = await startStaticServer(absoluteStorybookPath);
    storybookServer = server;
    setGlobalServer(server); // Set global reference for cleanup handlers

    // Run tests
    const command = `npx test-storybook --url http://localhost:${port} ${filterArg}`;
    console.log("Running accessibility checks...");
    console.log(`Command: ${command}`);

    try {
      execSync(command, {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: "pipe",
      });
      console.log("✅ All accessibility checks passed!");
    } catch (error) {
      // Parse violations and handle
      const output = (error.stdout || "") + "\n" + (error.stderr || "");
      const allViolations = parseViolations(output);

      // Filter to staged files
      const stagedViolations = allViolations.filter((v) =>
        storyFiles.some((staged) =>
          v.file.includes(staged.replace("src/", "")),
        ),
      );

      if (stagedViolations.length === 0 && allViolations.length > 0) {
        console.log("✅ All staged story files passed accessibility checks!");
        console.log("   (Other stories have violations but are not staged)");
        return;
      }

      console.error("❌ Accessibility violations found in staged stories:\n");
      displayViolations(stagedViolations);

      console.error("\nTo debug:");
      console.error(
        "  1. Run `npm run storybook` and check the Accessibility panel",
      );
      console.error("\nTo skip (emergency only):");
      console.error('  A11Y_SKIP=1 git commit -m "your message"');
      console.error(
        "  ⚠️  Always create a follow-up task to fix skipped issues!\n",
      );

      await cleanupAndExit(1);
    }
  } catch (error) {
    console.error("Accessibility check error:", error);
    await cleanupAndExit(1);
  } finally {
    // Always cleanup
    if (storybookServer) {
      await new Promise((resolve) => storybookServer.close(resolve));
      storybookServer = null;
      setGlobalServer(null); // Clear global reference
    }
  }
}

function parseViolations(output) {
  const violations = [];
  const lines = output.split("\n");

  let currentFile = null;
  let currentViolations = [];
  let inViolationTable = false;
  let inViolationDetail = false;
  let currentViolation = null;

  for (const line of lines) {
    // Detect test file
    if (line.includes("FAIL browser:") && line.includes(".stories.")) {
      const match = line.match(/(\S+\.stories\.\w+)$/);
      if (match) {
        if (currentFile && currentViolations.length > 0) {
          violations.push({ file: currentFile, violations: currentViolations });
        }
        currentFile = match[1];
        currentViolations = [];
      }
    }

    // Detect violation summary table
    if (line.includes("│ (index) │ id") && line.includes("│ impact")) {
      inViolationTable = true;
      inViolationDetail = false;
      continue;
    }

    if (inViolationTable && line.includes("└─")) {
      inViolationTable = false;
    }

    // Parse violation row in summary table
    if (inViolationTable && line.includes("│") && !line.includes("├─")) {
      const parts = line.split("│").map((p) => p.trim());
      if (parts.length >= 5 && parts[2]) {
        const violation = {
          id: parts[2].replace(/['"]/g, ""),
          impact: parts[3].replace(/['"]/g, ""),
          description: parts[4].replace(/['"]/g, ""),
          nodes: parseInt(parts[5]) || 1,
          help: "", // Will be populated from detail section
          helpUrl: ""
        };
        currentViolations.push(violation);
      }
    }
    
    // Look for detailed violation information
    if (line.includes("----- Violation #") && line.includes("-----")) {
      inViolationDetail = true;
      inViolationTable = false;
      continue;
    }
    
    // End of detailed violation
    if (inViolationDetail && line.includes("==============================")) {
      inViolationDetail = false;
      currentViolation = null;
      continue;
    }
    
    // Extract information from detailed violation sections
    if (inViolationDetail) {
      // Extract help text
      if (line.includes("Help:")) {
        const match = line.match(/Help:\s+(.+)/);
        if (match && match[1] && currentViolations.length > 0) {
          // Update the last violation with help text
          const index = currentViolations.length - 1;
          currentViolations[index].help = match[1].trim();
        }
      }
      
      // Extract help URL
      if (line.includes("Help URL:")) {
        const match = line.match(/Help URL:\s+(.+)/);
        if (match && match[1] && currentViolations.length > 0) {
          // Update the last violation with help URL
          const index = currentViolations.length - 1;
          currentViolations[index].helpUrl = match[1].trim();
        }
      }
      
      // Extract WCAG criteria if available
      if (line.includes("WCAG Criteria:")) {
        const match = line.match(/WCAG Criteria:\s+(.+)/);
        if (match && match[1] && currentViolations.length > 0) {
          // Update the last violation with WCAG criteria
          const index = currentViolations.length - 1;
          currentViolations[index].wcagCriteria = match[1].trim();
        }
      }
    }
  }

  // Add last file if exists
  if (currentFile && currentViolations.length > 0) {
    violations.push({ file: currentFile, violations: currentViolations });
  }

  return violations;
}

function displayViolations(violationsByFile) {
  // Overall violations summary
  const allViolations = violationsByFile.flatMap(file => file.violations);
  
  // Count by impact and rule
  const impactCounts = {};
  const ruleCounts = {};
  
  allViolations.forEach(v => {
    // Count by impact
    impactCounts[v.impact] = (impactCounts[v.impact] || 0) + 1;
    
    // Count by rule
    ruleCounts[v.id] = (ruleCounts[v.id] || 0) + 1;
  });
  
  // Print a clear summary header
  console.error('\n========== ACCESSIBILITY VIOLATIONS SUMMARY ==========');
  
  // Print impact counts
  console.error('\nImpact Breakdown:');
  ['critical', 'serious', 'moderate', 'minor'].forEach(impact => {
    if (impactCounts[impact]) {
      // Add visual indicators for severity
      let indicator = '  ';
      if (impact === 'critical') indicator = '❌ ';
      else if (impact === 'serious') indicator = '❌ ';
      else if (impact === 'moderate') indicator = '⚠️ ';
      else if (impact === 'minor') indicator = 'ℹ️ ';
      
      console.error(`${indicator}${impact.toUpperCase()}: ${impactCounts[impact]} violations`);
    }
  });
  
  // Print top rules
  console.error('\nTop Violation Rules:');
  Object.entries(ruleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([rule, count]) => {
      console.error(`  - ${rule}: ${count} violations`);
    });
  
  console.error('\n=== Violations By Component ===');
  
  // Detailed violations by file
  violationsByFile.forEach(({ file, violations }) => {
    console.error(`\n📁 ${file}:`);

    // Group by impact level
    const byImpact = violations.reduce((acc, v) => {
      if (!acc[v.impact]) acc[v.impact] = [];
      acc[v.impact].push(v);
      return acc;
    }, {});

    ["critical", "serious", "moderate", "minor"].forEach((impact) => {
      if (byImpact[impact]) {
        // Add impact header with visual severity indicator
        let indicator = '  ';
        if (impact === 'critical') indicator = '❌ ';
        else if (impact === 'serious') indicator = '❌ ';
        else if (impact === 'moderate') indicator = '⚠️ ';
        else if (impact === 'minor') indicator = 'ℹ️ ';
        
        console.error(`\n  ${indicator}${impact.toUpperCase()} violations:`);
        
        byImpact[impact].forEach((v) => {
          const instances = v.nodes > 1 ? ` (${v.nodes} instances)` : "";
          console.error(
            `    • Rule: ${v.id}\n      Description: ${v.description}${instances}`,
          );
          
          // Add help text when available
          if (v.help) {
            console.error(`      How to fix: ${v.help}`);
          }
          
          // Add URL for more information
          console.error(`      Documentation: https://dequeuniversity.com/rules/axe/${v.id}`);
        });
      }
    });
  });
  
  // Print remediation guidance
  console.error('\n=== How to Fix Accessibility Issues ===');
  console.error('1. Run `npm run storybook` and open the "Accessibility" panel');
  console.error('2. Check components individually to see detailed violation information');
  console.error('3. Use the Axe DevTools extension for more detailed debugging');
  console.error('4. Visit rule documentation links for remediation guidance');
  console.error('\nCommon fixes:');
  console.error('• color-contrast: Ensure text has 4.5:1 contrast ratio with its background');
  console.error('• button-name: All buttons must have accessible names (text or aria-label)');
  console.error('• aria-roles: Use valid ARIA role values on elements');
  console.error('• image-alt: All images must have alt text describing their purpose');
  console.error('\n======================================================');
}

// Main execution
async function main() {
  const stagedStoryFiles = detectStagedStoryFiles();

  if (stagedStoryFiles.length === 0) {
    console.log("No staged Storybook files to check for accessibility.");
    process.exit(0);
  }

  console.log(
    `Checking accessibility for ${stagedStoryFiles.length} staged story file(s)...`,
  );

  const projectRoot = path.resolve(__dirname, "..");
  const storybookStaticDir = path.join(projectRoot, "storybook-static");

  // Check if we need to build Storybook
  if (!isStorybookBuildRecent(storybookStaticDir)) {
    if (!buildStorybook()) {
      console.error("⚠️  Skipping accessibility checks due to build failure.");
      process.exit(0);
    }
  }

  await runAccessibilityCheck(stagedStoryFiles, storybookStaticDir);
}

// Export for testing
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
} else {
  module.exports = {
    detectStagedStoryFiles,
    runAccessibilityCheck,
    parseViolations,
    main, // Export main for testing
  };
}
