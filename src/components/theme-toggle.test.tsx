import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeToggle } from './theme-toggle';
import { ThemeProvider } from './theme-provider';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock matchMedia
const matchMediaMock = jest.fn();
global.matchMedia = matchMediaMock as any;

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.classList.remove('light', 'dark');
    
    // Default matchMedia mock
    matchMediaMock.mockReturnValue({
      matches: false, // Light mode by default
      addListener: jest.fn(),
      removeListener: jest.fn(),
    });
  });

  const renderWithTheme = (defaultTheme?: 'light' | 'dark' | 'system') => {
    return render(
      <ThemeProvider defaultTheme={defaultTheme}>
        <ThemeToggle />
      </ThemeProvider>
    );
  };

  describe('Rendering', () => {
    it('should render the toggle button', () => {
      const { getByRole } = renderWithTheme();
      const button = getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have accessible label', () => {
      const { getByLabelText } = renderWithTheme();
      expect(getByLabelText('Toggle theme')).toBeInTheDocument();
    });

    it('should show sun icon in light mode', async () => {
      const { container } = renderWithTheme('light');
      
      await waitFor(() => {
        const sunIcon = container.querySelector('.lucide-sun');
        const moonIcon = container.querySelector('.lucide-moon');
        
        // Sun should be visible (scale-100)
        expect(sunIcon).toHaveClass('scale-100');
        expect(sunIcon).not.toHaveClass('scale-0');
        
        // Moon should be hidden (scale-0)
        expect(moonIcon).toHaveClass('scale-0');
        expect(moonIcon).not.toHaveClass('scale-100');
      });
    });

    it('should show moon icon in dark mode', async () => {
      const { container } = renderWithTheme('dark');
      
      await waitFor(() => {
        const sunIcon = container.querySelector('.lucide-sun');
        const moonIcon = container.querySelector('.lucide-moon');
        
        // Moon should be visible (scale-100)
        expect(moonIcon).toHaveClass('dark:scale-100');
        
        // Sun should be hidden (scale-0)
        expect(sunIcon).toHaveClass('dark:scale-0');
      });
    });
  });

  describe('Theme Switching', () => {
    it('should toggle from light to dark theme', async () => {
      const { getByRole } = renderWithTheme('light');
      const button = getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('light')).toBe(false);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('gitpulse-theme', 'dark');
      });
    });

    it('should toggle from dark to light theme', async () => {
      const { getByRole } = renderWithTheme('dark');
      const button = getByRole('button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('gitpulse-theme', 'light');
      });
    });

    it('should toggle from system theme to opposite of system preference', async () => {
      // Mock system preference for dark mode
      matchMediaMock.mockReturnValue({
        matches: true, // Dark mode
        addListener: jest.fn(),
        removeListener: jest.fn(),
      });

      const { getByRole } = renderWithTheme('system');
      const button = getByRole('button');

      // System is dark, so clicking should switch to light
      fireEvent.click(button);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('gitpulse-theme', 'light');
      });
    });

    it('should handle multiple rapid clicks', async () => {
      const { getByRole } = renderWithTheme('light');
      const button = getByRole('button');

      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        // Should end up on dark (odd number of clicks)
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });
  });

  describe('Icon Transitions', () => {
    it('should have rotation transitions on icons', () => {
      const { container } = renderWithTheme();
      
      const sunIcon = container.querySelector('.lucide-sun');
      const moonIcon = container.querySelector('.lucide-moon');
      
      expect(sunIcon).toHaveClass('transition-all');
      expect(moonIcon).toHaveClass('transition-all');
      
      // Check rotation classes
      expect(sunIcon).toHaveClass('rotate-0');
      expect(sunIcon).toHaveClass('dark:-rotate-90');
      expect(moonIcon).toHaveClass('rotate-90');
      expect(moonIcon).toHaveClass('dark:rotate-0');
    });
  });

  describe('Button Styling', () => {
    it('should use ghost variant for minimal visual impact', () => {
      const { getByRole } = renderWithTheme();
      const button = getByRole('button');
      
      // Check for ghost variant classes
      expect(button).toHaveClass('hover:bg-accent');
      expect(button).toHaveClass('hover:text-accent-foreground');
    });

    it('should be icon-sized button', () => {
      const { getByRole } = renderWithTheme();
      const button = getByRole('button');
      
      // Check for icon size classes
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('w-9');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      const { getByRole } = renderWithTheme('light');
      const button = getByRole('button');

      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Press Enter
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter', code: 'Enter' });

      // Theme should change
      expect(localStorageMock.setItem).toHaveBeenCalledWith('gitpulse-theme', 'dark');
    });

    it('should be activatable with Space key', () => {
      const { getByRole } = renderWithTheme('light');
      const button = getByRole('button');

      button.focus();
      
      // Press Space
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      fireEvent.keyUp(button, { key: ' ', code: 'Space' });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('gitpulse-theme', 'dark');
    });

    it('should have proper ARIA attributes', () => {
      const { getByRole } = renderWithTheme();
      const button = getByRole('button');

      // Button should be a button element
      expect(button.tagName).toBe('BUTTON');
      
      // Should have accessible label via sr-only text
      expect(button).toHaveAccessibleName('Toggle theme');
    });
  });

  describe('Integration with ThemeProvider', () => {
    it('should reflect current theme state from provider', async () => {
      // Start with dark theme
      localStorageMock.getItem.mockReturnValue('dark');
      
      const { getByRole, container } = renderWithTheme();

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      // Click to toggle
      fireEvent.click(getByRole('button'));

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });

    it('should work when theme provider has custom storage key', async () => {
      const customKey = 'custom-theme-key';
      
      const { getByRole } = render(
        <ThemeProvider storageKey={customKey} defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      );

      fireEvent.click(getByRole('button'));

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(customKey, 'dark');
      });
    });
  });
});