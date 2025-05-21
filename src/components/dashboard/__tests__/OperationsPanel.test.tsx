import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OperationsPanel from '@/components/organisms/OperationsPanel';
import { ActivityMode } from '@/components/atoms/ModeSelector';

// Mock the dashboard-utils module
jest.mock('@/lib/dashboard-utils', () => ({
  getGitHubAppInstallUrl: jest.fn().mockReturnValue('https://github.com/apps/gitpulse/installations/new')
}));

// Mock the github module
jest.mock('@/lib/github', () => ({
  getInstallationManagementUrl: jest.fn().mockReturnValue('https://github.com/settings/installations/123')
}));

// Mock components used by OperationsPanel
jest.mock('@/components/molecules/TerminalHeader', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ title }) => (
    <div data-testid="terminal-header" data-title={title}></div>
  )),
}));

jest.mock('@/components/molecules/ErrorAlert', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ message, needsInstallation, installationUrl, onSignOut }) => (
    <div 
      data-testid="error-alert" 
      data-message={message}
      data-needs-installation={`${needsInstallation}`}
      data-installation-url={installationUrl}
    >
      {needsInstallation && <button data-testid="install-button">Install</button>}
      {message && message.includes('authentication') && (
        <button 
          data-testid="sign-out-button" 
          onClick={() => onSignOut && onSignOut({ callbackUrl: '/' })}
        >
          Sign Out
        </button>
      )}
    </div>
  )),
}));

jest.mock('@/components/molecules/AuthStatusBanner', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ authMethod, needsInstallation, installations, currentInstallations }) => (
    <div 
      data-testid="auth-banner" 
      data-auth-method={authMethod}
      data-needs-installation={`${needsInstallation}`}
      data-installations-count={`${installations.length}`}
      data-current-installations-count={`${currentInstallations.length}`}
    ></div>
  )),
}));

jest.mock('@/components/organisms/AccountSelectionPanel', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ installations, currentInstallations, onSwitchInstallations }) => (
    <div 
      data-testid="account-panel" 
      data-installations-count={`${installations.length}`}
      data-current-installations-count={`${currentInstallations.length}`}
    >
      <button 
        data-testid="switch-installations-button" 
        onClick={() => onSwitchInstallations([installations[0]?.id || 0])}
      >
        Switch
      </button>
    </div>
  )),
}));

jest.mock('@/components/organisms/AnalysisFiltersPanel', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ 
    activityMode, 
    loading, 
    installations, 
    activeFilters, 
    userName, 
    onModeChange, 
    onOrganizationChange 
  }) => (
    <div 
      data-testid="filters-panel" 
      data-activity-mode={activityMode}
      data-loading={`${loading}`}
      data-installations-count={`${installations.length}`}
      data-username={userName || ''}
    >
      <button 
        data-testid="mode-change-button" 
        onClick={() => onModeChange(activityMode === 'my-activity' ? 'team-activity' : 'my-activity')}
      >
        Toggle Mode
      </button>
      <button 
        data-testid="org-change-button" 
        onClick={() => onOrganizationChange(['org1', 'org2'])}
      >
        Select Orgs
      </button>
    </div>
  )),
}));

// Create a base mock props object
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
      targetType: 'Organization',
      permissions: {},
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }
  ],
  currentInstallations: [],
  activityMode: 'my-activity' as ActivityMode,
  activeFilters: {
    contributors: ['me'],
    organizations: [],
    repositories: []
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
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders without error', () => {
    const props = createDefaultProps();
    render(<OperationsPanel {...props} />);
    
    // Verify terminal header is rendered
    expect(screen.getByTestId('terminal-header')).toBeInTheDocument();
  });
  
  it('renders with GitHub App auth', () => {
    const props = createDefaultProps();
    render(<OperationsPanel {...props} />);
    
    // Find auth banner and check props
    const authBanner = screen.getByTestId('auth-banner');
    expect(authBanner).toBeInTheDocument();
    expect(authBanner).toHaveAttribute('data-auth-method', 'github_app');
    expect(authBanner).toHaveAttribute('data-needs-installation', 'false');
    expect(authBanner).toHaveAttribute('data-installations-count', '1');
    expect(authBanner).toHaveAttribute('data-current-installations-count', '0');
  });
  
  it('renders with error message', () => {
    const props = {
      ...createDefaultProps(),
      error: 'Test error message'
    };
    
    render(<OperationsPanel {...props} />);
    
    // Find error alert and check props
    const errorAlert = screen.getByTestId('error-alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveAttribute('data-message', 'Test error message');
  });
  
  it('renders with authentication error', () => {
    const props = {
      ...createDefaultProps(),
      error: 'Error with authentication'
    };
    
    render(<OperationsPanel {...props} />);
    
    // Find error alert and check props
    const errorAlert = screen.getByTestId('error-alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveAttribute('data-message', 'Error with authentication');
    expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
  });
  
  it('renders with needs installation', () => {
    const props = {
      ...createDefaultProps(),
      needsInstallation: true,
      error: 'GitHub App installation required'
    };
    
    render(<OperationsPanel {...props} />);
    
    // Find error alert and check props
    const errorAlert = screen.getByTestId('error-alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveAttribute('data-needs-installation', 'true');
    expect(screen.getByTestId('install-button')).toBeInTheDocument();
  });
  
  it('renders account selection panel', () => {
    const props = createDefaultProps();
    render(<OperationsPanel {...props} />);
    
    // Find account panel
    expect(screen.getByTestId('account-panel')).toBeInTheDocument();
  });
  
  it('renders with My Work Activity mode', () => {
    const props = {
      ...createDefaultProps(),
      activityMode: 'my-work-activity' as ActivityMode
    };
    
    render(<OperationsPanel {...props} />);
    
    // Find filters panel and check mode
    const filtersPanel = screen.getByTestId('filters-panel');
    expect(filtersPanel).toBeInTheDocument();
    expect(filtersPanel).toHaveAttribute('data-activity-mode', 'my-work-activity');
  });
  
  it('renders with Team Activity mode', () => {
    const props = {
      ...createDefaultProps(),
      activityMode: 'team-activity' as ActivityMode
    };
    
    render(<OperationsPanel {...props} />);
    
    // Find filters panel and check mode
    const filtersPanel = screen.getByTestId('filters-panel');
    expect(filtersPanel).toBeInTheDocument();
    expect(filtersPanel).toHaveAttribute('data-activity-mode', 'team-activity');
  });
  
  it('renders with loading state', () => {
    const props = {
      ...createDefaultProps(),
      loading: true,
      activityMode: 'team-activity' as ActivityMode
    };
    
    render(<OperationsPanel {...props} />);
    
    // Find filters panel and check loading state
    const filtersPanel = screen.getByTestId('filters-panel');
    expect(filtersPanel).toBeInTheDocument();
    expect(filtersPanel).toHaveAttribute('data-loading', 'true');
  });
});