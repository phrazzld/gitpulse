import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RepositoryInfoPanel from "../RepositoryInfoPanel";
import { Repository } from "@/types/github";

describe("RepositoryInfoPanel", () => {
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

  const defaultProps = {
    repositories: mockRepositories,
    showRepoList: true,
    loading: false,
    activeFilters: { repositories: [] },
    setShowRepoList: jest.fn(),
  };

  test("renders repository count and stats correctly", () => {
    render(<RepositoryInfoPanel {...defaultProps} />);

    // Check if repository count is displayed
    expect(screen.getByText("DETECTED: 2")).toBeInTheDocument();

    // Check if repository stats are displayed
    expect(screen.getByText("REPOS")).toBeInTheDocument();
    expect(screen.getAllByText("2")[0]).toBeInTheDocument(); // Total repos

    // Private repos count
    const privateLabels = screen.getAllByText("PRIVATE");
    expect(privateLabels.length).toBeGreaterThan(0);
    expect(screen.getByText("1")).toBeInTheDocument(); // Private repos count
  });

  test("toggle show/hide repository list button", () => {
    render(<RepositoryInfoPanel {...defaultProps} />);

    // Find and click the toggle button
    const toggleButton = screen.getByText("HIDE LIST");
    fireEvent.click(toggleButton);

    // Check if setShowRepoList was called with the correct value
    expect(defaultProps.setShowRepoList).toHaveBeenCalledWith(false);
  });

  test("renders repository list when showRepoList is true", () => {
    render(<RepositoryInfoPanel {...defaultProps} />);

    // Check if repository names are displayed
    expect(screen.getByText("owner/repo1")).toBeInTheDocument();
    expect(screen.getByText("owner/repo2")).toBeInTheDocument();

    // Check if repository language is displayed
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();

    // Check if private label is displayed for private repo
    const privateLabels = screen.getAllByText("PRIVATE");
    expect(privateLabels.length).toBe(2); // One in stats, one in repo list
  });

  test("hides repository list when showRepoList is false", () => {
    render(<RepositoryInfoPanel {...defaultProps} showRepoList={false} />);

    // Toggle button should show "SHOW LIST"
    expect(screen.getByText("SHOW LIST")).toBeInTheDocument();

    // Repository names should not be displayed
    expect(screen.queryByText("owner/repo1")).not.toBeInTheDocument();
    expect(screen.queryByText("owner/repo2")).not.toBeInTheDocument();
  });

  test("renders loading state correctly", () => {
    render(
      <RepositoryInfoPanel
        {...defaultProps}
        loading={true}
        repositories={[]}
      />,
    );

    // Check if loading indicator is displayed
    expect(screen.getByText("SCANNING REPOSITORIES...")).toBeInTheDocument();
  });

  test("renders empty state when no repositories", () => {
    render(<RepositoryInfoPanel {...defaultProps} repositories={[]} />);

    // Check if empty state message is displayed
    expect(screen.getByText("NO REPOSITORIES DETECTED")).toBeInTheDocument();
  });

  test("renders with active filters", () => {
    render(
      <RepositoryInfoPanel
        {...defaultProps}
        activeFilters={{ repositories: ["repo1", "repo2"] }}
      />,
    );

    // Check if active filters section is displayed
    expect(screen.getByText("ACTIVE FILTERS")).toBeInTheDocument();
  });

  test("sorts repositories alphabetically by name", () => {
    // Create repositories with names that would be sorted differently
    const unsortedRepos: Repository[] = [
      {
        id: 1,
        name: "zrepo",
        full_name: "owner/zrepo",
        private: false,
        html_url: "https://github.com/owner/zrepo",
        description: "Z Repository",
        language: "TypeScript",
        owner: {
          login: "owner",
        },
      },
      {
        id: 2,
        name: "arepo",
        full_name: "owner/arepo",
        private: false,
        html_url: "https://github.com/owner/arepo",
        description: "A Repository",
        language: "JavaScript",
        owner: {
          login: "owner",
        },
      },
    ];

    const { container } = render(
      <RepositoryInfoPanel {...defaultProps} repositories={unsortedRepos} />,
    );

    // Get all repository names in the list
    const repoNames = Array.from(container.querySelectorAll("li")).map(
      (li) => li.textContent,
    );

    // First repo in the list should be 'arepo' since it's alphabetically first
    expect(repoNames[0]).toContain("arepo");
  });
});
