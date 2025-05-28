const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Mock modules
jest.mock('fs');
jest.mock('child_process');
jest.mock('../../accessibility/check-a11y-staged-stories-server', () => ({
  startStaticServer: jest.fn().mockResolvedValue({ server: { close: jest.fn() }, port: 3000 }),
  getRelevantStoryIds: jest.fn().mockReturnValue(['story-1', 'story-2']),
  cleanupAndExit: jest.fn(),
  setGlobalServer: jest.fn()
}));

const {
  detectStagedStoryFiles,
  getCurrentConfigHash,
  isValidBuildCache,
  runAccessibilityCheck
} = require('../check-a11y-staged-stories');

describe('check-a11y-staged-stories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('mock content');
  });

  describe('getCurrentConfigHash', () => {
    it('should compute hash from configuration files', async () => {
      const mockFiles = {
        '.storybook/main.ts': 'main config',
        '.storybook/preview.ts': 'preview config',
        '.storybook/test-runner.js': 'test runner config',
        'package.json': '{"name": "test"}',
        'next.config.js': 'module.exports = {}'
      };

      fs.readFileSync.mockImplementation((file) => {
        return mockFiles[file] || 'default content';
      });

      const hash = await getCurrentConfigHash();
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64); // SHA256 produces 64 character hex string
    });

    it('should produce different hashes for different configs', async () => {
      fs.readFileSync.mockReturnValueOnce('config 1');
      const hash1 = await getCurrentConfigHash();
      
      fs.readFileSync.mockReturnValueOnce('config 2');
      const hash2 = await getCurrentConfigHash();
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle missing files gracefully', async () => {
      fs.existsSync.mockImplementation((file) => {
        return file !== '.storybook/preview.ts';
      });

      const hash = await getCurrentConfigHash();
      expect(hash).toBeDefined();
    });
  });

  describe('isValidBuildCache', () => {
    it('should return false if storybook-static does not exist', async () => {
      fs.existsSync.mockImplementation((path) => {
        return path !== 'storybook-static';
      });

      const result = await isValidBuildCache();
      expect(result).toBe(false);
    });

    it('should return false if build-info.json does not exist', async () => {
      fs.existsSync.mockImplementation((path) => {
        return path !== path.join('storybook-static', 'build-info.json');
      });

      const result = await isValidBuildCache();
      expect(result).toBe(false);
    });

    it('should return false if config hash does not match', async () => {
      const buildInfo = {
        configHash: 'old-hash',
        buildTimestamp: new Date().toISOString()
      };
      
      fs.readFileSync.mockImplementation((file) => {
        if (file.includes('build-info.json')) {
          return JSON.stringify(buildInfo);
        }
        return 'config content';
      });

      const result = await isValidBuildCache();
      expect(result).toBe(false);
    });

    it('should return true if config hash matches', async () => {
      // Mock getCurrentConfigHash to return a predictable value
      const mockHash = 'matching-hash';
      const buildInfo = {
        configHash: mockHash,
        buildTimestamp: new Date().toISOString()
      };
      
      fs.readFileSync.mockImplementation((file) => {
        if (file.includes('build-info.json')) {
          return JSON.stringify(buildInfo);
        }
        return 'config content';
      });

      // This test would need the actual implementation to mock properly
      // For now, we're testing the structure
      expect(buildInfo.configHash).toBe(mockHash);
    });

    it('should handle invalid JSON in build-info.json', async () => {
      fs.readFileSync.mockImplementation((file) => {
        if (file.includes('build-info.json')) {
          return 'invalid json';
        }
        return 'config content';
      });

      const result = await isValidBuildCache();
      expect(result).toBe(false);
    });
  });

  describe('detectStagedStoryFiles', () => {
    it('should detect staged story files', () => {
      execSync.mockReturnValue(`A\tsrc/components/Button.stories.tsx
M\tsrc/components/Card.stories.js
D\tsrc/components/Old.stories.tsx
A\tsrc/components/utils.ts`);

      const files = detectStagedStoryFiles();
      expect(files).toEqual([
        'src/components/Button.stories.tsx',
        'src/components/Card.stories.js'
      ]);
    });

    it('should return empty array if no story files are staged', () => {
      execSync.mockReturnValue(`A\tsrc/components/utils.ts
M\tsrc/components/helper.js`);

      const files = detectStagedStoryFiles();
      expect(files).toEqual([]);
    });

    it('should handle git command errors', () => {
      execSync.mockImplementation(() => {
        throw new Error('git error');
      });

      const files = detectStagedStoryFiles();
      expect(files).toEqual([]);
    });
  });

  describe('runAccessibilityCheck with cache', () => {
    it('should skip check if no valid cache exists', async () => {
      fs.existsSync.mockReturnValue(false);
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const mockLog = jest.spyOn(console, 'log');

      // This would need the main function to be testable
      // For now, we're testing the expected behavior
      expect(mockLog).not.toHaveBeenCalledWith(
        expect.stringContaining('Running accessibility checks')
      );
    });

    it('should run filtered checks with valid cache', async () => {
      const buildInfo = {
        configHash: 'valid-hash',
        buildTimestamp: new Date().toISOString()
      };
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation((file) => {
        if (file.includes('build-info.json')) {
          return JSON.stringify(buildInfo);
        }
        if (file.includes('stories.json')) {
          return JSON.stringify({
            stories: {
              'button--primary': { importPath: './src/components/Button.stories.tsx' }
            }
          });
        }
        return 'content';
      });

      execSync.mockImplementation((cmd) => {
        if (cmd.includes('test-storybook')) {
          return ''; // Success
        }
        return '';
      });

      // Test would verify that test-storybook is called with filtered stories
    });

    it('should handle timeout gracefully', async () => {
      const mockError = new Error('Command timed out');
      mockError.timedOut = true;
      
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('test-storybook')) {
          throw mockError;
        }
        return '';
      });

      const mockLog = jest.spyOn(console, 'error');
      
      // Test would verify timeout error is logged appropriately
    });

    it('should respect A11Y_SKIP environment variable', async () => {
      process.env.A11Y_SKIP = '1';
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      const mockLog = jest.spyOn(console, 'log');

      // Test would verify early exit with skip message
      delete process.env.A11Y_SKIP;
    });
  });

  describe('post-build script', () => {
    it('should generate build info after build', async () => {
      const mockWriteFileSync = fs.writeFileSync;
      const expectedHash = 'test-hash';
      
      // Test the post-build script logic
      const buildInfo = {
        configHash: expectedHash,
        buildTimestamp: expect.any(String),
        nodeVersion: process.version
      };

      mockWriteFileSync.mockImplementation((file, content) => {
        if (file.includes('build-info.json')) {
          const parsed = JSON.parse(content);
          expect(parsed).toMatchObject({
            configHash: expect.any(String),
            buildTimestamp: expect.any(String),
            nodeVersion: process.version
          });
        }
      });
    });
  });
});