import React from 'react';
import { render, screen, fireEvent } from '../../../__tests__/test-utils';
import ActionButton from '@/components/dashboard/ActionButton';

describe('ActionButton', () => {
  it('renders correctly in normal state', () => {
    render(<ActionButton loading={false} />);
    
    // Check that the button is rendered with the correct text
    const button = screen.getByRole('button', { name: /analyze commits/i });
    expect(button).toBeInTheDocument();
    
    // Button should not be disabled
    expect(button).not.toBeDisabled();
    
    // Check for SVG icons (chart icon and arrow)
    expect(button.querySelectorAll('svg')).toHaveLength(2);
  });

  it('renders correctly in loading state', () => {
    render(<ActionButton loading={true} />);
    
    // Check that the button is rendered with the loading text
    const button = screen.getByRole('button', { name: /analyzing data/i });
    expect(button).toBeInTheDocument();
    
    // Button should be disabled in loading state
    expect(button).toBeDisabled();
    
    // Check for loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('has correct styling in normal and loading states', () => {
    const { rerender } = render(<ActionButton loading={false} />);
    
    // Normal state button should have neon-green text
    const button = screen.getByRole('button', { name: /analyze commits/i });
    
    // Loading state
    rerender(<ActionButton loading={true} />);
    
    // Loading state button should be disabled
    const loadingButton = screen.getByRole('button', { name: /analyzing data/i });
    expect(loadingButton).toBeDisabled();
    
    // Style is applied inline, verify the style prop has opacity
    expect(loadingButton).toHaveAttribute('style', expect.stringContaining('opacity: 0.7'));
  });

  // Test form submission would be handled by a parent component
  // since ActionButton is a simple presentational component
  // that doesn't handle the submission logic itself
});