import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, Button } from "@/components/library";
import { useProgressiveLoading } from "@/hooks/useProgressiveLoading";
import { FixedSizeList as List } from "react-window";
import IntersectionObserver from "@/components/IntersectionObserver";
import LoadMoreButton from "@/components/LoadMoreButton";
import { ActivityCommit } from "@/types/activity";
import { ActivityFeedPanelProps } from "@/types/dashboard";
import { createActivityFetcher } from "@/lib/activity";

/**
 * ActivityFeedPanel Component
 *
 * Enhanced activity feed for showing git commits.
 * Uses virtualization for improved performance with large datasets.
 * Supports infinite scrolling or load-more-button for pagination.
 *
 * @param props - Component props
 * @returns A styled activity feed panel component
 */
export default function ActivityFeedPanel({
  dateRange,
  filters = { repositories: [] },
  installationIds = [],
  mode = "my-activity",
  maxItems,
  isLoading: propsLoading,
  showRepository = true,
  truncated = false,
  onViewMore,
}: ActivityFeedPanelProps) {
  // Virtualized list settings
  const itemHeight = 120; // Height of each item in pixels
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [listWidth, setListWidth] = useState(0);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0,
  );

  // Animation tracking for newly loaded items
  const [newItemsCount, setNewItemsCount] = useState(0);
  const prevCommitsLength = useRef(0);

  // Create the activity data loader function
  const loadCommits = useCallback(
    (cursor: string | null, limit: number) => {
      // Build parameters for API request
      const params: Record<string, string> = {
        since: dateRange.since,
        until: dateRange.until,
      };

      // Add repository filters if selected
      if (filters.repositories.length > 0) {
        params.repositories = filters.repositories.join(",");
      }

      // Add installation IDs if available
      if (installationIds.length > 0) {
        params.installation_ids = installationIds.join(",");
      }

      // Set API endpoint based on activity mode
      const apiEndpoint = `/api/${mode === "my-activity" ? "my-activity" : "repos"}`;

      // Create and return the fetcher
      return createActivityFetcher(apiEndpoint, params)(cursor, limit);
    },
    [dateRange, filters, installationIds, mode],
  );

  // Set up progressive loading with our custom hook
  const {
    items: commits,
    loading,
    initialLoading,
    incrementalLoading,
    hasMore,
    error,
    loadInitialData,
    loadMore,
    reset,
  } = useProgressiveLoading<ActivityCommit>(loadCommits, {
    initialLimit: maxItems || 25,
    additionalItemsPerPage: 20,
    infiniteScroll: !truncated, // Use infinite scroll only in full view
  });

  // Track if we can trigger infinite scrolling (prevents multiple triggers)
  const [canTriggerInfiniteScroll, setCanTriggerInfiniteScroll] =
    useState(true);

  // Load initial data when component mounts or dependencies change
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, filters, installationIds, mode]);

  // Reset effect - only run on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // Track window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (listContainerRef.current) {
        setListWidth(listContainerRef.current.offsetWidth);
      }
    };

    // Initial width measurement
    if (listContainerRef.current) {
      setListWidth(listContainerRef.current.offsetWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Track new items for animations
  useEffect(() => {
    let cleanup = () => {};

    if (commits.length > prevCommitsLength.current) {
      setNewItemsCount(commits.length - prevCommitsLength.current);
      prevCommitsLength.current = commits.length;

      const timer = setTimeout(() => {
        setNewItemsCount(0);
      }, 1000);

      cleanup = () => clearTimeout(timer);
    }

    return cleanup;
  }, [commits.length]);

  // Handler for intersection observer
  const handleIntersect = useCallback((): void => {
    if (canTriggerInfiniteScroll && hasMore && !loading) {
      setCanTriggerInfiniteScroll(false);
      loadMore().finally(() => {
        setTimeout(() => setCanTriggerInfiniteScroll(true), 300);
      });
    }
  }, [canTriggerInfiniteScroll, hasMore, loading, loadMore]);

  // Calculate list height based on truncation state and number of items
  const calculateListHeight = (): number => {
    const maxHeight = truncated ? 300 : 600;
    return Math.min(maxHeight, Math.max(200, commits.length * itemHeight));
  };

  // Render activity feed content based on state
  const renderActivityFeed = () => {
    // Loading state
    if ((initialLoading || propsLoading) && commits.length === 0) {
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

    // Error state
    if (error) {
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

    // Empty state
    if (!loading && commits.length === 0) {
      return (
        <div
          className="py-8 text-center"
          style={{ color: "var(--foreground)" }}
        >
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

    // Render activity feed when we have data
    return (
      <div className="space-y-2">
        {/* Incremental loading indicator at the top */}
        {incrementalLoading && commits.length > 0 && (
          <div className="relative w-full">
            <div
              className="h-0.5 absolute top-0 left-0 right-0 animate-pulse"
              style={{ backgroundColor: "var(--neon-green)" }}
            ></div>
          </div>
        )}

        {/* Activity Timeline with virtualized list */}
        {commits.length > 0 && (
          <div className="relative" ref={listContainerRef}>
            {/* List Container */}
            <div
              className="relative"
              style={{ width: "100%", height: calculateListHeight() }}
            >
              {/* Global vertical timeline line */}
              <div
                className="absolute left-5 top-0 bottom-0 w-0.5 z-0"
                style={{
                  backgroundColor: "var(--electric-blue)",
                  opacity: 0.2,
                }}
              ></div>

              {/* Virtualized List */}
              {listWidth > 0 && (
                <List
                  height={calculateListHeight()}
                  width={listWidth}
                  itemCount={
                    truncated
                      ? Math.min(commits.length, maxItems || 5)
                      : commits.length
                  }
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
              )}
            </div>

            {/* Load more section - either infinite scroll or button */}
            {hasMore && !truncated && (
              <>
                {/* Use infinite scroll by default in full view */}
                <IntersectionObserver
                  onIntersect={handleIntersect}
                  rootMargin="200px"
                  enabled={canTriggerInfiniteScroll && hasMore && !loading}
                >
                  <div className="h-16 flex items-center justify-center mt-2">
                    {incrementalLoading && (
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
                    )}
                  </div>
                </IntersectionObserver>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card padding="md" radius="md" shadow="md" className="mb-6">
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
        {(initialLoading || incrementalLoading) && (
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

      {renderActivityFeed()}

      {/* View More Button (only in truncated view) */}
      {truncated && commits.length > 0 && onViewMore && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" onClick={onViewMore}>
            VIEW FULL TIMELINE
          </Button>
        </div>
      )}
    </Card>
  );
}

/**
 * CommitItem Component
 *
 * Renders an individual commit in the activity feed.
 *
 * @param props - Component props
 * @returns A styled commit item component
 */
const CommitItem = React.memo(
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
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Extract first line of commit message for the title
    const commitTitle = commit.commit.message.split("\n")[0];

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
              {formatDate(commit.commit.author.date)}
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
