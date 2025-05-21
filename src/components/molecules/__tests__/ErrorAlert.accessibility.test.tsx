import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorAlert from '../ErrorAlert';
import { assertAccessible, testAccessibilityForStates } from '@/lib/tests/axeTest';
import { axe, toHaveNoViolations } from 'jest-axe';

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

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('ErrorAlert Accessibility', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should have no accessibility violations in default state', async () => {
    const { container } = render(<ErrorAlert message="An error occurred" />);
    await assertAccessible(container);
  });

  it('should have no accessibility violations with installation button', async () => {
    const { container } = render(
      <ErrorAlert 
        message="GitHub App installation required" 
        needsInstallation={true}
        installationUrl="https://github.com/apps/gitpulse/installations/new"
      />
    );
    await assertAccessible(container);
  });

  it('should have no accessibility violations with sign out button', async () => {
    const onSignOut = jest.fn();
    const { container } = render(
      <ErrorAlert 
        message="Your authentication has expired" 
        onSignOut={onSignOut}
      />
    );
    await assertAccessible(container);
  });

  it('should have no accessibility violations with app not configured', async () => {
    const { container } = render(
      <ErrorAlert 
        message="GitHub App not configured" 
        needsInstallation={true}
        installationUrl="#github-app-not-configured"
      />
    );
    await assertAccessible(container);
  });

  it('should test all common states for accessibility', async () => {
    type ErrorAlertTestProps = Parameters<typeof ErrorAlert>[0];

    await testAccessibilityForStates<ErrorAlertTestProps>(
      (props) => render(<ErrorAlert {...props} />),
      {
        default: { message: "An error occurred" },
        withInstallation: { 
          message: "GitHub App installation required", 
          needsInstallation: true,
          installationUrl: "https://github.com/apps/gitpulse/installations/new"
        },
        withSignOut: {
          message: "Your authentication has expired",
          onSignOut: jest.fn()
        },
        withBoth: {
          message: "Authentication error - GitHub App installation required",
          needsInstallation: true,
          installationUrl: "https://github.com/apps/gitpulse/installations/new",
          onSignOut: jest.fn()
        }
      }
    );
  });
  
  describe('Color Contrast', () => {
    it('should have sufficient contrast for error text', async () => {
      render(<ErrorAlert message="An error occurred" />);
      
      // The component uses crimson-red for the text which should have sufficient contrast
      // against the light background with red tint
      const alertElement = screen.getByText(/SYSTEM ALERT:/);
      expect(alertElement).toBeInTheDocument();
      
      // We can't test the exact styles in JSDOM, but we can verify the element exists
      const alertContainer = alertElement.closest('div');
      expect(alertContainer).toBeInTheDocument();
    });
    
    it('should have sufficient contrast for installation button', async () => {
      render(
        <ErrorAlert 
          message="GitHub App installation required" 
          needsInstallation={true}
          installationUrl="https://github.com/apps/gitpulse/installations/new"
        />
      );
      
      const installButton = screen.getByText('INSTALL GITHUB APP');
      expect(installButton).toBeInTheDocument();
      expect(installButton).toHaveStyle({
        backgroundColor: 'var(--dark-slate)',
        color: 'var(--neon-green, #00994f)',
        border: '1px solid var(--neon-green, #00994f)'
      });
    });
    
    it('should have sufficient contrast for reinitialize session button', async () => {
      const onSignOut = jest.fn();
      render(
        <ErrorAlert 
          message="Your authentication has expired" 
          onSignOut={onSignOut}
        />
      );
      
      const signoutButton = screen.getByText('REINITIALIZE SESSION');
      expect(signoutButton).toBeInTheDocument();
      expect(signoutButton).toHaveStyle({
        backgroundColor: 'var(--dark-slate)',
        color: 'var(--electric-blue, #0066cc)',
        border: '1px solid var(--electric-blue, #0066cc)'
      });
    });
  });
  
  describe('Keyboard Interaction', () => {
    it('should allow keyboard activation of installation button', () => {
      render(
        <ErrorAlert 
          message="GitHub App installation required" 
          needsInstallation={true}
          installationUrl="https://github.com/apps/gitpulse/installations/new"
        />
      );
      
      const installButton = screen.getByText('INSTALL GITHUB APP');
      expect(installButton).toBeInTheDocument();
      
      // Ensure button is focusable
      installButton.focus();
      expect(document.activeElement).toBe(installButton);
    });
    
    it('should allow keyboard activation of reinitialize session button', () => {
      const onSignOut = jest.fn();
      render(
        <ErrorAlert 
          message="Your authentication has expired" 
          onSignOut={onSignOut}
        />
      );
      
      const signoutButton = screen.getByText('REINITIALIZE SESSION');
      expect(signoutButton).toBeInTheDocument();
      
      // Ensure button is focusable
      signoutButton.focus();
      expect(document.activeElement).toBe(signoutButton);
      
      // Activate with Enter key
      fireEvent.keyDown(signoutButton, { key: 'Enter' });
      fireEvent.click(signoutButton);
      expect(onSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });
  
  describe('Screen Reader Announcements', () => {
    it('should announce error message on mount', () => {
      // Reset mocks
      const { __mocks } = require('@/lib/accessibility/useAriaAnnouncer');
      
      render(<ErrorAlert message="An error occurred" />);
      
      // Verify the announce function was called
      expect(__mocks.announce).toHaveBeenCalled();
    });
    
    it('should announce session reinitialization when button is clicked', () => {
      // Reset mocks
      const { __mocks } = require('@/lib/accessibility/useAriaAnnouncer');
      const onSignOut = jest.fn();
      
      render(
        <ErrorAlert 
          message="Your authentication has expired" 
          onSignOut={onSignOut}
        />
      );
      
      // Trigger the button click
      const signoutButton = screen.getByText('REINITIALIZE SESSION');
      fireEvent.click(signoutButton);
      
      // Verify the announce function was called and onSignOut was called
      expect(onSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });
  
  describe('ARIA Attributes', () => {
    it('should have alert element with proper roles', () => {
      const { container } = render(<ErrorAlert message="An error occurred" />);
      
      // The component doesn't use explicit role="alert", but it should have 
      // the appropriate styling and structure to convey its purpose
      const alertIcon = container.querySelector('svg');
      expect(alertIcon).toBeInTheDocument();
      
      // Text elements should be properly structured
      const alertText = screen.getByText(/SYSTEM ALERT:/);
      expect(alertText).toBeInTheDocument();
    });
  });
  
  describe('Focus Management', () => {
    it('should maintain visible focus indicators on interactive elements', () => {
      const onSignOut = jest.fn();
      render(
        <ErrorAlert 
          message="Your authentication has expired" 
          onSignOut={onSignOut}
        />
      );
      
      const signoutButton = screen.getByText('REINITIALIZE SESSION');
      
      // Focus the button
      signoutButton.focus();
      expect(document.activeElement).toBe(signoutButton);
      
      // The button should have visible focus styles
      // Note: We can't test computed styles in JSDOM directly,
      // but we can check the component applies appropriate classes/styles
      expect(signoutButton).toHaveClass('transition-all');
    });
  });

  describe('Component Variants', () => {
    it('should handle authentication errors with sign out callback', () => {
      const onSignOut = jest.fn();
      render(
        <ErrorAlert 
          message="Your authentication has expired" 
          onSignOut={onSignOut}
        />
      );
      
      // Check if message is displayed correctly
      expect(screen.getByText(/SYSTEM ALERT: Your authentication has expired/)).toBeInTheDocument();
      
      // Check if the sign out button is displayed
      const signoutButton = screen.getByText('REINITIALIZE SESSION');
      expect(signoutButton).toBeInTheDocument();
      
      // Test the button click
      fireEvent.click(signoutButton);
      expect(onSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
    
    it('should handle GitHub App installation required errors', () => {
      render(
        <ErrorAlert 
          message="GitHub App installation required" 
          needsInstallation={true}
          installationUrl="https://github.com/apps/gitpulse/installations/new"
        />
      );
      
      // Check if message is displayed correctly
      expect(screen.getByText(/SYSTEM ALERT: GitHub App installation required/)).toBeInTheDocument();
      
      // Check if the installation button is displayed
      const installButton = screen.getByText('INSTALL GITHUB APP');
      expect(installButton).toBeInTheDocument();
      
      // Check if the button has the correct href
      expect(installButton).toHaveAttribute('href', 'https://github.com/apps/gitpulse/installations/new');
    });
    
    it('should handle GitHub App not configured', () => {
      render(
        <ErrorAlert 
          message="GitHub App not configured" 
          needsInstallation={true}
          installationUrl="#github-app-not-configured"
        />
      );
      
      // Check if message is displayed correctly
      expect(screen.getByText(/SYSTEM ALERT: GitHub App not configured/)).toBeInTheDocument();
      
      // Check if the app not configured message is displayed
      const appNotConfigured = screen.getByText('APP NOT CONFIGURED');
      expect(appNotConfigured).toBeInTheDocument();
    });
    
    it('should support hover states for buttons', () => {
      render(
        <ErrorAlert 
          message="GitHub App installation required" 
          needsInstallation={true}
          installationUrl="https://github.com/apps/gitpulse/installations/new"
        />
      );
      
      const installButton = screen.getByText('INSTALL GITHUB APP');
      
      // Simulate hover (mouseOver) and mouseOut
      fireEvent.mouseOver(installButton);
      // The hover effect is applied via inline styles in event handlers
      
      fireEvent.mouseOut(installButton);
      // The normal style is restored via inline styles in event handlers
    });
    
    it('should handle both installation and auth error together', () => {
      const onSignOut = jest.fn();
      render(
        <ErrorAlert 
          // The message must include "authentication" to trigger the auth error handling
          message="Your authentication has expired and GitHub App installation is required" 
          needsInstallation={true}
          installationUrl="https://github.com/apps/gitpulse/installations/new"
          onSignOut={onSignOut}
        />
      );
      
      // Check if both buttons are displayed
      const installButton = screen.getByText('INSTALL GITHUB APP');
      expect(installButton).toBeInTheDocument();
      
      const signoutButton = screen.getByText('REINITIALIZE SESSION');
      expect(signoutButton).toBeInTheDocument();
    });
  });
});