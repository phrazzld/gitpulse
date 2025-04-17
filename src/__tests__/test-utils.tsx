import React, { ReactElement } from "react";
import {
  render as rtlRender,
  RenderOptions as RTLRenderOptions,
} from "@testing-library/react";

// Define types specifically to avoid JSX transform issues
type ProvidersProps = {
  children: React.ReactNode;
};

// Custom render function that properly handles React 19 JSX transform
// Avoid using JSX in the wrapper to prevent version conflicts
const customRender = (
  ui: ReactElement,
  options?: Omit<RTLRenderOptions, "wrapper">,
) => {
  // Use React.createElement directly instead of JSX to avoid transform issues
  const Wrapper = ({ children }: ProvidersProps) =>
    React.createElement(React.Fragment, null, children);

  return rtlRender(ui, { wrapper: Wrapper, ...options });
};

/**
 * DEPRECATED: conditionalTest was removed as part of T005
 * It was previously used as a workaround for React JSX transform errors in CI
 * ("A React Element from an older version of React was rendered")
 *
 * These issues have been resolved by:
 * - Updated Babel configuration for React 19 (T002)
 * - Updated Jest configuration for JSX files (T003)
 * - Updated testing library dependencies (T004)
 *
 * All tests now use the standard Jest 'it' function directly.
 */
// Export it directly to make refactoring easier
export const it = global.it;

// Mock session data
export const mockSession = {
  user: {
    name: "Test User",
    email: "test@example.com",
    image: "https://example.com/avatar.jpg",
  },
  expires: "2025-01-01T00:00:00.000Z",
  accessToken: "test-access-token",
};

// Mock Installation data (updated for individual-focused MVP)
export const mockInstallation = {
  id: 123,
  account: {
    login: "testuser",
    type: "User",
    avatarUrl: "https://example.com/user-avatar.jpg",
  },
  appSlug: "test-app",
  appId: 456,
  repositorySelection: "all",
  targetType: "User",
};

// Mock Repository data (updated for individual-focused MVP)
export const mockRepositories = [
  {
    id: 1,
    full_name: "testuser/repo-1",
    name: "repo-1",
    owner: {
      login: "testuser",
    },
    private: false,
    language: "TypeScript",
  },
  {
    id: 2,
    full_name: "testuser/repo-2",
    name: "repo-2",
    owner: {
      login: "testuser",
    },
    private: true,
    language: "JavaScript",
  },
];

// Mock summary data
export const mockSummary = {
  user: "Test User",
  commits: [
    {
      sha: "abc123",
      html_url: "https://github.com/testuser/repo-1/commit/abc123",
      commit: {
        message: "feat: add new feature",
        author: {
          name: "Test User",
          date: "2025-01-01T00:00:00Z",
        },
      },
      repository: {
        name: "repo-1",
        full_name: "testuser/repo-1",
        html_url: "https://github.com/testuser/repo-1",
      },
    },
  ],
  stats: {
    totalCommits: 10,
    repositories: ["testuser/repo-1", "testuser/repo-2"],
    dates: ["2025-01-01", "2025-01-02", "2025-01-03"],
  },
  aiSummary: {
    keyThemes: ["Feature Development", "Bug Fixes", "Documentation"],
    technicalAreas: [
      { name: "Frontend", count: 5 },
      { name: "API", count: 3 },
      { name: "Documentation", count: 2 },
    ],
    accomplishments: [
      "Implemented new user dashboard",
      "Fixed critical authentication bug",
      "Updated API documentation",
    ],
    commitsByType: [
      {
        type: "Feature",
        count: 5,
        description: "New functionality added to the application",
      },
      {
        type: "Bug Fix",
        count: 3,
        description: "Fixes for existing functionality",
      },
      {
        type: "Documentation",
        count: 2,
        description: "Documentation updates and improvements",
      },
    ],
    timelineHighlights: [
      { date: "2025-01-01", description: "Started work on new dashboard" },
      { date: "2025-01-02", description: "Completed dashboard implementation" },
      {
        date: "2025-01-03",
        description: "Fixed critical bugs and updated documentation",
      },
    ],
    overallSummary:
      "During this period, the developer focused on implementing a new user dashboard, fixing critical bugs in the authentication system, and improving API documentation.",
  },
  authMethod: "github_app",
  installationId: 123,
};

// Mock ActivityCommit data (updated for individual-focused MVP)
export const mockActivityCommits = [
  {
    sha: "abc123",
    html_url: "https://github.com/testuser/repo-1/commit/abc123",
    commit: {
      message: "feat: add new feature",
      author: {
        name: "Test User",
        date: "2025-01-01T00:00:00Z",
      },
    },
    repository: {
      name: "repo-1",
      full_name: "testuser/repo-1",
      html_url: "https://github.com/testuser/repo-1",
    },
    // contributor field deprecated but kept for backward compatibility
    contributor: {
      username: "testuser",
      displayName: "Test User",
      avatarUrl: "https://example.com/avatar.jpg",
    },
  },
  {
    sha: "def456",
    html_url: "https://github.com/testuser/repo-2/commit/def456",
    commit: {
      message: "fix: resolve authentication issue",
      author: {
        name: "Test User",
        date: "2025-01-02T00:00:00Z",
      },
    },
    repository: {
      name: "repo-2",
      full_name: "testuser/repo-2",
      html_url: "https://github.com/testuser/repo-2",
    },
    // contributor field deprecated but kept for backward compatibility
    contributor: {
      username: "testuser",
      displayName: "Test User",
      avatarUrl: "https://example.com/avatar.jpg",
    },
  },
];

// Mock common props (updated for individual-focused MVP)
export const mockActiveFilters = {
  // contributors and organizations fields have been removed completely
  repositories: [],
};

export const mockDateRange = {
  since: "2025-01-01",
  until: "2025-01-30",
};

// Re-export everything from RTL
export * from "@testing-library/react";
export { customRender as render };
