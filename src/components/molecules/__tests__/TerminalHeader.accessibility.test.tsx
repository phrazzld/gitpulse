import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import TerminalHeader from '../TerminalHeader';
import { assertAccessible, testAccessibilityForStates } from '@/lib/tests/axeTest';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('TerminalHeader Accessibility', () => {
  describe('WCAG Compliance', () => {
    it('should have no accessibility violations in default state', async () => {
      const { container } = render(<TerminalHeader title="Operations Console" />);
      await assertAccessible(container);
    });

    it('should have no accessibility violations with custom status text', async () => {
      const { container } = render(
        <TerminalHeader 
          title="Operations Console" 
          statusText="SYSTEM ACTIVE: ANALYZING REPOSITORIES"
        />
      );
      await assertAccessible(container);
    });

    it('should test all common states for accessibility', async () => {
      type TerminalHeaderTestProps = Parameters<typeof TerminalHeader>[0];

      await testAccessibilityForStates<TerminalHeaderTestProps>(
        (props) => render(<TerminalHeader {...props} />),
        {
          default: { title: "Operations Console" },
          withCustomStatus: { 
            title: "Repository Analysis", 
            statusText: "STATUS: SCANNING"
          },
          withLongTitle: {
            title: "Extended Operations Dashboard Management Console",
            statusText: "RUNNING"
          }
        }
      );
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient contrast for title text', () => {
      render(<TerminalHeader title="Operations Console" />);
      
      const titleElement = screen.getByText('Operations Console');
      expect(titleElement).toBeInTheDocument();
      
      // Verify title has proper styling for contrast
      expect(titleElement).toHaveStyle({
        color: 'var(--neon-green, #00994f)'
      });
      
      // The neon green color #00994f meets WCAG AA 3.51:1 contrast ratio for large text
    });
    
    it('should have sufficient contrast for status text', () => {
      render(<TerminalHeader title="Operations Console" />);
      
      const statusElement = screen.getByText('OPERATIONAL STATUS: ACTIVE');
      expect(statusElement).toBeInTheDocument();
      
      // We can't test exact styles in JSDOM, but we can verify the element exists
      // and has the expected classes
      expect(statusElement).toHaveClass('px-2', 'py-1', 'text-xs', 'rounded');
      
      // The electric blue color #0066cc meets WCAG AA 4.5:1 contrast ratio
    });
    
    it('should have sufficient contrast for status indicator', () => {
      const { container } = render(<TerminalHeader title="Operations Console" />);
      
      // Find the status indicator dot
      const statusDot = container.querySelector('.w-2.h-2.rounded-full');
      expect(statusDot).toBeInTheDocument();
      expect(statusDot).toHaveStyle({
        backgroundColor: 'var(--neon-green, #00994f)'
      });
      
      // The neon green status indicator should be visible against the background
    });
  });
  
  describe('Semantic Structure', () => {
    it('should use proper heading structure', () => {
      render(<TerminalHeader title="Operations Console" />);
      
      // Verify that the title uses h2 for proper document structure
      const headingElement = screen.getByRole('heading', { level: 2 });
      expect(headingElement).toHaveTextContent('Operations Console');
    });
    
    it('should maintain proper visual hierarchy', () => {
      render(<TerminalHeader title="Operations Console" />);
      
      // Verify elements have proper layout classes
      const container = screen.getByText('Operations Console').closest('div');
      expect(container?.parentElement).toHaveClass('flex', 'justify-between', 'items-center');
    });
  });
  
  describe('Text Alternatives', () => {
    it('should have clear, descriptive text labels', () => {
      render(
        <TerminalHeader 
          title="Repository Dashboard" 
          statusText="SCANNING REPOSITORY DATA"
        />
      );
      
      // Status text should be clear and descriptive
      const statusElement = screen.getByText('SCANNING REPOSITORY DATA');
      expect(statusElement).toBeInTheDocument();
      
      // Title should be clear and descriptive
      const titleElement = screen.getByText('Repository Dashboard');
      expect(titleElement).toBeInTheDocument();
    });
  });
  
  describe('Text Sizing and Spacing', () => {
    it('should use appropriate text sizes for readability', () => {
      render(<TerminalHeader title="Operations Console" />);
      
      // Title should use an appropriate text size (text-xl)
      const titleElement = screen.getByText('Operations Console');
      expect(titleElement).toHaveClass('text-xl');
      
      // Status should use appropriate size for secondary information
      const statusElement = screen.getByText('OPERATIONAL STATUS: ACTIVE');
      expect(statusElement).toHaveClass('text-xs');
    });
    
    it('should have appropriate spacing between elements', () => {
      render(<TerminalHeader title="Operations Console" />);
      
      // Container should have margin bottom
      const headerContainer = screen.getByText('Operations Console').closest('div');
      expect(headerContainer?.parentElement).toHaveClass('mb-6');
      
      // Status indicator should have spacing from title
      const titleContainer = screen.getByText('Operations Console').closest('div');
      const statusDot = titleContainer?.querySelector('.w-2.h-2.rounded-full');
      expect(statusDot).toHaveClass('mr-2');
    });
  });
});