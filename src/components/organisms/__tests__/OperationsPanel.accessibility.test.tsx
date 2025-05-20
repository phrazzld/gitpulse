import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import OperationsPanel from '../OperationsPanel';
import { assertAccessible, testAccessibilityForStates } from '@/lib/tests/axeTest';
import { ActivityMode } from '@/components/atoms/ModeSelector';
import { Installation } from '@/types/dashboard';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Sample installations for testing
const mockInstallations: Installation[] = [
  { 
    id: 1, 
    account: { 
      login: 'org1', 
      type: 'Organization',
      avatarUrl: 'https://example.com/avatar1.png' 
    },
    appSlug: 'gitpulse',
    appId: 12345,
    repositorySelection: 'selected',
    targetType: 'Organization'
  },
  { 
    id: 2, 
    account: { 
      login: 'org2', 
      type: 'Organization',
      avatarUrl: 'https://example.com/avatar2.png' 
    },
    appSlug: 'gitpulse',
    appId: 12345,
    repositorySelection: 'selected',
    targetType: 'Organization'
  }
];

// Default props for testing
const defaultProps = {
  error: null as string | null,
  loading: false,
  needsInstallation: false,
  authMethod: 'github_app',
  installations: mockInstallations,
  currentInstallations: [mockInstallations[0]],
  activityMode: 'my-activity' as ActivityMode,
  activeFilters: {
    contributors: [] as string[],
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
};

describe('OperationsPanel Accessibility', () => {
  it('should have no accessibility violations in default state', async () => {
    const { container } = render(<OperationsPanel {...defaultProps} />);
    await assertAccessible(container);
  });

  it('should have no accessibility violations when showing error', async () => {
    const props = {
      ...defaultProps,
      error: 'Authentication failed. Please try again.'
    };
    const { container } = render(<OperationsPanel {...props} />);
    await assertAccessible(container);
  });

  it('should have no accessibility violations in loading state', async () => {
    const props = {
      ...defaultProps,
      loading: true
    };
    const { container } = render(<OperationsPanel {...props} />);
    await assertAccessible(container);
  });

  it('should have no accessibility violations with different activity modes', async () => {
    // Test all activity modes
    const modes: ActivityMode[] = ['my-activity', 'my-work-activity', 'team-activity'];
    
    for (const mode of modes) {
      const props = {
        ...defaultProps,
        activityMode: mode
      };
      const { container, unmount } = render(<OperationsPanel {...props} />);
      await assertAccessible(container);
      unmount();
    }
  });

  it('should have no accessibility violations when needing installation', async () => {
    const props = {
      ...defaultProps,
      needsInstallation: true,
      error: 'GitHub App installation required'
    };
    const { container } = render(<OperationsPanel {...props} />);
    await assertAccessible(container);
  });

  it('should test all common states for accessibility', async () => {
    await testAccessibilityForStates(
      (props) => render(<OperationsPanel {...defaultProps} {...props} />),
      {
        default: {},
        withError: { 
          error: 'Authentication failed. Please try again.' 
        },
        loading: { 
          loading: true 
        },
        needsInstallation: {
          needsInstallation: true,
          error: 'GitHub App installation required'
        },
        differentAuthMethod: {
          authMethod: 'oauth',
          isGitHubAppAuth: false
        },
        noInstallations: {
          hasInstallations: false,
          installations: [] as Installation[]
        },
        teamMode: {
          activityMode: 'team-activity' as ActivityMode
        }
      }
    );
  });

  describe('Nested component accessibility', () => {
    it('should ensure nested ErrorAlert is accessible', async () => {
      const props = {
        ...defaultProps,
        error: 'Authentication error occurred',
        needsInstallation: true
      };
      
      const { getByText, container } = render(<OperationsPanel {...props} />);
      
      // Verify the ErrorAlert is rendered
      expect(getByText(/SYSTEM ALERT:/)).toBeInTheDocument();
      expect(getByText(/Authentication error occurred/)).toBeInTheDocument();
      
      // Verify it's accessible
      await assertAccessible(container);
    });
    
    it('should ensure nested panels are accessible', async () => {
      const { container } = render(<OperationsPanel {...defaultProps} />);
      
      // Just verify the whole component is accessible
      await assertAccessible(container);
    });
  });
});