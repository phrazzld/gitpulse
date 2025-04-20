import React, { useState } from "react";
import { cn } from "../../components/library/utils/cn";

interface Props {
  error: string | null;
  authMethod: string | null;
  needsInstallation: boolean;
  getGitHubAppInstallUrl: () => string;
  signOutCallback: (options?: { callbackUrl: string }) => void;
  handleAuthError?: () => void; // Made optional since it's not used
}

type ButtonType =
  | "install"
  | "upgrade"
  | "reinitialize"
  | "app-not-configured"
  | "app-needs-setup";

// Error Banner Component
function ErrorBanner({
  error,
  needsInstallation,
  isGitHubAppNotConfigured,
  getGitHubAppInstallUrl,
  getButtonClasses,
  setHoveredButton,
  signOutCallback,
}: {
  error: string;
  needsInstallation: boolean;
  isGitHubAppNotConfigured: boolean;
  getGitHubAppInstallUrl: () => string;
  getButtonClasses: (type: ButtonType) => string;
  setHoveredButton: React.Dispatch<React.SetStateAction<string | null>>;
  signOutCallback: (options?: { callbackUrl: string }) => void;
}) {
  return (
    <div className="mb-6 p-4 rounded-md border flex flex-col md:flex-row md:items-center bg-opacity-10 bg-crimson-red border-crimson-red text-crimson-red">
      <div className="flex items-start">
        <svg
          className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>SYSTEM ALERT: {error}</div>
      </div>
      <div className="md:ml-auto mt-3 md:mt-0 flex space-x-3">
        {needsInstallation && (
          <>
            {isGitHubAppNotConfigured ? (
              <div className={getButtonClasses("app-not-configured")}>
                APP NOT CONFIGURED
              </div>
            ) : (
              <a
                href={getGitHubAppInstallUrl()}
                className={getButtonClasses("install")}
                onMouseEnter={() => setHoveredButton("install")}
                onMouseLeave={() => setHoveredButton(null)}
              >
                INSTALL GITHUB APP
              </a>
            )}
          </>
        )}
        {error.includes("authentication") && (
          <button
            className={getButtonClasses("reinitialize")}
            onMouseEnter={() => setHoveredButton("reinitialize")}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => signOutCallback({ callbackUrl: "/" })}
          >
            REINITIALIZE SESSION
          </button>
        )}
      </div>
    </div>
  );
}

// Auth Status Banner Component
function AuthStatusBanner({
  authMethod,
  needsInstallation,
  isGitHubAppNotConfigured,
  getGitHubAppInstallUrl,
  getButtonClasses,
  setHoveredButton,
}: {
  authMethod: string;
  needsInstallation: boolean;
  isGitHubAppNotConfigured: boolean;
  getGitHubAppInstallUrl: () => string;
  getButtonClasses: (type: ButtonType) => string;
  setHoveredButton: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const isGithubApp = authMethod === "github_app";
  const bannerClasses = cn(
    "mb-6 p-3 rounded-md border",
    isGithubApp
      ? "bg-opacity-10 bg-neon-green border-neon-green text-neon-green"
      : "bg-opacity-10 bg-electric-blue border-electric-blue text-electric-blue",
  );

  return (
    <div className={bannerClasses}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            {isGithubApp
              ? "GITHUB APP INTEGRATION ACTIVE"
              : "USING OAUTH AUTHENTICATION"}
          </div>
        </div>

        <div className="flex space-x-2">
          {/* Install button for OAuth users */}
          {authMethod !== "github_app" && !needsInstallation && (
            <>
              {isGitHubAppNotConfigured ? (
                <div className={getButtonClasses("app-needs-setup")}>
                  APP NEEDS SETUP
                </div>
              ) : (
                <a
                  href={getGitHubAppInstallUrl()}
                  className={getButtonClasses("upgrade")}
                  onMouseEnter={() => setHoveredButton("upgrade")}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  UPGRADE TO APP
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthenticationStatusBanner({
  error,
  authMethod,
  needsInstallation,
  getGitHubAppInstallUrl,
  signOutCallback,
}: Props) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const isGitHubAppNotConfigured =
    getGitHubAppInstallUrl() === "#github-app-not-configured";

  // Button styles for different types
  const getButtonClasses = (buttonType: ButtonType) => {
    const isHovered = hoveredButton === buttonType;

    // Common classes for all buttons
    const baseClasses = "transition-all duration-200 rounded-md border";

    // Button-specific classes
    const typeClasses: Record<ButtonType, string> = {
      install: cn(
        baseClasses,
        "px-4 py-1 text-sm",
        "border-neon-green",
        isHovered
          ? "bg-neon-green text-dark-slate"
          : "bg-dark-slate text-neon-green",
      ),
      upgrade: cn(
        baseClasses,
        "text-xs px-2 py-1",
        "border-neon-green",
        isHovered
          ? "bg-neon-green text-dark-slate"
          : "bg-dark-slate text-neon-green",
      ),
      reinitialize: cn(
        baseClasses,
        "px-4 py-1 text-sm",
        "border-electric-blue",
        isHovered
          ? "bg-electric-blue text-dark-slate"
          : "bg-dark-slate text-electric-blue",
      ),
      "app-not-configured": cn(
        baseClasses,
        "px-4 py-1 text-sm",
        "bg-opacity-10 bg-crimson-red text-crimson-red border-crimson-red",
      ),
      "app-needs-setup": cn(
        baseClasses,
        "text-xs px-2 py-1",
        "bg-opacity-10 bg-crimson-red text-crimson-red border-crimson-red",
      ),
    };

    return typeClasses[buttonType];
  };

  return (
    <>
      {error && (
        <ErrorBanner
          error={error}
          needsInstallation={needsInstallation}
          isGitHubAppNotConfigured={isGitHubAppNotConfigured}
          getGitHubAppInstallUrl={getGitHubAppInstallUrl}
          getButtonClasses={getButtonClasses}
          setHoveredButton={setHoveredButton}
          signOutCallback={signOutCallback}
        />
      )}

      {authMethod && (
        <AuthStatusBanner
          authMethod={authMethod}
          needsInstallation={needsInstallation}
          isGitHubAppNotConfigured={isGitHubAppNotConfigured}
          getGitHubAppInstallUrl={getGitHubAppInstallUrl}
          getButtonClasses={getButtonClasses}
          setHoveredButton={setHoveredButton}
        />
      )}
    </>
  );
}
