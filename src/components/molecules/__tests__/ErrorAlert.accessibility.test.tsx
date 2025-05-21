import React from 'react';
import { render } from '@testing-library/react';
import ErrorAlert from '../ErrorAlert';
import { assertAccessible, testAccessibilityForStates } from '@/lib/tests/axeTest';

describe('ErrorAlert Accessibility', () => {
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
});