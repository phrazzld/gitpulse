import { useState, useRef, useEffect, useCallback } from "react";
import { ActivityCommit } from "@/types/activity";

interface UseActivityFeedLayoutProps {
  commits: ActivityCommit[];
  hasMore: boolean;
  loading: boolean;
  loadMore: () => Promise<void | { hasMore?: boolean }>;
}

/**
 * Custom hook to manage activity feed layout related state and effects
 *
 * Handles resize events, animation tracking, and infinite scroll triggering
 */
export function useActivityFeedLayout({
  commits,
  hasMore,
  loading,
  loadMore,
}: UseActivityFeedLayoutProps) {
  // Virtualized list settings
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

  return {
    listContainerRef,
    listWidth,
    windowWidth,
    newItemsCount,
    canTriggerInfiniteScroll,
    handleIntersect,
  };
}
