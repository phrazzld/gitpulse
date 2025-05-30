#!/usr/bin/env node

/**
 * Test script for ModeSelector CustomTheme story color contrast
 * Checks WCAG compliance for the specified color combinations
 */

// Since we're using CommonJS, we'll need to import the TypeScript module dynamically
const { promises: fs } = require('fs');
const path = require('path');

async function loadColorContrastModule() {
  // Read and evaluate the TypeScript module manually for this test
  const tsContent = await fs.readFile(
    path.join(__dirname, '../src/lib/accessibility/colorContrast.ts'),
    'utf-8'
  );
  
  // For simplicity, we'll implement the core functions here
  const parseColor = (colorString) => {
    const color = colorString.trim().toLowerCase();
    
    // Handle hex colors
    if (color.startsWith('#')) {
      let r = 0, g = 0, b = 0, a = 1;
      
      if (color.length === 7) {
        r = parseInt(color.substring(1, 3), 16);
        g = parseInt(color.substring(3, 5), 16);
        b = parseInt(color.substring(5, 7), 16);
      }
      
      return { r, g, b };
    }
    
    // Handle rgba format
    const rgbaMatch = color.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
    if (rgbaMatch) {
      return {
        r: parseInt(rgbaMatch[1], 10),
        g: parseInt(rgbaMatch[2], 10),
        b: parseInt(rgbaMatch[3], 10),
        a: parseFloat(rgbaMatch[4])
      };
    }
    
    return null;
  };
  
  const blendColors = (fg, bg) => {
    const alpha = fg.a;
    return {
      r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
      g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
      b: Math.round(fg.b * alpha + bg.b * (1 - alpha))
    };
  };
  
  const linearize = (colorComponent) => {
    const value = colorComponent / 255;
    if (value <= 0.03928) {
      return value / 12.92;
    } else {
      return Math.pow((value + 0.055) / 1.055, 2.4);
    }
  };
  
  const calculateLuminance = (color) => {
    const r = linearize(color.r);
    const g = linearize(color.g);
    const b = linearize(color.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const calculateContrastRatio = (fg, bg) => {
    const foreground = fg.a && fg.a < 1 ? blendColors(fg, bg) : fg;
    const fgLuminance = calculateLuminance(foreground);
    const bgLuminance = calculateLuminance(bg);
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    return (lighter + 0.05) / (darker + 0.05);
  };
  
  return { parseColor, calculateContrastRatio };
}

async function testColorContrast() {
  console.log('=== ModeSelector CustomTheme Story Color Contrast Test ===\n');
  
  const { parseColor, calculateContrastRatio } = await loadColorContrastModule();
  
  // Test colors from the CustomTheme story
  const colors = {
    accentColor: '#FF5733',        // orange-red
    secondaryColor: '#C70039',     // darker red
    textColor: '#ffffff',          // white
    backgroundColor: 'rgba(30, 30, 30, 0.8)' // dark gray with opacity
  };
  
  // Parse colors
  const accent = parseColor(colors.accentColor);
  const secondary = parseColor(colors.secondaryColor);
  const text = parseColor(colors.textColor);
  const background = parseColor(colors.backgroundColor);
  
  // For testing, we need an opaque background to blend with
  // Assuming the background behind the rgba(30, 30, 30, 0.8) is white
  const baseBackground = parseColor('#ffffff');
  const effectiveBackground = background.a < 1 
    ? {
        r: Math.round(background.r * background.a + baseBackground.r * (1 - background.a)),
        g: Math.round(background.g * background.a + baseBackground.g * (1 - background.a)),
        b: Math.round(background.b * background.a + baseBackground.b * (1 - background.a))
      }
    : background;
  
  console.log('Color values:');
  console.log(`- Accent Color: ${colors.accentColor}`);
  console.log(`- Secondary Color: ${colors.secondaryColor}`);
  console.log(`- Text Color: ${colors.textColor}`);
  console.log(`- Background Color: ${colors.backgroundColor}`);
  console.log(`- Effective Background (blended with white): rgb(${effectiveBackground.r}, ${effectiveBackground.g}, ${effectiveBackground.b})\n`);
  
  // Test 1: Accent color against background (UI elements - need 3:1 ratio)
  const accentRatio = calculateContrastRatio(accent, effectiveBackground);
  const accentPasses = accentRatio >= 3.0;
  
  console.log('Test 1: Accent Color (#FF5733) vs Background');
  console.log(`- Contrast Ratio: ${accentRatio.toFixed(2)}:1`);
  console.log(`- WCAG AA for UI Elements (3:1): ${accentPasses ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- ${accentPasses ? 'Meets' : 'Does not meet'} the minimum 3:1 ratio for UI elements\n`);
  
  // Test 2: Secondary color against background (text - need 4.5:1 ratio)
  const secondaryRatio = calculateContrastRatio(secondary, effectiveBackground);
  const secondaryPasses = secondaryRatio >= 4.5;
  
  console.log('Test 2: Secondary Color (#C70039) vs Background');
  console.log(`- Contrast Ratio: ${secondaryRatio.toFixed(2)}:1`);
  console.log(`- WCAG AA for Normal Text (4.5:1): ${secondaryPasses ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- ${secondaryPasses ? 'Meets' : 'Does not meet'} the minimum 4.5:1 ratio for normal text\n`);
  
  // Test 3: White text against background (should easily pass)
  const textRatio = calculateContrastRatio(text, effectiveBackground);
  const textPasses = textRatio >= 4.5;
  
  console.log('Test 3: White Text (#ffffff) vs Background');
  console.log(`- Contrast Ratio: ${textRatio.toFixed(2)}:1`);
  console.log(`- WCAG AA for Normal Text (4.5:1): ${textPasses ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- ${textPasses ? 'Meets' : 'Does not meet'} the minimum 4.5:1 ratio for normal text\n`);
  
  // Summary
  console.log('=== Summary ===');
  const allPass = accentPasses && secondaryPasses && textPasses;
  if (allPass) {
    console.log('✅ All color combinations meet WCAG AA standards!');
  } else {
    console.log('⚠️  Some color combinations do not meet WCAG AA standards:');
    if (!accentPasses) {
      console.log(`   - Accent color needs better contrast (current: ${accentRatio.toFixed(2)}:1, required: 3:1)`);
    }
    if (!secondaryPasses) {
      console.log(`   - Secondary color needs better contrast (current: ${secondaryRatio.toFixed(2)}:1, required: 4.5:1)`);
    }
    if (!textPasses) {
      console.log(`   - Text color needs better contrast (current: ${textRatio.toFixed(2)}:1, required: 4.5:1)`);
    }
  }
  
  // Additional test against pure black background
  console.log('\n=== Alternative Test: Against Pure Black Background ===');
  const blackBackground = parseColor('#000000');
  
  const accentRatioBlack = calculateContrastRatio(accent, blackBackground);
  const secondaryRatioBlack = calculateContrastRatio(secondary, blackBackground);
  
  console.log(`Accent Color vs Black: ${accentRatioBlack.toFixed(2)}:1 - ${accentRatioBlack >= 3.0 ? '✅ PASS' : '❌ FAIL'} (3:1 for UI)`);
  console.log(`Secondary Color vs Black: ${secondaryRatioBlack.toFixed(2)}:1 - ${secondaryRatioBlack >= 4.5 ? '✅ PASS' : '❌ FAIL'} (4.5:1 for text)`);
}

// Run the test
testColorContrast().catch(console.error);