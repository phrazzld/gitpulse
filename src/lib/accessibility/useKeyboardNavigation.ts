import { KeyboardEvent, useCallback } from 'react';

export type KeyboardHandlers = {
  [key: string]: (event: KeyboardEvent) => void;
};

export interface NavigationOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  disabled?: boolean;
}

/**
 * Hook to handle keyboard navigation with customizable key handlers
 * @param handlers - Object mapping keys to handler functions
 * @param options - Configuration options
 */
export function useKeyboardNavigation(
  handlers: KeyboardHandlers,
  options: NavigationOptions = {}
): (event: KeyboardEvent) => void {
  const { preventDefault = false, stopPropagation = false, disabled = false } = options;

  return useCallback((event: KeyboardEvent) => {
    if (disabled) return;

    // Build the key combination string
    let key = event.key;
    
    // Normalize space key
    if (key === ' ') {
      key = 'Space';
    }
    
    // Check for modifier keys
    const modifiers: string[] = [];
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');
    if (event.metaKey) modifiers.push('Meta');
    
    // Try with modifiers first
    if (modifiers.length > 0) {
      const modifiedKey = [...modifiers, key].join('+');
      
      // Case-insensitive lookup
      const modifiedHandler = Object.entries(handlers).find(([handlerKey]) => 
        handlerKey.toLowerCase() === modifiedKey.toLowerCase()
      );
      
      if (modifiedHandler) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        modifiedHandler[1](event);
        return;
      }
    }
    
    // Try without modifiers
    const handler = Object.entries(handlers).find(([handlerKey]) => 
      handlerKey.toLowerCase() === key.toLowerCase()
    );
    
    if (handler) {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      handler[1](event);
    }
  }, [handlers, preventDefault, stopPropagation, disabled]);
}