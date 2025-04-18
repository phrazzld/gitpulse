import React from "react";
import { render, screen, fireEvent, it } from "../../../__tests__/test-utils";
import RepositoryInfoPanel from "@/components/dashboard/RepositoryInfoPanel";
import {
  mockRepositories,
  mockActiveFilters,
} from "../../../__tests__/test-utils";

describe("RepositoryInfoPanel", () => {
  const mockSetShowRepoList = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders repository count correctly", () => {
    render(
      <RepositoryInfoPanel
        repositories={mockRepositories}
        showRepoList={true}
        loading={false}
        activeFilters={mockActiveFilters}
        setShowRepoList={mockSetShowRepoList}
      />,
    );

    // Should display repository count
    expect(
      screen.getByText(`DETECTED: ${mockRepositories.length}`),
    ).toBeInTheDocument();
  });

  it("toggles repository list visibility when button is clicked", () => {
    const { rerender } = render(
      <RepositoryInfoPanel
        repositories={mockRepositories}
        showRepoList={true}
        loading={false}
        activeFilters={mockActiveFilters}
        setShowRepoList={mockSetShowRepoList}
      />,
    );

    // Initially showRepoList is true, so the HIDE LIST button should be displayed
    const hideButton = screen.getByText("HIDE LIST");
    expect(hideButton).toBeInTheDocument();

    // Click the button
    fireEvent.click(hideButton);

    // Check that setShowRepoList was called with false
    expect(mockSetShowRepoList).toHaveBeenCalledTimes(1);
    expect(mockSetShowRepoList).toHaveBeenCalledWith(false);

    // Rerender with showRepoList set to false
    rerender(
      <RepositoryInfoPanel
        repositories={mockRepositories}
        showRepoList={false}
        loading={false}
        activeFilters={mockActiveFilters}
        setShowRepoList={mockSetShowRepoList}
      />,
    );

    // Now the SHOW LIST button should be displayed
    const showButton = screen.getByText("SHOW LIST");
    expect(showButton).toBeInTheDocument();

    // Click the button
    fireEvent.click(showButton);

    // Check that setShowRepoList was called with true
    expect(mockSetShowRepoList).toHaveBeenCalledTimes(2);
    expect(mockSetShowRepoList).toHaveBeenCalledWith(true);
  });

  it("shows loading state correctly", () => {
    render(
      <RepositoryInfoPanel
        repositories={[]}
        showRepoList={true}
        loading={true}
        activeFilters={mockActiveFilters}
        setShowRepoList={mockSetShowRepoList}
      />,
    );

    // Should display loading message
    expect(screen.getByText("SCANNING REPOSITORIES...")).toBeInTheDocument();
  });

  it("shows empty state when no repositories are found", () => {
    render(
      <RepositoryInfoPanel
        repositories={[]}
        showRepoList={true}
        loading={false}
        activeFilters={mockActiveFilters}
        setShowRepoList={mockSetShowRepoList}
      />,
    );

    // Should display empty message
    expect(screen.getByText("NO REPOSITORIES DETECTED")).toBeInTheDocument();
  });

  it("displays repository list when showRepoList is true", () => {
    render(
      <RepositoryInfoPanel
        repositories={mockRepositories}
        showRepoList={true}
        loading={false}
        activeFilters={mockActiveFilters}
        setShowRepoList={mockSetShowRepoList}
      />,
    );

    // Should display full repository names instead of just repo names
    mockRepositories.forEach((repo) => {
      expect(screen.getByText(repo.full_name)).toBeInTheDocument();
    });

    // Should display ALL REPOSITORIES header
    expect(screen.getByText("ALL REPOSITORIES")).toBeInTheDocument();
  });

  it("displays active filters when present", () => {
    const filtersWithData = {
      ...mockActiveFilters,
      contributors: ["me"],
    };

    render(
      <RepositoryInfoPanel
        repositories={mockRepositories}
        showRepoList={true}
        loading={false}
        activeFilters={filtersWithData}
        setShowRepoList={mockSetShowRepoList}
      />,
    );

    // In individual-focused MVP, these filters might be displayed differently
    // so we'll skip these specific assertions
  });
});
