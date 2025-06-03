#!/usr/bin/env node

/**
 * Simple Fix for Coverage JSON Format
 * 
 * Jest's json-summary reporter generates malformed JSON.
 * This script simply reconstructs it by treating the content correctly.
 */

const fs = require('fs');
const path = require('path');

function fixCoverageJsonSimple(inputFile, outputFile) {
  try {
    // Read the malformed JSON file
    const content = fs.readFileSync(inputFile, 'utf8').trim();
    
    // The file is actually almost valid JSON, but missing the closing brace
    // and has some formatting issues. Let's try to parse it by adding the closing brace.
    
    let fixedContent = content;
    
    // If it doesn't end with }, add it
    if (!fixedContent.endsWith('}')) {
      fixedContent += '}';
    }
    
    // Try to parse it
    let parsedData;
    try {
      parsedData = JSON.parse(fixedContent);
    } catch (err) {
      // If that fails, try reconstructing by reading the content differently
      console.log('Direct parsing failed, trying line-by-line reconstruction...');
      
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);
      
      // Build a proper JSON object
      const jsonParts = [];
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Remove leading comma if present
        if (line.startsWith(',')) {
          line = line.slice(1);
        }
        
        jsonParts.push(line);
      }
      
      // Join all parts and wrap in braces
      const reconstructed = '{' + jsonParts.join(',') + '}';
      
      try {
        parsedData = JSON.parse(reconstructed);
      } catch (err2) {
        throw new Error(`Both parsing attempts failed. Direct: ${err.message}, Reconstructed: ${err2.message}`);
      }
    }
    
    // Write the properly formatted JSON
    fs.writeFileSync(outputFile, JSON.stringify(parsedData, null, 2));
    
    console.log(`✅ Fixed coverage JSON: ${inputFile} → ${outputFile}`);
    
    // Validate the output
    const validationContent = fs.readFileSync(outputFile, 'utf8');
    const validated = JSON.parse(validationContent);
    
    console.log(`✅ Output JSON validation passed (${Object.keys(validated).length} keys)`);
    console.log(`✅ Total coverage found: lines=${validated.total?.lines?.pct}%`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error fixing coverage JSON: ${error.message}`);
    return false;
  }
}

// Main execution
if (require.main === module) {
  const inputFile = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  const outputFile = path.join(process.cwd(), 'coverage', 'coverage-summary-fixed.json');
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Coverage file not found: ${inputFile}`);
    process.exit(1);
  }
  
  const success = fixCoverageJsonSimple(inputFile, outputFile);
  process.exit(success ? 0 : 1);
}

module.exports = { fixCoverageJsonSimple };