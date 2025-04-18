import React from 'react';
import { render, screen, fireEvent, it } from '../../../__tests__/test-utils';
import AuthenticationStatusBanner from '@/components/dashboard/AuthenticationStatusBanner';

describe('AuthenticationStatusBanner', () => {
  // Common props
  const mockGetGitHubAppInstallUrl = jest.fn().mockReturnValue('https://github.com/apps/test-app/installations/new');
  const mockHandleAuthError = jest.fn();
  const mockSignOutCallback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when no error or auth method is provided', () => {
    const { container } = render(
      <AuthenticationStatusBanner
        error={null}
        authMethod={null}
        needsInstallation={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        handleAuthError={mockHandleAuthError}
        signOutCallback={mockSignOutCallback}
      />
    );
    
    // Container should be empty
    expect(container.firstChild).toBeNull();
  });

  it('renders error message correctly', () => {
    const errorMsg = 'Test error message';
    render(
      <AuthenticationStatusBanner
        error={errorMsg}
        authMethod={null}
        needsInstallation={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        handleAuthError={mockHandleAuthError}
        signOutCallback={mockSignOutCallback}
      />
    );
    
    // Error message should be displayed
    expect(screen.getByText('SYSTEM ALERT: ' + errorMsg)).toBeInTheDocument();
  });

  it('renders install button when needsInstallation is true', () => {
    render(
      <AuthenticationStatusBanner
        error={'GitHub App installation required'}
        authMethod={null}
        needsInstallation={true}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        handleAuthError={mockHandleAuthError}
        signOutCallback={mockSignOutCallback}
      />
    );
    
    // Install button should be displayed
    const installButton = screen.getByText('INSTALL GITHUB APP');
    expect(installButton).toBeInTheDocument();
    
    // Button should link to GitHub App installation URL
    expect(installButton).toHaveAttribute('href', 'https://github.com/apps/test-app/installations/new');
  });

  it('renders "APP NOT CONFIGURED" message when GitHub App is not configured', () => {
    const mockGetUnconfiguredUrl = jest.fn().mockReturnValue('#github-app-not-configured');
    
    render(
      <AuthenticationStatusBanner
        error={'GitHub App installation required'}
        authMethod={null}
        needsInstallation={true}
        getGitHubAppInstallUrl={mockGetUnconfiguredUrl}
        handleAuthError={mockHandleAuthError}
        signOutCallback={mockSignOutCallback}
      />
    );
    
    // Error message should be displayed
    expect(screen.getByText('APP NOT CONFIGURED')).toBeInTheDocument();
  });

  it('renders reinitialize button for authentication errors', () => {
    const authError = 'GitHub authentication issue detected';
    
    render(
      <AuthenticationStatusBanner
        error={authError}
        authMethod={null}
        needsInstallation={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        handleAuthError={mockHandleAuthError}
        signOutCallback={mockSignOutCallback}
      />
    );
    
    // Reinitialize button should be displayed
    const reinitializeButton = screen.getByText('REINITIALIZE SESSION');
    expect(reinitializeButton).toBeInTheDocument();
    
    // Click the button
    fireEvent.click(reinitializeButton);
    
    // Verify signOut was called with correct parameters
    expect(mockSignOutCallback).toHaveBeenCalledTimes(1);
    expect(mockSignOutCallback).toHaveBeenCalledWith({ callbackUrl: '/' });
  });

  it('renders GitHub App authentication banner', () => {
    render(
      <AuthenticationStatusBanner
        error={null}
        authMethod={'github_app'}
        needsInstallation={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        handleAuthError={mockHandleAuthError}
        signOutCallback={mockSignOutCallback}
      />
    );
    
    // GitHub App banner should be displayed
    expect(screen.getByText('GITHUB APP INTEGRATION ACTIVE')).toBeInTheDocument();
  });

  it('renders OAuth authentication banner with upgrade button', () => {
    render(
      <AuthenticationStatusBanner
        error={null}
        authMethod={'oauth'}
        needsInstallation={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        handleAuthError={mockHandleAuthError}
        signOutCallback={mockSignOutCallback}
      />
    );
    
    // OAuth banner should be displayed
    expect(screen.getByText('USING OAUTH AUTHENTICATION')).toBeInTheDocument();
    
    // Upgrade button should be displayed
    const upgradeButton = screen.getByText('UPGRADE TO APP');
    expect(upgradeButton).toBeInTheDocument();
    
    // Button should link to GitHub App installation URL
    expect(upgradeButton).toHaveAttribute('href', 'https://github.com/apps/test-app/installations/new');
  });
});