import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useKeyboardNavigation, KeyboardHandlers } from '../useKeyboardNavigation';

// Test component that uses the hook
function TestComponent({ 
  handlers, 
  options = {} 
}: { 
  handlers: KeyboardHandlers;
  options?: Parameters<typeof useKeyboardNavigation>[1];
}) {
  const handleKeyDown = useKeyboardNavigation(handlers, options);

  return (
    <button onKeyDown={handleKeyDown}>
      Test Button
    </button>
  );
}

describe('useKeyboardNavigation', () => {
  it('should handle basic key events', () => {
    const handlers: KeyboardHandlers = {
      Enter: jest.fn(),
      Space: jest.fn(),
      Escape: jest.fn(),
    };

    const { getByText } = render(<TestComponent handlers={handlers} />);
    const button = getByText('Test Button');

    // Test Enter key
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handlers.Enter).toHaveBeenCalledTimes(1);

    // Test Space key
    fireEvent.keyDown(button, { key: ' ' });
    expect(handlers.Space).toHaveBeenCalledTimes(1);

    // Test Escape key
    fireEvent.keyDown(button, { key: 'Escape' });
    expect(handlers.Escape).toHaveBeenCalledTimes(1);
  });

  it('should handle arrow keys', () => {
    const handlers: KeyboardHandlers = {
      ArrowUp: jest.fn(),
      ArrowDown: jest.fn(),
      ArrowLeft: jest.fn(),
      ArrowRight: jest.fn(),
    };

    const { getByText } = render(<TestComponent handlers={handlers} />);
    const button = getByText('Test Button');

    fireEvent.keyDown(button, { key: 'ArrowUp' });
    expect(handlers.ArrowUp).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: 'ArrowDown' });
    expect(handlers.ArrowDown).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: 'ArrowLeft' });
    expect(handlers.ArrowLeft).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: 'ArrowRight' });
    expect(handlers.ArrowRight).toHaveBeenCalledTimes(1);
  });

  it('should handle modifier keys', () => {
    const handlers: KeyboardHandlers = {
      'Ctrl+Enter': jest.fn(),
      'Shift+Tab': jest.fn(),
      'Alt+F': jest.fn(),
      'Meta+S': jest.fn(),
    };

    const { getByText } = render(<TestComponent handlers={handlers} />);
    const button = getByText('Test Button');

    fireEvent.keyDown(button, { key: 'Enter', ctrlKey: true });
    expect(handlers['Ctrl+Enter']).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: 'Tab', shiftKey: true });
    expect(handlers['Shift+Tab']).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: 'f', altKey: true });
    expect(handlers['Alt+F']).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: 's', metaKey: true });
    expect(handlers['Meta+S']).toHaveBeenCalledTimes(1);
  });

  it('should prevent default when specified', () => {
    let preventDefaultCalled = false;
    const handlers: KeyboardHandlers = {
      Enter: jest.fn(),
    };

    // Create a custom component to test preventDefault behavior
    const TestComponentWithPrevent = () => {
      const handleKeyDown = useKeyboardNavigation(handlers, { preventDefault: true });
      
      return (
        <button
          onKeyDown={(e) => {
            // Test that preventDefault is called by the hook
            const originalPreventDefault = e.preventDefault;
            e.preventDefault = () => {
              preventDefaultCalled = true;
              originalPreventDefault.call(e);
            };
            handleKeyDown(e);
          }}
        >
          Test Button
        </button>
      );
    };

    const { getByText } = render(<TestComponentWithPrevent />);
    const button = getByText('Test Button');

    fireEvent.keyDown(button, { key: 'Enter' });
    
    expect(preventDefaultCalled).toBe(true);
    expect(handlers.Enter).toHaveBeenCalled();
  });

  it('should stop propagation when specified', () => {
    let stopPropagationCalled = false;
    const handlers: KeyboardHandlers = {
      Enter: jest.fn(),
    };

    // Create a custom component to test stopPropagation behavior
    const TestComponentWithStop = () => {
      const handleKeyDown = useKeyboardNavigation(handlers, { stopPropagation: true });
      
      return (
        <button
          onKeyDown={(e) => {
            // Test that stopPropagation is called by the hook
            const originalStopPropagation = e.stopPropagation;
            e.stopPropagation = () => {
              stopPropagationCalled = true;
              originalStopPropagation.call(e);
            };
            handleKeyDown(e);
          }}
        >
          Test Button
        </button>
      );
    };

    const { getByText } = render(<TestComponentWithStop />);
    const button = getByText('Test Button');

    fireEvent.keyDown(button, { key: 'Enter' });
    
    expect(stopPropagationCalled).toBe(true);
    expect(handlers.Enter).toHaveBeenCalled();
  });

  it('should be disabled when specified', () => {
    const handlers: KeyboardHandlers = {
      Enter: jest.fn(),
    };

    const { getByText } = render(
      <TestComponent handlers={handlers} options={{ disabled: true }} />
    );
    const button = getByText('Test Button');

    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handlers.Enter).not.toHaveBeenCalled();
  });

  it('should ignore unhandled keys', () => {
    const handlers: KeyboardHandlers = {
      Enter: jest.fn(),
    };

    const { getByText } = render(<TestComponent handlers={handlers} />);
    const button = getByText('Test Button');

    // Press a key that's not handled
    fireEvent.keyDown(button, { key: 'a' });
    fireEvent.keyDown(button, { key: 'Tab' });
    
    // No handlers should be called
    expect(handlers.Enter).not.toHaveBeenCalled();
  });

  it('should handle Home and End keys', () => {
    const handlers: KeyboardHandlers = {
      Home: jest.fn(),
      End: jest.fn(),
    };

    const { getByText } = render(<TestComponent handlers={handlers} />);
    const button = getByText('Test Button');

    fireEvent.keyDown(button, { key: 'Home' });
    expect(handlers.Home).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: 'End' });
    expect(handlers.End).toHaveBeenCalledTimes(1);
  });

  it('should handle PageUp and PageDown keys', () => {
    const handlers: KeyboardHandlers = {
      PageUp: jest.fn(),
      PageDown: jest.fn(),
    };

    const { getByText } = render(<TestComponent handlers={handlers} />);
    const button = getByText('Test Button');

    fireEvent.keyDown(button, { key: 'PageUp' });
    expect(handlers.PageUp).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: 'PageDown' });
    expect(handlers.PageDown).toHaveBeenCalledTimes(1);
  });

  it('should pass event object to handlers', () => {
    const handlers: KeyboardHandlers = {
      Enter: jest.fn(),
    };

    const { getByText } = render(<TestComponent handlers={handlers} />);
    const button = getByText('Test Button');

    fireEvent.keyDown(button, { key: 'Enter' });

    // Verify the handler was called
    expect(handlers.Enter).toHaveBeenCalledTimes(1);
    
    // Check that it was called with an event object
    const eventArg = (handlers.Enter as jest.Mock).mock.calls[0][0];
    expect(eventArg).toBeDefined();
    expect(eventArg.key).toBe('Enter');
  });

  it('should handle case-insensitive key matching', () => {
    const handlers: KeyboardHandlers = {
      enter: jest.fn(), // lowercase
      SPACE: jest.fn(), // uppercase
    };

    const { getByText } = render(<TestComponent handlers={handlers} />);
    const button = getByText('Test Button');

    // Should match despite case differences
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handlers.enter).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: ' ' });
    expect(handlers.SPACE).toHaveBeenCalledTimes(1);
  });
});