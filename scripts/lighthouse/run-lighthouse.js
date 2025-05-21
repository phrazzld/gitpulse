#!/usr/bin/env node

/**
 * Run Lighthouse CI Locally
 * 
 * This script provides a convenient way to run Lighthouse CI locally
 * for testing performance and generating reports.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const lighthouseConfigPath = path.resolve(__dirname, '../../.lighthouserc.js');

// Ensure the output directory exists
const outputDir = path.resolve(__dirname, '../../lighthouse-results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Print banner
console.log('\n🚦 Running Lighthouse CI Performance Tests 🚦\n');

const runMode = process.argv[2] || 'collect';
const validModes = ['collect', 'assert', 'upload', 'autorun'];

if (!validModes.includes(runMode)) {
  console.error(`❌ Invalid mode: ${runMode}`);
  console.log(`Valid modes are: ${validModes.join(', ')}`);
  console.log('Example: node scripts/lighthouse/run-lighthouse.js collect');
  process.exit(1);
}

// Build the command
let command = `npx lhci ${runMode}`;

if (runMode === 'collect') {
  // When just collecting, use slightly different params for better UX
  command = `npx lhci collect --config=${lighthouseConfigPath} --headful`;
} else if (runMode === 'assert') {
  command = `npx lhci assert --config=${lighthouseConfigPath}`;
} else if (runMode === 'autorun') {
  command = `npx lhci autorun --config=${lighthouseConfigPath}`;
} else if (runMode === 'upload') {
  // Build the upload command based on target (local vs CI)
  command = `npx lhci upload --config=${lighthouseConfigPath}`;
}

// Run the command
try {
  console.log(`\n🚀 Executing: ${command}\n`);
  execSync(command, { stdio: 'inherit' });
  
  if (runMode === 'collect' || runMode === 'autorun') {
    console.log('\n✅ Lighthouse reports generated successfully!');
    console.log(`📊 Reports are available in: ${outputDir}`);
    
    // Open the latest report
    const files = fs.readdirSync(outputDir)
      .filter(file => file.endsWith('.html'))
      .sort((a, b) => {
        return fs.statSync(path.join(outputDir, b)).mtime.getTime() - 
               fs.statSync(path.join(outputDir, a)).mtime.getTime();
      });
      
    if (files.length > 0) {
      const latestReport = path.join(outputDir, files[0]);
      console.log(`\n🔍 Opening latest report: ${latestReport}`);
      
      // Try to open the report in the default browser
      try {
        const openCommand = process.platform === 'win32' ? 'start' : 
                           process.platform === 'darwin' ? 'open' : 'xdg-open';
        execSync(`${openCommand} "${latestReport}"`);
      } catch (err) {
        console.log('Could not automatically open the report.');
      }
    }
  }
} catch (error) {
  console.error('\n❌ Lighthouse CI execution failed:');
  process.exit(1);
}