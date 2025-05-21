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
    // Use porcelain format for more reliable parsing
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
      // Match story files with cross-platform path handling
      if (status !== "D" && /\.stories\.(js|jsx|ts|tsx)$/i.test(file)) {
        // Normalize path with forward slashes for consistency
        storyFiles.push(path.normalize(file).replace(/\\/g, '/'));
      }
    }

    if (process.env.DEBUG === "1") {
      console.log("Detected staged story files:", storyFiles);
    }

    return storyFiles;
  } catch (error) {
    console.error("Error detecting staged files:", error.message);
    console.error(error.stack);
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
    
    // Check if we have any stories to test
    if (relevantStoryIds && relevantStoryIds.length === 0) {
      console.log("No relevant stories found in staged files. Skipping checks.");
      return;
    }

    let filterArg = "";
    if (relevantStoryIds && relevantStoryIds.length > 0) {
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
    
    if (process.env.DEBUG === "1") {
      console.log(`Command: ${command}`);
    }

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

      if (process.env.DEBUG === "1") {
        console.log("All detected violations:", JSON.stringify(allViolations, null, 2));
      }

      // Filter to staged files - Improved matching logic
      const stagedViolations = allViolations.filter((v) => {
        return storyFiles.some((staged) => {
          // Remove src/ prefix and normalize paths for comparison
          const normalizedStaged = staged.replace(/^src\//, "").replace(/\\/g, '/');
          const normalizedVFile = v.file.replace(/\\/g, '/');
          
          // Check if the story file path includes the staged file path
          return normalizedVFile.includes(normalizedStaged);
        });
      });

      if (process.env.DEBUG === "1") {
        console.log("Staged files:", storyFiles);
        console.log("Filtered violations:", JSON.stringify(stagedViolations, null, 2));
      }

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
    if (process.env.DEBUG === "1") {
      console.error(error.stack);
    }
    await cleanupAndExit(1);
  } finally {
    // Always cleanup
    if (storybookServer) {
      try {
        await new Promise((resolve) => storybookServer.close(resolve));
        console.log("Server closed successfully.");
      } catch (err) {
        console.error("Error closing server:", err.message);
      } finally {
        storybookServer = null;
        setGlobalServer(null); // Clear global reference
      }
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
  let currentViolationIndex = -1;
  let capturingNodes = false;
  let currentNodes = [];

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
          helpUrl: "",
          wcagCriteria: [],
          nodeInfo: []
        };
        currentViolations.push(violation);
      }
    }
    
    // Look for detailed violation information
    if (line.includes("----- Violation #") && line.includes("-----")) {
      inViolationDetail = true;
      inViolationTable = false;
      capturingNodes = false;
      currentNodes = [];
      
      // Extract violation number from header
      const violationMatch = line.match(/Violation #(\d+)/);
      if (violationMatch && violationMatch[1]) {
        currentViolationIndex = parseInt(violationMatch[1]) - 1;
      } else {
        currentViolationIndex = -1;
      }
      
      continue;
    }
    
    // End of detailed violation
    if (inViolationDetail && line.includes("==============================")) {
      // Save nodes to the current violation if we have any
      if (currentViolationIndex >= 0 && currentViolationIndex < currentViolations.length && currentNodes.length > 0) {
        currentViolations[currentViolationIndex].nodeInfo = [...currentNodes];
      }
      
      inViolationDetail = false;
      currentViolationIndex = -1;
      capturingNodes = false;
      currentNodes = [];
      continue;
    }
    
    // Extract information from detailed violation sections
    if (inViolationDetail && currentViolationIndex >= 0 && currentViolationIndex < currentViolations.length) {
      // Extract help text
      if (line.includes("Help:")) {
        const match = line.match(/Help:\s+(.+)/);
        if (match && match[1]) {
          currentViolations[currentViolationIndex].help = match[1].trim();
        }
      }
      
      // Extract help URL
      if (line.includes("Help URL:")) {
        const match = line.match(/Help URL:\s+(.+)/);
        if (match && match[1]) {
          currentViolations[currentViolationIndex].helpUrl = match[1].trim();
        }
      }
      
      // Extract WCAG criteria if available
      if (line.includes("WCAG:") || line.includes("WCAG Criteria:")) {
        const match = line.match(/WCAG(?:\s+Criteria)?:\s+(.+)/);
        if (match && match[1]) {
          // Parse and clean up WCAG criteria tags
          const wcagTags = match[1].trim()
            .split(/,\s*/)
            .filter(tag => tag.includes('wcag') || /^\d\.\d\.\d$/.test(tag));
          
          currentViolations[currentViolationIndex].wcagCriteria = wcagTags;
        }
      }
      
      // Start capturing node information
      if (line.includes("Nodes:") || line.includes("Affected nodes:")) {
        capturingNodes = true;
        continue;
      }
      
      // End of node section
      if (capturingNodes && (line.trim() === "" || line.includes("---"))) {
        capturingNodes = false;
        continue;
      }
      
      // Capture node details
      if (capturingNodes && line.trim() !== "") {
        // Try to extract HTML snippet
        const htmlMatch = line.match(/<([^>]+)>/);
        // Try to extract selector
        const selectorMatch = line.match(/^([^:]+):/);
        // Try to extract failure summary
        const failureMatch = line.match(/Fix(?:es|ing):\s+(.+)/i) || 
                            line.match(/Issue(?:s|):\s+(.+)/i) ||
                            line.match(/Problem(?:s|):\s+(.+)/i);
        
        // Build node object with available information
        const nodeInfo = {};
        
        if (htmlMatch) {
          nodeInfo.html = line.trim();
        } else if (selectorMatch) {
          nodeInfo.selector = selectorMatch[1].trim();
        } else if (failureMatch) {
          nodeInfo.failureSummary = failureMatch[1].trim();
        } else if (line.trim().startsWith("- ")) {
          // List item with additional details
          nodeInfo.detail = line.trim().substring(2);
        } else {
          // General info that doesn't match other patterns
          nodeInfo.info = line.trim();
        }
        
        // Only add if we have some meaningful content
        if (Object.keys(nodeInfo).length > 0) {
          currentNodes.push(nodeInfo);
        }
      }
    }
  }

  // Add last file if exists
  if (currentFile && currentViolations.length > 0) {
    violations.push({ file: currentFile, violations: currentViolations });
  }

  // Post-process to enhance violation data
  return violations.map(fileData => {
    // Update each violation with more information
    const enhancedViolations = fileData.violations.map(violation => {
      // Add fixed URL if missing
      if (!violation.helpUrl) {
        violation.helpUrl = `https://dequeuniversity.com/rules/axe/${violation.id}`;
      }
      
      // Clean up WCAG criteria if empty
      if (!violation.wcagCriteria || !Array.isArray(violation.wcagCriteria) || violation.wcagCriteria.length === 0) {
        // Try to infer from rule ID
        switch(violation.id) {
          case 'color-contrast':
            violation.wcagCriteria = ['wcag2aa', 'wcag143'];
            break;
          case 'button-name':
            violation.wcagCriteria = ['wcag2aa', 'wcag412', 'wcag244'];
            break;
          case 'image-alt':
            violation.wcagCriteria = ['wcag2aa', 'wcag111'];
            break;
          default:
            violation.wcagCriteria = [];
        }
      }
      
      // Add remediation guidance based on rule ID
      if (!violation.remediation) {
        // Common fixes for frequent issues
        switch(violation.id) {
          case 'color-contrast':
            violation.remediation = "Ensure text has a contrast ratio of at least 4.5:1 for normal text or 3:1 for large text";
            break;
          case 'button-name':
            violation.remediation = "Add accessible text content, aria-label, or aria-labelledby to buttons";
            break;
          case 'image-alt':
            violation.remediation = "Add meaningful alt text that describes the purpose of the image";
            break;
          case 'aria-roles':
            violation.remediation = "Use only valid ARIA role values as documented in WAI-ARIA specification";
            break;
          case 'tabindex':
            violation.remediation = "Avoid using tabindex values greater than 0, which disrupt natural keyboard navigation";
            break;
          default:
            violation.remediation = "Check Axe documentation for this rule to understand how to fix it";
        }
      }
      
      return violation;
    });
    
    return {
      file: fileData.file,
      violations: enhancedViolations
    };
  });
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
  try {
    console.log("📋 Running accessibility checks on staged story files...");
    
    // Log debug information if requested
    if (process.env.DEBUG === "1") {
      console.log("Running in debug mode - verbose output enabled");
      console.log(`Current working directory: ${process.cwd()}`);
      console.log(`Platform: ${process.platform}`);
    }

    const stagedStoryFiles = detectStagedStoryFiles();

    if (stagedStoryFiles.length === 0) {
      console.log("✅ No staged Storybook files to check for accessibility.");
      process.exit(0);
    }

    console.log(
      `📊 Found ${stagedStoryFiles.length} staged story file(s) to check...`,
    );

    const projectRoot = path.resolve(__dirname, "..");
    const storybookStaticDir = path.join(projectRoot, "storybook-static");

    // Check if Storybook static dir exists
    if (!fs.existsSync(storybookStaticDir)) {
      console.log("⚙️ Storybook static directory doesn't exist. Building Storybook...");
      if (!buildStorybook()) {
        console.error("⚠️  Skipping accessibility checks due to build failure.");
        process.exit(0);
      }
    }
    // Check if we need to build Storybook
    else if (!isStorybookBuildRecent(storybookStaticDir)) {
      console.log("⚙️ Storybook build is outdated. Rebuilding...");
      if (!buildStorybook()) {
        console.error("⚠️  Skipping accessibility checks due to build failure.");
        process.exit(0);
      }
    } else {
      console.log("📦 Using existing Storybook build (less than 5 minutes old)");
    }

    await runAccessibilityCheck(stagedStoryFiles, storybookStaticDir);
  } catch (error) {
    console.error("❌ Fatal error in accessibility checks:", error.message);
    if (process.env.DEBUG === "1") {
      console.error(error.stack);
    }
    process.exit(1);
  }
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
