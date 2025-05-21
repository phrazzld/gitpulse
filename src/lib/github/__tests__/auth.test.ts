/**
 * Tests for the GitHub auth module
 */

import { 
  getAllAppInstallations, 
  checkAppInstallation, 
  getInstallationOctokit,
  getInstallationManagementUrl,
  createOAuthOctokit,
  validateOAuthToken
} from '../auth';
import { IOctokitClient, IOctokitFactory, IAppAuthProvider } from '../interfaces';
import { createMockOctokitClient } from './testUtils.helper';
import { logger } from '@/lib/logger';

// Test globals
declare const describe: any;
declare const it: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const expect: any;
declare const jest: any;

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('GitHub Auth Module', () => {
  let mockClient: IOctokitClient;
  let mockFactory: IOctokitFactory;
  let mockAuthProvider: IAppAuthProvider;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createMockOctokitClient();
    mockFactory = jest.fn().mockReturnValue(mockClient);
    mockAuthProvider = {
      createAppAuth: jest.fn().mockReturnValue(async () => ({
        type: 'installation',
        token: 'test-token',
        expiresAt: '2024-01-01T00:00:00Z'
      }))
    };
  });

  describe('Function exports', () => {
    it('should export getInstallationManagementUrl function', () => {
      expect(typeof getInstallationManagementUrl).toBe('function');
    });
    
    it('should export getAllAppInstallations function', () => {
      expect(typeof getAllAppInstallations).toBe('function');
    });
    
    it('should export checkAppInstallation function', () => {
      expect(typeof checkAppInstallation).toBe('function');
    });
    
    it('should export getInstallationOctokit function', () => {
      expect(typeof getInstallationOctokit).toBe('function');
    });
    
    it('should export createOAuthOctokit function', () => {
      expect(typeof createOAuthOctokit).toBe('function');
    });
    
    it('should export validateOAuthToken function', () => {
      expect(typeof validateOAuthToken).toBe('function');
    });
  });

  describe('getInstallationManagementUrl', () => {
    it('returns organization URL for organization accounts', () => {
      const url = getInstallationManagementUrl(123, 'test-org', 'Organization');
      expect(url).toBe('https://github.com/organizations/test-org/settings/installations/123');
    });
    
    it('returns user URL for user accounts', () => {
      const url = getInstallationManagementUrl(456, 'test-user', 'User');
      expect(url).toBe('https://github.com/settings/installations/456');
    });
    
    it('returns default URL when account type is missing', () => {
      const url = getInstallationManagementUrl(789);
      expect(url).toBe('https://github.com/settings/installations/789');
    });
  });

  describe('getAllAppInstallations', () => {
    it('should fetch all installations for authenticated user', async () => {
      const mockInstallations = [
        { 
          id: 1, 
          account: { login: 'org1', type: 'Organization', avatar_url: 'https://example.com' },
          app_slug: 'test-app',
          app_id: 12345,
          repository_selection: 'selected',
          target_type: 'Organization'
        },
        { 
          id: 2, 
          account: { login: 'org2', type: 'Organization', avatar_url: 'https://example.com' },
          app_slug: 'test-app',
          app_id: 12345,
          repository_selection: 'all',
          target_type: 'Organization'
        }
      ];
      
      (mockClient.rest.apps.listInstallationsForAuthenticatedUser as any).mockResolvedValue({
        data: { installations: mockInstallations }
      });
      
      const result = await getAllAppInstallations(mockClient);
      
      expect(result).toEqual([
        {
          id: 1,
          account: { login: 'org1', type: 'Organization', avatarUrl: 'https://example.com' },
          appSlug: 'test-app',
          appId: 12345,
          repositorySelection: 'selected',
          targetType: 'Organization'
        },
        {
          id: 2,
          account: { login: 'org2', type: 'Organization', avatarUrl: 'https://example.com' },
          appSlug: 'test-app',
          appId: 12345,
          repositorySelection: 'all',
          targetType: 'Organization'
        }
      ]);
      expect(mockClient.rest.apps.listInstallationsForAuthenticatedUser).toHaveBeenCalled();
    });
    
    it('should return empty array on error', async () => {
      (mockClient.rest.apps.listInstallationsForAuthenticatedUser as any).mockRejectedValue(
        new Error('API error')
      );
      
      const result = await getAllAppInstallations(mockClient);
      
      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
    
    it('should handle installations without account', async () => {
      const mockInstallations = [
        { 
          id: 1, 
          app_slug: 'test-app',
          app_id: 12345,
          repository_selection: 'selected',
          target_type: 'Organization'
        }
      ];
      
      (mockClient.rest.apps.listInstallationsForAuthenticatedUser as any).mockResolvedValue({
        data: { installations: mockInstallations }
      });
      
      const result = await getAllAppInstallations(mockClient);
      
      expect(result).toEqual([
        {
          id: 1,
          account: null,
          appSlug: 'test-app',
          appId: 12345,
          repositorySelection: 'selected',
          targetType: 'Organization'
        }
      ]);
    });
  });

  describe('checkAppInstallation', () => {
    it('should return first installation ID if found', async () => {
      const mockInstallations = [
        { 
          id: 123, 
          account: { login: 'org1', type: 'Organization', avatar_url: 'url' },
          app_slug: 'test-app',
          app_id: 12345,
          repository_selection: 'all',
          target_type: 'Organization'
        },
        { 
          id: 456, 
          account: { login: 'org2', type: 'Organization', avatar_url: 'url' },
          app_slug: 'test-app',
          app_id: 12345,
          repository_selection: 'all',
          target_type: 'Organization'
        }
      ];
      
      (mockClient.rest.apps.listInstallationsForAuthenticatedUser as any).mockResolvedValue({
        data: { installations: mockInstallations }
      });
      
      const result = await checkAppInstallation(mockClient);
      
      expect(result).toBe(123);
      expect(logger.info).toHaveBeenCalledWith(
        'github:auth',
        'Using first GitHub App installation',
        expect.objectContaining({
          installationId: 123,
          account: 'org1'
        })
      );
    });
    
    it('should return null if no installations found', async () => {
      (mockClient.rest.apps.listInstallationsForAuthenticatedUser as any).mockResolvedValue({
        data: { installations: [] }
      });
      
      const result = await checkAppInstallation(mockClient);
      
      expect(result).toBeNull();
      expect(logger.info).toHaveBeenCalledWith(
        'github:auth',
        'No GitHub App installation found for this user'
      );
    });
    
    it('should return null on error', async () => {
      (mockClient.rest.apps.listInstallationsForAuthenticatedUser as any).mockRejectedValue(
        new Error('API error')
      );
      
      const result = await checkAppInstallation(mockClient);
      
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('createOAuthOctokit', () => {
    it('should create Octokit client with OAuth token', () => {
      const result = createOAuthOctokit('test-token', mockFactory);
      
      expect(mockFactory).toHaveBeenCalledWith({ auth: 'test-token' });
      expect(result).toBe(mockClient);
    });
  });

  describe('getInstallationOctokit', () => {
    it('should create Octokit client for installation', async () => {
      process.env.GITHUB_APP_ID = 'test-app-id';
      process.env.GITHUB_APP_PRIVATE_KEY_PKCS8 = 'test-private-key';
      
      const result = await getInstallationOctokit(123, mockAuthProvider, mockFactory);
      
      expect(mockAuthProvider.createAppAuth).toHaveBeenCalledWith({
        appId: 'test-app-id',
        privateKey: 'test-private-key',
        installationId: 123
      });
      expect(mockFactory).toHaveBeenCalledWith({ auth: 'test-token' });
      expect(result).toBe(mockClient);
    });
    
    it('should throw error when credentials are missing', async () => {
      delete process.env.GITHUB_APP_ID;
      delete process.env.GITHUB_APP_PRIVATE_KEY_PKCS8;
      
      await expect(getInstallationOctokit(123, mockAuthProvider, mockFactory))
        .rejects.toThrow('GitHub App credentials not configured');
    });
  });

  describe('validateOAuthToken', () => {
    it('should validate token with required scopes', async () => {
      (mockClient.rest.users.getAuthenticated as any).mockResolvedValue({
        data: { login: 'user', id: 123 },
        headers: { 'x-oauth-scopes': 'repo, read:org' }
      });
      
      const result = await validateOAuthToken(mockClient);
      
      expect(result).toEqual({ 
        isValid: true,
        login: 'user',
        scopes: ['repo', 'read:org'],
        hasRepoScope: true,
        hasReadOrgScope: true
      });
    });
    
    it('should identify missing scopes', async () => {
      (mockClient.rest.users.getAuthenticated as any).mockResolvedValue({
        data: { login: 'user', id: 123 },
        headers: { 'x-oauth-scopes': 'read:org' }
      });
      
      const result = await validateOAuthToken(mockClient);
      
      expect(result).toEqual({ 
        isValid: true,
        login: 'user',
        scopes: ['read:org'],
        hasRepoScope: false,
        hasReadOrgScope: true
      });
    });
    
    it('should handle missing scope header', async () => {
      (mockClient.rest.users.getAuthenticated as any).mockResolvedValue({
        data: { login: 'user', id: 123 },
        headers: {}
      });
      
      const result = await validateOAuthToken(mockClient);
      
      expect(result).toEqual({ 
        isValid: true,
        login: 'user',
        scopes: [],
        hasRepoScope: false,
        hasReadOrgScope: false
      });
    });
    
    it('should handle validation errors', async () => {
      (mockClient.rest.users.getAuthenticated as any).mockRejectedValue(
        new Error('Unauthorized')
      );
      
      const result = await validateOAuthToken(mockClient);
      
      expect(result).toEqual({ 
        isValid: false,
        scopes: [],
        hasRepoScope: false,
        hasReadOrgScope: false,
        error: 'Unauthorized'
      });
    });
  });
});