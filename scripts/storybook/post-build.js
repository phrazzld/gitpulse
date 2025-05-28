#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
      console.warn(`Warning: Could not read ${file}: ${error.message}`);
    }
  }
  
  return hash.digest('hex');
}

/**
 * Generates build info file after Storybook build
 */
async function generateBuildInfo() {
  try {
    const buildInfo = {
      configHash: await getCurrentConfigHash(),
      buildTimestamp: new Date().toISOString(),
      nodeVersion: process.version,
      storybookVersion: getStorybookVersion()
    };
    
    const buildInfoPath = path.join('storybook-static', 'build-info.json');
    
    // Ensure directory exists
    if (!fs.existsSync('storybook-static')) {
      console.error('Error: storybook-static directory does not exist');
      process.exit(1);
    }
    
    // Write build info
    fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
    
    console.log('✅ Generated build-info.json with config hash:', buildInfo.configHash);
  } catch (error) {
    console.error('Error generating build info:', error.message);
    process.exit(1);
  }
}

/**
 * Extracts Storybook version from package.json
 */
function getStorybookVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const storybookDeps = Object.keys(packageJson.dependencies || {})
      .concat(Object.keys(packageJson.devDependencies || {}))
      .filter(dep => dep.startsWith('@storybook/'));
    
    if (storybookDeps.length > 0) {
      const firstStorybookDep = storybookDeps[0];
      return packageJson.dependencies?.[firstStorybookDep] || 
             packageJson.devDependencies?.[firstStorybookDep] || 
             'unknown';
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// Run if called directly
if (require.main === module) {
  generateBuildInfo();
}

module.exports = {
  generateBuildInfo,
  getCurrentConfigHash
};