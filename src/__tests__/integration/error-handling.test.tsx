/**
 * Integration tests for error handling in GitPulse
 * Tests the complete flow from API errors to UI display
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { 
  mockSession, 
  mockInstallation
} from '../test-utils';
// Define our own error creation utilities to avoid importing from api-test-utils
// which has dependencies on Next.js server components
const mockErrors = {
  createAuthError: () => new Error("GitHub authentication failed"),
  createTokenError: () => new Error("GitHub token is invalid or expired"),
  createRateLimitError: () => new Error("GitHub API rate limit exceeded"),
  createNotFoundError: () => new Error("GitHub resource not found"),
  createConfigError: () => new Error("GitHub App not properly configured"),
};

// Import our test wrapper for the Dashboard component
import { DashboardTestWrapper } from './DashboardTestWrapper';

// Import actual error components to verify proper integration
import { AuthError } from '@/components/AuthError';

// Mocking dependencies
jest.mock('@/lib/auth/githubAuth', () => ({
  createAuthenticatedOctokit: jest.fn(),
  getInstallationManagementUrl: jest.fn().mockReturnValue('https://github.com/settings/installations/123'),
  getAllAppInstallations: jest.fn().mockResolvedValue([]),
  checkAppInstallation: jest.fn().mockResolvedValue(123),
}));

jest.mock('@/lib/githubData', () => ({
  fetchRepositories: jest.fn(),
  fetchAppRepositories: jest.fn(),
  fetchRepositoryCommitsWithOctokit: jest.fn(),
  fetchCommitsForRepositoriesWithOctokit: jest.fn(),
}));

jest.mock('@/lib/activity', () => ({
  createActivityFetcher: jest.fn().mockReturnValue(() => Promise.resolve({
    data: [],
    hasMore: false
  })),
}));

jest.mock('@/lib/localStorageCache', () => ({
  setCacheItem: jest.fn(),
  getCacheItem: jest.fn(),
  getStaleItem: jest.fn().mockReturnValue({ data: null, isStale: true }),
  ClientCacheTTL: { LONG: 3600000 },
}));

// Mock next-auth session
jest.mock('next-auth/react', () => {
  const mockSignOut = jest.fn();
  return {
    useSession: jest.fn(() => ({
      data: mockSession,
      status: 'authenticated',
    })),
    signOut: mockSignOut,
  };
});

// Mock next navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock the AuthError component to capture its props
const mockAuthErrorProps: Record<string, unknown> = {};

// Import the real AuthError props type
import type { AuthErrorProps } from '@/components/AuthError';

jest.mock('@/components/AuthError', () => {
  return {
    AuthError: (props: AuthErrorProps) => {
      mockAuthErrorProps.current = props;
      return (
        <div data-testid="auth-error-component">
          <div data-testid="auth-error-message">{props.error}</div>
          {props.signOutRequired && (
            <div data-testid="auth-signout-required">Sign Out Required</div>
          )}
          <button 
            data-testid="auth-signout-button"
            onClick={() => props.onRetry ? props.onRetry() : null}
          >
            Try Again
          </button>
        </div>
      );
    }
  };
});

// Track component props for testing
const mockComponentProps: Record<string, unknown> = {};

// Define interface for AuthenticationStatusBanner props
interface AuthStatusBannerProps {
  error: string | null;
  authMethod?: string | null;
  needsInstallation?: boolean;
  getGitHubAppInstallUrl: () => string;
  handleAuthError: () => void;
  signOutCallback?: () => void;
}

// Mock AuthenticationStatusBanner to capture its props
jest.mock('@/components/dashboard/AuthenticationStatusBanner', () => {
  return function MockAuthenticationStatusBanner(props: AuthStatusBannerProps) {
    mockComponentProps.AuthenticationStatusBanner = props;
    return (
      <div data-testid="auth-banner">
        {props.error && <div data-testid="error-message">{props.error}</div>}
        {props.needsInstallation && <div data-testid="needs-installation">Installation needed</div>}
        {props.error && props.error.includes('authentication') && (
          <button
            data-testid="auth-retry-button"
            onClick={props.handleAuthError}
          >
            Retry
          </button>
        )}
      </div>
    );
  };
});

// Simple mocks for other dashboard components to avoid errors
// Define interfaces for dashboard component props where needed
interface AccountManagementPanelProps {
  authMethod: string | null;
  installations: any[];
  currentInstallations: any[];
  loading: boolean;
  getGitHubAppInstallUrl: () => string;
  getInstallationManagementUrl: (installationId: number, login: string, type: string) => string;
  switchInstallations: (installationIds: number[]) => void;
  session: any;
}

jest.mock('@/components/dashboard/AccountManagementPanel', () => {
  return function MockAccountManagementPanel(props: AccountManagementPanelProps) {
    mockComponentProps.AccountManagementPanel = props;
    return <div data-testid="account-panel"></div>;
  };
});

interface FilterControlsProps {
  activityMode: string;
  dateRange: { since: string; until: string };
  activeFilters: Record<string, any>;
  installations: any[];
  loading: boolean;
  handleModeChange: (mode: string) => void;
  handleDateRangeChange: (range: { since: string; until: string }) => void;
  handleOrganizationChange: (orgs: string[]) => void;
  session: any;
}

jest.mock('@/components/dashboard/FilterControls', () => {
  return function MockFilterControls(props: FilterControlsProps) {
    mockComponentProps.FilterControls = props;
    return <div data-testid="filter-controls"></div>;
  };
});

interface RepoInfoPanelProps {
  repositories: any[];
  showRepoList: boolean;
  loading: boolean;
  activeFilters: Record<string, any>;
  setShowRepoList: (show: boolean) => void;
}

jest.mock('@/components/dashboard/RepositoryInfoPanel', () => {
  return function MockRepositoryInfoPanel(props: RepoInfoPanelProps) {
    mockComponentProps.RepositoryInfoPanel = props;
    return <div data-testid="repo-panel"></div>;
  };
});

interface ActionButtonProps {
  loading: boolean;
}

jest.mock('@/components/dashboard/ActionButton', () => {
  return function MockActionButton(props: ActionButtonProps) {
    mockComponentProps.ActionButton = props;
    return <button data-testid="action-button"></button>;
  };
});

interface SummaryDisplayProps {
  summary: any | null;
  activityMode: string;
  dateRange: { since: string; until: string };
  activeFilters: Record<string, any>;
  installationIds: number[];
}

jest.mock('@/components/dashboard/SummaryDisplay', () => {
  return function MockSummaryDisplay(props: SummaryDisplayProps) {
    mockComponentProps.SummaryDisplay = props;
    return props.summary ? <div data-testid="summary-display"></div> : null;
  };
});

jest.mock('@/components/DashboardLoadingState', () => {
  return function MockDashboardLoadingState() {
    return <div data-testid="loading-state">Loading...</div>;
  };
});

interface DashboardHeaderProps {
  session: any;
}

jest.mock('@/components/dashboard/DashboardHeader', () => {
  return function MockDashboardHeader(props: DashboardHeaderProps) {
    mockComponentProps.DashboardHeader = props;
    return <div data-testid="dashboard-header" />;
  };
});

// Helper function to create error response
function createErrorResponse(error: any) {
  // Use the error message to determine the type since constructor.name won't work well with our simple Error objects
  const errorMessage = error.message;
  let status = 500;
  let errorCode = 'UNKNOWN_ERROR';
  const details = errorMessage;
  let signOutRequired = false;
  let resetAt = undefined;
  
  // Map based on the error message content
  if (errorMessage.includes('authentication failed')) {
    status = 403;
    errorCode = 'GITHUB_AUTH_ERROR';
    signOutRequired = true;
  } else if (errorMessage.includes('token is invalid')) {
    status = 403;
    errorCode = 'GITHUB_TOKEN_ERROR';
    signOutRequired = true;
  } else if (errorMessage.includes('rate limit exceeded')) {
    status = 429;
    errorCode = 'GITHUB_RATE_LIMIT_ERROR';
    resetAt = new Date(Date.now() + 3600000).toISOString();
  } else if (errorMessage.includes('not found')) {
    status = 404;
    errorCode = 'GITHUB_NOT_FOUND_ERROR';
  } else if (errorMessage.includes('not properly configured')) {
    status = 500;
    errorCode = 'GITHUB_APP_CONFIG_ERROR';
  }
  
  return {
    error: errorMessage, // Use the actual error message
    code: errorCode,
    details,
    ...(signOutRequired ? { signOutRequired } : {}),
    ...(resetAt ? { resetAt } : {})
  };
}

describe('Error Handling Integration', () => {
  let originalFetch: typeof global.fetch;
  
  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;
    
    // Clear all mock data between tests
    jest.clearAllMocks();
    mockComponentProps.AuthenticationStatusBanner = undefined;
    mockAuthErrorProps.current = undefined;
    
    // Reset localStorage
    mockLocalStorage.clear();
  });
  
  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });
  
  it('should display authentication error when GitHub authentication fails', async () => {
    // Create an auth error
    const authError = mockErrors.createAuthError();
    
    // Mock fetch to return authentication error
    const mockFetchFn = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/repos')) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: () => Promise.resolve(createErrorResponse(authError))
        });
      }
      return Promise.reject(new Error(`Unhandled route: ${url}`));
    });
    
    // Render the dashboard with the mock fetch
    render(<DashboardTestWrapper mockFetch={mockFetchFn} />);
    
    // Should show loading state initially
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    
    // After "loading" completes, should display error
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    
    // Verify error message content
    expect(screen.getByTestId('error-message').textContent).toContain('GitHub authentication failed');
    
    // Verify auth retry button is displayed for authentication errors
    expect(screen.getByTestId('auth-retry-button')).toBeInTheDocument();
  });
  
  it('should display rate limit error when GitHub API rate limit is exceeded', async () => {
    // Create a rate limit error
    const rateLimitError = mockErrors.createRateLimitError();
    
    // Mock fetch to return rate limit error
    const mockFetchFn = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/repos')) {
        return Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve(createErrorResponse(rateLimitError))
        });
      }
      return Promise.reject(new Error(`Unhandled route: ${url}`));
    });
    
    // Render the dashboard with the mock fetch
    render(<DashboardTestWrapper mockFetch={mockFetchFn} />);
    
    // Should show loading state initially
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    
    // After "loading" completes, should display error
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    
    // Verify error message content
    expect(screen.getByTestId('error-message').textContent).toContain('GitHub API rate limit exceeded');
  });
  
  it('should display not found error when GitHub resource is not found', async () => {
    // Create a not found error
    const notFoundError = mockErrors.createNotFoundError();
    
    // Mock fetch to return not found error
    const mockFetchFn = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/repos')) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve(createErrorResponse(notFoundError))
        });
      }
      return Promise.reject(new Error(`Unhandled route: ${url}`));
    });
    
    // Render the dashboard with the mock fetch
    render(<DashboardTestWrapper mockFetch={mockFetchFn} />);
    
    // Should show loading state initially
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    
    // After "loading" completes, should display error
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    
    // Verify error message content
    expect(screen.getByTestId('error-message').textContent).toContain('GitHub resource not found');
  });
  
  it('should display installation needed message when GitHub App installation is required', async () => {
    // Mock fetch to return authentication error with needsInstallation flag
    const mockFetchFn = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/repos')) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: () => Promise.resolve({
            error: 'GitHub App installation required',
            code: 'GITHUB_APP_INSTALLATION_REQUIRED',
            details: 'You need to install the GitHub App to access this resource',
            needsInstallation: true
          })
        });
      }
      return Promise.reject(new Error(`Unhandled route: ${url}`));
    });
    
    // Render the dashboard with the mock fetch
    render(<DashboardTestWrapper mockFetch={mockFetchFn} />);
    
    // Should show loading state initially
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    
    // After "loading" completes, should display error and installation needed message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByTestId('needs-installation')).toBeInTheDocument();
    });
  });
  
  it('should display GitHub App configuration error when app is not properly configured', async () => {
    // Create a config error
    const configError = mockErrors.createConfigError();
    
    // Mock fetch to return configuration error
    const mockFetchFn = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/repos')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve(createErrorResponse(configError))
        });
      }
      return Promise.reject(new Error(`Unhandled route: ${url}`));
    });
    
    // Mock getInstallationManagementUrl to indicate app not configured
    // We need to mock the module differently for this specific test
    jest.mock('@/lib/auth/githubAuth', () => ({
      ...jest.requireActual('@/lib/auth/githubAuth'),
      getInstallationManagementUrl: jest.fn().mockReturnValue('#github-app-not-configured')
    }));
    
    // Render the dashboard with the mock fetch
    render(<DashboardTestWrapper mockFetch={mockFetchFn} />);
    
    // Should show loading state initially
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    
    // After "loading" completes, should display error
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    
    // Verify error message content
    expect(screen.getByTestId('error-message').textContent).toContain('GitHub App not properly configured');
  });
});