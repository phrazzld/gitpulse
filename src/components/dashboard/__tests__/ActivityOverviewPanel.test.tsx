import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ActivityOverviewPanel from "../ActivityOverviewPanel";
import { CommitSummary } from "@/types/summary";

// Mock data for testing
const mockSummary: CommitSummary = {
  user: "testuser",
  commits: [],
  stats: {
    totalCommits: 100,
    repositories: ["repo1", "repo2"],
    dates: ["2023-01-01", "2023-01-02"],
  },
  aiSummary: {
    keyThemes: ["Theme 1", "Theme 2", "Theme 3", "Theme 4"],
    technicalAreas: [
      { name: "Area 1", count: 10 },
      { name: "Area 2", count: 20 },
      { name: "Area 3", count: 30 },
      { name: "Area 4", count: 40 },
    ],
    accomplishments: [
      "Accomplishment 1",
      "Accomplishment 2",
      "Accomplishment 3",
    ],
    commitsByType: [],
    timelineHighlights: [],
    overallSummary: "Test summary",
  },
};

describe("ActivityOverviewPanel", () => {
  test("renders loading state correctly", () => {
    render(<ActivityOverviewPanel isLoading={true} />);

    // Check if the loading indicator text is shown
    expect(screen.getByText("ANALYZING COMMIT PATTERNS")).toBeInTheDocument();

    // Loading state should have animated elements
    const loadingElements = document.querySelectorAll(
      '[class*="animate-pulse"]',
    );
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  test("renders error state correctly", () => {
    const errorMessage = "Failed to load activity data";

    render(<ActivityOverviewPanel error={errorMessage} />);

    // Check if the error message is displayed
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test("renders empty state when no summary available", () => {
    render(<ActivityOverviewPanel />);

    // Check if the empty state message is displayed
    expect(
      screen.getByText(
        "No activity data available. Generate a summary to see insights.",
      ),
    ).toBeInTheDocument();
  });

  test("renders full data in non-truncated mode", () => {
    render(<ActivityOverviewPanel summary={mockSummary} />);

    // Check if panel titles are displayed
    expect(screen.getByText("ACTIVITY OVERVIEW")).toBeInTheDocument();
    expect(screen.getByText("IDENTIFIED PATTERNS")).toBeInTheDocument();
    expect(screen.getByText("TECHNICAL FOCUS AREAS")).toBeInTheDocument();
    expect(screen.getByText("KEY ACHIEVEMENTS")).toBeInTheDocument();

    // Check if all themes are displayed
    mockSummary.aiSummary!.keyThemes.forEach((theme) => {
      expect(screen.getByText(theme)).toBeInTheDocument();
    });

    // Check if accomplishments are displayed
    mockSummary.aiSummary!.accomplishments.forEach((accomplishment) => {
      expect(screen.getByText(accomplishment)).toBeInTheDocument();
    });

    // Should not show the "View Full Analysis" button
    expect(screen.queryByText("VIEW FULL ANALYSIS")).not.toBeInTheDocument();
  });

  test("renders truncated data in truncated mode", () => {
    const mockViewMoreFn = jest.fn();

    render(
      <ActivityOverviewPanel
        summary={mockSummary}
        truncated={true}
        onViewMore={mockViewMoreFn}
      />,
    );

    // Should show only a subset of technical areas
    const technicalArea4 = screen.queryByText("Area 4");
    expect(technicalArea4).not.toBeInTheDocument();

    // Should not show accomplishments section in truncated mode
    expect(screen.queryByText("KEY ACHIEVEMENTS")).not.toBeInTheDocument();
    expect(screen.queryByText("Accomplishment 1")).not.toBeInTheDocument();

    // Should show the "View Full Analysis" button
    const viewMoreButton = screen.getByText("VIEW FULL ANALYSIS");
    expect(viewMoreButton).toBeInTheDocument();

    // Test button click
    fireEvent.click(viewMoreButton);
    expect(mockViewMoreFn).toHaveBeenCalledTimes(1);
  });

  test("renders AI analysis completion status", () => {
    render(<ActivityOverviewPanel summary={mockSummary} />);

    // Check if the analysis status is displayed
    expect(screen.getByText("AI ANALYSIS COMPLETE")).toBeInTheDocument();
  });
});
