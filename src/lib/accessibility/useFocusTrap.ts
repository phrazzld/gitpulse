import { RefObject, useEffect, useRef, useCallback } from 'react';

export interface FocusTrapOptions {
  onDeactivate?: () => void;
  allowClickOutside?: boolean;
  returnFocusOnDeactivate?: boolean;
  initialFocus?: () => HTMLElement | null;
}

/**
 * Hook to trap focus within a container element
 * @param containerRef - Reference to the container element
 * @param isActive - Whether the focus trap is active
 * @param options - Configuration options for the focus trap
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean,
  options: FocusTrapOptions = {}
): void {
  const {
    onDeactivate,
    allowClickOutside = false,
    returnFocusOnDeactivate = true,
    initialFocus
  } = options;

  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    const selector = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(',');

    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(selector)
    ).filter(element => {
      // Check if element is visible
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }, [containerRef]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;

    if (event.key === 'Escape' && onDeactivate) {
      onDeactivate();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const currentFocus = document.activeElement as HTMLElement;

    // Tab forward
    if (!event.shiftKey && currentFocus === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
    // Tab backward
    else if (event.shiftKey && currentFocus === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    }
  }, [isActive, onDeactivate, getFocusableElements]);

  // Handle click outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!isActive || !allowClickOutside || !containerRef.current) return;

    const target = event.target as Node;
    if (!containerRef.current.contains(target) && onDeactivate) {
      onDeactivate();
    }
  }, [isActive, allowClickOutside, containerRef, onDeactivate]);

  useEffect(() => {
    if (!isActive) return;

    // Store previously focused element
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;

    // Move focus to initial element or first focusable element
    const focusableElements = getFocusableElements();
    if (initialFocus) {
      const element = initialFocus();
      if (element) {
        element.focus();
      }
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside, true);

      // Return focus to previously focused element
      if (returnFocusOnDeactivate && previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [
    isActive,
    getFocusableElements,
    handleKeyDown,
    handleClickOutside,
    initialFocus,
    returnFocusOnDeactivate
  ]);
}