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

  test("handles install button hover state correctly", () => {
    const props = {
      ...defaultProps,
      error: "GitHub App installation required",
      needsInstallation: true,
    };

    render(<AuthenticationStatusBanner {...props} />);
    const installButton = screen.getByText("INSTALL GITHUB APP");

    // Check initial state (not hovered)
    expect(installButton).toHaveClass("bg-dark-slate");
    expect(installButton).toHaveClass("text-neon-green");

    // Simulate hover
    fireEvent.mouseEnter(installButton);
    expect(installButton).toHaveClass("bg-neon-green");
    expect(installButton).toHaveClass("text-dark-slate");

    // Simulate hover out
    fireEvent.mouseLeave(installButton);
    expect(installButton).toHaveClass("bg-dark-slate");
    expect(installButton).toHaveClass("text-neon-green");
  });

  test("handles upgrade button hover state correctly", () => {
    const props = {
      ...defaultProps,
      authMethod: "oauth",
      needsInstallation: false,
    };

    render(<AuthenticationStatusBanner {...props} />);
    const upgradeButton = screen.getByText("UPGRADE TO APP");

    // Check initial state (not hovered)
    expect(upgradeButton).toHaveClass("bg-dark-slate");
    expect(upgradeButton).toHaveClass("text-neon-green");

    // Simulate hover
    fireEvent.mouseEnter(upgradeButton);
    expect(upgradeButton).toHaveClass("bg-neon-green");
    expect(upgradeButton).toHaveClass("text-dark-slate");

    // Simulate hover out
    fireEvent.mouseLeave(upgradeButton);
    expect(upgradeButton).toHaveClass("bg-dark-slate");
    expect(upgradeButton).toHaveClass("text-neon-green");
  });

  test("handles reinitialize session button hover state correctly", () => {
    const props = {
      ...defaultProps,
      error: "GitHub authentication issue detected",
    };

    render(<AuthenticationStatusBanner {...props} />);
    const resetButton = screen.getByText("REINITIALIZE SESSION");

    // Check initial state (not hovered)
    expect(resetButton).toHaveClass("bg-dark-slate");
    expect(resetButton).toHaveClass("text-electric-blue");

    // Simulate hover
    fireEvent.mouseEnter(resetButton);
    expect(resetButton).toHaveClass("bg-electric-blue");
    expect(resetButton).toHaveClass("text-dark-slate");

    // Simulate hover out
    fireEvent.mouseLeave(resetButton);
    expect(resetButton).toHaveClass("bg-dark-slate");
    expect(resetButton).toHaveClass("text-electric-blue");
  });
});
