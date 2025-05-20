const fs = require('fs');
const path = require('path');

/**
 * Parse CSS file and extract CSS variables with proper resolution
 */
function parseCSSVariables(cssContent) {
  const variables = {};
  
  // First pass: collect all direct values
  const varRegex = /(--[\w-]+):\s*([^;]+);/g;
  let match;
  
  while ((match = varRegex.exec(cssContent)) !== null) {
    const [, varName, value] = match;
    variables[varName] = value.trim();
  }
  
  // Second pass: resolve variable references
  const resolved = {};
  for (const [name, value] of Object.entries(variables)) {
    resolved[name] = resolveVariable(value, variables);
  }
  
  return { dark: resolved };
}

/**
 * Resolve CSS variable references recursively
 */
function resolveVariable(value, variables) {
  if (value.startsWith('var(')) {
    const varMatch = value.match(/var\((--[\w-]+)\)/);
    if (varMatch) {
      const varName = varMatch[1];
      const resolvedValue = variables[varName];
      if (resolvedValue) {
        // Recursively resolve in case the variable references another variable
        return resolveVariable(resolvedValue, variables);
      }
    }
  }
  return value;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance
 */
function calculateLuminance(rgb) {
  const rsRGB = rgb.r/255;
  const gsRGB = rgb.g/255;
  const bsRGB = rgb.b/255;

  const r = rsRGB <= 0.03928 ? rsRGB/12.92 : Math.pow((rsRGB + 0.055)/1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB/12.92 : Math.pow((gsRGB + 0.055)/1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB/12.92 : Math.pow((bsRGB + 0.055)/1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio
 */
function calculateContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = calculateLuminance(rgb1);
  const lum2 = calculateLuminance(rgb2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG standards
 */
function meetsWCAG(ratio, level, size) {
  if (level === 'AA') {
    return size === 'normal' ? ratio >= 4.5 : ratio >= 3.0;
  } else if (level === 'AAA') {
    return size === 'normal' ? ratio >= 7.0 : ratio >= 4.5;
  }
  return false;
}

/**
 * Validate color pairings
 */
function validateColorPairings(config, cssVariables) {
  const results = [];
  
  for (const pairing of config.pairings) {
    for (const theme of pairing.themes) {
      const themeVars = cssVariables[theme] || cssVariables.dark;
      
      // Debug logging
      console.log(`\nProcessing: ${pairing.name}`);
      console.log(`Foreground: ${pairing.foreground} -> ${themeVars[pairing.foreground.replace('var(', '').replace(')', '')]}`);
      console.log(`Background: ${pairing.background} -> ${themeVars[pairing.background.replace('var(', '').replace(')', '')]}`);
      
      // Resolve CSS variables to actual values
      let foregroundResolved = pairing.foreground;
      let backgroundResolved = pairing.background;
      
      // Handle var() syntax
      if (foregroundResolved.startsWith('var(')) {
        const varName = foregroundResolved.replace('var(', '').replace(')', '');
        foregroundResolved = themeVars[varName] || foregroundResolved;
      }
      
      if (backgroundResolved.startsWith('var(')) {
        const varName = backgroundResolved.replace('var(', '').replace(')', '');
        backgroundResolved = themeVars[varName] || backgroundResolved;
      }
      
      // Calculate contrast
      const ratio = calculateContrastRatio(foregroundResolved, backgroundResolved);
      const passes = meetsWCAG(ratio, pairing.wcagLevel, pairing.textSize);
      
      results.push({
        name: pairing.name,
        foreground: pairing.foreground,
        foregroundResolved,
        background: pairing.background,
        backgroundResolved,
        contextDescription: pairing.contextDescription,
        theme,
        ratio,
        wcagLevel: pairing.wcagLevel,
        textSize: pairing.textSize,
        passes
      });
    }
  }
  
  return results;
}

/**
 * Generate markdown documentation
 */
function generateMarkdown(results) {
  let markdown = `# Approved Color Pairings

This document lists all approved color pairings for the GitPulse application, along with their WCAG contrast ratios and compliance status.

## WCAG Standards

The Web Content Accessibility Guidelines (WCAG) 2.1 defines minimum contrast ratios:

| Level | Normal Text | Large Text |
|-------|------------|------------|
| AA    | 4.5:1      | 3:1        |
| AAA   | 7:1        | 4.5:1      |

- **Normal Text**: Less than 18pt, or less than 14pt if bold
- **Large Text**: 18pt or larger, or 14pt or larger if bold

## Color Contrast Utility

All contrast calculations use the centralized utility at \`src/lib/accessibility/colorContrast.ts\`.

## Approved Pairings

`;

  // Group results by theme
  const resultsByTheme = results.reduce((acc, result) => {
    if (!acc[result.theme]) {
      acc[result.theme] = [];
    }
    acc[result.theme].push(result);
    return acc;
  }, {});

  for (const [theme, themeResults] of Object.entries(resultsByTheme)) {
    markdown += `### ${theme.charAt(0).toUpperCase() + theme.slice(1)} Theme

| Name | Foreground | Background | Context | Ratio | Required | Status |
|------|------------|------------|---------|-------|----------|--------|
`;

    for (const result of themeResults) {
      const status = result.passes ? '✅ Pass' : '❌ Fail';
      const required = `${result.wcagLevel} (${result.textSize})`;
      
      markdown += `| ${result.name} | ${result.foreground}<br/>${result.foregroundResolved} | ${result.background}<br/>${result.backgroundResolved} | ${result.contextDescription} | ${result.ratio.toFixed(2)}:1 | ${required} | ${status} |\n`;
    }
    
    markdown += '\n';
  }

  // Add summary
  const failingPairings = results.filter(r => !r.passes);
  if (failingPairings.length > 0) {
    markdown += `## ⚠️ Non-Compliant Pairings

The following pairings do not meet their specified WCAG requirements:

`;
    for (const failing of failingPairings) {
      markdown += `- **${failing.name}** (${failing.theme}): ${failing.ratio.toFixed(2)}:1 (requires ${failing.wcagLevel} ${failing.textSize})\n`;
    }
  } else {
    markdown += `## ✅ All Pairings Compliant

All defined color pairings meet their specified WCAG requirements.
`;
  }

  markdown += `
## Usage

When implementing UI components, use only the approved color pairings listed above. For new color combinations, add them to \`docs/color-pairings.config.json\` and regenerate this documentation.

## Updating This Document

This document is automatically generated. To update:

1. Edit \`docs/color-pairings.config.json\`
2. Run \`npm run generate-color-docs\`  
3. Commit both files

Generated on: ${new Date().toISOString()}
`;

  return markdown;
}

/**
 * Main function to generate color documentation
 */
async function generateColorDocs(validateOnly = false) {
  try {
    // Read CSS file
    const cssPath = path.join(process.cwd(), 'src/app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    const cssVariables = parseCSSVariables(cssContent);
    
    console.log('Parsed CSS variables:', JSON.stringify(cssVariables.dark, null, 2));
    
    // Read configuration
    const configPath = path.join(process.cwd(), 'docs/color-pairings.config.json');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    // Validate pairings
    const results = validateColorPairings(config, cssVariables);
    
    // Check for failures
    const failures = results.filter(r => !r.passes);
    if (failures.length > 0) {
      console.error('\n❌ Color pairing validation failed:');
      for (const failure of failures) {
        console.error(`  - ${failure.name} (${failure.theme}): ${failure.ratio.toFixed(2)}:1 (requires ${failure.wcagLevel} ${failure.textSize})`);
      }
      
      if (validateOnly) {
        process.exit(1);
      }
    }
    
    // Generate documentation if not in validate-only mode
    if (!validateOnly) {
      const markdown = generateMarkdown(results);
      const outputPath = path.join(process.cwd(), 'docs/APPROVED_COLOR_PAIRINGS.md');
      fs.writeFileSync(outputPath, markdown);
      console.log('\n✅ Generated color documentation at docs/APPROVED_COLOR_PAIRINGS.md');
    } else {
      console.log('\n✅ All color pairings are compliant with WCAG standards');
    }
    
  } catch (error) {
    console.error('Error generating color documentation:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  const validateOnly = process.argv.includes('--validate');
  generateColorDocs(validateOnly);
}