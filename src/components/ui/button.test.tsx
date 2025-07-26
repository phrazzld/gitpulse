import React from 'react';
import { render, screen, fireEvent } from '@/test/test-utils';
import { Button } from './button';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders as button element by default', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('applies data-slot attribute', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-slot', 'button');
    });
  });

  describe('Variants', () => {
    it('renders default variant correctly', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('renders destructive variant correctly', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive', 'text-white');
    });

    it('renders outline variant correctly', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'bg-background');
    });

    it('renders secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('renders ghost variant correctly', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
      expect(button).not.toHaveClass('shadow-xs');
    });

    it('renders link variant correctly', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('renders default size correctly', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-4', 'py-2');
    });

    it('renders small size correctly', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'px-3');
    });

    it('renders large size correctly', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-6');
    });

    it('renders icon size correctly', () => {
      render(<Button size="icon" aria-label="Settings">⚙️</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-9');
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      const handleClick = jest.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles focus state', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus-visible:ring-[3px]');
    });
  });

  describe('Custom Props', () => {
    it('accepts custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('forwards additional props', () => {
      render(
        <Button data-testid="custom-button" aria-label="Custom Button">
          Props
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-testid', 'custom-button');
      expect(button).toHaveAttribute('aria-label', 'Custom Button');
    });

    it('handles type prop', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('asChild Prop', () => {
    it('renders as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveClass('inline-flex', 'items-center');
    });
  });

  describe('Icons', () => {
    it('handles icons correctly', () => {
      render(
        <Button>
          <svg className="h-4 w-4" data-testid="icon">
            <circle cx="8" cy="8" r="8" />
          </svg>
          With Icon
        </Button>
      );
      
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('icon');
      
      expect(icon).toBeInTheDocument();
      expect(button).toHaveClass('gap-2');
    });

    it('applies icon-specific styles', () => {
      render(
        <Button size="default">
          <svg>
            <circle cx="8" cy="8" r="8" />
          </svg>
          Icon Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('has-[>svg]:px-3');
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard Test</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
      
      handleClick.mockClear();
      
      fireEvent.keyDown(button, { key: ' ' });
      expect(handleClick).toHaveBeenCalled();
    });

    it('supports aria-invalid state', () => {
      render(<Button aria-invalid="true">Invalid</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('aria-invalid:border-destructive');
    });

    it('announces disabled state to screen readers', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Loading States', () => {
    it('shows loading state with disabled', () => {
      render(
        <Button disabled>
          <svg className="animate-spin h-4 w-4" />
          Loading...
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Combined Props', () => {
    it('combines variant and size correctly', () => {
      render(
        <Button variant="outline" size="lg">
          Large Outline
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'bg-background', 'h-10', 'px-6');
    });

    it('combines multiple states', () => {
      render(
        <Button variant="destructive" size="sm" disabled className="custom">
          Complex
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive', 'h-8', 'custom');
      expect(button).toBeDisabled();
    });
  });
});