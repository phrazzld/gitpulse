import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';
import { createAuthenticatedOctokit, GitHubCredentials } from './githubAuth';
import { GitHubAuthError, GitHubConfigError } from '../errors';

// Mock dependencies
jest.mock('octokit');
jest.mock('@octokit/auth-app');
jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('githubAuth', () => {
  // Original environment variables
  const originalEnv = { ...process.env };
  
  // Setup and teardown
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Mock Octokit constructor
    (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => {
      return { 
        // Minimal implementation for testing
        rest: {}
      } as unknown as Octokit;
    });
    
    // Mock createAppAuth
    (createAppAuth as jest.MockedFunction<typeof createAppAuth>).mockImplementation(() => {
      const auth: any = async () => {
        return {
          type: 'token',
          token: 'mock-installation-token',
          expiresAt: '2099-01-01T00:00:00Z'
        };
      };
      
      // Add the missing hook property required by AuthInterface
      auth.hook = jest.fn();
      return auth;
    });
    
    // Set up environment variables for GitHub App auth
    process.env.GITHUB_APP_ID = '12345';
    process.env.GITHUB_APP_PRIVATE_KEY_PKCS8 = '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----';
  });
  
  afterEach(() => {
    // Restore original environment variables
    process.env = { ...originalEnv };
  });
  
  describe('createAuthenticatedOctokit', () => {
    it('should create an Octokit instance with OAuth token', async () => {
      // Arrange
      const credentials: GitHubCredentials = {
        type: 'oauth',
        token: 'mock-oauth-token'
      };
      
      // Act
      const octokit = await createAuthenticatedOctokit(credentials);
      
      // Assert
      expect(Octokit).toHaveBeenCalledWith({ auth: 'mock-oauth-token' });
      expect(octokit).toBeDefined();
    });
    
    it('should create an Octokit instance with GitHub App installation', async () => {
      // Arrange
      const credentials: GitHubCredentials = {
        type: 'app',
        installationId: 67890
      };
      
      // Act
      const octokit = await createAuthenticatedOctokit(credentials);
      
      // Assert
      expect(createAppAuth).toHaveBeenCalledWith({
        appId: '12345',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----',
        installationId: 67890
      });
      expect(Octokit).toHaveBeenCalledWith({ auth: 'mock-installation-token' });
      expect(octokit).toBeDefined();
    });
    
    it('should throw GitHubAuthError when OAuth token is missing', async () => {
      // Arrange
      const credentials: GitHubCredentials = {
        type: 'oauth',
        token: '' // Empty token
      };
      
      // Act & Assert
      await expect(createAuthenticatedOctokit(credentials))
        .rejects
        .toThrow(GitHubAuthError);
    });
    
    it('should throw GitHubConfigError when GitHub App environment variables are missing', async () => {
      // Arrange
      process.env.GITHUB_APP_ID = '';
      process.env.GITHUB_APP_PRIVATE_KEY_PKCS8 = '';
      
      const credentials: GitHubCredentials = {
        type: 'app',
        installationId: 67890
      };
      
      // Act & Assert
      await expect(createAuthenticatedOctokit(credentials))
        .rejects
        .toThrow(GitHubConfigError);
    });
    
    it('should handle errors from App authentication process', async () => {
      // Arrange
      const authError = new Error('Authentication failed');
      (createAppAuth as jest.MockedFunction<typeof createAppAuth>).mockImplementation(() => {
        const auth: any = async () => {
          throw authError;
        };
        
        // Add the missing hook property required by AuthInterface
        auth.hook = jest.fn();
        return auth;
      });
      
      const credentials: GitHubCredentials = {
        type: 'app',
        installationId: 67890
      };
      
      // Act & Assert
      await expect(createAuthenticatedOctokit(credentials))
        .rejects
        .toThrow();
    });
  });
});