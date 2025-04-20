import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, Button } from "@/components/library";
import { ActivityFeedPanelProps } from "@/types/dashboard";
import { useActivityData } from "@/hooks/useActivityData";
import { calculateListHeight } from "./utils/activityFeedUtils";
import {
  ActivityFeedHeader,
  ActivityFeedLoading,
  ActivityFeedError,
  ActivityFeedEmpty,
  CommitList,
  LoadMoreSection,
} from "./ActivityFeedComponents";

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

  // Track if we can trigger infinite scrolling (prevents multiple triggers)
  const [canTriggerInfiniteScroll, setCanTriggerInfiniteScroll] =
    useState(true);

  // Use the activity data hook for data fetching and state management
  const {
    commits,
    loading,
    initialLoading,
    incrementalLoading,
    hasMore,
    error,
    loadMore,
  } = useActivityData(
    {
      dateRange,
      filters,
      installationIds,
      mode,
    },
    {
      initialLimit: maxItems || 25,
      additionalItemsPerPage: 20,
      infiniteScroll: !truncated, // Use infinite scroll only in full view
      maxItems,
    },
  );

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

  // Render activity feed content based on state
  const renderActivityFeed = () => {
    // Loading state
    if ((initialLoading || propsLoading) && commits.length === 0) {
      return <ActivityFeedLoading />;
    }

    // Error state
    if (error) {
      return <ActivityFeedError error={error} />;
    }

    // Empty state
    if (!loading && commits.length === 0) {
      return <ActivityFeedEmpty />;
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
              style={{
                width: "100%",
                height: calculateListHeight(
                  commits.length,
                  itemHeight,
                  truncated,
                  maxItems,
                ),
              }}
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
                <CommitList
                  commits={commits}
                  listWidth={listWidth}
                  listHeight={calculateListHeight(
                    commits.length,
                    itemHeight,
                    truncated,
                    maxItems,
                  )}
                  itemHeight={itemHeight}
                  itemCount={
                    truncated
                      ? Math.min(commits.length, maxItems || 5)
                      : commits.length
                  }
                  showRepository={showRepository}
                  newItemsCount={newItemsCount}
                />
              )}
            </div>

            {/* Load more section - for infinite scroll */}
            {hasMore && !truncated && (
              <LoadMoreSection
                hasMore={hasMore}
                incrementalLoading={incrementalLoading}
                onIntersect={handleIntersect}
                canTriggerInfiniteScroll={canTriggerInfiniteScroll}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card padding="md" radius="md" shadow="md" className="mb-6">
      <ActivityFeedHeader isLoading={initialLoading || incrementalLoading} />

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
