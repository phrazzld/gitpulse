#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  startStaticServer,
  getRelevantStoryIds,
  cleanupAndExit,
  setGlobalServer,
} = require("./check-a11y-staged-stories-server");

// Check if storybook build is recent (within 5 minutes)
const STORYBOOK_BUILD_CACHE_MINUTES = 5;
const STORYBOOK_STATIC_DIR = 'storybook-static';
const BUILD_INFO_FILE = path.join(STORYBOOK_STATIC_DIR, 'build-info.json');
const A11Y_CHECK_TIMEOUT_MS = 120000; // 2 minutes

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

/**
 * Computes a hash of relevant configuration files
 * @returns {Promise<string>} SHA256 hash of configuration files
 */
async function getCurrentConfigHash() {
  const configFiles = [
    '.storybook/main.ts',
    '.storybook/preview.ts',
    '.storybook/test-runner.js',
    'package.json',
    'next.config.js'
  ];
  
  const hash = crypto.createHash('sha256');
  
  for (const file of configFiles) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        hash.update(file + '\n' + content + '\n');
      }
    } catch (error) {
      // If file can't be read, continue with other files
      if (process.env.DEBUG === "1") {
        console.log(`Warning: Could not read ${file}: ${error.message}`);
      }
    }
  }
  
  return hash.digest('hex');
}

/**
 * Checks if the Storybook build cache is valid
 * @returns {Promise<boolean>} true if cache is valid, false otherwise
 */
async function isValidBuildCache() {
  try {
    // Check if storybook-static directory exists
    if (!fs.existsSync(STORYBOOK_STATIC_DIR)) {
      return false;
    }
    
    // Check if build-info.json exists
    if (!fs.existsSync(BUILD_INFO_FILE)) {
      return false;
    }
    
    // Read build info
    const buildInfo = JSON.parse(fs.readFileSync(BUILD_INFO_FILE, 'utf-8'));
    
    // Get current config hash
    const currentHash = await getCurrentConfigHash();
    
    // Compare hashes
    if (buildInfo.configHash !== currentHash) {
      if (process.env.DEBUG === "1") {
        console.log(`Config hash mismatch: ${buildInfo.configHash} !== ${currentHash}`);
      }
      return false;
    }
    
    // Optional: Check if build is too old (e.g., more than 24 hours)
    const buildTime = new Date(buildInfo.buildTimestamp);
    const hoursSinceBuild = (Date.now() - buildTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceBuild > 24) {
      if (process.env.DEBUG === "1") {
        console.log(`Build is too old: ${hoursSinceBuild.toFixed(1)} hours`);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    if (process.env.DEBUG === "1") {
      console.error('Error checking build cache:', error.message);
    }
    return false;
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
    
    // Generate build info after successful build
    console.log("Generating build cache info...");
    execSync("node scripts/storybook/post-build.js", { stdio: "inherit" });
    
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

    // Verify CI-compatible configuration exists
    const testRunnerConfigPath = path.join(projectRoot, ".storybook/test-runner.js");
    if (!fs.existsSync(testRunnerConfigPath)) {
      console.warn("⚠️  .storybook/test-runner.js not found - using default Axe configuration");
    } else {
      console.log("✅ Using enhanced Axe configuration from .storybook/test-runner.js");
    }

    // Run tests with same configuration as CI 
    const command = `npx test-storybook --url http://localhost:${port} ${filterArg}`;
    console.log("Running accessibility checks (CI-compatible configuration)...");
    console.log(`⏱️  Timeout: ${A11Y_CHECK_TIMEOUT_MS / 1000} seconds`);
    
    if (process.env.DEBUG === "1") {
      console.log(`Command: ${command}`);
      console.log("Note: Using same Axe rules and thresholds as GitHub Actions CI");
    }

    try {
      execSync(command, {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: "pipe",
        timeout: A11Y_CHECK_TIMEOUT_MS
      });
      console.log("✅ All accessibility checks passed!");
      console.log("   Staged components meet WCAG 2.1 AA standards (CI-compatible)");
    } catch (error) {
      // Check if it was a timeout
      if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
        console.error("❌ Accessibility check timed out after 2 minutes");
        console.error("   This may indicate performance issues with test execution");
        console.error("\n💡 Suggestions:");
        console.error("   1. Run fewer tests at once by staging fewer story files");
        console.error("   2. Check if your system is under heavy load");
        console.error("   3. Use A11Y_SKIP=1 to temporarily skip and create a follow-up task");
        await cleanupAndExit(1);
      }
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
        console.log("   Staged components meet WCAG 2.1 AA standards (CI-compatible)");
        console.log("   (Other stories have violations but are not staged for commit)");
        return;
      }

      console.error("❌ Accessibility violations found in staged stories:\n");
      displayViolations(stagedViolations);

      console.error("\n🔍 How to debug accessibility issues:");
      console.error("  1. Run `npm run storybook` and check the Accessibility panel");
      console.error("  2. Use browser dev tools with Axe extension for detailed analysis");
      console.error("  3. Run `DEBUG=1 npm run check:a11y:staged` for verbose output");
      console.error("  4. Check docs/accessibility/APPROVED_COLOR_PAIRINGS.md for color guidance");
      
      console.error("\n⚙️  CI Consistency Note:");
      console.error("  • Pre-commit checks use identical Axe configuration as CI pipeline");
      console.error("  • Same WCAG 2.1 AA standards enforced locally and in CI");
      console.error("  • Local failures will also fail in CI - no surprises!");
      
      console.error("\n🚨 Emergency skip (use sparingly):");
      console.error('  A11Y_SKIP=1 git commit -m "your message"');
      console.error("  ⚠️  Always create a follow-up task to fix skipped accessibility issues!\n");

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
        // Common fixes for frequent issues with project-specific guidance
        switch(violation.id) {
          case 'color-contrast':
            violation.remediation = "Use approved color combinations from docs/accessibility/APPROVED_COLOR_PAIRINGS.md. For buttons: #1a4bbd (7.54:1) or #2563eb (4.90:1) with white text. For success states: #00994f (3.51:1) for large text only.";
            break;
          case 'button-name':
            violation.remediation = "Add accessible text content, aria-label, or aria-labelledby to buttons. Ensure button purpose is clear to screen readers.";
            break;
          case 'image-alt':
            violation.remediation = "Add meaningful alt text describing the image's purpose/function, not just appearance. Use empty alt='' for decorative images.";
            break;
          case 'aria-roles':
            violation.remediation = "Use only valid ARIA role values. Check WAI-ARIA specification for supported roles. Common valid roles: button, link, heading, list, listitem.";
            break;
          case 'tabindex':
            violation.remediation = "Remove positive tabindex values (>0). Use tabindex='0' to include in tab order or tabindex='-1' to exclude. Let DOM order determine tab sequence.";
            break;
          case 'label':
            violation.remediation = "Associate form controls with labels using for/id attributes or aria-labelledby. Every input needs an accessible name.";
            break;
          case 'aria-required-attr':
            violation.remediation = "Add required ARIA attributes for the element's role. Check ARIA specification for mandatory attributes per role.";
            break;
          default:
            violation.remediation = "Visit the Axe documentation link for specific remediation steps. Test fixes using Storybook's Accessibility panel.";
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
          
          // Add project-specific remediation guidance
          if (v.remediation) {
            console.error(`      Project guidance: ${v.remediation}`);
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
  
  console.error('\n📖 Color Contrast Guidelines:');
  console.error('• WCAG AA requires 4.5:1 contrast for normal text (under 18pt or under 14pt bold)');
  console.error('• WCAG AA requires 3:1 contrast for large text (18pt+ or 14pt+ bold)');
  console.error('• Use our approved color combinations from docs/accessibility/APPROVED_COLOR_PAIRINGS.md');
  console.error('• Test contrast ratios using our colorContrast.ts utility');
  console.error('• For buttons: Use darkBlue (#1a4bbd) or electricBlue (#2563eb) with white text');
  console.error('• For success states: Use approved neon green (#00994f) for large text only');
  
  console.error('\n🔧 Common Fixes by Rule:');
  console.error('• color-contrast: Update colors to meet WCAG AA standards (see approved pairings)');
  console.error('• button-name: Add accessible text content, aria-label, or aria-labelledby');
  console.error('• aria-roles: Use valid ARIA role values listed in WAI-ARIA specification');
  console.error('• image-alt: Add meaningful alt text describing image purpose (not just description)');
  console.error('• label: Associate form controls with labels using for/id or aria-labelledby');
  console.error('• aria-required-attr: Add required ARIA attributes for specific roles');
  console.error('• tabindex: Avoid positive tabindex values; use 0 or -1 only');
  
  console.error('\n🛠️  Testing Locally:');
  console.error('• CI uses same Axe configuration as local pre-commit checks');
  console.error('• Run `npm run check:a11y:all` to check all components');
  console.error('• Use DEBUG=1 environment variable for verbose output');
  console.error('• Generate color docs with `npm run generate-color-docs`');
  console.error('\n======================================================');
}

/**
 * Validates that local accessibility configuration matches CI expectations
 */
function validateConfiguration() {
  const projectRoot = path.resolve(__dirname, "..");
  const huskyPreCommitPath = path.join(projectRoot, ".husky/pre-commit");
  const testRunnerConfigPath = path.join(projectRoot, ".storybook/test-runner.js");
  
  const warnings = [];
  
  // Check if Husky pre-commit exists and includes our script
  if (fs.existsSync(huskyPreCommitPath)) {
    try {
      const preCommitContent = fs.readFileSync(huskyPreCommitPath, 'utf-8');
      if (!preCommitContent.includes('check-a11y-staged-stories.js')) {
        warnings.push("Pre-commit hook may not include accessibility checks");
      }
    } catch (error) {
      warnings.push("Cannot read pre-commit hook file");
    }
  }
  
  // Check if test-runner configuration exists
  if (!fs.existsSync(testRunnerConfigPath)) {
    warnings.push("Enhanced Axe configuration (.storybook/test-runner.js) not found");
  }
  
  if (warnings.length > 0 && process.env.DEBUG === "1") {
    console.log("⚠️  Configuration warnings:");
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  return warnings.length === 0;
}

// Main execution
async function main() {
  try {
    console.log("📋 Running accessibility checks on staged story files...");
    console.log("⚙️  Using CI-compatible Axe configuration (WCAG 2.1 AA standards)");
    
    // Validate configuration consistency
    validateConfiguration();
    
    // Log debug information if requested
    if (process.env.DEBUG === "1") {
      console.log("Running in debug mode - verbose output enabled");
      console.log(`Current working directory: ${process.cwd()}`);
      console.log(`Platform: ${process.platform}`);
      console.log("Configuration: CI-compatible Axe rules and thresholds");
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

    // Check if we have a valid cache
    const hasValidCache = await isValidBuildCache();
    
    if (hasValidCache) {
      console.log("📦 Using cached Storybook build (configuration unchanged)");
    } else {
      // Need to build Storybook
      if (!fs.existsSync(storybookStaticDir)) {
        console.log("⚙️ Storybook static directory doesn't exist. Building Storybook...");
      } else {
        console.log("⚙️ Storybook configuration has changed. Rebuilding...");
      }
      
      if (!buildStorybook()) {
        console.error("⚠️  Skipping accessibility checks due to build failure.");
        process.exit(0);
      }
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
    getCurrentConfigHash,
    isValidBuildCache,
    runAccessibilityCheck,
    parseViolations,
    main, // Export main for testing
  };
}
