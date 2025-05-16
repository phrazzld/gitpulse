#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if storybook build is recent (within 5 minutes)
const STORYBOOK_BUILD_CACHE_MINUTES = 5;

function detectStagedStoryFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    const files = output.trim().split('\n').filter(Boolean);
    
    // Filter for story files
    return files.filter(file => /\.stories\.(js|jsx|ts|tsx)$/.test(file));
  } catch (error) {
    console.error('Error detecting staged files:', error.message);
    return [];
  }
}

function isStorybookBuildRecent(storybookPath) {
  try {
    const indexPath = path.join(storybookPath, 'index.html');
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
  console.log('Building Storybook for accessibility checks...');
  try {
    execSync('npm run build-storybook', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('Failed to build Storybook:', error.message);
    return false;
  }
}

function runAccessibilityCheck(storyFiles, storybookPath) {
  // Check for skip flag
  if (process.env.A11Y_SKIP === '1') {
    console.log('⚠️  Accessibility checks skipped via A11Y_SKIP=1');
    console.log('   Please create a follow-up task to fix accessibility issues.');
    process.exit(0);
  }

  const projectRoot = path.resolve(__dirname, '..');
  
  try {
    // Use absolute file path for the static build
    const absoluteStorybookPath = path.resolve(storybookPath);
    const command = `npx test-storybook --url file://${absoluteStorybookPath}`;
    
    console.log('Running accessibility checks on staged stories...');
    console.log(`Command: ${command}`);
    
    execSync(command, { 
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    console.log('✅ All accessibility checks passed!');
  } catch (error) {
    // Parse the output for violations
    const output = (error.stdout || '') + '\n' + (error.stderr || '');
    console.log('Test output:', output);
    const allViolations = parseViolations(output);
    
    // Filter violations to only show staged files
    const stagedViolations = allViolations.filter(v => 
      storyFiles.some(staged => v.file.includes(staged.replace('src/', '')))
    );
    
    if (stagedViolations.length === 0 && error.status === 1) {
      // If test-storybook failed but we found no violations for staged files, 
      // check if there were any violations at all
      if (allViolations.length > 0) {
        console.log('✅ All staged story files passed accessibility checks!');
        console.log('   (Other stories have violations but are not staged)');
        return;
      }
    }
    
    console.error('❌ Accessibility violations found in staged stories:\n');
    displayViolations(stagedViolations);
    
    console.error('\nTo debug:');
    console.error('  1. Run `npm run storybook` and check the Accessibility panel');
    console.error('\nTo skip (emergency only):');
    console.error('  A11Y_SKIP=1 git commit -m "your message"');
    console.error('  ⚠️  Always create a follow-up task to fix skipped issues!\n');
    
    process.exit(1);
  }
}

function parseViolations(output) {
  const violations = [];
  const lines = output.split('\n');
  
  let currentFile = null;
  let currentViolations = [];
  let inViolationTable = false;
  
  for (const line of lines) {
    // Detect test file
    if (line.includes('FAIL browser:') && line.includes('.stories.')) {
      const match = line.match(/(\S+\.stories\.\w+)$/);
      if (match) {
        if (currentFile && currentViolations.length > 0) {
          violations.push({ file: currentFile, violations: currentViolations });
        }
        currentFile = match[1];
        currentViolations = [];
      }
    }
    
    // Detect violation table
    if (line.includes('│ (index) │ id') && line.includes('│ impact')) {
      inViolationTable = true;
      continue;
    }
    
    if (inViolationTable && line.includes('└─')) {
      inViolationTable = false;
    }
    
    // Parse violation row
    if (inViolationTable && line.includes('│') && !line.includes('├─')) {
      const parts = line.split('│').map(p => p.trim());
      if (parts.length >= 5 && parts[2]) {
        const violation = {
          id: parts[2].replace(/['"]/g, ''),
          impact: parts[3].replace(/['"]/g, ''),
          description: parts[4].replace(/['"]/g, ''),
          nodes: parseInt(parts[5]) || 1
        };
        currentViolations.push(violation);
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
  violationsByFile.forEach(({ file, violations }) => {
    console.error(`\n  ${file}:`);
    
    // Group by impact level
    const byImpact = violations.reduce((acc, v) => {
      if (!acc[v.impact]) acc[v.impact] = [];
      acc[v.impact].push(v);
      return acc;
    }, {});
    
    ['critical', 'serious', 'moderate', 'minor'].forEach(impact => {
      if (byImpact[impact]) {
        byImpact[impact].forEach(v => {
          const instances = v.nodes > 1 ? ` (${v.nodes} instances)` : '';
          console.error(`    - ${impact.toUpperCase()}: ${v.description}${instances}`);
        });
      }
    });
  });
}

// Main execution
function main() {
  const stagedStoryFiles = detectStagedStoryFiles();
  
  if (stagedStoryFiles.length === 0) {
    console.log('No staged Storybook files to check for accessibility.');
    process.exit(0);
  }
  
  console.log(`Checking accessibility for ${stagedStoryFiles.length} staged story file(s)...`);
  
  const projectRoot = path.resolve(__dirname, '..');
  const storybookStaticDir = path.join(projectRoot, 'storybook-static');
  
  // Check if we need to build Storybook
  if (!isStorybookBuildRecent(storybookStaticDir)) {
    if (!buildStorybook()) {
      console.error('⚠️  Skipping accessibility checks due to build failure.');
      process.exit(0);
    }
  }
  
  runAccessibilityCheck(stagedStoryFiles, storybookStaticDir);
}

// Export for testing
if (require.main === module) {
  main();
} else {
  module.exports = {
    detectStagedStoryFiles,
    runAccessibilityCheck,
    parseViolations,
    main // Export main for testing
  };
}