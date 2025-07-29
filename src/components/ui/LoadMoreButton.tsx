import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Loader2 } from 'lucide-react';

/**
 * Props for the LoadMoreButton component
 */
interface LoadMoreButtonProps {
  /**
   * Function to call when the button is clicked
   */
  onClick: () => void;
  
  /**
   * Whether the button is in loading state
   * When true, the button will show a loading spinner and be disabled
   */
  loading: boolean;
  
  /**
   * Whether there are more items to load
   * When false, the button will not be rendered
   */
  hasMore: boolean;
  
  /**
   * Additional CSS classes to apply to the container
   */
  className?: string;
  
  /**
   * Custom text to display when button is in normal state
   * @default "LOAD MORE"
   */
  loadText?: string;
  
  /**
   * Custom text to display when button is in loading state
   * @default "LOADING"
   */
  loadingText?: string;
}

/**
 * A button component for loading more items in a paginated list.
 * 
 * The button has three states:
 * - Default: Shows "LOAD MORE" text with an icon
 * - Loading: Shows a loading spinner with "LOADING..." text and is disabled
 * - Hidden: Not rendered when there are no more items to load (hasMore is false)
 * 
 * @example
 * ```tsx
 * <LoadMoreButton
 *   onClick={() => loadMoreData()}
 *   loading={isLoading}
 *   hasMore={hasMoreData}
 * />
 * ```
 */
export default function LoadMoreButton({
  onClick,
  loading,
  hasMore,
  className = '',
  loadText = 'LOAD MORE',
  loadingText = 'LOADING'
}: LoadMoreButtonProps) {
  // Don't render if there's nothing more to load
  if (!hasMore) return null;

  return (
    <div className={`flex justify-center py-4 ${className}`}>
      <Button
        onClick={onClick}
        disabled={loading}
        variant="outline"
        size="sm"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText}...
          </>
        ) : (
          <>
            {loadText}
            <ChevronDown className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}