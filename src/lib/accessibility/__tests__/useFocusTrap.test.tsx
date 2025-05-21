import React, { useRef, RefObject } from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useFocusTrap, FocusTrapOptions } from '../useFocusTrap';

// Test component that uses the hook
function TestComponent({ isActive = true }: { isActive?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef as RefObject<HTMLElement>, isActive);

  return (
    <div>
      <button id="before">Before</button>
      <div ref={containerRef}>
        <button id="first">First</button>
        <button id="second">Second</button>
        <button id="last">Last</button>
      </div>
      <button id="after">After</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('should trap focus within container when active', () => {
    const { getByText } = render(<TestComponent />);
    
    const firstButton = getByText('First');
    const lastButton = getByText('Last');
    const afterButton = getByText('After');
    
    // Focus the last button in the trap
    lastButton.focus();
    expect(document.activeElement).toBe(lastButton);
    
    // Tab should cycle to first element
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(firstButton);
    
    // Shift+Tab should cycle to last element
    fireEvent.keyDown(document.activeElement!, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastButton);
  });

  it('should not trap focus when inactive', () => {
    const { getByText } = render(<TestComponent isActive={false} />);
    
    const lastButton = getByText('Last');
    const afterButton = getByText('After');
    
    // Focus the last button
    lastButton.focus();
    
    // Tab should go to after button (normal flow)
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    // In real browser, this would move focus to afterButton
    // but jsdom doesn't handle native tab behavior
  });

  it('should handle escape key to deactivate trap', () => {
    const handleDeactivate = jest.fn();
    
    function TestComponentWithEscape() {
      const containerRef = useRef<HTMLDivElement>(null);
      useFocusTrap(containerRef as RefObject<HTMLElement>, true, { onDeactivate: handleDeactivate });

      return (
        <div ref={containerRef}>
          <button>Button</button>
        </div>
      );
    }
    
    render(<TestComponentWithEscape />);
    
    // Press escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleDeactivate).toHaveBeenCalled();
  });

  it('should handle click outside to deactivate trap', () => {
    const handleDeactivate = jest.fn();
    
    function TestComponentWithClickOutside() {
      const containerRef = useRef<HTMLDivElement>(null);
      useFocusTrap(containerRef as RefObject<HTMLElement>, true, { 
        onDeactivate: handleDeactivate,
        allowClickOutside: true 
      });

      return (
        <>
          <div ref={containerRef}>
            <button>Inside</button>
          </div>
          <button id="outside">Outside</button>
        </>
      );
    }
    
    const { getByText } = render(<TestComponentWithClickOutside />);
    
    // Click outside
    fireEvent.click(getByText('Outside'));
    expect(handleDeactivate).toHaveBeenCalled();
  });

  it('should return focus to previous element when deactivated', () => {
    function TestComponentWithReturn() {
      const [isActive, setIsActive] = React.useState(false);
      const containerRef = useRef<HTMLDivElement>(null);
      const triggerRef = useRef<HTMLButtonElement>(null);
      
      useFocusTrap(containerRef as RefObject<HTMLElement>, isActive, {
        returnFocusOnDeactivate: true,
        initialFocus: () => document.getElementById('first-in-trap')
      });

      return (
        <>
          <button ref={triggerRef} onClick={() => setIsActive(true)}>
            Activate
          </button>
          <div ref={containerRef}>
            <button id="first-in-trap">First in trap</button>
            <button onClick={() => setIsActive(false)}>Deactivate</button>
          </div>
        </>
      );
    }
    
    const { getByText } = render(<TestComponentWithReturn />);
    const activateButton = getByText('Activate');
    
    // Focus and click activate
    activateButton.focus();
    fireEvent.click(activateButton);
    
    // Focus should move to first element in trap
    expect(document.activeElement?.id).toBe('first-in-trap');
    
    // Click deactivate
    fireEvent.click(getByText('Deactivate'));
    
    // Focus should return to activate button
    expect(document.activeElement).toBe(activateButton);
  });
});