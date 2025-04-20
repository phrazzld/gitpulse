import React from "react";
import { Card, Button } from "@/components/library";
import { ActivityFeedPanelProps } from "@/types/dashboard";
import { useActivityData } from "@/hooks/useActivityData";
import {
  ActivityFeedHeader,
  ActivityFeedContent,
  useActivityFeedLayout,
} from "./activityFeed";

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
  // Fixed settings
  const itemHeight = 120; // Height of each item in pixels

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

  // Use the layout hook for UI-related state and effects
  const {
    listContainerRef,
    listWidth,
    newItemsCount,
    canTriggerInfiniteScroll,
    handleIntersect,
  } = useActivityFeedLayout({
    commits,
    hasMore,
    loading,
    loadMore,
  });

  return (
    <Card padding="md" radius="md" shadow="md" className="mb-6">
      <ActivityFeedHeader isLoading={initialLoading || incrementalLoading} />

      <ActivityFeedContent
        commits={commits}
        loading={loading}
        initialLoading={initialLoading}
        incrementalLoading={incrementalLoading}
        hasMore={hasMore}
        error={error}
        propsLoading={propsLoading}
        truncated={truncated}
        maxItems={maxItems}
        showRepository={showRepository}
        newItemsCount={newItemsCount}
        listWidth={listWidth}
        itemHeight={itemHeight}
        canTriggerInfiniteScroll={canTriggerInfiniteScroll}
        handleIntersect={handleIntersect}
        listContainerRef={listContainerRef}
      />

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
