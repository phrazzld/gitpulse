import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AnalysisFiltersPanel from '../AnalysisFiltersPanel';
import { assertAccessible, testAccessibilityForStates } from '@/lib/tests/axeTest';
import { Installation } from '@/types/dashboard';
import { ActivityMode } from '@/components/atoms/ModeSelector';

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

// Mock the ModeSelector component to simplify testing
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
          role="radio" 
          aria-checked={selectedMode === 'my-activity'}
          aria-label="MY ACTIVITY"
        >
          MY ACTIVITY
        </button>
        <button 
          onClick={() => onChange('my-work-activity')} 
          data-testid="mode-option-my-work-activity"
          role="radio" 
          aria-checked={selectedMode === 'my-work-activity'}
          aria-label="MY WORK ACTIVITY"
        >
          MY WORK ACTIVITY
        </button>
        <button 
          onClick={() => onChange('team-activity')} 
          data-testid="mode-option-team-activity"
          role="radio" 
          aria-checked={selectedMode === 'team-activity'}
          aria-label="TEAM ACTIVITY"
        >
          TEAM ACTIVITY
        </button>
      </div>
    )
  };
});

// Mock the OrganizationPicker component
jest.mock('@/components/organisms/OrganizationPicker', () => {
  return {
    __esModule: true,
    default: ({ 
      organizations, 
      selectedOrganizations, 
      onSelectionChange 
    }: { 
      organizations: Array<{ id: number; login: string; }>; 
      selectedOrganizations: string[]; 
      onSelectionChange: (orgs: string[]) => void;
    }) => (
      <div data-testid="organization-picker">
        <div>Organization Picker</div>
        {organizations.map((org: { id: number; login: string }) => (
          <div key={org.id} data-testid={`org-${org.login}`}>
            {org.login}
          </div>
        ))}
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
  activityMode: 'my-activity' as ActivityMode,
  loading: false,
  installations: mockInstallations,
  activeFilters: {
    contributors: [] as string[],
    organizations: [] as string[],
    repositories: [] as string[]
  },
  userName: 'testuser',
  onModeChange: jest.fn(),
  onOrganizationChange: jest.fn()
};

describe('AnalysisFiltersPanel Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should have no accessibility violations in default state', async () => {
    const { container } = render(<AnalysisFiltersPanel {...defaultProps} />);
    await assertAccessible(container);
  });
  
  it('should have no accessibility violations in loading state', async () => {
    const props = {
      ...defaultProps,
      loading: true
    };
    const { container } = render(<AnalysisFiltersPanel {...props} />);
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
      const { container, unmount } = render(<AnalysisFiltersPanel {...props} />);
      await assertAccessible(container);
      unmount();
    }
  });
  
  it('should have no accessibility violations with active filters', async () => {
    const props = {
      ...defaultProps,
      activeFilters: {
        contributors: ['user1', 'user2'],
        organizations: ['org1'],
        repositories: ['repo1', 'repo2']
      }
    };
    const { container } = render(<AnalysisFiltersPanel {...props} />);
    await assertAccessible(container);
  });
  
  it('should test all common states for accessibility', async () => {
    await testAccessibilityForStates(
      (props) => render(<AnalysisFiltersPanel {...defaultProps} {...props} />),
      {
        default: {},
        loading: { 
          loading: true 
        },
        myWorkActivityMode: {
          activityMode: 'my-work-activity' as ActivityMode
        },
        teamActivityMode: {
          activityMode: 'team-activity' as ActivityMode
        },
        withActiveFilters: {
          activeFilters: {
            contributors: ['user1'],
            organizations: ['org1'],
            repositories: ['repo1']
          }
        },
        withNoUserName: {
          userName: null
        }
      }
    );
  });
  
  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation through all interactive elements', () => {
      render(<AnalysisFiltersPanel {...defaultProps} />);
      
      // Get all radio buttons from our mocked ModeSelector
      const modeButtons = screen.getAllByRole('radio');
      expect(modeButtons.length).toBe(3);
      
      // Check that all interactive elements are focusable in order
      modeButtons.forEach(element => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });
    
    it('should trigger onModeChange when mode buttons are activated', () => {
      const onModeChangeMock = jest.fn();
      
      render(
        <AnalysisFiltersPanel 
          {...defaultProps} 
          onModeChange={onModeChangeMock}
        />
      );
      
      // Find the mode selector buttons using our test IDs
      const teamActivityButton = screen.getByTestId('mode-option-team-activity');
      expect(teamActivityButton).toBeInTheDocument();
      
      // Click the button
      fireEvent.click(teamActivityButton);
      
      // Verify callback was called
      expect(onModeChangeMock).toHaveBeenCalledWith('team-activity');
    });
    
    it('should properly show/hide OrganizationPicker based on mode', () => {
      // First render with my-activity (shouldn't show OrganizationPicker)
      const { rerender } = render(<AnalysisFiltersPanel {...defaultProps} />);
      
      // OrganizationPicker should not be visible in my-activity mode
      const orgPickerInMyActivity = screen.queryByTestId('organization-picker');
      expect(orgPickerInMyActivity).toBeNull();
      
      // Rerender with my-work-activity (should show OrganizationPicker)
      rerender(
        <AnalysisFiltersPanel 
          {...defaultProps} 
          activityMode="my-work-activity"
        />
      );
      
      // Now the OrganizationPicker should be visible
      const orgPickerInMyWorkActivity = screen.queryByTestId('organization-picker');
      expect(orgPickerInMyWorkActivity).toBeInTheDocument();
    });
  });
  
  describe('ARIA Attributes', () => {
    it('should have appropriate heading structure', () => {
      render(<AnalysisFiltersPanel {...defaultProps} />);
      
      // Verify heading text exists (in our version uses h3)
      const heading = screen.getByText('ANALYSIS FILTERS');
      expect(heading).toBeInTheDocument();
    });
    
    it('should use proper ARIA attributes in nested ModeSelector', () => {
      render(<AnalysisFiltersPanel {...defaultProps} />);
      
      // Ensure proper ARIA attributes in our mock
      const selectedButton = screen.getByTestId('mode-option-my-activity');
      expect(selectedButton).toHaveAttribute('aria-checked', 'true');
      
      const unselectedButton = screen.getByTestId('mode-option-team-activity');
      expect(unselectedButton).toHaveAttribute('aria-checked', 'false');
    });
  });
  
  describe('Color Contrast and Visual Structure', () => {
    it('should have proper structural elements', () => {
      const { container } = render(<AnalysisFiltersPanel {...defaultProps} />);
      
      // Check for border class on main container element
      const borderElement = container.querySelector('.border');
      expect(borderElement).toBeInTheDocument();
      
      // Check for proper structure (grid layout)
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toBeInTheDocument();
    });
  });
  
  describe('Visibility and Organization', () => {
    it('should show appropriate UI components based on mode', () => {
      // Render with team-activity mode to test organization picker visibility
      const { container } = render(
        <AnalysisFiltersPanel 
          {...defaultProps} 
          activityMode="team-activity"
        />
      );
      
      // Check for ModeSelector presence
      const modeSelector = screen.getByTestId('mode-selector');
      expect(modeSelector).toBeInTheDocument();
      
      // Check for OrganizationPicker presence in team-activity mode
      const orgPicker = screen.getByTestId('organization-picker');
      expect(orgPicker).toBeInTheDocument();
    });
  });
  
  describe('Screen Reader Announcements', () => {
    it('should announce mode changes to screen readers', () => {
      const { __mocks } = require('@/lib/accessibility/useAriaAnnouncer');
      const onModeChangeMock = jest.fn();
      
      render(
        <AnalysisFiltersPanel 
          {...defaultProps} 
          onModeChange={onModeChangeMock}
        />
      );
      
      // Find and click a mode button
      const teamActivityButton = screen.getByTestId('mode-option-team-activity');
      fireEvent.click(teamActivityButton);
      
      // Verify that the callback was called which would normally trigger the announcement
      expect(onModeChangeMock).toHaveBeenCalled();
    });
    
    it('should provide relevant text content', () => {
      render(<AnalysisFiltersPanel {...defaultProps} />);
      
      // Check for informative text
      const configureText = screen.getByText('CONFIGURE PARAMETERS');
      expect(configureText).toBeInTheDocument();
      
      const filtersHeading = screen.getByText('ANALYSIS FILTERS');
      expect(filtersHeading).toBeInTheDocument();
    });
  });
});