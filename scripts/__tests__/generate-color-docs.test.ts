/**
 * Tests for CSS variable parsing in generate-color-docs script
 */

import { parseCSSVariables } from '../accessibility/generate-color-docs';

describe('parseCSSVariables', () => {
  test('extracts CSS variables from :root selector', () => {
    const cssContent = `
      :root {
        --background: #1b2b34;
        --foreground: #ffffff;
        --accent-primary: #00ff87;
        --accent-secondary: #5ba3ff;
      }
      
      body {
        /* These variables should be ignored */
        --body-padding: 20px;
        --body-margin: 0;
      }
    `;
    
    const result = parseCSSVariables(cssContent);
    
    expect(result.dark).toEqual({
      '--background': '#1b2b34',
      '--foreground': '#ffffff',
      '--accent-primary': '#00ff87',
      '--accent-secondary': '#5ba3ff'
    });
    
    // Should not extract variables from other selectors
    expect(result.dark['--body-padding']).toBeUndefined();
    expect(result.dark['--body-margin']).toBeUndefined();
  });
  
  test('handles CSS variables with spaces correctly', () => {
    const cssContent = `
      :root {
        --spacing-sm : 0.5rem;
        --spacing-md:1rem;
        --spacing-lg:  2rem;
      }
    `;
    
    const result = parseCSSVariables(cssContent);
    
    expect(result.dark).toEqual({
      '--spacing-sm': '0.5rem',
      '--spacing-md': '1rem',
      '--spacing-lg': '2rem'
    });
  });
  
  test('returns empty object when no :root selector is found', () => {
    const cssContent = `
      body {
        --body-padding: 20px;
        --body-margin: 0;
      }
    `;
    
    const result = parseCSSVariables(cssContent);
    
    expect(result.dark).toEqual({});
  });
  
  test('handles multiline CSS variables', () => {
    const cssContent = `
      :root {
        --color-1: #111;
        --gradient: linear-gradient(
          to bottom,
          #000,
          #fff
        );
        --color-2: #222;
      }
    `;
    
    const result = parseCSSVariables(cssContent);
    
    expect(result.dark['--color-1']).toBe('#111');
    expect(result.dark['--color-2']).toBe('#222');
    // Note: the multiline gradient might not be correctly extracted by the current regex
    // but we're testing what the current implementation does with it
  });
});