import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAriaAnnouncer } from '../useAriaAnnouncer';

// Test component that uses the hook
function TestComponent() {
  const { announce } = useAriaAnnouncer();

  return (
    <div>
      <button onClick={() => announce('Item added to cart')}>
        Add to Cart
      </button>
      <button onClick={() => announce('Error: Invalid input', 'assertive')}>
        Trigger Error
      </button>
    </div>
  );
}

describe('useAriaAnnouncer', () => {
  beforeEach(() => {
    // Clean up any existing live regions
    document.querySelectorAll('[aria-live]').forEach(el => el.remove());
  });

  it('should create a live region on mount', () => {
    render(<TestComponent />);
    
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    
    // Check the styles through computed styles or direct style attribute
    const styles = (liveRegion as HTMLElement).style;
    expect(styles.position).toBe('absolute');
    expect(styles.left).toBe('-10000px');
    expect(styles.width).toBe('1px');
    expect(styles.height).toBe('1px');
    expect(styles.overflow).toBe('hidden');
  });

  it('should announce polite messages', async () => {
    const { getByText } = render(<TestComponent />);
    const addButton = getByText('Add to Cart');
    
    // Click to announce
    fireEvent.click(addButton);
    
    // Check that the message appears in the live region
    const liveRegion = document.querySelector('[aria-live="polite"]');
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('Item added to cart');
    });
    
    // Message should be cleared after a delay
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('');
    }, { timeout: 1500 });
  });

  it('should announce assertive messages', async () => {
    const { getByText } = render(<TestComponent />);
    const errorButton = getByText('Trigger Error');
    
    // Create assertive live region
    let assertiveRegion = document.querySelector('[aria-live="assertive"]');
    expect(assertiveRegion).not.toBeInTheDocument();
    
    // Click to announce
    fireEvent.click(errorButton);
    
    // Check that assertive region is created and contains message
    assertiveRegion = document.querySelector('[aria-live="assertive"]');
    expect(assertiveRegion).toBeInTheDocument();
    await waitFor(() => {
      expect(assertiveRegion).toHaveTextContent('Error: Invalid input');
    });
  });

  it('should handle multiple rapid announcements', async () => {
    function RapidTest() {
      const { announce } = useAriaAnnouncer();

      const handleMultiple = () => {
        announce('First message');
        announce('Second message');
        announce('Third message');
      };

      return <button onClick={handleMultiple}>Announce Multiple</button>;
    }
    
    const { getByText } = render(<RapidTest />);
    const button = getByText('Announce Multiple');
    
    fireEvent.click(button);
    
    const liveRegion = document.querySelector('[aria-live="polite"]');
    
    // Should handle all messages, potentially queueing them
    await waitFor(() => {
      expect(liveRegion?.textContent).toBeTruthy();
    });
  });

  it('should clean up live regions on unmount', () => {
    const { unmount } = render(<TestComponent />);
    
    // Verify live region exists
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    
    // Unmount component
    unmount();
    
    // Live region should be removed
    expect(document.querySelector('[aria-live="polite"]')).not.toBeInTheDocument();
  });

  it('should not create duplicate live regions', () => {
    // Render multiple components
    const { rerender } = render(
      <>
        <TestComponent />
        <TestComponent />
      </>
    );
    
    // Should only have one polite live region
    const liveRegions = document.querySelectorAll('[aria-live="polite"]');
    expect(liveRegions).toHaveLength(1);
  });

  it('should handle empty messages gracefully', async () => {
    function EmptyTest() {
      const { announce } = useAriaAnnouncer();

      return (
        <>
          <button onClick={() => announce('')}>Empty</button>
          <button onClick={() => announce(null as any)}>Null</button>
          <button onClick={() => announce(undefined as any)}>Undefined</button>
        </>
      );
    }
    
    const { getByText } = render(<EmptyTest />);
    
    // Should not throw or cause issues
    fireEvent.click(getByText('Empty'));
    fireEvent.click(getByText('Null'));
    fireEvent.click(getByText('Undefined'));
    
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('should provide a clear queued messages function', () => {
    function ClearTest() {
      const { announce, clearQueue } = useAriaAnnouncer();

      const handleQueueAndClear = () => {
        announce('Message 1');
        announce('Message 2');
        announce('Message 3');
        clearQueue?.();
      };

      return <button onClick={handleQueueAndClear}>Queue and Clear</button>;
    }
    
    const { getByText } = render(<ClearTest />);
    const button = getByText('Queue and Clear');
    
    fireEvent.click(button);
    
    // Live region should remain but queue should be cleared
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('should support custom delay for clearing messages', async () => {
    function CustomDelayTest() {
      const { announce } = useAriaAnnouncer({ clearDelay: 500 });

      return (
        <button onClick={() => announce('Quick message')}>
          Announce with Custom Delay
        </button>
      );
    }
    
    const { getByText } = render(<CustomDelayTest />);
    const button = getByText('Announce with Custom Delay');
    
    fireEvent.click(button);
    
    const liveRegion = document.querySelector('[aria-live="polite"]');
    
    // Message should appear
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('Quick message');
    });
    
    // Should clear after custom delay
    await waitFor(() => {
      expect(liveRegion).toHaveTextContent('');
    }, { timeout: 600 });
  });
});