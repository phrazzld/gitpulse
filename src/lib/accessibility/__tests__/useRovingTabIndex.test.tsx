import React, { useRef, RefObject } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRovingTabIndex } from '../useRovingTabIndex';

// Test component that uses the hook
function TestList({ orientation = 'horizontal' }: { orientation?: 'horizontal' | 'vertical' }) {
  const ref1 = useRef<HTMLButtonElement>(null);
  const ref2 = useRef<HTMLButtonElement>(null);
  const ref3 = useRef<HTMLButtonElement>(null);
  
  // Create stable ref array
  const itemRefs = React.useMemo(() => [ref1, ref2, ref3] as RefObject<HTMLElement>[], []);
  
  const { currentIndex, handleKeyDown } = useRovingTabIndex(itemRefs, orientation);

  return (
    <div role="list" onKeyDown={handleKeyDown}>
      {['Item 1', 'Item 2', 'Item 3'].map((text, index) => (
        <button
          key={index}
          ref={itemRefs[index] as RefObject<HTMLButtonElement>}
          role="listitem"
          // Let the hook manage tabindex - do NOT set it manually
          aria-selected={currentIndex === index}
          data-testid={`item-${index}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

describe('useRovingTabIndex', () => {
  it('should initialize with first item focusable', () => {
    const { getByText } = render(<TestList />);
    
    const item1 = getByText('Item 1');
    const item2 = getByText('Item 2');
    const item3 = getByText('Item 3');
    
    expect(item1).toHaveAttribute('tabindex', '0');
    expect(item2).toHaveAttribute('tabindex', '-1');
    expect(item3).toHaveAttribute('tabindex', '-1');
  });

  it('should handle arrow key navigation for horizontal orientation', () => {
    const { getByText, getByRole } = render(<TestList orientation="horizontal" />);
    
    const item1 = getByText('Item 1');
    const item2 = getByText('Item 2');
    const item3 = getByText('Item 3');
    const list = getByRole('list');
    
    // Initial state - first item should have tabindex 0
    expect(item1).toHaveAttribute('tabindex', '0');
    expect(item2).toHaveAttribute('tabindex', '-1');
    expect(item3).toHaveAttribute('tabindex', '-1');
    
    // Press right arrow - should move to second item
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(item2).toHaveAttribute('tabindex', '0');
    expect(item1).toHaveAttribute('tabindex', '-1');
    expect(item3).toHaveAttribute('tabindex', '-1');
    
    // Press right arrow again - should move to third item
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(item3).toHaveAttribute('tabindex', '0');
    expect(item1).toHaveAttribute('tabindex', '-1');
    expect(item2).toHaveAttribute('tabindex', '-1');
    
    // Press right arrow to wrap around
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(item1).toHaveAttribute('tabindex', '0');
    expect(item2).toHaveAttribute('tabindex', '-1');
    expect(item3).toHaveAttribute('tabindex', '-1');
    
    // Press left arrow
    fireEvent.keyDown(list, { key: 'ArrowLeft' });
    expect(item3).toHaveAttribute('tabindex', '0');
    expect(item1).toHaveAttribute('tabindex', '-1');
    expect(item2).toHaveAttribute('tabindex', '-1');
  });

  it('should handle arrow key navigation for vertical orientation', async () => {
    const { getByText, getByRole } = render(<TestList orientation="vertical" />);
    
    const item1 = getByText('Item 1');
    const item2 = getByText('Item 2');
    const list = getByRole('list');
    
    // Focus first item
    item1.focus();
    
    // Press down arrow
    fireEvent.keyDown(list, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(item2).toHaveAttribute('tabindex', '0');
      expect(item1).toHaveAttribute('tabindex', '-1');
    });
    
    // Press up arrow
    fireEvent.keyDown(list, { key: 'ArrowUp' });
    await waitFor(() => {
      expect(item1).toHaveAttribute('tabindex', '0');
      expect(item2).toHaveAttribute('tabindex', '-1');
    });
  });

  it('should handle Home and End keys', async () => {
    const { getByText, getByRole } = render(<TestList />);
    
    const item1 = getByText('Item 1');
    const item2 = getByText('Item 2');
    const item3 = getByText('Item 3');
    const list = getByRole('list');
    
    // Start with middle item focused
    item2.focus();
    
    // Press Home
    fireEvent.keyDown(list, { key: 'Home' });
    await waitFor(() => {
      expect(item1).toHaveAttribute('tabindex', '0');
      expect(item2).toHaveAttribute('tabindex', '-1');
    });
    
    // Press End
    fireEvent.keyDown(list, { key: 'End' });
    await waitFor(() => {
      expect(item3).toHaveAttribute('tabindex', '0');
      expect(item1).toHaveAttribute('tabindex', '-1');
    });
  });

  it('should maintain focus on current item when other keys are pressed', () => {
    const { getByText } = render(<TestList />);
    
    const item1 = getByText('Item 1');
    
    // Focus first item
    item1.focus();
    
    // Press other keys
    fireEvent.keyDown(item1, { key: 'Enter' });
    fireEvent.keyDown(item1, { key: 'Space' });
    fireEvent.keyDown(item1, { key: 'a' });
    
    // First item should still have tabindex="0"
    expect(item1).toHaveAttribute('tabindex', '0');
  });

  it('should handle empty refs gracefully', () => {
    function TestEmptyList() {
      const itemRefs: React.RefObject<HTMLElement>[] = [];
      const { currentIndex, handleKeyDown } = useRovingTabIndex(itemRefs);

      return (
        <div role="list" onKeyDown={handleKeyDown}>
          <span>Empty list, currentIndex: {currentIndex}</span>
        </div>
      );
    }
    
    const { getByText } = render(<TestEmptyList />);
    const container = getByText(/Empty list/).parentElement!;
    
    // Should not throw when pressing keys on empty list
    fireEvent.keyDown(container, { key: 'ArrowRight' });
    fireEvent.keyDown(container, { key: 'Home' });
  });

  it('should focus the element when tabindex changes', () => {
    const { getByText } = render(<TestList />);
    
    const item1 = getByText('Item 1');
    const item2 = getByText('Item 2');
    
    // Mock focus method
    const focusSpy = jest.spyOn(item2, 'focus');
    
    // Navigate to second item
    fireEvent.keyDown(item1, { key: 'ArrowRight' });
    
    // Focus should be called on the newly active item
    expect(focusSpy).toHaveBeenCalled();
  });

  it('should handle preventScroll option', () => {
    function TestListWithScroll() {
      const itemRefs = [
        useRef<HTMLButtonElement>(null),
        useRef<HTMLButtonElement>(null),
      ];
      
      const { currentIndex, handleKeyDown } = useRovingTabIndex(itemRefs as RefObject<HTMLElement>[], 'horizontal', {
        preventScroll: true
      });

      return (
        <div role="list">
          {['Item 1', 'Item 2'].map((text, index) => (
            <button
              key={index}
              ref={itemRefs[index]}
              tabIndex={currentIndex === index ? 0 : -1}
              onKeyDown={handleKeyDown}
            >
              {text}
            </button>
          ))}
        </div>
      );
    }
    
    const { getByText } = render(<TestListWithScroll />);
    const item1 = getByText('Item 1');
    const item2 = getByText('Item 2');
    
    // Mock focus method
    const focusSpy = jest.spyOn(item2, 'focus');
    
    // Navigate to second item
    fireEvent.keyDown(item1, { key: 'ArrowRight' });
    
    // Focus should be called with preventScroll option
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });
});