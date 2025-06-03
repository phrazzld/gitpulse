#!/usr/bin/env node

/**
 * Coverage Format Validation Script
 * 
 * Validates Jest coverage JSON format to prevent CI failures caused by
 * malformed coverage files. Designed for pre-commit hook integration.
 * 
 * Usage:
 *   node scripts/coverage/validate-coverage-format.js [coverage-file]
 *   
 * Exit codes:
 *   0 - Valid coverage format
 *   1 - Invalid coverage format or file errors
 *   2 - No coverage files found
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_COVERAGE_PATHS = [
  'coverage/coverage-final.json',
  'coverage/coverage.json', 
  'coverage-final.json',
  'coverage.json'
];

const COMMON_MALFORMATION_PATTERNS = [
  {
    pattern: /^,/,
    name: 'Leading comma',
    description: 'JSON starts with a comma',
    fix: 'Remove the leading comma from the beginning of the file'
  },
  {
    pattern: /,\s*}$/,
    name: 'Trailing comma before closing brace',
    description: 'Extra comma before closing object brace',
    fix: 'Remove the trailing comma before the closing brace'
  },
  {
    pattern: /,\s*]$/,
    name: 'Trailing comma before closing bracket',
    description: 'Extra comma before closing array bracket', 
    fix: 'Remove the trailing comma before the closing bracket'
  },
  {
    pattern: /}\s*{/,
    name: 'Missing comma between objects',
    description: 'Objects not properly separated by commas',
    fix: 'Add commas between object definitions'
  }
];

/**
 * Find coverage files to validate
 */
function findCoverageFiles(specifiedFile = null) {
  if (specifiedFile) {
    if (!fs.existsSync(specifiedFile)) {
      throw new Error(`Specified coverage file not found: ${specifiedFile}`);
    }
    return [specifiedFile];
  }
  
  const foundFiles = [];
  for (const coveragePath of DEFAULT_COVERAGE_PATHS) {
    if (fs.existsSync(coveragePath)) {
      foundFiles.push(coveragePath);
    }
  }
  
  return foundFiles;
}

/**
 * Validate JSON syntax using native parser
 */
function validateJsonSyntax(content, filePath) {
  try {
    JSON.parse(content);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      location: extractErrorLocation(error.message),
      suggestions: generateFixSuggestions(content, error.message)
    };
  }
}

/**
 * Extract line/column information from JSON parse error
 */
function extractErrorLocation(errorMessage) {
  // Parse common JSON error patterns
  const positionMatch = errorMessage.match(/position (\d+)/);
  const lineMatch = errorMessage.match(/line (\d+)/);
  const columnMatch = errorMessage.match(/column (\d+)/);
  
  return {
    position: positionMatch ? parseInt(positionMatch[1]) : null,
    line: lineMatch ? parseInt(lineMatch[1]) : null,
    column: columnMatch ? parseInt(columnMatch[1]) : null
  };
}

/**
 * Generate fix suggestions based on error patterns
 */
function generateFixSuggestions(content, errorMessage) {
  const suggestions = [];
  
  for (const pattern of COMMON_MALFORMATION_PATTERNS) {
    if (pattern.pattern.test(content)) {
      suggestions.push({
        issue: pattern.name,
        description: pattern.description,
        fix: pattern.fix
      });
    }
  }
  
  // Additional context-specific suggestions
  if (errorMessage.includes('Unexpected token')) {
    suggestions.push({
      issue: 'Syntax error',
      description: 'Invalid JSON character or structure',
      fix: 'Check for unescaped quotes, missing commas, or invalid characters'
    });
  }
  
  if (errorMessage.includes('Unexpected end of JSON')) {
    suggestions.push({
      issue: 'Incomplete JSON',
      description: 'File appears to be truncated or incomplete',
      fix: 'Ensure the file ends with proper closing braces/brackets'
    });
  }
  
  return suggestions;
}

/**
 * Validate coverage file structure and content
 */
function validateCoverageStructure(coverageData, filePath) {
  const issues = [];
  
  // Check if it's a valid coverage object
  if (typeof coverageData !== 'object' || coverageData === null) {
    issues.push({
      type: 'structure',
      message: 'Coverage data is not a valid object',
      fix: 'Ensure the file contains a valid JSON object'
    });
    return { valid: false, issues };
  }
  
  // Check for common coverage properties
  const expectedProperties = ['total', 'files'];
  const hasExpectedStructure = expectedProperties.some(prop => 
    coverageData.hasOwnProperty(prop) || 
    Object.keys(coverageData).some(key => key.includes(prop))
  );
  
  // If it doesn't look like coverage data, warn but don't fail
  if (!hasExpectedStructure && Object.keys(coverageData).length > 0) {
    // Check if it might be Istanbul/NYC format (file paths as keys)
    const hasFilePathKeys = Object.keys(coverageData).some(key => 
      key.includes('/') || key.includes('\\') || key.endsWith('.js') || key.endsWith('.ts')
    );
    
    if (!hasFilePathKeys) {
      issues.push({
        type: 'warning',
        message: 'File does not appear to contain standard coverage data structure',
        fix: 'Verify this is the correct coverage output file'
      });
    }
  }
  
  return { valid: issues.filter(i => i.type !== 'warning').length === 0, issues };
}

/**
 * Display validation results
 */
function displayResults(results) {
  const hasErrors = results.some(r => !r.valid);
  const hasWarnings = results.some(r => r.issues && r.issues.some(i => i.type === 'warning'));
  
  if (!hasErrors && !hasWarnings) {
    console.log('✅ All coverage files have valid format');
    return;
  }
  
  console.log('\n📊 Coverage Format Validation Results:');
  console.log('=====================================\n');
  
  results.forEach(result => {
    if (!result.valid) {
      console.log(`❌ ${result.file}:`);
      
      if (result.syntaxError) {
        console.log(`   Syntax Error: ${result.syntaxError.error}`);
        
        if (result.syntaxError.location.line) {
          console.log(`   Location: Line ${result.syntaxError.location.line}, Column ${result.syntaxError.location.column}`);
        }
        
        if (result.syntaxError.suggestions.length > 0) {
          console.log('   Suggested fixes:');
          result.syntaxError.suggestions.forEach(suggestion => {
            console.log(`     • ${suggestion.issue}: ${suggestion.fix}`);
          });
        }
      }
      
      if (result.structureIssues) {
        result.structureIssues.forEach(issue => {
          if (issue.type === 'warning') {
            console.log(`   ⚠️  Warning: ${issue.message}`);
          } else {
            console.log(`   Structure Error: ${issue.message}`);
          }
          console.log(`   Fix: ${issue.fix}`);
        });
      }
      
      console.log();
    } else if (result.issues && result.issues.some(i => i.type === 'warning')) {
      console.log(`⚠️  ${result.file}:`);
      result.issues.filter(i => i.type === 'warning').forEach(issue => {
        console.log(`   Warning: ${issue.message}`);
        console.log(`   Suggestion: ${issue.fix}`);
      });
      console.log();
    } else {
      console.log(`✅ ${result.file}: Valid format`);
    }
  });
  
  if (hasErrors) {
    console.log('\n💡 Common solutions:');
    console.log('  • Regenerate coverage: npm test -- --coverage');
    console.log('  • Check Jest configuration in jest.config.js');
    console.log('  • Ensure coverage directory is not corrupted');
    console.log('  • Review recent changes to test files or configuration');
    console.log('\n📚 For more help, see project documentation or run: npm run help');
  }
}

/**
 * Main validation function
 */
async function validateCoverageFormat(specifiedFile = null) {
  try {
    // Find coverage files
    const coverageFiles = findCoverageFiles(specifiedFile);
    
    if (coverageFiles.length === 0) {
      console.log('ℹ️  No coverage files found to validate');
      console.log('   Expected locations:');
      DEFAULT_COVERAGE_PATHS.forEach(path => console.log(`     - ${path}`));
      console.log('\n   Run tests with coverage to generate files: npm test -- --coverage');
      return 2; // No files found
    }
    
    const results = [];
    
    // Validate each coverage file
    for (const filePath of coverageFiles) {
      const result = { file: filePath, valid: true };
      
      try {
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.trim().length === 0) {
          result.valid = false;
          result.structureIssues = [{
            type: 'error',
            message: 'Coverage file is empty',
            fix: 'Regenerate coverage data with: npm test -- --coverage'
          }];
        } else {
          // Validate JSON syntax
          const syntaxValidation = validateJsonSyntax(content, filePath);
          
          if (!syntaxValidation.valid) {
            result.valid = false;
            result.syntaxError = syntaxValidation;
          } else {
            // Parse and validate structure
            const coverageData = JSON.parse(content);
            const structureValidation = validateCoverageStructure(coverageData, filePath);
            
            if (!structureValidation.valid) {
              result.valid = false;
            }
            
            if (structureValidation.issues.length > 0) {
              result.issues = structureValidation.issues;
            }
          }
        }
        
      } catch (error) {
        result.valid = false;
        result.fileError = error.message;
      }
      
      results.push(result);
    }
    
    // Display results
    displayResults(results);
    
    // Return appropriate exit code
    const hasErrors = results.some(r => !r.valid);
    return hasErrors ? 1 : 0;
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return 1;
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const specifiedFile = args[0];
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Coverage Format Validation Script');
    console.log('=================================\n');
    console.log('Usage:');
    console.log('  node scripts/coverage/validate-coverage-format.js [coverage-file]');
    console.log('\nOptions:');
    console.log('  coverage-file  Specific coverage file to validate (optional)');
    console.log('  -h, --help     Show this help message');
    console.log('\nExit codes:');
    console.log('  0  Valid coverage format');
    console.log('  1  Invalid coverage format or errors');
    console.log('  2  No coverage files found');
    console.log('\nDefault coverage file locations:');
    DEFAULT_COVERAGE_PATHS.forEach(path => console.log(`  - ${path}`));
    return 0;
  }
  
  const exitCode = await validateCoverageFormat(specifiedFile);
  process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
}

module.exports = { validateCoverageFormat, findCoverageFiles, validateJsonSyntax };