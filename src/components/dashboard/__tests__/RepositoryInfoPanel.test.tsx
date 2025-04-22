import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RepositoryInfoPanel from "../RepositoryInfoPanel";
import { Repository } from "@/types/github";

// Mock repositories for testing
const mockRepositories: Repository[] = [
  {
    id: 1,
    name: "repo1",
    full_name: "owner/repo1",
    private: false,
    html_url: "https://github.com/owner/repo1",
    description: "Test repository 1",
    language: "TypeScript",
    owner: {
      login: "owner",
    },
  },
  {
    id: 2,
    name: "repo2",
    full_name: "owner/repo2",
    private: true,
    html_url: "https://github.com/owner/repo2",
    description: "Test repository 2",
    language: "JavaScript",
    owner: {
      login: "owner",
    },
  },
];

// Mock setShowRepoList function
const mockSetShowRepoList = jest.fn();

// Mock Zustand hooks
jest.mock("@/state", () => ({
  useUIState: () => ({
    showRepoList: true,
    setShowRepoList: mockSetShowRepoList,
    error: null,
  }),
  useDashboardRepository: () => ({
    repositories: mockRepositories,
    loading: false,
    initialLoad: false,
  }),
  useFilters: () => ({
    activeFilters: { repositories: [] },
    filters: { repositories: [] },
  }),
}));

describe("RepositoryInfoPanel", () => {
  test("renders repository count and stats correctly", () => {
    render(<RepositoryInfoPanel />);

    // Check if repository count is displayed
    expect(screen.getByText("DETECTED: 2")).toBeInTheDocument();

    // Check if repository stats are displayed
    expect(screen.getByText("REPOS")).toBeInTheDocument();

    // Check if repository list items are displayed
    expect(screen.getByText("owner/repo1")).toBeInTheDocument();
    expect(screen.getByText("owner/repo2")).toBeInTheDocument();
  });

  test("toggle button calls setShowRepoList", () => {
    render(<RepositoryInfoPanel />);

    // Find and click the toggle button
    const toggleButton = screen.getByText("HIDE LIST");
    fireEvent.click(toggleButton);

    // Check if setShowRepoList was called with the correct value
    expect(mockSetShowRepoList).toHaveBeenCalledWith(false);
  });
});
