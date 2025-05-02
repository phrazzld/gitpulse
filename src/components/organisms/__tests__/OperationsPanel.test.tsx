import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OperationsPanel from '../OperationsPanel';
import { ActivityMode } from '@/components/ui/ModeSelector';
import { FilterState, Installation } from '@/types/dashboard';

// Mock the dashboard-utils module
jest.mock('@/lib/dashboard-utils', () => ({
  getGitHubAppInstallUrl: jest.fn().mockReturnValue('https://github.com/apps/gitpulse/installations/new')
}));

// Mock the github module
jest.mock('@/lib/github', () => ({
  getInstallationManagementUrl: jest.fn().mockReturnValue('https://github.com/settings/installations/123')
}));

// Mock child components
jest.mock('@/components/molecules/TerminalHeader', () => {
  return {
    __esModule: true,
    default: jest.fn(({ title }) => (
      <div data-testid="terminal-header" data-title={title}>{title}</div>
    ))
  };
});

jest.mock('@/components/molecules/ErrorAlert', () => {
  return {
    __esModule: true,
    default: jest.fn(({ message, needsInstallation, installationUrl, onSignOut }) => (
      <div 
        data-testid="error-alert" 
        data-message={message}
        data-needs-installation={needsInstallation ? 'true' : 'false'}
        data-installation-url={installationUrl}
      >
        {needsInstallation && (
          <button data-testid="install-button">Install App</button>
        )}
        {message?.includes('authentication') && (
          <button 
            data-testid="sign-out-button"
            onClick={() => onSignOut({ callbackUrl: '/' })}
          >
            Sign Out
          </button>
        )}
      </div>
    ))
  };
});

jest.mock('@/components/molecules/AuthStatusBanner', () => {
  return {
    __esModule: true,
    default: jest.fn(({ authMethod, needsInstallation, installations, currentInstallations }) => (
      <div 
        data-testid="auth-status-banner"
        data-auth-method={authMethod}
        data-needs-installation={needsInstallation ? 'true' : 'false'}
        data-installations-count={installations.length}
        data-current-installations-count={currentInstallations.length}
      >
        Authentication Status: {authMethod}
      </div>
    ))
  };
});

jest.mock('@/components/organisms/AccountSelectionPanel', () => {
  return {
    __esModule: true,
    default: jest.fn(({ installations, currentInstallations, onSwitchInstallations }) => (
      <div 
        data-testid="account-selection-panel"
        data-installations-count={installations.length}
        data-current-installations-count={currentInstallations.length}
      >
        <h3>Account Selection Panel</h3>
        <button 
          data-testid="switch-installations-button"
          onClick={() => onSwitchInstallations([installations[0]?.id || 0])}
        >
          Switch Installations
        </button>
      </div>
    ))
  };
});

jest.mock('@/components/organisms/AnalysisFiltersPanel', () => {
  return {
    __esModule: true,
    default: jest.fn(({ 
      activityMode, 
      loading, 
      installations, 
      activeFilters, 
      userName, 
      onModeChange, 
      onOrganizationChange 
    }) => (
      <div 
        data-testid="analysis-filters-panel"
        data-activity-mode={activityMode}
        data-loading={loading ? 'true' : 'false'}
        data-installations-count={installations.length}
        data-username={userName || ''}
      >
        <h3>Analysis Filters</h3>
        <div>
          Selected Mode: {activityMode}
        </div>
        <button 
          data-testid="mode-change-button"
          onClick={() => onModeChange(activityMode === 'my-activity' ? 'team-activity' : 'my-activity')}
        >
          Change Mode
        </button>
        <button 
          data-testid="org-change-button"
          onClick={() => onOrganizationChange(['org1', 'org2'])}
        >
          Select Organizations
        </button>
      </div>
    ))
  };
});

// Mock required props
const createDefaultProps = () => ({
  error: null,
  loading: false,
  needsInstallation: false,
  authMethod: 'github_app',
  installations: [
    {
      id: 123,
      account: {
        login: 'testorg',
        type: 'Organization',
        avatarUrl: 'https://github.com/testorg.png'
      },
      appSlug: 'gitpulse',
      appId: 12345,
      repositorySelection: 'all',
      targetType: 'Organization'
    }
  ] as Installation[],
  currentInstallations: [] as Installation[],
  activityMode: 'my-activity' as ActivityMode,
  activeFilters: {
    contributors: ['me'] as string[],
    organizations: [] as string[],
    repositories: [] as string[]
  },
  userName: 'testuser',
  installationUrl: 'https://github.com/apps/gitpulse/installations/new',
  isGitHubAppAuth: true,
  hasInstallations: true,
  onModeChange: jest.fn(),
  onOrganizationChange: jest.fn(),
  onFilterChange: jest.fn(),
  onSwitchInstallations: jest.fn(),
  onSignOut: jest.fn()
});

describe('OperationsPanel', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Rendering Tests
  describe('rendering', () => {
    it('renders with default props', () => {
      const props = createDefaultProps();
      render(<OperationsPanel {...props} />);
      
      // Check for terminal header
      expect(screen.getByTestId('terminal-header')).toBeInTheDocument();
      expect(screen.getByTestId('terminal-header')).toHaveTextContent('COMMIT ANALYSIS MODULE');
      
      // Check for auth status banner
      expect(screen.getByTestId('auth-status-banner')).toBeInTheDocument();
      expect(screen.getByTestId('auth-status-banner')).toHaveAttribute('data-auth-method', 'github_app');
      
      // Check for account selection panel when isGitHubAppAuth and hasInstallations are true
      expect(screen.getByTestId('account-selection-panel')).toBeInTheDocument();
      
      // Check for analysis filters panel
      expect(screen.getByTestId('analysis-filters-panel')).toBeInTheDocument();
      expect(screen.getByTestId('analysis-filters-panel')).toHaveAttribute('data-activity-mode', 'my-activity');
    });

    it('renders error message when error prop is provided', () => {
      const props = {
        ...createDefaultProps(),
        error: 'Test error message'
      };
      render(<OperationsPanel {...props} />);
      
      // Error alert should be visible and contain the error message
      const errorAlert = screen.getByTestId('error-alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveAttribute('data-message', 'Test error message');
    });

    it('renders installation prompt when needsInstallation is true', () => {
      const props = {
        ...createDefaultProps(),
        needsInstallation: true,
        error: 'GitHub App installation required',
        hasInstallations: false
      };
      render(<OperationsPanel {...props} />);
      
      // Error alert with installation button should be visible
      const errorAlert = screen.getByTestId('error-alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveAttribute('data-needs-installation', 'true');
      expect(screen.getByTestId('install-button')).toBeInTheDocument();
    });

    it('does not render error alert when error is null', () => {
      const props = createDefaultProps();
      render(<OperationsPanel {...props} />);
      
      // Error alert should not be present
      expect(screen.queryByTestId('error-alert')).not.toBeInTheDocument();
    });

    it('does not render auth status banner when authMethod is null', () => {
      const props = {
        ...createDefaultProps(),
        authMethod: null
      };
      render(<OperationsPanel {...props} />);
      
      // Auth status banner should not be present
      expect(screen.queryByTestId('auth-status-banner')).not.toBeInTheDocument();
    });

    it('does not render account selection panel when isGitHubAppAuth is false', () => {
      const props = {
        ...createDefaultProps(),
        isGitHubAppAuth: false
      };
      render(<OperationsPanel {...props} />);
      
      // Account selection panel should not be present
      expect(screen.queryByTestId('account-selection-panel')).not.toBeInTheDocument();
    });

    it('does not render account selection panel when hasInstallations is false', () => {
      const props = {
        ...createDefaultProps(),
        hasInstallations: false
      };
      render(<OperationsPanel {...props} />);
      
      // Account selection panel should not be present
      expect(screen.queryByTestId('account-selection-panel')).not.toBeInTheDocument();
    });

    it('renders with OAuth authentication', () => {
      const props = {
        ...createDefaultProps(),
        authMethod: 'oauth',
        isGitHubAppAuth: false
      };
      render(<OperationsPanel {...props} />);
      
      // Auth status banner should be present with oauth method
      const authBanner = screen.getByTestId('auth-status-banner');
      expect(authBanner).toBeInTheDocument();
      expect(authBanner).toHaveAttribute('data-auth-method', 'oauth');
      
      // Account selection panel should not be present
      expect(screen.queryByTestId('account-selection-panel')).not.toBeInTheDocument();
    });

    it('passes loading state to child components', () => {
      const props = {
        ...createDefaultProps(),
        loading: true
      };
      render(<OperationsPanel {...props} />);
      
      // Analysis filters panel should have loading attribute
      const filtersPanel = screen.getByTestId('analysis-filters-panel');
      expect(filtersPanel).toHaveAttribute('data-loading', 'true');
    });

    it('passes activeFilters to child components', () => {
      const activeFilters = {
        contributors: ['me', 'user2'],
        organizations: ['org1', 'org2'],
        repositories: ['repo1', 'repo2']
      };
      const props = {
        ...createDefaultProps(),
        activeFilters
      };
      render(<OperationsPanel {...props} />);
      
      // Analysis filters panel should have the active filters
      expect(screen.getByTestId('analysis-filters-panel')).toBeInTheDocument();
    });
  });

  // Interaction Tests
  describe('interactions', () => {
    it('triggers onModeChange when mode button is clicked', () => {
      const onModeChange = jest.fn();
      const props = {
        ...createDefaultProps(),
        onModeChange
      };
      render(<OperationsPanel {...props} />);
      
      // Find and click the mode change button
      const modeButton = screen.getByTestId('mode-change-button');
      fireEvent.click(modeButton);
      
      // onModeChange should be called with the new mode
      expect(onModeChange).toHaveBeenCalledTimes(1);
      expect(onModeChange).toHaveBeenCalledWith('team-activity');
    });

    it('triggers onOrganizationChange when organization button is clicked', () => {
      const onOrganizationChange = jest.fn();
      const props = {
        ...createDefaultProps(),
        onOrganizationChange
      };
      render(<OperationsPanel {...props} />);
      
      // Find and click the organization change button
      const orgButton = screen.getByTestId('org-change-button');
      fireEvent.click(orgButton);
      
      // onOrganizationChange should be called with the selected orgs
      expect(onOrganizationChange).toHaveBeenCalledTimes(1);
      expect(onOrganizationChange).toHaveBeenCalledWith(['org1', 'org2']);
    });

    it('triggers onSwitchInstallations when switch installations button is clicked', () => {
      const onSwitchInstallations = jest.fn();
      const installations = [
        {
          id: 123,
          account: {
            login: 'testorg',
            type: 'Organization'
          },
          appSlug: 'gitpulse',
          appId: 12345,
          repositorySelection: 'all',
          targetType: 'Organization'
        }
      ] as Installation[];
      
      const props = {
        ...createDefaultProps(),
        installations,
        onSwitchInstallations
      };
      render(<OperationsPanel {...props} />);
      
      // Find and click the switch installations button
      const switchButton = screen.getByTestId('switch-installations-button');
      fireEvent.click(switchButton);
      
      // onSwitchInstallations should be called with the installation ID
      expect(onSwitchInstallations).toHaveBeenCalledTimes(1);
      expect(onSwitchInstallations).toHaveBeenCalledWith([123]);
    });

    it('triggers onSignOut when sign out button is clicked in authentication error', () => {
      const onSignOut = jest.fn();
      const props = {
        ...createDefaultProps(),
        error: 'Error with authentication',
        onSignOut
      };
      render(<OperationsPanel {...props} />);
      
      // Find and click the sign out button
      const signOutButton = screen.getByTestId('sign-out-button');
      fireEvent.click(signOutButton);
      
      // onSignOut should be called with the callback URL
      expect(onSignOut).toHaveBeenCalledTimes(1);
      expect(onSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  // Integration Tests
  describe('integration', () => {
    it('correctly propagates props to child components', () => {
      const props = createDefaultProps();
      render(<OperationsPanel {...props} />);

      // Check terminal header
      expect(screen.getByTestId('terminal-header')).toHaveAttribute('data-title', 'COMMIT ANALYSIS MODULE');
      
      // Check auth status banner
      const authBanner = screen.getByTestId('auth-status-banner');
      expect(authBanner).toHaveAttribute('data-auth-method', 'github_app');
      expect(authBanner).toHaveAttribute('data-installations-count', '1');
      expect(authBanner).toHaveAttribute('data-current-installations-count', '0');
      
      // Check account selection panel
      const accountPanel = screen.getByTestId('account-selection-panel');
      expect(accountPanel).toHaveAttribute('data-installations-count', '1');
      expect(accountPanel).toHaveAttribute('data-current-installations-count', '0');
      
      // Check analysis filters panel
      const filtersPanel = screen.getByTestId('analysis-filters-panel');
      expect(filtersPanel).toHaveAttribute('data-activity-mode', 'my-activity');
      expect(filtersPanel).toHaveAttribute('data-loading', 'false');
      expect(filtersPanel).toHaveAttribute('data-username', 'testuser');
    });

    it('handles case with error, loading and multiple installations', () => {
      const installations = [
        {
          id: 123,
          account: { login: 'org1', type: 'Organization' },
          appSlug: 'gitpulse',
          appId: 12345,
          repositorySelection: 'all',
          targetType: 'Organization'
        },
        {
          id: 456,
          account: { login: 'org2', type: 'Organization' },
          appSlug: 'gitpulse',
          appId: 12345,
          repositorySelection: 'all',
          targetType: 'Organization'
        }
      ] as Installation[];
      
      const currentInstallations = [installations[0]];
      
      const props = {
        ...createDefaultProps(),
        error: 'Some error occurred',
        loading: true,
        installations,
        currentInstallations,
        activityMode: 'team-activity' as ActivityMode
      };
      
      render(<OperationsPanel {...props} />);
      
      // Error alert should be visible
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      
      // Auth banner should show correct installation counts
      const authBanner = screen.getByTestId('auth-status-banner');
      expect(authBanner).toHaveAttribute('data-installations-count', '2');
      expect(authBanner).toHaveAttribute('data-current-installations-count', '1');
      
      // Account panel should show correct installation counts
      const accountPanel = screen.getByTestId('account-selection-panel');
      expect(accountPanel).toHaveAttribute('data-installations-count', '2');
      expect(accountPanel).toHaveAttribute('data-current-installations-count', '1');
      
      // Analysis filters panel should have loading=true and correct activity mode
      const filtersPanel = screen.getByTestId('analysis-filters-panel');
      expect(filtersPanel).toHaveAttribute('data-loading', 'true');
      expect(filtersPanel).toHaveAttribute('data-activity-mode', 'team-activity');
    });

    it('handles case with null userName', () => {
      const props = {
        ...createDefaultProps(),
        userName: null
      };
      render(<OperationsPanel {...props} />);
      
      // Analysis filters panel should have empty username
      const filtersPanel = screen.getByTestId('analysis-filters-panel');
      expect(filtersPanel).toHaveAttribute('data-username', '');
    });
  });
});