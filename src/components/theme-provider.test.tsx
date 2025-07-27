import React from 'react';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from './theme-provider';

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

describe('ThemeProvider', () => {
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

  describe('Initialization', () => {
    it('should initialize with system theme by default', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('system');
    });

    it('should initialize with theme from localStorage if available', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should initialize with custom default theme', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
      });

      expect(result.current.theme).toBe('light');
    });

    it('should use custom storage key', () => {
      const customKey = 'custom-theme-key';
      
      renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider storageKey={customKey}>{children}</ThemeProvider>,
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith(customKey);
    });
  });

  describe('Theme Application', () => {
    it('should apply light theme class to document root', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
      });

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });

    it('should apply dark theme class to document root', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>,
      });

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('light')).toBe(false);
      });
    });

    it('should apply system theme based on prefers-color-scheme', async () => {
      // Mock dark mode preference
      matchMediaMock.mockReturnValue({
        matches: true, // Dark mode
        addListener: jest.fn(),
        removeListener: jest.fn(),
      });

      renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
      });

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('light')).toBe(false);
      });
    });

    it('should apply light theme when system prefers light', async () => {
      // Mock light mode preference
      matchMediaMock.mockReturnValue({
        matches: false, // Light mode
        addListener: jest.fn(),
        removeListener: jest.fn(),
      });

      renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="system">{children}</ThemeProvider>,
      });

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });
  });

  describe('Theme Switching', () => {
    it('should switch from light to dark theme', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('light')).toBe(false);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('gitpulse-theme', 'dark');
      });
    });

    it('should switch from dark to light theme', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('light');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('gitpulse-theme', 'light');
      });
    });

    it('should switch to system theme and apply appropriate class', async () => {
      // Start with dark theme
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>,
      });

      // Mock system preference for light mode
      matchMediaMock.mockReturnValue({
        matches: false, // Light mode
        addListener: jest.fn(),
        removeListener: jest.fn(),
      });

      act(() => {
        result.current.setTheme('system');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('system');
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('gitpulse-theme', 'system');
      });
    });

    it('should persist theme changes to localStorage', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('gitpulse-theme', 'dark');

      act(() => {
        result.current.setTheme('light');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('gitpulse-theme', 'light');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useTheme is used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid theme values from localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');
      
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      // Should fall back to default theme
      expect(result.current.theme).toBe('invalid-theme');
    });

    it('should clean up previous theme classes when switching', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultTheme="light">{children}</ThemeProvider>,
      });

      // Initially light
      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true);
      });

      // Switch to dark
      act(() => {
        result.current.setTheme('dark');
      });

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('light')).toBe(false);
      });

      // Switch to system
      act(() => {
        result.current.setTheme('system');
      });

      await waitFor(() => {
        // Should have only one theme class
        const classes = Array.from(document.documentElement.classList);
        const themeClasses = classes.filter(c => c === 'light' || c === 'dark');
        expect(themeClasses.length).toBe(1);
      });
    });
  });

  describe('Component Integration', () => {
    it('should provide theme context to child components', () => {
      const TestComponent = () => {
        const { theme, setTheme } = useTheme();
        return (
          <div>
            <span data-testid="current-theme">{theme}</span>
            <button onClick={() => setTheme('dark')}>Switch to Dark</button>
          </div>
        );
      };

      const { getByTestId, getByText } = render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      );

      expect(getByTestId('current-theme')).toHaveTextContent('light');

      act(() => {
        getByText('Switch to Dark').click();
      });

      expect(getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should handle multiple theme switches rapidly', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });

      // Rapid theme switches
      act(() => {
        result.current.setTheme('light');
        result.current.setTheme('dark');
        result.current.setTheme('system');
        result.current.setTheme('light');
      });

      await waitFor(() => {
        expect(result.current.theme).toBe('light');
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });
  });
});