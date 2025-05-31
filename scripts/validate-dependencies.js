#!/usr/bin/env node

/**
 * Dependency Compatibility Validator
 * 
 * Validates known incompatible dependency version combinations
 * to prevent CI failures and provide early warning of issues.
 */

const fs = require('fs');
const path = require('path');

// Known incompatible version combinations
const INCOMPATIBLE_COMBINATIONS = [
  {
    name: 'Storybook + Test Runner Compatibility',
    dependencies: ['storybook', '@storybook/test-runner'],
    check: (versions) => {
      const storybookVersion = versions.storybook;
      const testRunnerVersion = versions['@storybook/test-runner'];
      
      if (storybookVersion && testRunnerVersion) {
        // Check if Storybook 8.x with test-runner < 0.19
        const sbMajor = parseInt(storybookVersion.split('.')[0]);
        const trMinor = parseInt(testRunnerVersion.split('.')[1]);
        
        if (sbMajor >= 8 && trMinor < 19) {
          return {
            compatible: false,
            issue: `Storybook ${storybookVersion} requires @storybook/test-runner >= 0.19.0, found ${testRunnerVersion}`,
            solution: 'Update @storybook/test-runner to version 0.19.0 or higher'
          };
        }
      }
      
      return { compatible: true };
    }
  },
  {
    name: 'React + Next.js Compatibility',
    dependencies: ['react', 'next'],
    check: (versions) => {
      const reactVersion = versions.react;
      const nextVersion = versions.next;
      
      if (reactVersion && nextVersion) {
        // Check React 19 with Next.js < 15
        const reactMajor = parseInt(reactVersion.split('.')[0]);
        const nextMajor = parseInt(nextVersion.split('.')[0]);
        
        if (reactMajor >= 19 && nextMajor < 15) {
          return {
            compatible: false,
            issue: `React ${reactVersion} requires Next.js >= 15.0.0, found ${nextVersion}`,
            solution: 'Update Next.js to version 15.0.0 or higher for React 19 compatibility'
          };
        }
      }
      
      return { compatible: true };
    }
  }
];

function getInstalledVersions() {
  try {
    const packageLockPath = path.resolve(process.cwd(), 'package-lock.json');
    const packageLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
    
    const versions = {};
    
    // Extract versions from package-lock.json
    if (packageLock.packages) {
      Object.entries(packageLock.packages).forEach(([packagePath, info]) => {
        if (packagePath.startsWith('node_modules/')) {
          const packageName = packagePath.replace('node_modules/', '');
          if (info.version && !packageName.includes('/')) {
            versions[packageName] = info.version;
          }
        }
      });
    }
    
    return versions;
  } catch (error) {
    console.error('Error reading package-lock.json:', error.message);
    process.exit(1);
  }
}

function validateDependencies() {
  console.log('🔍 Validating dependency compatibility...');
  
  const installedVersions = getInstalledVersions();
  const issues = [];
  
  for (const combo of INCOMPATIBLE_COMBINATIONS) {
    const relevantVersions = {};
    let hasRelevantDeps = false;
    
    // Check if we have the dependencies this rule applies to
    for (const dep of combo.dependencies) {
      if (installedVersions[dep]) {
        relevantVersions[dep] = installedVersions[dep];
        hasRelevantDeps = true;
      }
    }
    
    if (hasRelevantDeps) {
      const result = combo.check(relevantVersions);
      if (!result.compatible) {
        issues.push({
          name: combo.name,
          ...result
        });
      }
    }
  }
  
  if (issues.length > 0) {
    console.error('❌ Dependency compatibility issues found:');
    console.error('');
    
    issues.forEach((issue, index) => {
      console.error(`${index + 1}. ${issue.name}`);
      console.error(`   Problem: ${issue.issue}`);
      console.error(`   Solution: ${issue.solution}`);
      console.error('');
    });
    
    console.error('Please resolve these compatibility issues before proceeding.');
    process.exit(1);
  }
  
  console.log('✅ All dependency combinations are compatible');
}

// Run validation
validateDependencies();