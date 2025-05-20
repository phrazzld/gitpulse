const { generateColorDocs, validateColorPairings, parseCSSVariables } = require('../../accessibility/generate-color-docs.js');
import * as fs from 'fs';
import * as path from 'path';
import { checkColorContrast } from '../../../src/lib/accessibility/colorContrast';

jest.mock('fs');
jest.mock('../../../src/lib/accessibility/colorContrast');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockCheckColorContrast = checkColorContrast as jest.MockedFunction<typeof checkColorContrast>;

describe('generate-color-docs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseCSSVariables', () => {
    it('should parse CSS variables correctly', () => {
      const cssContent = `
        :root {
          --dark-slate: #1b2b34;
          --neon-green: #00ff87;
          --foreground: #ffffff;
          --background: var(--dark-slate);
        }
      `;

      const result = parseCSSVariables(cssContent);

      expect(result).toEqual({
        dark: {
          '--dark-slate': '#1b2b34',
          '--neon-green': '#00ff87',
          '--foreground': '#ffffff',
          '--background': 'var(--dark-slate)'
        }
      });
    });

    it('should handle theme-specific variables', () => {
      const cssContent = `
        :root {
          --foreground: #ffffff;
        }
        
        .light-theme {
          --foreground: #000000;
        }
      `;

      const result = parseCSSVariables(cssContent);

      expect(result.dark['--foreground']).toBe('#ffffff');
      expect(result.light).toBeUndefined(); // This test assumes we only support dark theme initially
    });
  });

  describe('validateColorPairings', () => {
    it('should validate color pairings successfully', () => {
      const config = {
        pairings: [
          {
            name: 'Test Pairing',
            foreground: 'var(--foreground)',
            background: 'var(--background)',
            contextDescription: 'Test context',
            wcagLevel: 'AA' as const,
            textSize: 'normal' as const,
            themes: ['dark']
          }
        ]
      };

      const cssVariables = {
        dark: {
          '--foreground': '#ffffff',
          '--background': '#1b2b34'
        }
      };

      mockCheckColorContrast.mockReturnValue({
        ratio: 15.8,
        passes: true,
        foregroundColor: '#ffffff',
        backgroundColor: '#1b2b34'
      });

      const results = validateColorPairings(config, cssVariables);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        name: 'Test Pairing',
        ratio: 15.8,
        passes: true,
        theme: 'dark'
      });
    });

    it('should fail validation for non-compliant pairings', () => {
      const config = {
        pairings: [
          {
            name: 'Failing Pairing',
            foreground: 'var(--low-contrast)',
            background: 'var(--background)',
            contextDescription: 'Test context',
            wcagLevel: 'AA' as const,
            textSize: 'normal' as const,
            themes: ['dark']
          }
        ]
      };

      const cssVariables = {
        dark: {
          '--low-contrast': '#777777',
          '--background': '#888888'
        }
      };

      mockCheckColorContrast.mockReturnValue({
        ratio: 1.2,
        passes: false,
        foregroundColor: '#777777',
        backgroundColor: '#888888'
      });

      const results = validateColorPairings(config, cssVariables);

      expect(results[0].passes).toBe(false);
    });
  });

  describe('generateColorDocs', () => {
    it('should generate markdown documentation', async () => {
      const config = {
        pairings: [
          {
            name: 'Primary Text',
            foreground: 'var(--foreground)',
            background: 'var(--background)',
            contextDescription: 'Main text',
            wcagLevel: 'AA' as const,
            textSize: 'normal' as const,
            themes: ['dark']
          }
        ]
      };

      const cssVariables = {
        dark: {
          '--foreground': '#ffffff',
          '--background': '#1b2b34'
        }
      };

      mockCheckColorContrast.mockReturnValue({
        ratio: 15.8,
        passes: true,
        foregroundColor: '#ffffff',
        backgroundColor: '#1b2b34'
      });

      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (typeof filePath === 'string' && filePath.includes('globals.css')) {
          return ':root { --foreground: #ffffff; --background: #1b2b34; }';
        }
        if (typeof filePath === 'string' && filePath.includes('config.json')) {
          return JSON.stringify(config);
        }
        return '';
      });

      mockFs.writeFileSync.mockImplementation(() => undefined);

      await generateColorDocs();

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('APPROVED_COLOR_PAIRINGS.md'),
        expect.stringContaining('# Approved Color Pairings')
      );
    });

    it('should exit with error code in validation mode when pairings fail', async () => {
      const config = {
        pairings: [
          {
            name: 'Failing Pairing',
            foreground: 'var(--low-contrast)',
            background: 'var(--background)',
            contextDescription: 'Test context',
            wcagLevel: 'AA' as const,
            textSize: 'normal' as const,
            themes: ['dark']
          }
        ]
      };

      mockCheckColorContrast.mockReturnValue({
        ratio: 1.2,
        passes: false,
        foregroundColor: '#777777',
        backgroundColor: '#888888'
      });

      mockFs.readFileSync.mockImplementation((filePath: string) => {
        if (typeof filePath === 'string' && filePath.includes('globals.css')) {
          return ':root { --low-contrast: #777777; --background: #888888; }';
        }
        if (typeof filePath === 'string' && filePath.includes('config.json')) {
          return JSON.stringify(config);
        }
        return '';
      });

      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exit');
      });

      await expect(generateColorDocs(true)).rejects.toThrow('Process exit');
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });
  });
});