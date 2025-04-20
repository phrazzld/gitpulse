import React from "react";
import IntersectionObserver from "@/components/IntersectionObserver";
import { IncrementalLoadingIndicator } from "./IncrementalLoadingIndicator";

interface LoadMoreSectionProps {
  hasMore: boolean;
  incrementalLoading: boolean;
  onIntersect: () => void;
  canTriggerInfiniteScroll: boolean;
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
}: LoadMoreSectionProps) {
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
