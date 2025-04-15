import React from 'react';
import { render, screen, fireEvent } from '../../../__tests__/test-utils';
import AccountManagementPanel from '@/components/dashboard/AccountManagementPanel';
import { mockSession } from '../../../__tests__/test-utils';

// Mock AccountSelector component to simplify testing
jest.mock('@/components/AccountSelector', () => {
  return {
    __esModule: true,
    default: ({ 
      accounts, 
      selectedAccounts, 
      onSelectionChange, 
      isLoading,
      multiSelect,
      showCurrentLabel,
      currentUsername
    }) => (
      <div data-testid="account-selector">
        <span>Selected accounts: {selectedAccounts.join(', ') || 'None'}</span>
        <span>Loading: {isLoading ? 'true' : 'false'}</span>
        <span>Total accounts: {accounts.length}</span>
        <button 
          onClick={() => onSelectionChange(['test-org'])}
          data-testid="select-account-button"
        >
          Select Account
        </button>
        <button 
          onClick={() => onSelectionChange([])}
          data-testid="clear-selection-button"
        >
          Clear Selection
        </button>
      </div>
    )
  };
});

describe('AccountManagementPanel', () => {
  // Mock props
  const mockInstallations = [
    {
      id: 123,
      account: {
        login: 'test-org',
        type: 'Organization',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
      appSlug: 'test-app',
      appId: 456,
      repositorySelection: 'all',
      targetType: 'Organization',
    },
    {
      id: 456,
      account: {
        login: 'another-org',
        type: 'Organization',
        avatarUrl: 'https://example.com/avatar2.jpg',
      },
      appSlug: 'test-app',
      appId: 456,
      repositorySelection: 'all',
      targetType: 'Organization',
    }
  ];

  const mockGetGitHubAppInstallUrl = jest.fn().mockReturnValue('https://github.com/apps/test-app/installations/new');
  const mockGetInstallationManagementUrl = jest.fn().mockReturnValue('https://github.com/settings/installations/123');
  const mockSwitchInstallations = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when authMethod is not github_app', () => {
    const { container } = render(
      <AccountManagementPanel
        authMethod="oauth"
        installations={mockInstallations}
        currentInstallations={[mockInstallations[0]]}
        loading={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        getInstallationManagementUrl={mockGetInstallationManagementUrl}
        switchInstallations={mockSwitchInstallations}
        session={mockSession}
      />
    );
    
    // Component should not render anything
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when installations array is empty', () => {
    const { container } = render(
      <AccountManagementPanel
        authMethod="github_app"
        installations={[]}
        currentInstallations={[]}
        loading={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        getInstallationManagementUrl={mockGetInstallationManagementUrl}
        switchInstallations={mockSwitchInstallations}
        session={mockSession}
      />
    );
    
    // Component should not render anything
    expect(container).toBeEmptyDOMElement();
  });

  it('renders correctly with installations', () => {
    render(
      <AccountManagementPanel
        authMethod="github_app"
        installations={mockInstallations}
        currentInstallations={[mockInstallations[0]]}
        loading={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        getInstallationManagementUrl={mockGetInstallationManagementUrl}
        switchInstallations={mockSwitchInstallations}
        session={mockSession}
      />
    );
    
    // Should display header
    expect(screen.getByText('AVAILABLE ACCOUNTS & ORGANIZATIONS')).toBeInTheDocument();
    
    // Should display add account button
    expect(screen.getByText('ADD ACCOUNT')).toBeInTheDocument();
    
    // Should display manage current button (when there are current installations)
    expect(screen.getByText('MANAGE CURRENT')).toBeInTheDocument();
    
    // Should display account selector
    expect(screen.getByTestId('account-selector')).toBeInTheDocument();
    
    // Should display selected accounts
    expect(screen.getByText('Selected accounts: test-org')).toBeInTheDocument();
    
    // Should display total accounts
    expect(screen.getByText(`Total accounts: ${mockInstallations.length}`)).toBeInTheDocument();
    
    // Should display help text
    expect(screen.getByText(/Select one or more accounts to analyze/)).toBeInTheDocument();
  });

  it('does not display manage current button when there are no current installations', () => {
    render(
      <AccountManagementPanel
        authMethod="github_app"
        installations={mockInstallations}
        currentInstallations={[]} // Empty array
        loading={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        getInstallationManagementUrl={mockGetInstallationManagementUrl}
        switchInstallations={mockSwitchInstallations}
        session={mockSession}
      />
    );
    
    // Manage current button should not be displayed
    expect(screen.queryByText('MANAGE CURRENT')).not.toBeInTheDocument();
  });

  it('calls getGitHubAppInstallUrl when ADD ACCOUNT button is clicked', () => {
    render(
      <AccountManagementPanel
        authMethod="github_app"
        installations={mockInstallations}
        currentInstallations={[mockInstallations[0]]}
        loading={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        getInstallationManagementUrl={mockGetInstallationManagementUrl}
        switchInstallations={mockSwitchInstallations}
        session={mockSession}
      />
    );
    
    // Function should have been called when getting the href
    expect(mockGetGitHubAppInstallUrl).toHaveBeenCalledTimes(1);
    
    // Verify the ADD ACCOUNT link has the correct href
    const addAccountLink = screen.getByText('ADD ACCOUNT').closest('a');
    expect(addAccountLink).toHaveAttribute('href', 'https://github.com/apps/test-app/installations/new');
  });

  it('calls getInstallationManagementUrl with correct parameters', () => {
    render(
      <AccountManagementPanel
        authMethod="github_app"
        installations={mockInstallations}
        currentInstallations={[mockInstallations[0]]}
        loading={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        getInstallationManagementUrl={mockGetInstallationManagementUrl}
        switchInstallations={mockSwitchInstallations}
        session={mockSession}
      />
    );
    
    // Function should have been called with correct parameters
    expect(mockGetInstallationManagementUrl).toHaveBeenCalledTimes(1);
    expect(mockGetInstallationManagementUrl).toHaveBeenCalledWith(
      mockInstallations[0].id,
      mockInstallations[0].account.login,
      mockInstallations[0].account.type
    );
    
    // Verify the MANAGE CURRENT link has the correct href
    const manageCurrentLink = screen.getByText('MANAGE CURRENT').closest('a');
    expect(manageCurrentLink).toHaveAttribute('href', 'https://github.com/settings/installations/123');
  });

  it('calls switchInstallations when an account is selected', () => {
    render(
      <AccountManagementPanel
        authMethod="github_app"
        installations={mockInstallations}
        currentInstallations={[]}
        loading={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        getInstallationManagementUrl={mockGetInstallationManagementUrl}
        switchInstallations={mockSwitchInstallations}
        session={mockSession}
      />
    );
    
    // Click select account button
    fireEvent.click(screen.getByTestId('select-account-button'));
    
    // Should call switchInstallations with selected installation ID
    expect(mockSwitchInstallations).toHaveBeenCalledTimes(1);
    expect(mockSwitchInstallations).toHaveBeenCalledWith([123]); // ID of test-org
  });

  it('calls switchInstallations with empty array when no accounts are selected', () => {
    render(
      <AccountManagementPanel
        authMethod="github_app"
        installations={mockInstallations}
        currentInstallations={[mockInstallations[0]]}
        loading={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        getInstallationManagementUrl={mockGetInstallationManagementUrl}
        switchInstallations={mockSwitchInstallations}
        session={mockSession}
      />
    );
    
    // Click clear selection button
    fireEvent.click(screen.getByTestId('clear-selection-button'));
    
    // Should call switchInstallations with empty array
    expect(mockSwitchInstallations).toHaveBeenCalledTimes(1);
    expect(mockSwitchInstallations).toHaveBeenCalledWith([]);
  });

  it('passes loading state to AccountSelector', () => {
    render(
      <AccountManagementPanel
        authMethod="github_app"
        installations={mockInstallations}
        currentInstallations={[mockInstallations[0]]}
        loading={true}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        getInstallationManagementUrl={mockGetInstallationManagementUrl}
        switchInstallations={mockSwitchInstallations}
        session={mockSession}
      />
    );
    
    // Should show loading state
    expect(screen.getByText('Loading: true')).toBeInTheDocument();
  });

  it('correctly maps installation data to account format for AccountSelector', () => {
    render(
      <AccountManagementPanel
        authMethod="github_app"
        installations={mockInstallations}
        currentInstallations={[mockInstallations[0]]}
        loading={false}
        getGitHubAppInstallUrl={mockGetGitHubAppInstallUrl}
        getInstallationManagementUrl={mockGetInstallationManagementUrl}
        switchInstallations={mockSwitchInstallations}
        session={mockSession}
      />
    );
    
    // Should pass correct number of accounts to AccountSelector
    expect(screen.getByText(`Total accounts: ${mockInstallations.length}`)).toBeInTheDocument();
    
    // Should pass correct selected accounts
    expect(screen.getByText('Selected accounts: test-org')).toBeInTheDocument();
  });
});