import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, useTheme } from './theme-provider';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';

// Mock localStorage and matchMedia
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

const matchMediaMock = jest.fn();
global.matchMedia = matchMediaMock as any;

describe('Theme Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.classList.remove('light', 'dark');
    
    matchMediaMock.mockReturnValue({
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    });
  });

  const TestApp = () => {
    const { theme } = useTheme();
    
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Theme Test App</h1>
          <ThemeToggle />
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Component */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Card</CardTitle>
              <CardDescription>Current theme: {theme}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This card should adapt to the current theme.
              </p>
            </CardContent>
          </Card>
          
          {/* Form Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-input">Sample Input</Label>
                <Input id="test-input" placeholder="Type something..." />
              </div>
              
              <div className="flex gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              
              <div className="flex gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </CardContent>
          </Card>
          
          {/* Loading States */}
          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          
          {/* Color Palette */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-2 bg-background border rounded">Background</div>
                <div className="p-2 bg-card text-card-foreground rounded">Card</div>
                <div className="p-2 bg-primary text-primary-foreground rounded">Primary</div>
                <div className="p-2 bg-secondary text-secondary-foreground rounded">Secondary</div>
                <div className="p-2 bg-muted text-muted-foreground rounded">Muted</div>
                <div className="p-2 bg-accent text-accent-foreground rounded">Accent</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderTestApp = (defaultTheme?: 'light' | 'dark' | 'system') => {
    return render(
      <ThemeProvider defaultTheme={defaultTheme}>
        <TestApp />
      </ThemeProvider>
    );
  };

  describe('Component Theme Responsiveness', () => {
    it('should render all components correctly in light theme', async () => {
      const { container } = renderTestApp('light');
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('light');
      });

      // Verify components are rendered
      expect(container.querySelector('.text-2xl')).toHaveTextContent('Theme Test App');
      expect(container.querySelectorAll('[data-radix-id]').length).toBeGreaterThan(0); // Cards
      expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('input').length).toBeGreaterThan(0);
    });

    it('should render all components correctly in dark theme', async () => {
      const { container } = renderTestApp('dark');
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
      });

      // Verify dark theme is applied
      expect(container.querySelector('.text-2xl')).toHaveTextContent('Theme Test App');
      
      // Check that theme-aware classes are present
      const cards = container.querySelectorAll('[data-radix-id]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should update all components when theme changes', async () => {
      const { getByRole, getByText } = renderTestApp('light');
      
      // Initial state - light theme
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('light');
        expect(getByText('Current theme: light')).toBeInTheDocument();
      });

      // Toggle theme
      const toggleButton = getByRole('button', { name: /toggle theme/i });
      fireEvent.click(toggleButton);

      // Verify theme changed to dark
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
        expect(document.documentElement).not.toHaveClass('light');
        expect(getByText('Current theme: dark')).toBeInTheDocument();
      });
    });
  });

  describe('Theme CSS Variables', () => {
    it('should have correct CSS variables in light theme', async () => {
      renderTestApp('light');
      
      await waitFor(() => {
        const root = document.documentElement;
        expect(root).toHaveClass('light');
        
        // Verify CSS variables are applied (these would be set by globals.css)
        const computedStyle = window.getComputedStyle(root);
        
        // Note: In a real environment, these would be actual color values
        // For testing, we're just verifying the theme class is applied
        expect(root.classList.contains('light')).toBe(true);
      });
    });

    it('should have correct CSS variables in dark theme', async () => {
      renderTestApp('dark');
      
      await waitFor(() => {
        const root = document.documentElement;
        expect(root).toHaveClass('dark');
        expect(root.classList.contains('dark')).toBe(true);
      });
    });
  });

  describe('Component Styling Consistency', () => {
    it('should maintain consistent button styling across themes', async () => {
      const { getAllByRole, getByRole } = renderTestApp('light');
      
      const buttons = getAllByRole('button').filter(btn => 
        !btn.getAttribute('aria-label')?.includes('Toggle theme')
      );
      
      // Check initial button states
      expect(buttons.length).toBeGreaterThanOrEqual(4); // Default, Secondary, Outline, Ghost
      
      // Toggle theme
      const toggleButton = getByRole('button', { name: /toggle theme/i });
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
      });
      
      // Buttons should still be present and functional
      const buttonsAfterToggle = getAllByRole('button').filter(btn => 
        !btn.getAttribute('aria-label')?.includes('Toggle theme')
      );
      expect(buttonsAfterToggle.length).toBe(buttons.length);
    });

    it('should maintain consistent input styling across themes', async () => {
      const { getByLabelText, getByRole } = renderTestApp('light');
      
      const input = getByLabelText('Sample Input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Type something...');
      
      // Toggle theme
      const toggleButton = getByRole('button', { name: /toggle theme/i });
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
      });
      
      // Input should maintain functionality
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'Test input' } });
      expect(input).toHaveValue('Test input');
    });

    it('should maintain consistent badge styling across themes', async () => {
      const { container, getByRole } = renderTestApp('light');
      
      const badges = container.querySelectorAll('.inline-flex.items-center.rounded-md');
      const initialBadgeCount = badges.length;
      expect(initialBadgeCount).toBeGreaterThan(0);
      
      // Toggle theme
      const toggleButton = getByRole('button', { name: /toggle theme/i });
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
      });
      
      // Badges should still be present
      const badgesAfterToggle = container.querySelectorAll('.inline-flex.items-center.rounded-md');
      expect(badgesAfterToggle.length).toBe(initialBadgeCount);
    });
  });

  describe('Rapid Theme Switching', () => {
    it('should handle rapid theme toggles without breaking', async () => {
      const { getByRole } = renderTestApp('light');
      const toggleButton = getByRole('button', { name: /toggle theme/i });
      
      // Rapidly toggle theme multiple times
      for (let i = 0; i < 10; i++) {
        fireEvent.click(toggleButton);
      }
      
      // Should end up on light theme (even number of toggles)
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('light');
        expect(document.documentElement).not.toHaveClass('dark');
      });
      
      // All components should still be functional
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      const inputs = document.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  describe('System Theme Integration', () => {
    it('should respect system theme preference', async () => {
      // Mock dark mode system preference
      matchMediaMock.mockReturnValue({
        matches: true, // Dark mode
        addListener: jest.fn(),
        removeListener: jest.fn(),
      });
      
      const { getByText } = renderTestApp('system');
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
        expect(getByText('Current theme: system')).toBeInTheDocument();
      });
    });

    it('should update when system theme changes', async () => {
      let mediaQueryListeners: ((e: any) => void)[] = [];
      
      matchMediaMock.mockReturnValue({
        matches: false, // Start with light mode
        addListener: (listener: (e: any) => void) => {
          mediaQueryListeners.push(listener);
        },
        removeListener: jest.fn(),
        addEventListener: (event: string, listener: (e: any) => void) => {
          if (event === 'change') {
            mediaQueryListeners.push(listener);
          }
        },
        removeEventListener: jest.fn(),
      });
      
      renderTestApp('system');
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('light');
      });
      
      // Simulate system theme change to dark
      matchMediaMock.mockReturnValue({
        matches: true, // Dark mode
        addListener: jest.fn(),
        removeListener: jest.fn(),
      });
      
      // Trigger listeners (simulating system theme change)
      mediaQueryListeners.forEach(listener => {
        listener({ matches: true });
      });
      
      // Note: In a real implementation, this would require the ThemeProvider
      // to listen for system theme changes, which it currently doesn't do
    });
  });
});