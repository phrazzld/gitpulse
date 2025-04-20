import React from "react";
import { FixedSizeList as List } from "react-window";
import IntersectionObserver from "@/components/IntersectionObserver";
import { ActivityCommit } from "@/types/activity";
import {
  formatCommitDate,
  extractCommitTitle,
} from "./utils/activityFeedUtils";

/**
 * ActivityFeedHeader Component
 *
 * Displays the header of the activity feed panel with optional loading indicator
 */
export function ActivityFeedHeader({ isLoading }: { isLoading: boolean }) {
  return (
    <div
      className="mb-4 flex items-center justify-between border-b pb-3"
      style={{ borderColor: "var(--electric-blue)" }}
    >
      <div className="flex items-center">
        <div
          className="w-3 h-3 rounded-full mr-3"
          style={{ backgroundColor: "var(--luminous-yellow)" }}
        ></div>
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--luminous-yellow)" }}
        >
          COMMIT TIMELINE
        </h2>
      </div>
      {isLoading && (
        <div
          className="px-2 py-1 text-xs rounded flex items-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            border: "1px solid var(--luminous-yellow)",
            color: "var(--luminous-yellow)",
          }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full mr-2 animate-pulse"
            style={{ backgroundColor: "var(--luminous-yellow)" }}
          ></span>
          <span>LOADING</span>
        </div>
      )}
    </div>
  );
}

/**
 * ActivityFeedLoading Component
 *
 * Displays a loading spinner during initial data load
 */
export function ActivityFeedLoading() {
  return (
    <div className="py-8 flex justify-center">
      <div className="flex flex-col items-center">
        <div
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-3"
          style={{
            borderColor: "var(--electric-blue)",
            borderTopColor: "transparent",
          }}
        ></div>
        <div style={{ color: "var(--electric-blue)" }}>
          Loading activity data...
        </div>
      </div>
    </div>
  );
}

/**
 * ActivityFeedError Component
 *
 * Displays an error message when data fetching fails
 */
export function ActivityFeedError({ error }: { error: string }) {
  return (
    <div
      className="p-4 rounded-md border"
      style={{
        backgroundColor: "rgba(255, 59, 48, 0.1)",
        borderColor: "var(--crimson-red)",
        color: "var(--crimson-red)",
      }}
    >
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
        <div>Failed to load activity data: {error}</div>
      </div>
    </div>
  );
}

/**
 * ActivityFeedEmpty Component
 *
 * Displays a message when no activity data is available
 */
export function ActivityFeedEmpty() {
  return (
    <div className="py-8 text-center" style={{ color: "var(--foreground)" }}>
      <div
        className="inline-block p-3 rounded-md border mb-3"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          borderColor: "var(--electric-blue)",
        }}
      >
        <svg
          className="h-6 w-6 mx-auto mb-2"
          fill="currentColor"
          viewBox="0 0 20 20"
          style={{ color: "var(--electric-blue)" }}
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
        <div className="text-sm">
          No activity data available for the selected filters.
        </div>
      </div>
    </div>
  );
}

/**
 * IncrementalLoadingIndicator Component
 *
 * Displays a loading indicator for incremental loading
 */
export function IncrementalLoadingIndicator() {
  return (
    <div
      className="text-xs flex items-center"
      style={{ color: "var(--neon-green)" }}
    >
      <div
        className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin mr-2"
        style={{
          borderColor: "var(--neon-green)",
          borderTopColor: "transparent",
        }}
      ></div>
      <div>
        Loading
        <span className="inline-block animate-pulse">.</span>
        <span
          className="inline-block animate-pulse"
          style={{ animationDelay: "0.3s" }}
        >
          .
        </span>
        <span
          className="inline-block animate-pulse"
          style={{ animationDelay: "0.6s" }}
        >
          .
        </span>
      </div>
    </div>
  );
}

/**
 * CommitList Component
 *
 * Displays a virtualized list of commits
 */
export function CommitList({
  commits,
  listWidth,
  listHeight,
  itemHeight,
  itemCount,
  showRepository,
  newItemsCount,
}: {
  commits: ActivityCommit[];
  listWidth: number;
  listHeight: number;
  itemHeight: number;
  itemCount: number;
  showRepository: boolean;
  newItemsCount: number;
}) {
  return (
    <List
      height={listHeight}
      width={listWidth}
      itemCount={itemCount}
      itemSize={itemHeight}
      overscanCount={3}
      className="scrollbar-custom"
    >
      {({ index, style }) => (
        <CommitItem
          key={commits[index].sha}
          commit={commits[index]}
          showRepository={showRepository}
          style={style}
          isNew={index >= commits.length - newItemsCount}
        />
      )}
    </List>
  );
}

/**
 * LoadMoreSection Component
 *
 * Displays the infinite scroll loading section
 */
export function LoadMoreSection({
  hasMore,
  incrementalLoading,
  onIntersect,
  canTriggerInfiniteScroll,
}: {
  hasMore: boolean;
  incrementalLoading: boolean;
  onIntersect: () => void;
  canTriggerInfiniteScroll: boolean;
}) {
  return (
    <IntersectionObserver
      onIntersect={onIntersect}
      rootMargin="200px"
      enabled={canTriggerInfiniteScroll && hasMore && !incrementalLoading}
    >
      <div className="h-16 flex items-center justify-center mt-2">
        {incrementalLoading && <IncrementalLoadingIndicator />}
      </div>
    </IntersectionObserver>
  );
}

/**
 * CommitItem Component
 *
 * Renders an individual commit in the activity feed.
 */
export const CommitItem = React.memo(
  ({
    commit,
    showRepository,
    style,
    isNew = false,
  }: {
    commit: ActivityCommit;
    showRepository: boolean;
    style?: React.CSSProperties;
    isNew?: boolean;
  }) => {
    // Extract first line of commit message for the title
    const commitTitle = extractCommitTitle(commit.commit.message);

    return (
      <div
        className={`pl-12 relative ${isNew ? "animate-fadeIn" : ""}`}
        style={{
          ...style,
          paddingLeft: "3.5rem",
        }}
      >
        {/* Timeline dot */}
        <div
          className="absolute left-4 top-3 w-3 h-3 rounded-full border-2"
          style={{
            backgroundColor: "var(--dark-slate)",
            borderColor: isNew ? "var(--neon-green)" : "var(--electric-blue)",
            zIndex: 1,
          }}
        ></div>

        {/* Vertical timeline line */}
        <div
          className="absolute left-5 top-0 bottom-0 w-0.5"
          style={{
            backgroundColor: "var(--electric-blue)",
            opacity: 0.4,
          }}
        ></div>

        {/* Commit card */}
        <div
          className={`border rounded-md p-3 mb-3 ${isNew ? "animate-pulse-highlight" : ""}`}
          style={{
            backgroundColor: "rgba(27, 43, 52, 0.7)",
            backdropFilter: "blur(5px)",
            borderColor: isNew ? "var(--neon-green)" : "var(--electric-blue)",
            boxShadow: isNew
              ? "0 0 15px rgba(0, 255, 135, 0.2)"
              : "0 0 10px rgba(59, 142, 234, 0.1)",
          }}
        >
          {/* Commit header with author and date */}
          <div className="flex justify-between items-start mb-2 flex-wrap">
            <div className="flex items-center mr-2">
              <div className="flex items-center">
                <span
                  className="font-bold text-sm truncate max-w-48"
                  style={{ color: "var(--electric-blue)" }}
                >
                  {commit.commit.author.name}
                </span>
              </div>
            </div>

            <div
              className="text-xs"
              style={{ color: "var(--foreground)", opacity: 0.7 }}
            >
              {formatCommitDate(commit.commit.author.date)}
            </div>
          </div>

          {/* Repository info if needed */}
          {showRepository && commit.repository && (
            <div className="mb-2">
              <a
                href={commit.repository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-1.5 py-0.5 rounded inline-flex items-center"
                style={{
                  backgroundColor: "rgba(0, 255, 135, 0.1)",
                  color: "var(--neon-green)",
                  border: "1px solid var(--neon-green)",
                  textDecoration: "none",
                }}
              >
                <svg
                  className="h-2.5 w-2.5 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"
                    clipRule="evenodd"
                  />
                </svg>
                {commit.repository.full_name}
              </a>
            </div>
          )}

          {/* Commit message */}
          <div className="text-sm" style={{ color: "var(--foreground)" }}>
            <a
              href={commit.html_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
              className="hover:underline"
            >
              {commitTitle}
            </a>
          </div>
        </div>
      </div>
    );
  },
);
