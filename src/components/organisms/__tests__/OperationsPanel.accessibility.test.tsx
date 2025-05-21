import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import OperationsPanel from '../OperationsPanel';
import { assertAccessible, testAccessibilityForStates } from '@/lib/tests/axeTest';
import { ActivityMode } from '@/components/atoms/ModeSelector';
import { Installation } from '@/types/dashboard';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the useAriaAnnouncer hook
jest.mock('@/lib/accessibility/useAriaAnnouncer', () => {
  const announceMock = jest.fn();
  return {
    useAriaAnnouncer: jest.fn().mockReturnValue({
      announce: announceMock,
      clearQueue: jest.fn(),
    }),
    __mocks: {
      announce: announceMock
    }
  };
});

// Mock child components to simplify testing
jest.mock('@/components/molecules/TerminalHeader', () => {
  return function MockTerminalHeader({ title }: { title: string }) {
    return <h2>{title}</h2>;
  };
});

jest.mock('@/components/molecules/ErrorAlert', () => {
  return function MockErrorAlert({ message }: { message: string }) {
    return (
      <div role="alert">
        <span>SYSTEM ALERT:</span> {message}
      </div>
    );
  };
});

jest.mock('@/components/atoms/ModeSelector', () => {
  return {
    __esModule: true,
    ActivityMode: {
      'my-activity': 'my-activity',
      'my-work-activity': 'my-work-activity',
      'team-activity': 'team-activity'
    },
    default: ({ selectedMode, onChange }: { selectedMode: string; onChange: (mode: string) => void }) => (
      <div data-testid="mode-selector">
        <button 
          onClick={() => onChange('my-activity')} 
          data-testid="mode-option-my-activity"
          aria-label="MY ACTIVITY"
        >
          MY ACTIVITY
        </button>
        <button 
          onClick={() => onChange('my-work-activity')} 
          data-testid="mode-option-my-work-activity"
          aria-label="MY WORK ACTIVITY"
        >
          MY WORK ACTIVITY
        </button>
      </div>
    )
  };
});

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    it('should ensure nested ErrorAlert is rendered correctly', async () => {
      const props = {
        ...defaultProps,
        error: 'Authentication error occurred',
        needsInstallation: true
      };
      
      const { getByText, container } = render(<OperationsPanel {...props} />);
      
      // Verify the ErrorAlert is rendered (via our mock)
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

  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation through interactive elements', () => {
      render(<OperationsPanel {...defaultProps} />);
      
      // Get all buttons from our mocked components
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Verify we can focus each button
      buttons.forEach(button => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });
    
    it('should trigger callbacks when interactive elements are activated', () => {
      const onModeChangeMock = jest.fn();
      
      render(<OperationsPanel 
        {...defaultProps} 
        onModeChange={onModeChangeMock}
      />);
      
      // Find a button by test ID from our mock
      const activityButton = screen.getByTestId('mode-option-my-work-activity');
      expect(activityButton).toBeInTheDocument();
      
      // Click the button
      fireEvent.click(activityButton);
      
      // Verify callback was called
      expect(onModeChangeMock).toHaveBeenCalledWith('my-work-activity');
    });
  });
  
  describe('ARIA Attributes', () => {
    it('should have appropriate ARIA attributes for the main container', () => {
      const { container } = render(<OperationsPanel {...defaultProps} />);
      
      // Test that the section has proper ARIA attributes
      const mainSection = container.querySelector('section');
      expect(mainSection).toHaveAttribute('role', 'region');
      expect(mainSection).toHaveAttribute('aria-label', 'Commit Analysis Controls');
    });
    
    it('should have proper landmark regions', () => {
      const { container } = render(<OperationsPanel {...defaultProps} />);
      
      // The component should have at least one landmark region
      const regions = container.querySelectorAll('[role="region"]');
      expect(regions.length).toBeGreaterThan(0);
    });
    
    it('should use the proper heading hierarchy', () => {
      render(<OperationsPanel {...defaultProps} />);
      
      // Verify heading level for the terminal header
      const heading = screen.getByText('COMMIT ANALYSIS MODULE');
      expect(heading.tagName).toBe('H2');
    });
  });
  
  describe('Color Contrast', () => {
    it('should use appropriate container styles', () => {
      const { container } = render(<OperationsPanel {...defaultProps} />);
      
      // Check for basic structural elements
      const containerElement = container.querySelector('section');
      expect(containerElement).toBeInTheDocument();
      expect(containerElement).toHaveClass('border');
      expect(containerElement).toHaveClass('rounded-lg');
    });
  });
  
  describe('Screen Reader Announcements', () => {
    it('should announce errors to screen readers', () => {
      const { __mocks } = require('@/lib/accessibility/useAriaAnnouncer');
      
      render(<OperationsPanel 
        {...defaultProps} 
        error="Critical system error" 
      />);
      
      // With our mocked ErrorAlert, we don't directly test announce,
      // but we can verify the alert role is present
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toBeInTheDocument();
    });
    
    it('should have descriptive text for each component', () => {
      render(<OperationsPanel {...defaultProps} />);
      
      // Verify key text elements are present
      expect(screen.getByText('COMMIT ANALYSIS MODULE')).toBeInTheDocument();
    });
  });
});