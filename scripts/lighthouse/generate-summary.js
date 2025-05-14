#!/usr/bin/env node

/**
 * Lighthouse CI Performance Summary Generator
 * 
 * This script generates a markdown summary of Lighthouse performance results for GitHub PR comments.
 * It reads the JSON report files from Lighthouse CI and creates a human-readable summary with visual indicators.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const RESULTS_DIR = path.resolve(__dirname, '../../lighthouse-results');
const SUMMARY_FILE = path.resolve(RESULTS_DIR, 'performance-summary.md');

// Ensure the directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Find the latest Lighthouse report
const findLatestReport = () => {
  try {
    const files = fs.readdirSync(RESULTS_DIR)
      .filter(file => file.endsWith('.json') && !file.includes('manifest'))
      .sort((a, b) => {
        return fs.statSync(path.join(RESULTS_DIR, b)).mtime.getTime() - 
               fs.statSync(path.join(RESULTS_DIR, a)).mtime.getTime();
      });
      
    if (files.length === 0) {
      console.error('No Lighthouse report JSON files found.');
      return null;
    }
    
    return path.join(RESULTS_DIR, files[0]);
  } catch (error) {
    console.error('Error finding Lighthouse reports:', error);
    return null;
  }
};

// Generate status indicator
const getStatusIndicator = (score, thresholds = { error: 0.5, warning: 0.9 }) => {
  if (score >= thresholds.warning) return '✅';
  if (score >= thresholds.error) return '⚠️';
  return '❌';
};

// Format milliseconds to a readable string
const formatTime = (ms) => {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

// Generate summary markdown
const generateSummary = (reportPath) => {
  try {
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    // Extract core metrics
    const { categories, audits } = reportData;
    
    // Performance score
    const performanceScore = categories.performance.score;
    const performancePercentage = Math.round(performanceScore * 100);
    
    // Core Web Vitals and other key metrics
    const fcp = audits['first-contentful-paint'];
    const lcp = audits['largest-contentful-paint'];
    const cls = audits['cumulative-layout-shift'];
    const tbt = audits['total-blocking-time'];
    const si = audits['speed-index'];
    const tti = audits['interactive'];
    
    // Resource summary
    const resourceSummary = audits['resource-summary'];
    const jsTransfer = audits['network-requests']?.details?.items
      .filter(item => item.resourceType === 'Script')
      .reduce((total, item) => total + (item.transferSize || 0), 0) || 0;
    
    // Generate markdown summary
    let markdown = `# Performance Test Results\n\n`;
    
    // Performance score section
    markdown += `## Overall Score\n\n`;
    markdown += `${getStatusIndicator(performanceScore)} **Performance Score: ${performancePercentage}%**\n\n`;
    
    // Core Web Vitals section
    markdown += `## Core Web Vitals\n\n`;
    markdown += `| Metric | Value | Budget | Status |\n`;
    markdown += `|--------|-------|--------|--------|\n`;
    markdown += `| Largest Contentful Paint (LCP) | ${formatTime(lcp.numericValue)} | 2.5s | ${getStatusIndicator(lcp.score)} |\n`;
    markdown += `| First Contentful Paint (FCP) | ${formatTime(fcp.numericValue)} | 2.0s | ${getStatusIndicator(fcp.score)} |\n`;
    markdown += `| Cumulative Layout Shift (CLS) | ${cls.displayValue} | 0.1 | ${getStatusIndicator(cls.score)} |\n`;
    markdown += `| Total Blocking Time (TBT) | ${formatTime(tbt.numericValue)} | 300ms | ${getStatusIndicator(tbt.score)} |\n`;
    markdown += `| Speed Index | ${formatTime(si.numericValue)} | 3.8s | ${getStatusIndicator(si.score)} |\n`;
    markdown += `| Time to Interactive (TTI) | ${formatTime(tti.numericValue)} | 3.5s | ${getStatusIndicator(tti.score)} |\n\n`;
    
    // Resource budgets section
    if (resourceSummary) {
      markdown += `## Resource Budgets\n\n`;
      markdown += `| Resource Type | Count | Size | Budget | Status |\n`;
      markdown += `|--------------|-------|------|--------|--------|\n`;
      
      const totalResources = resourceSummary.details.items.find(item => item.resourceType === 'total');
      const scriptResources = resourceSummary.details.items.find(item => item.resourceType === 'script');
      const styleResources = resourceSummary.details.items.find(item => item.resourceType === 'stylesheet');
      const imageResources = resourceSummary.details.items.find(item => item.resourceType === 'image');
      const fontResources = resourceSummary.details.items.find(item => item.resourceType === 'font');
      const thirdPartyResources = resourceSummary.details.items.find(item => item.resourceType === 'third-party');
      
      // JavaScript
      if (scriptResources) {
        const scriptSize = Math.round(jsTransfer / 1024);
        const scriptBudget = 400; // 400 KB
        markdown += `| JavaScript | ${scriptResources.requestCount} | ${scriptSize} KB | ${scriptBudget} KB | ${getStatusIndicator(scriptSize <= scriptBudget ? 1 : 0)} |\n`;
      }
      
      // CSS
      if (styleResources) {
        const styleSize = Math.round(styleResources.transferSize / 1024);
        const styleBudget = 100; // 100 KB
        markdown += `| CSS | ${styleResources.requestCount} | ${styleSize} KB | ${styleBudget} KB | ${getStatusIndicator(styleSize <= styleBudget ? 1 : 0)} |\n`;
      }
      
      // Images
      if (imageResources) {
        const imageSize = Math.round(imageResources.transferSize / 1024);
        const imageBudget = 300; // 300 KB
        markdown += `| Images | ${imageResources.requestCount} | ${imageSize} KB | ${imageBudget} KB | ${getStatusIndicator(imageSize <= imageBudget ? 1 : 0)} |\n`;
      }
      
      // Fonts
      if (fontResources) {
        const fontCount = fontResources.requestCount;
        const fontBudget = 5; // 5 fonts max
        markdown += `| Fonts | ${fontCount} | - | ${fontBudget} | ${getStatusIndicator(fontCount <= fontBudget ? 1 : 0)} |\n`;
      }
      
      // Third-party
      if (thirdPartyResources) {
        const thirdPartyCount = thirdPartyResources.requestCount;
        const thirdPartyBudget = 10; // 10 third-party requests max
        markdown += `| Third-party | ${thirdPartyCount} | - | ${thirdPartyBudget} | ${getStatusIndicator(thirdPartyCount <= thirdPartyBudget ? 1 : 0.7)} |\n`;
      }
      
      // Total
      if (totalResources) {
        const totalSize = Math.round(totalResources.transferSize / 1024);
        const totalBudget = 1000; // 1000 KB (1 MB)
        markdown += `| **Total** | ${totalResources.requestCount} | ${totalSize} KB | ${totalBudget} KB | ${getStatusIndicator(totalSize <= totalBudget ? 1 : 0)} |\n`;
      }
    }
    
    // Explanation key
    markdown += `\n## Status Key\n\n`;
    markdown += `- ✅ Pass: Meets our performance targets\n`;
    markdown += `- ⚠️ Warning: Close to or slightly exceeding targets\n`;
    markdown += `- ❌ Fail: Significantly exceeds performance budgets\n\n`;
    
    // Write summary to file
    fs.writeFileSync(SUMMARY_FILE, markdown);
    console.log(`Performance summary generated at: ${SUMMARY_FILE}`);
    
    return markdown;
  } catch (error) {
    console.error('Error generating summary:', error);
    
    // Create a simple error message
    const errorMarkdown = `# Performance Test Results\n\n⚠️ **Error generating performance report.**\n\nThere was an error processing the Lighthouse results. Please check the CI logs for more details.`;
    fs.writeFileSync(SUMMARY_FILE, errorMarkdown);
    
    return null;
  }
};

// Main execution
const latestReport = findLatestReport();
if (latestReport) {
  generateSummary(latestReport);
} else {
  // Create a placeholder file if no reports are found
  const placeholderMarkdown = `# Performance Test Results\n\n⚠️ **No Lighthouse reports found.**\n\nLighthouse CI may have failed to generate reports. Please check the CI logs for more details.`;
  fs.writeFileSync(SUMMARY_FILE, placeholderMarkdown);
}