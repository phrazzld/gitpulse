#!/usr/bin/env node

/**
 * Authentication Configuration Validation Script
 * 
 * Validates that authentication configuration is consistent across all CI workflows
 * and detects configuration drift between workflows.
 * 
 * Usage:
 *   node scripts/ci/validate-auth-configuration.js
 *   npm run validate:auth-config
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class AuthConfigValidator {
  constructor() {
    this.workflows = {
      main: '.github/workflows/ci.yml',
      e2e: '.github/workflows/e2e-tests.yml', 
      monitoring: '.github/workflows/auth-monitoring.yml'
    };
    
    this.compositeActions = {
      setup: '.github/actions/auth-setup/action.yml',
      cleanup: '.github/actions/auth-cleanup/action.yml'
    };
    
    this.requiredEnvVars = [
      'E2E_MOCK_AUTH_ENABLED',
      'NODE_ENV',
      'NEXTAUTH_URL',
      'NEXT_PUBLIC_GITHUB_APP_NAME',
      'NEXTAUTH_SECRET',
      'GITHUB_OAUTH_CLIENT_ID',
      'GITHUB_OAUTH_CLIENT_SECRET'
    ];
    
    // Environment variables that are allowed to have different values across workflows
    this.allowedDriftVars = new Set([
      'NODE_ENV',          // Main CI uses 'test', E2E uses 'production' for build
      'DEBUG',             // Different debug levels for different workflows
      'GEMINI_API_KEY',    // Only needed in certain workflows
      'A11Y_FAILING_IMPACTS', // Accessibility config may vary
      'LHCI_BUILD_CONTEXT__GITHUB_REPO_OWNER', // Lighthouse CI specific
      'LHCI_BUILD_CONTEXT__GITHUB_REPO_NAME',
      'LHCI_BUILD_CONTEXT__GITHUB_RUN_ID',
      'LHCI_BUILD_CONTEXT__CURRENT_HASH',
      'LHCI_BUILD_CONTEXT__COMMIT_TIME',
      'LHCI_TOKEN'
    ]);
    
    this.results = {
      workflows: {},
      compositeActions: {},
      validationErrors: [],
      configDrift: [],
      summary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        warningChecks: 0
      }
    };
  }

  /**
   * Main validation entry point
   */
  async validate() {
    console.log('🔍 Starting authentication configuration validation...\n');
    
    try {
      await this.validateWorkflows();
      await this.validateCompositeActions();
      await this.detectConfigurationDrift();
      await this.validateAuthenticationReadiness();
      
      this.generateReport();
      this.saveResults();
      
      return this.results.summary.failedChecks === 0;
    } catch (error) {
      console.error('❌ Validation failed with error:', error.message);
      this.results.validationErrors.push({
        type: 'FATAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  /**
   * Validate all workflow files
   */
  async validateWorkflows() {
    console.log('📋 Validating workflow configurations...\n');
    
    for (const [name, workflowPath] of Object.entries(this.workflows)) {
      try {
        const workflowContent = fs.readFileSync(workflowPath, 'utf8');
        const workflow = yaml.load(workflowContent);
        
        this.results.workflows[name] = await this.validateWorkflow(name, workflow, workflowPath);
        
        console.log(`✅ Workflow '${name}' validation completed`);
      } catch (error) {
        console.error(`❌ Failed to validate workflow '${name}':`, error.message);
        this.addValidationError('WORKFLOW_ERROR', `Failed to validate ${name}: ${error.message}`);
      }
    }
  }

  /**
   * Validate individual workflow
   */
  async validateWorkflow(name, workflow, filePath) {
    const result = {
      path: filePath,
      envVars: {},
      usesCompositeActions: false,
      authenticationSteps: [],
      validationIssues: []
    };

    // Find jobs that use authentication
    for (const [jobName, job] of Object.entries(workflow.jobs || {})) {
      if (this.isAuthenticationJob(job)) {
        // Check for composite action usage
        const setupStep = this.findCompositeActionStep(job.steps, 'auth-setup');
        const cleanupStep = this.findCompositeActionStep(job.steps, 'auth-cleanup');
        
        if (setupStep && cleanupStep) {
          result.usesCompositeActions = true;
          result.authenticationSteps.push({
            job: jobName,
            setup: setupStep,
            cleanup: cleanupStep
          });
        } else {
          result.validationIssues.push({
            type: 'MISSING_COMPOSITE_ACTION',
            job: jobName,
            message: 'Job uses authentication but missing composite actions'
          });
        }

        // Extract environment variables
        this.extractEnvironmentVariables(job, result.envVars);
      }
    }

    this.incrementCheck();
    if (result.validationIssues.length === 0) {
      this.incrementPassed();
    } else {
      this.incrementFailed();
    }

    return result;
  }

  /**
   * Validate composite actions exist and are properly configured
   */
  async validateCompositeActions() {
    console.log('\n🔧 Validating composite actions...\n');
    
    for (const [name, actionPath] of Object.entries(this.compositeActions)) {
      try {
        if (!fs.existsSync(actionPath)) {
          this.addValidationError('MISSING_COMPOSITE_ACTION', `Composite action not found: ${actionPath}`);
          continue;
        }
        
        const actionContent = fs.readFileSync(actionPath, 'utf8');
        const action = yaml.load(actionContent);
        
        this.results.compositeActions[name] = this.validateCompositeAction(name, action, actionPath);
        
        console.log(`✅ Composite action '${name}' validation completed`);
      } catch (error) {
        console.error(`❌ Failed to validate composite action '${name}':`, error.message);
        this.addValidationError('COMPOSITE_ACTION_ERROR', `Failed to validate ${name}: ${error.message}`);
      }
    }
  }

  /**
   * Validate individual composite action
   */
  validateCompositeAction(name, action, filePath) {
    const result = {
      path: filePath,
      inputs: action.inputs || {},
      outputs: action.outputs || {},
      steps: action.runs?.steps || [],
      validationIssues: []
    };

    // Validate required inputs for setup action
    if (name === 'setup') {
      const requiredInputs = ['auth_context'];
      for (const input of requiredInputs) {
        if (!result.inputs[input]) {
          result.validationIssues.push({
            type: 'MISSING_INPUT',
            input,
            message: `Required input '${input}' not defined`
          });
        }
      }
    }

    // Validate cleanup action has server_pid input
    if (name === 'cleanup') {
      if (!result.inputs.server_pid) {
        result.validationIssues.push({
          type: 'MISSING_INPUT',
          input: 'server_pid',
          message: 'Cleanup action missing server_pid input'
        });
      }
    }

    this.incrementCheck();
    if (result.validationIssues.length === 0) {
      this.incrementPassed();
    } else {
      this.incrementFailed();
    }

    return result;
  }

  /**
   * Detect configuration drift between workflows
   */
  async detectConfigurationDrift() {
    console.log('\n🔄 Detecting configuration drift...\n');
    
    const workflows = Object.values(this.results.workflows);
    const baseWorkflow = workflows[0];
    
    if (!baseWorkflow) {
      this.addValidationError('NO_WORKFLOWS', 'No workflows found for drift detection');
      return;
    }

    // Compare environment variables across workflows
    const envVarDrift = this.detectEnvironmentVariableDrift();
    const compositeActionDrift = this.detectCompositeActionDrift();
    
    this.results.configDrift = [...envVarDrift, ...compositeActionDrift];
    
    if (this.results.configDrift.length === 0) {
      console.log('✅ No configuration drift detected');
      this.incrementCheck();
      this.incrementPassed();
    } else {
      console.log(`⚠️ Configuration drift detected: ${this.results.configDrift.length} issues`);
      this.incrementCheck();
      this.incrementFailed();
    }
  }

  /**
   * Detect environment variable drift
   */
  detectEnvironmentVariableDrift() {
    const drift = [];
    const workflowNames = Object.keys(this.results.workflows);
    
    for (const envVar of this.requiredEnvVars) {
      // Skip variables that are allowed to have different values
      if (this.allowedDriftVars.has(envVar)) {
        continue;
      }
      
      const values = new Map();
      
      // Collect values across workflows
      for (const workflowName of workflowNames) {
        const workflow = this.results.workflows[workflowName];
        if (workflow.envVars[envVar]) {
          values.set(workflowName, workflow.envVars[envVar]);
        }
      }
      
      // Check for inconsistencies
      if (values.size > 1) {
        const uniqueValues = [...new Set(values.values())];
        if (uniqueValues.length > 1) {
          drift.push({
            type: 'ENV_VAR_DRIFT',
            variable: envVar,
            workflows: Object.fromEntries(values),
            message: `Environment variable '${envVar}' has different values across workflows`
          });
        }
      }
    }
    
    return drift;
  }

  /**
   * Detect composite action usage drift
   */
  detectCompositeActionDrift() {
    const drift = [];
    const workflowNames = Object.keys(this.results.workflows);
    
    for (const workflowName of workflowNames) {
      const workflow = this.results.workflows[workflowName];
      
      // Skip workflows that don't use authentication
      if (workflow.authenticationSteps.length === 0) {
        continue;
      }
      
      if (!workflow.usesCompositeActions) {
        drift.push({
          type: 'COMPOSITE_ACTION_DRIFT',
          workflow: workflowName,
          message: `Workflow '${workflowName}' uses authentication but not composite actions`
        });
      }
    }
    
    return drift;
  }

  /**
   * Validate authentication readiness across all workflows
   */
  async validateAuthenticationReadiness() {
    console.log('\n🛡️ Validating authentication readiness...\n');
    
    // Check that all required environment variables are defined somewhere
    const definedEnvVars = new Set();
    
    for (const workflow of Object.values(this.results.workflows)) {
      Object.keys(workflow.envVars).forEach(envVar => definedEnvVars.add(envVar));
    }
    
    for (const requiredVar of this.requiredEnvVars) {
      this.incrementCheck();
      
      if (definedEnvVars.has(requiredVar)) {
        this.incrementPassed();
      } else {
        this.incrementFailed();
        this.addValidationError('MISSING_ENV_VAR', `Required environment variable '${requiredVar}' not found in any workflow`);
      }
    }
    
    // Check that composite actions are being used consistently
    const authWorkflows = Object.entries(this.results.workflows)
      .filter(([_, workflow]) => workflow.authenticationSteps.length > 0);
    
    for (const [workflowName, workflow] of authWorkflows) {
      this.incrementCheck();
      
      if (workflow.usesCompositeActions) {
        this.incrementPassed();
        console.log(`✅ Workflow '${workflowName}' uses composite actions correctly`);
      } else {
        this.incrementFailed();
        console.log(`❌ Workflow '${workflowName}' should use composite actions`);
      }
    }
  }

  /**
   * Helper methods
   */
  isAuthenticationJob(job) {
    const steps = job.steps || [];
    return steps.some(step => 
      step.uses?.includes('auth-setup') ||
      step.uses?.includes('auth-cleanup') ||
      step.name?.toLowerCase().includes('auth') ||
      (step.env && Object.keys(step.env).some(key => key.includes('AUTH')))
    );
  }

  findCompositeActionStep(steps, actionName) {
    return steps.find(step => step.uses?.includes(actionName));
  }

  extractEnvironmentVariables(job, envVars) {
    // Extract from job-level env
    if (job.env) {
      Object.assign(envVars, job.env);
    }
    
    // Extract from step-level env
    for (const step of job.steps || []) {
      if (step.env) {
        Object.assign(envVars, step.env);
      }
    }
  }

  addValidationError(type, message) {
    this.results.validationErrors.push({
      type,
      message,
      timestamp: new Date().toISOString()
    });
    
    console.error(`❌ ${type}: ${message}`);
  }

  incrementCheck() { this.results.summary.totalChecks++; }
  incrementPassed() { this.results.summary.passedChecks++; }
  incrementFailed() { this.results.summary.failedChecks++; }
  incrementWarning() { this.results.summary.warningChecks++; }

  /**
   * Generate validation report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUTHENTICATION CONFIGURATION VALIDATION REPORT');
    console.log('='.repeat(60));
    
    const { totalChecks, passedChecks, failedChecks, warningChecks } = this.results.summary;
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Checks: ${totalChecks}`);
    console.log(`   ✅ Passed: ${passedChecks}`);
    console.log(`   ❌ Failed: ${failedChecks}`);
    console.log(`   ⚠️ Warnings: ${warningChecks}`);
    console.log(`   🎯 Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}%`);
    
    if (this.results.validationErrors.length > 0) {
      console.log(`\n❌ Validation Errors (${this.results.validationErrors.length}):`);
      this.results.validationErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.type}: ${error.message}`);
      });
    }
    
    if (this.results.configDrift.length > 0) {
      console.log(`\n🔄 Configuration Drift (${this.results.configDrift.length}):`);
      this.results.configDrift.forEach((drift, index) => {
        console.log(`   ${index + 1}. ${drift.type}: ${drift.message}`);
      });
    }
    
    console.log('\n📋 Workflow Analysis:');
    for (const [name, workflow] of Object.entries(this.results.workflows)) {
      console.log(`   ${name}:`);
      console.log(`     Uses Composite Actions: ${workflow.usesCompositeActions ? '✅' : '❌'}`);
      console.log(`     Authentication Steps: ${workflow.authenticationSteps.length}`);
      console.log(`     Environment Variables: ${Object.keys(workflow.envVars).length}`);
      console.log(`     Validation Issues: ${workflow.validationIssues.length}`);
    }
    
    const isValid = failedChecks === 0;
    console.log(`\n🏆 Overall Status: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (!isValid) {
      console.log('\n🔧 Recommendations:');
      console.log('   1. Fix all validation errors listed above');
      console.log('   2. Ensure all authentication workflows use composite actions');
      console.log('   3. Align environment variable configuration across workflows');
      console.log('   4. Review authentication readiness checks');
    }
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * Save validation results to file
   */
  saveResults() {
    const outputDir = 'ci-metrics';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, 'auth-config-validation.json');
    const resultsWithMetadata = {
      ...this.results,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        validator: 'AuthConfigValidator',
        nodeVersion: process.version
      }
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(resultsWithMetadata, null, 2));
    console.log(`💾 Results saved to: ${outputFile}`);
  }
}

// Main execution
async function main() {
  const validator = new AuthConfigValidator();
  const isValid = await validator.validate();
  
  process.exit(isValid ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { AuthConfigValidator };