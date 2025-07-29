import React from 'react';
import { render, screen, fireEvent } from '@/test/test-utils';
import LoadMoreButton from './LoadMoreButton';

describe('LoadMoreButton Component', () => {
  const defaultProps = {
    onClick: jest.fn(),
    loading: false,
    hasMore: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering States', () => {
    it('renders with default text when not loading', () => {
      render(<LoadMoreButton {...defaultProps} />);
      
      expect(screen.getByText('LOAD MORE')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeEnabled();
    });

    it('renders with loading state', () => {
      render(<LoadMoreButton {...defaultProps} loading={true} />);
      
      expect(screen.getByText('LOADING...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('does not render when hasMore is false', () => {
      const { container } = render(
        <LoadMoreButton {...defaultProps} hasMore={false} />
      );
      
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Custom Text', () => {
    it('renders with custom load text', () => {
      render(
        <LoadMoreButton {...defaultProps} loadText="Show More Items" />
      );
      
      expect(screen.getByText('Show More Items')).toBeInTheDocument();
    });

    it('renders with custom loading text', () => {
      render(
        <LoadMoreButton
          {...defaultProps}
          loading={true}
          loadingText="Please Wait"
        />
      );
      
      expect(screen.getByText('Please Wait...')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('shows ChevronDown icon when not loading', () => {
      render(<LoadMoreButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      // Check for Lucide icon by its class
      const icon = button.querySelector('.lucide-chevron-down');
      expect(icon).toBeInTheDocument();
    });

    it('shows Loader2 spinning icon when loading', () => {
      render(<LoadMoreButton {...defaultProps} loading={true} />);
      
      const button = screen.getByRole('button');
      // Check for animated spinner
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('lucide-loader-2');
    });
  });

  describe('Interactions', () => {
    it('calls onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<LoadMoreButton {...defaultProps} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(
        <LoadMoreButton {...defaultProps} onClick={handleClick} loading={true} />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(
        <LoadMoreButton {...defaultProps} onClick={handleClick} loading={true} />
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('applies custom className to container', () => {
      render(<LoadMoreButton {...defaultProps} className="custom-spacing" />);
      
      const container = screen.getByRole('button').parentElement;
      expect(container).toHaveClass('custom-spacing', 'flex', 'justify-center', 'py-4');
    });

    it('uses outline variant and small size for button', () => {
      render(<LoadMoreButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      // shadcn button classes for outline variant and sm size
      expect(button).toHaveClass('border', 'bg-background', 'h-8');
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<LoadMoreButton {...defaultProps} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('announces loading state to screen readers', () => {
      render(<LoadMoreButton {...defaultProps} loading={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
      expect(screen.getByText('LOADING...')).toBeInTheDocument();
    });

    it('has appropriate ARIA attributes', () => {
      render(<LoadMoreButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid clicks gracefully', () => {
      const handleClick = jest.fn();
      render(<LoadMoreButton {...defaultProps} onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      
      // Simulate rapid clicks
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('transitions from loading to not loading correctly', () => {
      const { rerender } = render(
        <LoadMoreButton {...defaultProps} loading={true} />
      );
      
      expect(screen.getByText('LOADING...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
      
      rerender(<LoadMoreButton {...defaultProps} loading={false} />);
      
      expect(screen.getByText('LOAD MORE')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeEnabled();
    });

    it('handles all props changing simultaneously', () => {
      const { rerender } = render(
        <LoadMoreButton
          onClick={jest.fn()}
          loading={false}
          hasMore={true}
          loadText="More"
          loadingText="Wait"
        />
      );
      
      expect(screen.getByText('More')).toBeInTheDocument();
      
      const newOnClick = jest.fn();
      rerender(
        <LoadMoreButton
          onClick={newOnClick}
          loading={true}
          hasMore={true}
          loadText="Load"
          loadingText="Processing"
        />
      );
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});