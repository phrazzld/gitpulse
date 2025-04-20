import React from "react";
import { ActivityCommit } from "@/types/activity";
import { ActivityFeedLoading } from "./ActivityFeedLoading";
import { ActivityFeedError } from "./ActivityFeedError";
import { ActivityFeedEmpty } from "./ActivityFeedEmpty";
import { CommitList } from "./CommitList";
import { LoadMoreSection } from "./LoadMoreSection";
import { calculateListHeight } from "../utils/activityFeedUtils";

interface ActivityFeedContentProps {
  commits: ActivityCommit[];
  loading: boolean;
  initialLoading: boolean;
  incrementalLoading: boolean;
  hasMore: boolean;
  error: string | null;
  propsLoading?: boolean;
  truncated: boolean;
  maxItems?: number;
  showRepository: boolean;
  newItemsCount: number;
  listWidth: number;
  itemHeight: number;
  canTriggerInfiniteScroll: boolean;
  handleIntersect: () => void;
  listContainerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * ActivityFeedContent Component
 *
 * Renders the main content area of the activity feed based on current state
 */
export function ActivityFeedContent({
  commits,
  loading,
  initialLoading,
  incrementalLoading,
  hasMore,
  error,
  propsLoading,
  truncated,
  maxItems,
  showRepository,
  newItemsCount,
  listWidth,
  itemHeight,
  canTriggerInfiniteScroll,
  handleIntersect,
  listContainerRef,
}: ActivityFeedContentProps) {
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
}
