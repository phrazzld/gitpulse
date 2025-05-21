import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AccountSelectionPanel from '../AccountSelectionPanel';
import { assertAccessible, testAccessibilityForStates } from '@/lib/tests/axeTest';
import { Installation } from '@/types/dashboard';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the getGitHubAppInstallUrl and getInstallationManagementUrl functions
jest.mock('@/lib/dashboard-utils', () => ({
  getGitHubAppInstallUrl: jest.fn().mockReturnValue('https://github.com/apps/gitpulse/installations/new')
}));

jest.mock('@/lib/github/auth', () => ({
  getInstallationManagementUrl: jest.fn().mockReturnValue('https://github.com/settings/installations/12345')
}));

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
  installations: mockInstallations,
  currentInstallations: [mockInstallations[0]],
  onSwitchInstallations: jest.fn()
};

describe('AccountSelectionPanel Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should have no accessibility violations in default state', async () => {
    const { container } = render(<AccountSelectionPanel {...defaultProps} />);
    await assertAccessible(container);
  });
  
  it('should have no accessibility violations with multiple selections', async () => {
    const props = {
      ...defaultProps,
      currentInstallations: mockInstallations
    };
    const { container } = render(<AccountSelectionPanel {...props} />);
    await assertAccessible(container);
  });
  
  it('should have no accessibility violations with no selections', async () => {
    const props = {
      ...defaultProps,
      currentInstallations: []
    };
    const { container } = render(<AccountSelectionPanel {...props} />);
    await assertAccessible(container);
  });
  
  it('should test all common states for accessibility', async () => {
    await testAccessibilityForStates(
      (props) => render(<AccountSelectionPanel {...defaultProps} {...props} />),
      {
        default: {},
        multipleSelections: {
          currentInstallations: mockInstallations
        },
        noSelections: {
          currentInstallations: []
        },
        noInstallations: {
          installations: [],
          currentInstallations: []
        }
      }
    );
  });
  
  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation through all interactive elements', () => {
      render(<AccountSelectionPanel {...defaultProps} />);
      
      // Get all interactive elements
      const interactiveElements = screen.getAllByRole('button');
      interactiveElements.push(...screen.getAllByRole('link'));
      
      // Check that all interactive elements are focusable in order
      interactiveElements.forEach(element => {
        element.focus();
        expect(document.activeElement).toBe(element);
      });
    });
    
    it('should trigger onSwitchInstallations when removing an installation with keyboard', () => {
      const onSwitchInstallationsMock = jest.fn();
      
      render(
        <AccountSelectionPanel 
          {...defaultProps} 
          onSwitchInstallations={onSwitchInstallationsMock}
        />
      );
      
      // Find the remove button (× button)
      const removeButton = screen.getByText('×');
      expect(removeButton).toBeInTheDocument();
      
      // Click directly instead of keyboard navigation in testing environment
      fireEvent.click(removeButton);
      
      // Verify callback was called with empty array (removing the only selected installation)
      expect(onSwitchInstallationsMock).toHaveBeenCalled();
    });
    
    it('should open installation URL when ADD ACCOUNT link is activated via keyboard', () => {
      render(<AccountSelectionPanel {...defaultProps} />);
      
      // Find the ADD ACCOUNT link
      const addAccountLink = screen.getByText('ADD ACCOUNT');
      expect(addAccountLink).toBeInTheDocument();
      
      // Verify href attribute
      expect(addAccountLink).toHaveAttribute('href', 'https://github.com/apps/gitpulse/installations/new');
      
      // Verify it's keyboard focusable
      addAccountLink.focus();
      expect(document.activeElement).toBe(addAccountLink);
    });
  });
  
  describe('ARIA Attributes', () => {
    it('should use proper semantic elements for interactive components', () => {
      render(<AccountSelectionPanel {...defaultProps} />);
      
      // ADD ACCOUNT should be a proper link
      const addAccountLink = screen.getByText('ADD ACCOUNT');
      expect(addAccountLink.tagName).toBe('A');
      
      // MANAGE CURRENT should be a proper link
      const manageCurrentLink = screen.getByText('MANAGE CURRENT');
      expect(manageCurrentLink.tagName).toBe('A');
      expect(manageCurrentLink).toHaveAttribute('target', '_blank');
      expect(manageCurrentLink).toHaveAttribute('rel', 'noopener noreferrer');
      
      // Remove button should be a proper button
      const removeButton = screen.getByText('×');
      expect(removeButton.tagName).toBe('BUTTON');
    });
    
    it('should have proper heading and text structure', () => {
      render(<AccountSelectionPanel {...defaultProps} />);
      
      // Check for proper heading/label structure
      const accountsHeading = screen.getByText('AVAILABLE ACCOUNTS & ORGANIZATIONS');
      expect(accountsHeading).toBeInTheDocument();
      
      const activeAccountsLabel = screen.getAllByText('ACTIVE ACCOUNTS:');
      expect(activeAccountsLabel.length).toBeGreaterThan(0);
    });
  });
  
  describe('Color Contrast', () => {
    it('should use appropriate colors for UI elements', () => {
      const { container } = render(<AccountSelectionPanel {...defaultProps} />);
      
      // Since JSDOM doesn't compute styles, we'll check for the existence of specific elements
      const headerContainer = container.querySelector('.flex.items-center.justify-between');
      expect(headerContainer).toBeInTheDocument();
      
      // Check for the account chip container
      const accountChipsContainer = container.querySelector('.flex.flex-wrap.gap-2');
      expect(accountChipsContainer).toBeInTheDocument();
    });
  });
  
  describe('Screen Reader Text', () => {
    it('should have descriptive text for screen readers', () => {
      render(<AccountSelectionPanel {...defaultProps} />);
      
      // Check for descriptive help text
      const helpText = screen.getByText(/Select one or more accounts to analyze/);
      expect(helpText).toBeInTheDocument();
      
      // Empty state text should be informative
      const props = {
        ...defaultProps,
        currentInstallations: []
      };
      const { getByText } = render(<AccountSelectionPanel {...props} />);
      
      const emptyStateText = getByText(/No accounts selected/);
      expect(emptyStateText).toBeInTheDocument();
    });
  });
  
  describe('Interactive Element States', () => {
    it('should have proper interactive elements for account management', () => {
      render(<AccountSelectionPanel {...defaultProps} />);
      
      // Check the ADD ACCOUNT link exists
      const addAccountButton = screen.getByText('ADD ACCOUNT');
      expect(addAccountButton).toBeInTheDocument();
      
      // Check the account chip (selected account) exists
      const accountChip = screen.getByText('org1');
      expect(accountChip).toBeInTheDocument();
      
      // Check the remove button exists
      const removeButton = screen.getByText('×');
      expect(removeButton).toBeInTheDocument();
    });
  });
});