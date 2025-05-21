const fs = require('fs');
const path = require('path');
const { checkColorContrast } = require('../../src/lib/accessibility/colorContrast');

/**
 * Parse CSS file and extract CSS variables
 */
function parseCSSVariables(cssContent) {
  const variables = { dark: {} };
  
  // First extract the root selector content
  const rootSelectorRegex = /:root\s*{([^}]*)}/;
  const rootMatch = cssContent.match(rootSelectorRegex);
  
  if (rootMatch && rootMatch[1]) {
    // From the root content, match CSS variable declarations
    const rootContent = rootMatch[1];
    const varRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let match;
    
    while ((match = varRegex.exec(rootContent)) !== null) {
      const [, varName, value] = match;
      variables.dark[varName] = value.trim();
    }
  }
  
  return variables;
}

/**
 * Resolve CSS variable references
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
 * Validate color pairings against WCAG standards
 */
function validateColorPairings(config, cssVariables) {
  const results = [];
  
  for (const pairing of config.pairings) {
    for (const theme of pairing.themes) {
      const themeVars = cssVariables[theme] || cssVariables.dark;
      
      // Resolve CSS variables to hex values
      const foregroundResolved = resolveVariable(pairing.foreground, themeVars);
      const backgroundResolved = resolveVariable(pairing.background, themeVars);
      
      // Check contrast using the utility
      const contrastResult = checkColorContrast(
        foregroundResolved,
        backgroundResolved,
        {
          level: pairing.wcagLevel,
          size: pairing.textSize,
          cssVariables: themeVars
        }
      );
      
      results.push({
        name: pairing.name,
        foreground: pairing.foreground,
        foregroundResolved: contrastResult.foregroundColor,
        background: pairing.background,
        backgroundResolved: contrastResult.backgroundColor,
        contextDescription: pairing.contextDescription,
        theme,
        ratio: contrastResult.ratio,
        wcagLevel: pairing.wcagLevel,
        textSize: pairing.textSize,
        passes: contrastResult.passes
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

When implementing UI components, use only the approved color pairings listed above. For new color combinations, add them to \`docs/accessibility/color-pairings.config.json\` and regenerate this documentation.

## Updating This Document

This document is automatically generated. To update:

1. Edit \`docs/accessibility/color-pairings.config.json\`
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
    
    // Read configuration
    const configPath = path.join(process.cwd(), 'docs/accessibility/color-pairings.config.json');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    // Validate pairings
    const results = validateColorPairings(config, cssVariables);
    
    // Check for failures
    const failures = results.filter(r => !r.passes);
    if (failures.length > 0) {
      console.error('❌ Color pairing validation failed:');
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
      const outputPath = path.join(process.cwd(), 'docs/accessibility/APPROVED_COLOR_PAIRINGS.md');
      fs.writeFileSync(outputPath, markdown);
      console.log('✅ Generated color documentation at docs/accessibility/APPROVED_COLOR_PAIRINGS.md');
    } else {
      console.log('✅ All color pairings are compliant with WCAG standards');
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

module.exports = { generateColorDocs, validateColorPairings, parseCSSVariables };