import React from "react";
import { Card, Button } from "@/components/library";
import { useActivityData } from "@/hooks/useActivityData";
import { ActivityMode } from "@/types/activity";
import {
  ActivityFeedHeader,
  ActivityFeedContent,
  useActivityFeedLayout,
} from "./activityFeed";
import {
  useDateRange,
  useFilters,
  useInstallations,
  useUIState,
} from "@/state";

import { Repository } from "@/types/github";

interface ActivityFeedPanelProps {
  mode: ActivityMode;
  maxItems?: number;
  showRepository?: boolean;
  truncated?: boolean;
  onViewMore?: () => void;
  repositories?: Repository[];
  "data-testid"?: string;
}

/**
 * ActivityFeedPanel Component
 *
 * Enhanced activity feed for showing git commits.
 * Uses virtualization for improved performance with large datasets.
 * Supports infinite scrolling or load-more-button for pagination.
 * Data is accessed directly via Zustand hooks.
 *
 * @param props - Component props
 * @returns A styled activity feed panel component
 */
export default function ActivityFeedPanel({
  mode = "my-activity",
  maxItems,
  showRepository = true,
  truncated = false,
  onViewMore,
  "data-testid": testId,
}: ActivityFeedPanelProps) {
  // Get state directly from Zustand hooks
  const { dateRange } = useDateRange();
  const { filters } = useFilters();
  const { installationIds } = useInstallations();
  const { loading: propsLoading } = useUIState();

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
    errorDetails,
    loadMore,
    loadInitialData,
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
    <Card padding="md" radius="md" shadow="md" data-testid={testId}>
      <ActivityFeedHeader isLoading={initialLoading || incrementalLoading} />

      <div className="mt-md">
        <ActivityFeedContent
          commits={commits}
          loading={loading}
          initialLoading={initialLoading}
          incrementalLoading={incrementalLoading}
          hasMore={hasMore}
          error={error}
          errorDetails={errorDetails}
          propsLoading={propsLoading}
          truncated={truncated}
          maxItems={maxItems}
          showRepository={showRepository}
          newItemsCount={newItemsCount}
          listWidth={listWidth}
          itemHeight={itemHeight}
          canTriggerInfiniteScroll={canTriggerInfiniteScroll}
          handleIntersect={handleIntersect}
          onRetry={loadInitialData}
          listContainerRef={listContainerRef}
        />
      </div>

      {/* View More Button (only in truncated view) */}
      {truncated && commits.length > 0 && onViewMore && (
        <div className="mt-md flex justify-center">
          <Button variant="secondary" size="sm" onClick={onViewMore}>
            VIEW FULL TIMELINE
          </Button>
        </div>
      )}
    </Card>
  );
}
