import React from 'react';
import OperationsPanel from '@/components/organisms/OperationsPanel';
import { ActivityMode } from '@/components/ui/ModeSelector';
import { getGitHubAppInstallUrl } from '@/lib/dashboard-utils';

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
  ))
}));

jest.mock('@/components/molecules/ErrorAlert', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ message, needsInstallation, installationUrl, onSignOut }) => (
    <div 
      data-testid="error-alert" 
      data-message={message}
      data-needs-installation={needsInstallation}
      data-installation-url={installationUrl}
    >
      {needsInstallation && <button data-testid="install-button">Install</button>}
      {message.includes('authentication') && (
        <button 
          data-testid="sign-out-button" 
          onClick={() => onSignOut({ callbackUrl: '/' })}
        >
          Sign Out
        </button>
      )}
    </div>
  ))
}));

jest.mock('@/components/molecules/AuthStatusBanner', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ authMethod, needsInstallation, installations, currentInstallations }) => (
    <div 
      data-testid="auth-banner" 
      data-auth-method={authMethod}
      data-needs-installation={needsInstallation}
      data-installations-count={installations.length}
      data-current-installations-count={currentInstallations.length}
    ></div>
  ))
}));

jest.mock('@/components/organisms/AccountSelectionPanel', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ installations, currentInstallations, onSwitchInstallations }) => (
    <div 
      data-testid="account-panel" 
      data-installations-count={installations.length}
      data-current-installations-count={currentInstallations.length}
    >
      <button 
        data-testid="switch-installations-button" 
        onClick={() => onSwitchInstallations([installations[0]?.id || 0])}
      >
        Switch
      </button>
    </div>
  ))
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
      data-loading={loading}
      data-installations-count={installations.length}
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
  ))
}));

// Create a base mock props object and helper function
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

// Simple React test renderer for assertion
const renderComponent = (element: React.ReactElement) => {
  const renderElement = (el: any): any => {
    if (!el) return null;
    if (typeof el === 'string' || typeof el === 'number') return el;
    
    // If this is a function component, render it
    if (typeof el.type === 'function') {
      const Component = el.type;
      const rendered = Component(el.props);
      return renderElement(rendered);
    }
    
    const result: any = { 
      type: el.type,
      props: { ...el.props },
      children: []
    };
    
    // Delete children from props
    delete result.props.children;
    
    if (el.props && el.props.children) {
      if (Array.isArray(el.props.children)) {
        result.children = el.props.children
          .filter(Boolean)
          .map((child: any) => renderElement(child));
      } else {
        result.children = [renderElement(el.props.children)].filter(Boolean);
      }
    }
    
    // Add helper method to find child by props
    result.findByProps = (propsToMatch: Record<string, any>) => {
      const findInChildren = (children: any[]): any => {
        for (const child of children) {
          if (!child || typeof child !== 'object') continue;
          
          // Check if props match
          const match = Object.entries(propsToMatch).every(([key, value]) => 
            child.props && child.props[key] === value
          );
          
          if (match) return child;
          
          // Recursively search in children
          if (child.children) {
            const found = findInChildren(Array.isArray(child.children) ? child.children : [child.children]);
            if (found) return found;
          }
        }
        return null;
      };
      
      return findInChildren(result.children);
    };
    
    return result;
  };
  
  return renderElement(element);
};

describe('OperationsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders without error', () => {
    const props = createDefaultProps();
    const rendered = renderComponent(<OperationsPanel {...props} />);
    
    expect(rendered.type).toBe('OperationsPanel');
    // Since the component structure has changed with the Atomic Design refactoring,
    // we now check for specific child components instead of looking at children.length
    const hasTerminalHeader = rendered.children.some((child: any) => child.type === 'TerminalHeader');
    const hasAuthBanner = rendered.children.some((child: any) => child.type === 'AuthStatusBanner');
    
    expect(hasTerminalHeader).toBe(true);
    expect(hasAuthBanner).toBe(true);
  });
  
  it('renders with GitHub App auth', () => {
    const props = createDefaultProps();
    const rendered = renderComponent(<OperationsPanel {...props} />);
    
    // AuthStatusBanner is a mocked component - find it by test id
    const authBanner = rendered.findByProps({ 'data-testid': 'auth-banner' });
    expect(authBanner).toBeTruthy();
    
    // Verify auth method was passed correctly (mocked component adds data- prefixes)
    expect(authBanner.props).toMatchObject({
      'data-testid': 'auth-banner',
      'data-auth-method': 'github_app',
      'data-needs-installation': false,
      'data-installations-count': 1,
      'data-current-installations-count': 0
    });
  });
  
  it('renders with error message', () => {
    const props = {
      ...createDefaultProps(),
      error: 'Test error message'
    };
    
    const rendered = renderComponent(<OperationsPanel {...props} />);
    
    // Find the ErrorAlert
    const errorAlert = rendered.children.find((child: any) => 
      child.type === 'ErrorAlert'
    );
    
    expect(errorAlert).toBeTruthy();
    expect(errorAlert.props.message).toBe('Test error message');
  });
  
  it('renders with authentication error', () => {
    const props = {
      ...createDefaultProps(),
      error: 'Error with authentication'
    };
    
    const rendered = renderComponent(<OperationsPanel {...props} />);
    
    // Find the ErrorAlert
    const errorAlert = rendered.children.find((child: any) => 
      child.type === 'ErrorAlert'
    );
    
    expect(errorAlert).toBeTruthy();
    expect(errorAlert.props.message).toBe('Error with authentication');
  });
  
  it('renders with needs installation', () => {
    const props = {
      ...createDefaultProps(),
      needsInstallation: true,
      error: 'GitHub App installation required'
    };
    
    const rendered = renderComponent(<OperationsPanel {...props} />);
    
    // Find the ErrorAlert
    const errorAlert = rendered.children.find((child: any) => 
      child.type === 'ErrorAlert'
    );
    
    expect(errorAlert).toBeTruthy();
    expect(errorAlert.props.needsInstallation).toBe(true);
  });
  
  it('renders account selection panel', () => {
    const props = createDefaultProps();
    const rendered = renderComponent(<OperationsPanel {...props} />);
    
    // Find the AccountSelectionPanel
    const accountPanel = rendered.children.find((child: any) => 
      child.type === 'AccountSelectionPanel'
    );
    
    expect(accountPanel).toBeTruthy();
  });
  
  it('renders with My Work Activity mode', () => {
    const props = {
      ...createDefaultProps(),
      activityMode: 'my-work-activity' as ActivityMode
    };
    
    const rendered = renderComponent(<OperationsPanel {...props} />);
    
    // Find the AnalysisFiltersPanel
    const filtersPanel = rendered.children.find((child: any) => 
      child.type === 'AnalysisFiltersPanel'
    );
    
    expect(filtersPanel).toBeTruthy();
    expect(filtersPanel.props.activityMode).toBe('my-work-activity');
  });
  
  it('renders with Team Activity mode', () => {
    const props = {
      ...createDefaultProps(),
      activityMode: 'team-activity' as ActivityMode
    };
    
    const rendered = renderComponent(<OperationsPanel {...props} />);
    
    // Find the AnalysisFiltersPanel
    const filtersPanel = rendered.children.find((child: any) => 
      child.type === 'AnalysisFiltersPanel'
    );
    
    expect(filtersPanel).toBeTruthy();
    expect(filtersPanel.props.activityMode).toBe('team-activity');
  });
  
  it('renders with loading state', () => {
    const props = {
      ...createDefaultProps(),
      loading: true,
      activityMode: 'team-activity' as ActivityMode
    };
    
    const rendered = renderComponent(<OperationsPanel {...props} />);
    
    // Find the AnalysisFiltersPanel
    const filtersPanel = rendered.children.find((child: any) => 
      child.type === 'AnalysisFiltersPanel'
    );
    
    expect(filtersPanel).toBeTruthy();
    expect(filtersPanel.props.loading).toBe(true);
  });
});