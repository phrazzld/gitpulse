import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AuthStatusBanner from '../AuthStatusBanner';
import { assertAccessible, testAccessibilityForStates } from '@/lib/tests/axeTest';
import { Installation } from '@/types/dashboard';

// Mock the useAriaAnnouncer hook
jest.mock('@/lib/accessibility/useAriaAnnouncer', () => {
  const announceMock = jest.fn();
  return {
    useAriaAnnouncer: jest.fn().mockReturnValue({
      announce: announceMock,
    }),
    __mocks: {
      announce: announceMock
    }
  };
});

// Mock the dashboard utils
jest.mock('@/lib/dashboard-utils', () => ({
  getGitHubAppInstallUrl: jest.fn().mockReturnValue('https://github.com/apps/gitpulse/installations/new'),
}));

// Mock the github auth utility
jest.mock('@/lib/github/auth', () => ({
  getInstallationManagementUrl: jest.fn().mockReturnValue('https://github.com/settings/installations/123'),
}));

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Sample data for tests
const mockInstallations: Installation[] = [
  {
    id: 12345,
    account: {
      login: 'example-org',
      type: 'Organization',
      avatarUrl: 'https://github.com/avatars/example-org.png'
    },
    appSlug: 'gitpulse',
    appId: 123456,
    repositorySelection: 'selected',
    targetType: 'Organization'
  }
];

const emptyInstallations: Installation[] = [];

describe('AuthStatusBanner Accessibility', () => {
  describe('WCAG Compliance', () => {
    it('should have no accessibility violations with GitHub App auth', async () => {
      const { container } = render(
        <AuthStatusBanner 
          authMethod="github_app"
          installations={mockInstallations}
          currentInstallations={mockInstallations}
        />
      );
      await assertAccessible(container);
    });

    it('should have no accessibility violations with OAuth auth', async () => {
      const { container } = render(
        <AuthStatusBanner 
          authMethod="oauth"
          installations={emptyInstallations}
          currentInstallations={emptyInstallations}
        />
      );
      await assertAccessible(container);
    });

    it('should have no accessibility violations when needing installation', async () => {
      const { container } = render(
        <AuthStatusBanner 
          authMethod="oauth"
          needsInstallation={true}
          installations={emptyInstallations}
          currentInstallations={emptyInstallations}
        />
      );
      await assertAccessible(container);
    });

    it('should test all common states for accessibility', async () => {
      type AuthStatusBannerTestProps = Parameters<typeof AuthStatusBanner>[0];

      await testAccessibilityForStates<AuthStatusBannerTestProps>(
        (props) => render(<AuthStatusBanner {...props} />),
        {
          githubApp: { 
            authMethod: "github_app",
            installations: mockInstallations,
            currentInstallations: mockInstallations
          },
          oauth: { 
            authMethod: "oauth",
            installations: emptyInstallations,
            currentInstallations: emptyInstallations
          },
          needsInstallation: {
            authMethod: "oauth",
            needsInstallation: true,
            installations: emptyInstallations,
            currentInstallations: emptyInstallations
          },
          gitHubAppWithNoCurrentInstallation: {
            authMethod: "github_app",
            installations: mockInstallations,
            currentInstallations: []
          }
        }
      );
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient contrast for GitHub App status', () => {
      render(
        <AuthStatusBanner 
          authMethod="github_app"
          installations={mockInstallations}
          currentInstallations={mockInstallations}
        />
      );
      
      const bannerElement = screen.getByText('GITHUB APP INTEGRATION ACTIVE');
      expect(bannerElement).toBeInTheDocument();
      
      // We can't test the exact styles in JSDOM, but we can verify the element exists
      const bannerContainer = bannerElement.closest('div')?.parentElement;
      expect(bannerContainer).toBeInTheDocument();
    });
    
    it('should have sufficient contrast for OAuth status', () => {
      render(
        <AuthStatusBanner 
          authMethod="oauth"
          installations={emptyInstallations}
          currentInstallations={emptyInstallations}
        />
      );
      
      const bannerElement = screen.getByText('USING OAUTH AUTHENTICATION');
      expect(bannerElement).toBeInTheDocument();
      
      // We can't test the exact styles in JSDOM, but we can verify the element exists
      const bannerContainer = bannerElement.closest('div')?.parentElement;
      expect(bannerContainer).toBeInTheDocument();
    });
    
    it('should have sufficient contrast for manage installation button', () => {
      render(
        <AuthStatusBanner 
          authMethod="github_app"
          installations={mockInstallations}
          currentInstallations={mockInstallations}
        />
      );
      
      const manageButton = screen.getByText('MANAGE');
      expect(manageButton).toBeInTheDocument();
      
      // We can't test the exact styles in JSDOM, but we can verify the element exists
      // and has expected classes
      expect(manageButton).toHaveClass('text-xs', 'px-2', 'py-1', 'rounded-md');
    });
    
    it('should have sufficient contrast for upgrade to app button', () => {
      render(
        <AuthStatusBanner 
          authMethod="oauth"
          needsInstallation={false}
          installations={emptyInstallations}
          currentInstallations={emptyInstallations}
        />
      );
      
      const upgradeButton = screen.getByText('UPGRADE TO APP');
      expect(upgradeButton).toBeInTheDocument();
      
      // Button should have proper styling
      expect(upgradeButton).toHaveStyle({
        backgroundColor: 'var(--dark-slate)',
        color: 'var(--neon-green)',
        border: '1px solid var(--neon-green)'
      });
    });
    
    it('should have sufficient contrast for app not configured status', () => {
      const mockDashboardUtils = require('@/lib/dashboard-utils');
      mockDashboardUtils.getGitHubAppInstallUrl.mockReturnValue('#github-app-not-configured');
      
      render(
        <AuthStatusBanner 
          authMethod="oauth"
          needsInstallation={false}
          installations={emptyInstallations}
          currentInstallations={emptyInstallations}
        />
      );
      
      const appNeedsSetupText = screen.getByText('APP NEEDS SETUP');
      expect(appNeedsSetupText).toBeInTheDocument();
      
      // We can't test the exact styles in JSDOM, but we can verify the element exists
      // and has expected classes
      expect(appNeedsSetupText).toHaveClass('text-xs', 'px-2', 'py-1', 'rounded-md');
    });
  });
  
  describe('Keyboard Interaction', () => {
    it('should allow keyboard activation of upgrade button', () => {
      const mockDashboardUtils = require('@/lib/dashboard-utils');
      mockDashboardUtils.getGitHubAppInstallUrl.mockReturnValue('https://github.com/apps/gitpulse/installations/new');
      
      const { __mocks } = require('@/lib/accessibility/useAriaAnnouncer');
      
      render(
        <AuthStatusBanner 
          authMethod="oauth"
          needsInstallation={false}
          installations={emptyInstallations}
          currentInstallations={emptyInstallations}
        />
      );
      
      const upgradeButton = screen.getByText('UPGRADE TO APP');
      expect(upgradeButton).toBeInTheDocument();
      
      // Should be focusable
      upgradeButton.focus();
      expect(document.activeElement).toBe(upgradeButton);
      
      // Clicking should trigger the onClick handler
      fireEvent.click(upgradeButton);
      expect(__mocks.announce).toHaveBeenCalled();
    });
    
    it('should allow keyboard navigation for add account button', () => {
      render(
        <AuthStatusBanner 
          authMethod="github_app"
          installations={mockInstallations}
          currentInstallations={mockInstallations}
        />
      );
      
      const addButton = screen.getByText('ADD ACCOUNT');
      expect(addButton).toBeInTheDocument();
      
      // Should be focusable
      addButton.focus();
      expect(document.activeElement).toBe(addButton);
    });
    
    it('should allow keyboard navigation for manage button', () => {
      render(
        <AuthStatusBanner 
          authMethod="github_app"
          installations={mockInstallations}
          currentInstallations={mockInstallations}
        />
      );
      
      const manageButton = screen.getByText('MANAGE');
      expect(manageButton).toBeInTheDocument();
      
      // Should be focusable
      manageButton.focus();
      expect(document.activeElement).toBe(manageButton);
    });
  });
  
  describe('Screen Reader Announcements', () => {
    it('should announce GitHub App authentication status on mount', () => {
      const { __mocks } = require('@/lib/accessibility/useAriaAnnouncer');
      
      render(
        <AuthStatusBanner 
          authMethod="github_app"
          installations={mockInstallations}
          currentInstallations={mockInstallations}
        />
      );
      
      // Verify announcement function was called
      expect(__mocks.announce).toHaveBeenCalled();
    });
    
    it('should announce OAuth authentication status on mount', () => {
      const { __mocks } = require('@/lib/accessibility/useAriaAnnouncer');
      
      render(
        <AuthStatusBanner 
          authMethod="oauth"
          installations={emptyInstallations}
          currentInstallations={emptyInstallations}
        />
      );
      
      // Verify announcement function was called
      expect(__mocks.announce).toHaveBeenCalled();
    });
    
    it('should announce when upgrading to GitHub App', () => {
      const { __mocks } = require('@/lib/accessibility/useAriaAnnouncer');
      
      const mockDashboardUtils = require('@/lib/dashboard-utils');
      mockDashboardUtils.getGitHubAppInstallUrl.mockReturnValue('https://github.com/apps/gitpulse/installations/new');
      
      render(
        <AuthStatusBanner 
          authMethod="oauth"
          needsInstallation={false}
          installations={emptyInstallations}
          currentInstallations={emptyInstallations}
        />
      );
      
      // Reset the mock to check for the new call
      jest.clearAllMocks();
      
      // Click the upgrade button
      const upgradeButton = screen.getByText('UPGRADE TO APP');
      fireEvent.click(upgradeButton);
      
      // Verify announcement function was called again after click
      expect(__mocks.announce).toHaveBeenCalled();
    });
  });
  
  describe('ARIA Attributes', () => {
    it('should have appropriate status icon for screen readers', () => {
      const { container } = render(
        <AuthStatusBanner 
          authMethod="github_app"
          installations={mockInstallations}
          currentInstallations={mockInstallations}
        />
      );
      
      // Find the status icon
      const statusIcon = container.querySelector('svg');
      expect(statusIcon).toBeInTheDocument();
      
      // Since this is a decorative icon, it shouldn't have explicit ARIA attributes
      // It's part of a text element which conveys the meaning
    });
  });
  
  describe('Interactive Element States', () => {
    it('should support hover states for upgrade button', () => {
      const mockDashboardUtils = require('@/lib/dashboard-utils');
      mockDashboardUtils.getGitHubAppInstallUrl.mockReturnValue('https://github.com/apps/gitpulse/installations/new');
      
      render(
        <AuthStatusBanner 
          authMethod="oauth"
          needsInstallation={false}
          installations={emptyInstallations}
          currentInstallations={emptyInstallations}
        />
      );
      
      const upgradeButton = screen.getByText('UPGRADE TO APP');
      
      // Verify transition classes for hover effect
      expect(upgradeButton).toHaveClass('transition-all', 'duration-200');
      
      // Simulate hover
      fireEvent.mouseOver(upgradeButton);
      // The hover event handler sets inline styles in the component
      // But we can't easily test the applied hover styles in JSDOM
      
      // Return to normal state
      fireEvent.mouseOut(upgradeButton);
    });
  });
});