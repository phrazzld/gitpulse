import React from 'react';
import OperationsPanel from '../OperationsPanel';
import { ActivityMode } from '@/components/ui/ModeSelector';

// Mock the dashboard-utils module
jest.mock('@/lib/dashboard-utils', () => ({
  getGitHubAppInstallUrl: jest.fn().mockReturnValue('https://github.com/apps/gitpulse/installations/new')
}));

// Mock the github module
jest.mock('@/lib/github', () => ({
  getInstallationManagementUrl: jest.fn().mockReturnValue('https://github.com/settings/installations/123')
}));

// Mock components used by OperationsPanel
jest.mock('@/components/ui/ModeSelector', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ selectedMode, onChange, disabled }) => (
    <div data-testid="mode-selector" data-selected-mode={selectedMode} data-disabled={disabled}>
      <button onClick={() => onChange('my-activity')}>My Activity</button>
      <button onClick={() => onChange('my-work-activity')}>My Work Activity</button>
      <button onClick={() => onChange('team-activity')}>Team Activity</button>
    </div>
  ))
}));

jest.mock('@/components/OrganizationPicker', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ 
    organizations, 
    selectedOrganizations, 
    onSelectionChange,
    mode,
    disabled,
    isLoading,
    currentUsername
  }) => {
    // Only render for appropriate modes
    if (mode !== 'my-work-activity' && mode !== 'team-activity') {
      return null;
    }
    
    return (
      <div 
        data-testid="org-picker" 
        data-selected-orgs={JSON.stringify(selectedOrganizations)}
        data-disabled={disabled}
        data-loading={isLoading}
        data-username={currentUsername}
        data-mode={mode}
      >
        <button onClick={() => onSelectionChange(['org1'])}>Select Org1</button>
        <button onClick={() => onSelectionChange(['org1', 'org2'])}>Select Multiple</button>
        <button onClick={() => onSelectionChange([])}>Clear Selection</button>
      </div>
    );
  })
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn()
  })
}));

// Create mock element for testing
interface MockElement {
  type: string;
  props: Record<string, any>;
  children?: MockElement[] | string | number;
}

interface MockRenderer {
  render: (component: React.ReactElement) => MockElement;
}

const createMockRenderer = (): MockRenderer => {
  return {
    render: (component: React.ReactElement): MockElement => {
      // Extract type and props from component
      const type = component.type;
      const props = component.props as Record<string, any>;
      
      let renderedType = '';
      if (typeof type === 'string') {
        renderedType = type;
      } else if (typeof type === 'function') {
        // For function components, use the name
        renderedType = type.name || 'Unknown';
      } else {
        renderedType = 'Unknown';
      }
      
      let children: MockElement[] | string | number | undefined;
      
      // Handle children prop
      if (props.children) {
        if (Array.isArray(props.children)) {
          children = props.children.map((child: any) => {
            if (React.isValidElement(child)) {
              // @ts-ignore - We know the render method exists on this
              return this.render(child);
            }
            return child;
          });
        } else if (React.isValidElement(props.children)) {
          // @ts-ignore - We know the render method exists on this
          children = this.render(props.children);
        } else {
          children = props.children;
        }
      }
      
      // Create the rendered element
      const renderedElement: MockElement = {
        type: renderedType,
        props: { ...props, children: undefined },
      };
      
      if (children !== undefined) {
        renderedElement.children = children;
      }
      
      return renderedElement;
    }
  };
};

describe('OperationsPanel', () => {
  // Sample test data
  const defaultProps = {
    error: null,
    loading: false,
    needsInstallation: false,
    authMethod: 'github_app',
    installations: [
      {
        id: 123,
        account: {
          login: 'org1',
          type: 'Organization',
          avatarUrl: 'https://github.com/org1.png'
        },
        appSlug: 'gitpulse',
        appId: 1,
        repositorySelection: 'all',
        targetType: 'Organization'
      },
      {
        id: 456,
        account: {
          login: 'user1',
          type: 'User',
          avatarUrl: 'https://github.com/user1.png'
        },
        appSlug: 'gitpulse',
        appId: 1,
        repositorySelection: 'all',
        targetType: 'User'
      }
    ],
    currentInstallations: [
      {
        id: 123,
        account: {
          login: 'org1',
          type: 'Organization',
          avatarUrl: 'https://github.com/org1.png'
        },
        appSlug: 'gitpulse',
        appId: 1,
        repositorySelection: 'all',
        targetType: 'Organization'
      }
    ],
    activityMode: 'my-activity' as ActivityMode,
    activeFilters: {
      contributors: ['me'],
      organizations: [],
      repositories: []
    },
    userName: 'testuser',
    onModeChange: jest.fn(),
    onOrganizationChange: jest.fn(),
    onFilterChange: jest.fn(),
    onSwitchInstallations: jest.fn(),
    onSignOut: jest.fn()
  };

  // Create the mock renderer
  const mockRenderer = createMockRenderer();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders component with github_app auth method', () => {
    const rendered = mockRenderer.render(<OperationsPanel {...defaultProps} />);
    
    // Check if it renders the right auth method message
    expect(rendered).toBeDefined();
    expect(JSON.stringify(rendered)).toContain('GITHUB APP INTEGRATION ACTIVE');
  });
  
  test('renders component with oauth auth method', () => {
    const rendered = mockRenderer.render(
      <OperationsPanel 
        {...defaultProps} 
        authMethod="oauth"
        currentInstallations={[]}
      />
    );
    
    // Check if it renders the right auth method message
    expect(rendered).toBeDefined();
    expect(JSON.stringify(rendered)).toContain('USING OAUTH AUTHENTICATION');
  });
  
  test('renders with error message', () => {
    const rendered = mockRenderer.render(
      <OperationsPanel 
        {...defaultProps} 
        error="Something went wrong"
      />
    );
    
    // Check if it renders the error message
    expect(rendered).toBeDefined();
    expect(JSON.stringify(rendered)).toContain('SYSTEM ALERT: Something went wrong');
  });
  
  test('renders with authentication error and reinitialize button', () => {
    const rendered = mockRenderer.render(
      <OperationsPanel 
        {...defaultProps} 
        error="GitHub authentication issue detected"
      />
    );
    
    // Check if it renders the error message and the reinitialize button
    expect(rendered).toBeDefined();
    expect(JSON.stringify(rendered)).toContain('SYSTEM ALERT: GitHub authentication issue detected');
    expect(JSON.stringify(rendered)).toContain('REINITIALIZE SESSION');
  });
  
  test('renders with needsInstallation message and button', () => {
    const rendered = mockRenderer.render(
      <OperationsPanel 
        {...defaultProps} 
        needsInstallation={true}
        error="GitHub App installation required"
      />
    );
    
    // Check if it renders the installation button
    expect(rendered).toBeDefined();
    expect(JSON.stringify(rendered)).toContain('INSTALL GITHUB APP');
  });
  
  test('renders mode selector with correct props', () => {
    const rendered = mockRenderer.render(<OperationsPanel {...defaultProps} />);
    
    // Find the mode selector in the rendered output
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('mode-selector');
    expect(renderedJson).toContain('my-activity');
  });
  
  test('renders organization picker for my-work-activity mode', () => {
    const rendered = mockRenderer.render(
      <OperationsPanel 
        {...defaultProps} 
        activityMode="my-work-activity"
      />
    );
    
    // Check if organization picker is rendered for this mode
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('org-picker');
    expect(renderedJson).toContain('my-work-activity');
  });
  
  test('renders organization picker for team-activity mode', () => {
    const rendered = mockRenderer.render(
      <OperationsPanel 
        {...defaultProps} 
        activityMode="team-activity"
      />
    );
    
    // Check if organization picker is rendered for this mode
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('org-picker');
    expect(renderedJson).toContain('team-activity');
  });
  
  test('does not render organization picker for my-activity mode', () => {
    const rendered = mockRenderer.render(
      <OperationsPanel 
        {...defaultProps} 
        activityMode="my-activity"
      />
    );
    
    // Check if organization picker is not rendered for this mode
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).not.toContain('org-picker');
  });
  
  test('passes loading state to child components', () => {
    const rendered = mockRenderer.render(
      <OperationsPanel 
        {...defaultProps} 
        loading={true}
        activityMode="team-activity"
      />
    );
    
    // Check if loading prop is passed to child components
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('"data-loading":true');
    expect(renderedJson).toContain('"data-disabled":true');
  });
});