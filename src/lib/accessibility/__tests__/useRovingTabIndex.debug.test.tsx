import React, { useRef, useEffect, RefObject } from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRovingTabIndex } from '../useRovingTabIndex';

// Simpler test component to isolate the issue
function SimpleTestList() {
  const ref1 = useRef<HTMLButtonElement>(null);
  const ref2 = useRef<HTMLButtonElement>(null);
  const ref3 = useRef<HTMLButtonElement>(null);
  
  const refs = React.useMemo(() => [ref1, ref2, ref3] as RefObject<HTMLElement>[], []); // Stable array
  const { currentIndex, handleKeyDown } = useRovingTabIndex(refs);

  // Log to see what's happening
  useEffect(() => {
    console.log('Current index:', currentIndex);
    console.log('Ref1 current:', ref1.current);
    console.log('Ref1 tabindex:', ref1.current?.getAttribute('tabindex'));
    console.log('Ref2 tabindex:', ref2.current?.getAttribute('tabindex'));
    console.log('Ref3 tabindex:', ref3.current?.getAttribute('tabindex'));
  }, [currentIndex]);

  return (
    <div onKeyDown={handleKeyDown}>
      <button ref={ref1}>Item 1 (index={currentIndex})</button>
      <button ref={ref2}>Item 2</button>
      <button ref={ref3}>Item 3</button>
    </div>
  );
}

describe('useRovingTabIndex debug', () => {
  it('should debug tabindex updates', () => {
    const { container } = render(<SimpleTestList />);
    
    const button1 = container.querySelector('button:nth-child(1)');
    const button2 = container.querySelector('button:nth-child(2)');
    const div = container.querySelector('div');
    
    console.log('Initial button1 tabindex:', button1?.getAttribute('tabindex'));
    console.log('Initial button2 tabindex:', button2?.getAttribute('tabindex'));
    
    // Fire keyboard event
    fireEvent.keyDown(div!, { key: 'ArrowRight' });
    
    console.log('After arrow button1 tabindex:', button1?.getAttribute('tabindex'));
    console.log('After arrow button2 tabindex:', button2?.getAttribute('tabindex'));
  });
});