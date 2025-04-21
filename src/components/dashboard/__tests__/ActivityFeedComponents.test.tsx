import React from "react";
import { render, screen } from "@testing-library/react";
import {
  ActivityFeedHeader,
  ActivityFeedLoading,
  ActivityFeedError,
  ActivityFeedEmpty,
  CommitItem,
  IncrementalLoadingIndicator,
} from "../ActivityFeedComponents";
import { ActivityCommit } from "@/types/activity";

// Mock FixedSizeList from react-window
jest.mock("react-window", () => ({
  FixedSizeList: ({ children, itemCount }: any) => {
    // Render each item for testing
    return (
      <div data-testid="virtual-list">
        {Array.from({ length: itemCount }).map((_, index) => (
          <div key={index}>{children({ index, style: {} })}</div>
        ))}
      </div>
    );
  },
}));

// Mock IntersectionObserver component
jest.mock("@/components/IntersectionObserver", () => ({
  __esModule: true,
  default: ({ children, onIntersect }: any) => (
    <div data-testid="intersection-observer" onClick={onIntersect}>
      {children}
    </div>
  ),
}));

// Sample commit data
const mockCommit: ActivityCommit = {
  sha: "123abc",
  html_url: "https://github.com/org/repo/commit/123abc",
  commit: {
    message: "Fix bug in login form\nDetailed description here",
    author: {
      name: "Jane Doe",
      date: "2023-01-01T12:00:00Z",
    },
  },
  repository: {
    name: "repo",
    full_name: "org/repo",
    html_url: "https://github.com/org/repo",
  },
};

describe("ActivityFeedComponents", () => {
  describe("ActivityFeedHeader", () => {
    it("renders header with title", () => {
      render(<ActivityFeedHeader isLoading={false} />);

      // Check if title is displayed
      expect(screen.getByText("COMMIT TIMELINE")).toBeInTheDocument();

      // Loading indicator should not be shown
      expect(screen.queryByText("LOADING")).not.toBeInTheDocument();
    });

    it("renders loading indicator when loading", () => {
      render(<ActivityFeedHeader isLoading={true} />);

      // Loading indicator should be shown
      expect(screen.getByText("LOADING")).toBeInTheDocument();
    });
  });

  describe("ActivityFeedLoading", () => {
    it("renders loading message", () => {
      render(<ActivityFeedLoading />);

      // Check loading message
      expect(screen.getByText("Loading activity data...")).toBeInTheDocument();
    });
  });

  describe("ActivityFeedError", () => {
    it("renders error message", () => {
      const errorMessage = "API connection error";
      render(<ActivityFeedError error={errorMessage} />);

      // Check error message
      expect(
        screen.getByText(`Failed to load activity data: ${errorMessage}`),
      ).toBeInTheDocument();
    });
  });

  describe("ActivityFeedEmpty", () => {
    it("renders empty state message", () => {
      render(<ActivityFeedEmpty />);

      // Check empty state message
      expect(
        screen.getByText(
          "No activity data available for the selected filters.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("IncrementalLoadingIndicator", () => {
    it("renders loading dots", () => {
      render(<IncrementalLoadingIndicator />);

      // Check if loading text is there
      expect(screen.getByText("Loading")).toBeInTheDocument();
    });
  });

  describe("CommitItem", () => {
    it("renders commit details", () => {
      render(<CommitItem commit={mockCommit} showRepository={true} />);

      // Check if commit message (first line) is displayed
      expect(screen.getByText("Fix bug in login form")).toBeInTheDocument();

      // Check if author name is displayed
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();

      // Check if repository name is displayed
      expect(screen.getByText("org/repo")).toBeInTheDocument();
    });

    it("does not show repository when showRepository is false", () => {
      render(<CommitItem commit={mockCommit} showRepository={false} />);

      // Repository name should not be shown
      expect(screen.queryByText("org/repo")).not.toBeInTheDocument();
    });

    it("applies 'new' styling when isNew is true", () => {
      const { container } = render(
        <CommitItem commit={mockCommit} showRepository={true} isNew={true} />,
      );

      // Check for animation class on the container
      expect(container.firstChild).toHaveClass("animate-fadeIn");
    });
  });
});
