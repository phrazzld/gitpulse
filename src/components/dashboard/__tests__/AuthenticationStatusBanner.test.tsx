import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AuthenticationStatusBanner from "../AuthenticationStatusBanner";

describe("AuthenticationStatusBanner", () => {
  const defaultProps = {
    error: null,
    authMethod: null,
    needsInstallation: false,
    getGitHubAppInstallUrl: jest
      .fn()
      .mockReturnValue("https://github.com/apps/test-app/installations/new"),
    handleAuthError: jest.fn(),
    signOutCallback: jest.fn(),
  };

  test("renders nothing when no error and no auth method", () => {
    const { container } = render(
      <AuthenticationStatusBanner {...defaultProps} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders error message when error is provided", () => {
    const props = {
      ...defaultProps,
      error: "Test error message",
    };

    render(<AuthenticationStatusBanner {...props} />);
    expect(
      screen.getByText(/SYSTEM ALERT: Test error message/),
    ).toBeInTheDocument();
  });

  test("renders GitHub App installation button when needed", () => {
    const props = {
      ...defaultProps,
      error: "GitHub App installation required",
      needsInstallation: true,
    };

    render(<AuthenticationStatusBanner {...props} />);

    const installButton = screen.getByText("INSTALL GITHUB APP");
    expect(installButton).toBeInTheDocument();
    expect(installButton).toHaveAttribute(
      "href",
      "https://github.com/apps/test-app/installations/new",
    );
  });

  test("renders app not configured message when GitHub App URL is invalid", () => {
    const props = {
      ...defaultProps,
      error: "GitHub App installation required",
      needsInstallation: true,
      getGitHubAppInstallUrl: jest
        .fn()
        .mockReturnValue("#github-app-not-configured"),
    };

    render(<AuthenticationStatusBanner {...props} />);
    expect(screen.getByText("APP NOT CONFIGURED")).toBeInTheDocument();
    expect(screen.queryByText("INSTALL GITHUB APP")).not.toBeInTheDocument();
  });

  test("renders reinitialize session button for authentication errors", () => {
    const props = {
      ...defaultProps,
      error: "GitHub authentication issue detected",
    };

    render(<AuthenticationStatusBanner {...props} />);

    const resetButton = screen.getByText("REINITIALIZE SESSION");
    expect(resetButton).toBeInTheDocument();

    // Test button click
    fireEvent.click(resetButton);
    expect(props.signOutCallback).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  test("renders GitHub App authentication status banner", () => {
    const props = {
      ...defaultProps,
      authMethod: "github_app",
    };

    render(<AuthenticationStatusBanner {...props} />);
    expect(
      screen.getByText("GITHUB APP INTEGRATION ACTIVE"),
    ).toBeInTheDocument();
  });

  test("renders OAuth authentication status banner", () => {
    const props = {
      ...defaultProps,
      authMethod: "oauth",
    };

    render(<AuthenticationStatusBanner {...props} />);
    expect(screen.getByText("USING OAUTH AUTHENTICATION")).toBeInTheDocument();
  });

  test("renders upgrade to app button for OAuth users", () => {
    const props = {
      ...defaultProps,
      authMethod: "oauth",
      needsInstallation: false,
    };

    render(<AuthenticationStatusBanner {...props} />);

    const upgradeButton = screen.getByText("UPGRADE TO APP");
    expect(upgradeButton).toBeInTheDocument();
    expect(upgradeButton).toHaveAttribute(
      "href",
      "https://github.com/apps/test-app/installations/new",
    );
  });

  test("shows app needs setup message when GitHub App URL is invalid for OAuth users", () => {
    const props = {
      ...defaultProps,
      authMethod: "oauth",
      needsInstallation: false,
      getGitHubAppInstallUrl: jest
        .fn()
        .mockReturnValue("#github-app-not-configured"),
    };

    render(<AuthenticationStatusBanner {...props} />);
    expect(screen.getByText("APP NEEDS SETUP")).toBeInTheDocument();
    expect(screen.queryByText("UPGRADE TO APP")).not.toBeInTheDocument();
  });

  test("does not show upgrade button when using GitHub App already", () => {
    const props = {
      ...defaultProps,
      authMethod: "github_app",
      needsInstallation: false,
    };

    render(<AuthenticationStatusBanner {...props} />);
    expect(screen.queryByText("UPGRADE TO APP")).not.toBeInTheDocument();
  });

  test("includes github app installation button with proper attributes", () => {
    const props = {
      ...defaultProps,
      error: "GitHub App installation required",
      needsInstallation: true,
    };

    render(<AuthenticationStatusBanner {...props} />);

    const installButton = screen.getByText("INSTALL GITHUB APP");
    expect(installButton).toBeInTheDocument();
    expect(installButton).toHaveAttribute(
      "href",
      "https://github.com/apps/test-app/installations/new",
    );

    // Verify mouse event handlers
    expect(installButton.onmouseover).toBeDefined();
    expect(installButton.onmouseout).toBeDefined();
  });

  test("includes upgrade button for oauth users with correct attributes", () => {
    const props = {
      ...defaultProps,
      authMethod: "oauth",
      needsInstallation: false,
    };

    render(<AuthenticationStatusBanner {...props} />);

    const upgradeButton = screen.getByText("UPGRADE TO APP");
    expect(upgradeButton).toBeInTheDocument();
    expect(upgradeButton).toHaveAttribute(
      "href",
      "https://github.com/apps/test-app/installations/new",
    );

    // Verify mouse event handlers
    expect(upgradeButton.onmouseover).toBeDefined();
    expect(upgradeButton.onmouseout).toBeDefined();
  });
});
