#!/usr/bin/env node

/**
 * CI Authentication Health Monitor
 * 
 * Collects and reports authentication test metrics for CI monitoring.
 * Provides data for alerting and dashboard systems.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AuthHealthMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      timestamp: new Date().toISOString(),
      runId: process.env.GITHUB_RUN_ID || 'local',
      branch: process.env.GITHUB_REF_NAME || 'unknown',
      commit: process.env.GITHUB_SHA || 'unknown',
      workflow: process.env.GITHUB_WORKFLOW || 'manual',
      authTests: {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        duration: 0,
        passRate: 0
      },
      environment: {
        nodeVersion: process.version,
        os: process.platform,
        isCI: !!process.env.CI,
        runner: process.env.RUNNER_OS || 'unknown'
      },
      errors: [],
      warnings: [],
      recommendations: []
    };
  }

  /**
   * Monitor E2E authentication tests
   */
  async monitorE2EAuthTests() {
    console.log('📊 Monitoring E2E authentication tests...');
    
    try {
      const testStartTime = Date.now();
      
      // Run authentication-specific E2E tests
      const testCommand = 'npx playwright test e2e/auth.spec.ts --reporter=json';
      
      let testOutput;
      let testExitCode = 0;
      
      try {
        testOutput = execSync(testCommand, { 
          encoding: 'utf8',
          timeout: 300000, // 5 minute timeout
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (error) {
        testExitCode = error.status || 1;
        testOutput = error.stdout || '';
        this.metrics.errors.push({
          type: 'test_execution_failed',
          message: error.message,
          stderr: error.stderr
        });
      }
      
      const testDuration = Date.now() - testStartTime;
      this.metrics.authTests.duration = testDuration;
      
      // Parse test results
      await this.parseTestResults(testOutput);
      
      // Calculate pass rate
      if (this.metrics.authTests.total > 0) {
        this.metrics.authTests.passRate = 
          (this.metrics.authTests.passed / this.metrics.authTests.total) * 100;
      }
      
      // Generate recommendations based on results
      this.generateRecommendations();
      
      console.log('✅ Authentication test monitoring completed');
      
    } catch (error) {
      console.error('❌ Authentication test monitoring failed:', error.message);
      this.metrics.errors.push({
        type: 'monitoring_failed',
        message: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Parse Playwright test results
   */
  async parseTestResults(testOutput) {
    try {
      // Look for JSON output or parse text output
      const lines = testOutput.split('\n');
      let jsonResult = null;
      
      // Try to find JSON report
      for (const line of lines) {
        if (line.trim().startsWith('{') && line.includes('tests')) {
          try {
            jsonResult = JSON.parse(line);
            break;
          } catch {
            // Not valid JSON, continue
          }
        }
      }
      
      if (jsonResult && jsonResult.tests) {
        // Parse JSON results
        for (const test of jsonResult.tests) {
          this.metrics.authTests.total++;
          
          if (test.status === 'passed') {
            this.metrics.authTests.passed++;
          } else if (test.status === 'failed') {
            this.metrics.authTests.failed++;
            this.metrics.errors.push({
              type: 'test_failed',
              testTitle: test.title,
              error: test.error
            });
          } else if (test.status === 'skipped') {
            this.metrics.authTests.skipped++;
          }
        }
      } else {
        // Parse text output as fallback
        this.parseTextOutput(testOutput);
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to parse test results:', error.message);
      this.metrics.warnings.push({
        type: 'parse_results_failed',
        message: error.message
      });
    }
  }

  /**
   * Parse text-based test output
   */
  parseTextOutput(output) {
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Look for Playwright test result patterns
      if (line.includes('✓') || line.includes('✔')) {
        this.metrics.authTests.passed++;
        this.metrics.authTests.total++;
      } else if (line.includes('✗') || line.includes('×')) {
        this.metrics.authTests.failed++;
        this.metrics.authTests.total++;
      } else if (line.includes('skipped')) {
        this.metrics.authTests.skipped++;
        this.metrics.authTests.total++;
      }
    }
  }

  /**
   * Generate recommendations based on metrics
   */
  generateRecommendations() {
    const { authTests } = this.metrics;
    
    // Check pass rate
    if (authTests.passRate < 90 && authTests.total > 0) {
      this.metrics.recommendations.push({
        type: 'low_pass_rate',
        severity: 'high',
        message: `Authentication test pass rate is ${authTests.passRate.toFixed(1)}% (below 90% threshold)`,
        action: 'Review authentication troubleshooting guide and investigate failing tests'
      });
    }
    
    // Check test duration
    if (authTests.duration > 180000) { // 3 minutes
      this.metrics.recommendations.push({
        type: 'slow_tests',
        severity: 'medium',
        message: `Authentication tests took ${(authTests.duration / 1000).toFixed(1)}s (over 3 minute threshold)`,
        action: 'Review adaptive timing configuration and CI environment performance'
      });
    }
    
    // Check for failures
    if (authTests.failed > 0) {
      this.metrics.recommendations.push({
        type: 'test_failures',
        severity: 'high',
        message: `${authTests.failed} authentication test(s) failed`,
        action: 'Check authentication troubleshooting guide and review error details'
      });
    }
    
    // Check for errors
    if (this.metrics.errors.length > 0) {
      this.metrics.recommendations.push({
        type: 'execution_errors',
        severity: 'critical',
        message: `${this.metrics.errors.length} error(s) occurred during monitoring`,
        action: 'Review error details and check CI environment configuration'
      });
    }
  }

  /**
   * Generate health score
   */
  calculateHealthScore() {
    let score = 100;
    
    // Deduct points for failures
    if (this.metrics.authTests.total > 0) {
      const failureRate = this.metrics.authTests.failed / this.metrics.authTests.total;
      score -= failureRate * 50; // Up to 50 points for failures
    }
    
    // Deduct points for slow tests
    if (this.metrics.authTests.duration > 120000) { // 2 minutes
      score -= 10;
    }
    
    // Deduct points for errors
    score -= this.metrics.errors.length * 10;
    
    // Deduct points for warnings
    score -= this.metrics.warnings.length * 5;
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Save metrics to file
   */
  async saveMetrics() {
    const metricsDir = path.join(process.cwd(), 'ci-metrics');
    
    // Ensure metrics directory exists
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }
    
    // Add health score
    this.metrics.healthScore = this.calculateHealthScore();
    
    // Save detailed metrics
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const metricsFile = path.join(metricsDir, `auth-health-${timestamp}.json`);
    
    fs.writeFileSync(metricsFile, JSON.stringify(this.metrics, null, 2));
    
    // Save latest metrics (for dashboard)
    const latestFile = path.join(metricsDir, 'auth-health-latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(this.metrics, null, 2));
    
    console.log(`📊 Metrics saved to: ${metricsFile}`);
    console.log(`📊 Latest metrics: ${latestFile}`);
    
    return metricsFile;
  }

  /**
   * Generate monitoring report
   */
  generateReport() {
    const { authTests, healthScore } = this.metrics;
    
    console.log('\n📊 Authentication Health Report');
    console.log('═══════════════════════════════════');
    console.log(`🎯 Health Score: ${healthScore}/100`);
    console.log(`📈 Test Pass Rate: ${authTests.passRate.toFixed(1)}%`);
    console.log(`✅ Tests Passed: ${authTests.passed}`);
    console.log(`❌ Tests Failed: ${authTests.failed}`);
    console.log(`⏭️  Tests Skipped: ${authTests.skipped}`);
    console.log(`📊 Total Tests: ${authTests.total}`);
    console.log(`⏱️  Duration: ${(authTests.duration / 1000).toFixed(1)}s`);
    console.log(`🏃 Runner: ${this.metrics.environment.runner}`);
    console.log(`🌿 Branch: ${this.metrics.branch}`);
    
    if (this.metrics.errors.length > 0) {
      console.log(`\n❌ Errors (${this.metrics.errors.length}):`);
      this.metrics.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.type}: ${error.message}`);
      });
    }
    
    if (this.metrics.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.metrics.warnings.length}):`);
      this.metrics.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning.type}: ${warning.message}`);
      });
    }
    
    if (this.metrics.recommendations.length > 0) {
      console.log(`\n💡 Recommendations (${this.metrics.recommendations.length}):`);
      this.metrics.recommendations.forEach((rec, index) => {
        const severity = rec.severity.toUpperCase();
        console.log(`  ${index + 1}. [${severity}] ${rec.message}`);
        console.log(`     → ${rec.action}`);
      });
    }
    
    console.log('\n═══════════════════════════════════\n');
  }

  /**
   * Check if alerts should be triggered
   */
  shouldTriggerAlert() {
    const { authTests, healthScore } = this.metrics;
    
    // Trigger alert if health score is below 80
    if (healthScore < 80) {
      return {
        trigger: true,
        severity: 'high',
        reason: `Health score dropped to ${healthScore}/100 (below 80 threshold)`
      };
    }
    
    // Trigger alert if pass rate is below 90%
    if (authTests.passRate < 90 && authTests.total > 0) {
      return {
        trigger: true,
        severity: 'medium',
        reason: `Authentication test pass rate is ${authTests.passRate.toFixed(1)}% (below 90% threshold)`
      };
    }
    
    // Trigger alert if there are critical errors
    const criticalErrors = this.metrics.errors.filter(e => 
      e.type === 'test_execution_failed' || e.type === 'monitoring_failed'
    );
    
    if (criticalErrors.length > 0) {
      return {
        trigger: true,
        severity: 'critical',
        reason: `${criticalErrors.length} critical error(s) detected`
      };
    }
    
    return { trigger: false };
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting CI Authentication Health Monitor');
  
  const monitor = new AuthHealthMonitor();
  
  try {
    // Monitor authentication tests
    await monitor.monitorE2EAuthTests();
    
    // Save metrics
    await monitor.saveMetrics();
    
    // Generate report
    monitor.generateReport();
    
    // Check for alerts
    const alertCheck = monitor.shouldTriggerAlert();
    if (alertCheck.trigger) {
      console.log(`🚨 ALERT TRIGGERED: ${alertCheck.severity.toUpperCase()}`);
      console.log(`📋 Reason: ${alertCheck.reason}`);
      
      // Set GitHub Actions output for alert handling
      if (process.env.GITHUB_ACTIONS) {
        console.log(`::warning::Authentication health alert: ${alertCheck.reason}`);
        console.log(`::set-output name=alert_triggered::true`);
        console.log(`::set-output name=alert_severity::${alertCheck.severity}`);
        console.log(`::set-output name=health_score::${monitor.metrics.healthScore}`);
      }
    } else {
      console.log('✅ No alerts triggered - authentication system healthy');
      
      if (process.env.GITHUB_ACTIONS) {
        console.log(`::set-output name=alert_triggered::false`);
        console.log(`::set-output name=health_score::${monitor.metrics.healthScore}`);
      }
    }
    
    console.log('🎉 Authentication health monitoring completed successfully');
    
  } catch (error) {
    console.error('💥 Authentication health monitoring failed:', error);
    
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::error::Authentication monitoring failed: ${error.message}`);
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { AuthHealthMonitor };