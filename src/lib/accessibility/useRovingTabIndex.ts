import { RefObject, useState, KeyboardEvent, useEffect, useCallback } from 'react';

export interface RovingTabIndexOptions {
  preventScroll?: boolean;
}

/**
 * Hook to implement roving tabindex pattern for keyboard navigation
 * @param itemRefs - Array of refs to the navigable items
 * @param orientation - Whether navigation is horizontal or vertical
 * @param options - Configuration options
 */
export function useRovingTabIndex(
  itemRefs: RefObject<HTMLElement>[],
  orientation: 'horizontal' | 'vertical' = 'horizontal',
  options: RovingTabIndexOptions = {}
): {
  currentIndex: number;
  handleKeyDown: (event: KeyboardEvent) => void;
} {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { preventScroll = false } = options;

  // Navigate to a specific index
  const navigateToIndex = useCallback((index: number) => {
    if (index < 0 || index >= itemRefs.length) return;
    
    setCurrentIndex(index);
    const element = itemRefs[index]?.current;
    if (element) {
      element.focus({ preventScroll });
    }
  }, [itemRefs, preventScroll]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (itemRefs.length === 0) return;

    const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

    switch (event.key) {
      case prevKey:
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : itemRefs.length - 1;
        navigateToIndex(prevIndex);
        break;

      case nextKey:
        event.preventDefault();
        const nextIndex = currentIndex < itemRefs.length - 1 ? currentIndex + 1 : 0;
        navigateToIndex(nextIndex);
        break;

      case 'Home':
        event.preventDefault();
        navigateToIndex(0);
        break;

      case 'End':
        event.preventDefault();
        navigateToIndex(itemRefs.length - 1);
        break;

      default:
        // Don't prevent default for other keys
        break;
    }
  }, [currentIndex, itemRefs.length, orientation, navigateToIndex]);

  // Update tabindex attributes when currentIndex changes
  useEffect(() => {
    itemRefs.forEach((ref, index) => {
      if (ref.current) {
        ref.current.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
      }
    });
  }, [currentIndex, itemRefs]);

  // Initialize tabindex on mount
  useEffect(() => {
    itemRefs.forEach((ref, index) => {
      if (ref.current) {
        ref.current.setAttribute('tabindex', index === 0 ? '0' : '-1');
      }
    });
  }, [itemRefs]);

  return { currentIndex, handleKeyDown };
}