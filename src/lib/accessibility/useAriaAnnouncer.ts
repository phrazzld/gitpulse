import { useEffect, useRef, useCallback } from 'react';

export interface AriaAnnouncerOptions {
  clearDelay?: number;
}

export interface AriaAnnouncerReturn {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  clearQueue?: () => void;
}

/**
 * Hook to manage ARIA live region announcements for screen readers
 * @param options - Configuration options
 */
export function useAriaAnnouncer(options: AriaAnnouncerOptions = {}): AriaAnnouncerReturn {
  const { clearDelay = 1000 } = options;
  
  // Refs for live regions
  const politeRegionRef = useRef<HTMLDivElement | null>(null);
  const assertiveRegionRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queueRef = useRef<string[]>([]);

  // Create or get live region
  const getOrCreateLiveRegion = useCallback((priority: 'polite' | 'assertive') => {
    const id = `aria-live-${priority}`;
    let liveRegion = document.getElementById(id) as HTMLDivElement;
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = id;
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
    
    return liveRegion;
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Handle empty or invalid messages
    if (!message || typeof message !== 'string') return;

    const liveRegion = getOrCreateLiveRegion(priority);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set the message
    liveRegion.textContent = message;
    
    // Save ref
    if (priority === 'polite') {
      politeRegionRef.current = liveRegion;
    } else {
      assertiveRegionRef.current = liveRegion;
    }
    
    // Clear after delay
    timeoutRef.current = setTimeout(() => {
      liveRegion.textContent = '';
    }, clearDelay);
  }, [clearDelay, getOrCreateLiveRegion]);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Clear live regions
    if (politeRegionRef.current) {
      politeRegionRef.current.textContent = '';
    }
    if (assertiveRegionRef.current) {
      assertiveRegionRef.current.textContent = '';
    }
  }, []);

  // Setup and cleanup
  useEffect(() => {
    // Create polite region on mount
    const politeRegion = getOrCreateLiveRegion('polite');
    politeRegionRef.current = politeRegion;
    
    return () => {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Remove live regions if not used by other components
      const politeRegions = document.querySelectorAll('[aria-live="polite"]');
      const assertiveRegions = document.querySelectorAll('[aria-live="assertive"]');
      
      if (politeRegions.length === 1 && politeRegionRef.current) {
        politeRegionRef.current.remove();
      }
      
      if (assertiveRegions.length === 1 && assertiveRegionRef.current) {
        assertiveRegionRef.current.remove();
      }
    };
  }, [getOrCreateLiveRegion]);

  return { announce, clearQueue };
}