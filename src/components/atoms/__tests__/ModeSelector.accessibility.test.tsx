import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import ModeSelector, { DEFAULT_MODES, type ActivityMode } from '../ModeSelector';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('ModeSelector Accessibility', () => {
  const defaultProps = {
    selectedMode: 'my-activity' as ActivityMode,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ARIA Structure', () => {
    it('should have proper radiogroup role and attributes', () => {
      render(<ModeSelector {...defaultProps} />);
      
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
      expect(radioGroup).toHaveAttribute('aria-labelledby');
      expect(radioGroup).toHaveAttribute('aria-roledescription', 'Activity mode selection');
      expect(radioGroup).toHaveAttribute('aria-orientation', 'vertical');
    });

    it('should have proper radio buttons with correct roles', () => {
      render(<ModeSelector {...defaultProps} />);
      
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons).toHaveLength(DEFAULT_MODES.length);
      
      radioButtons.forEach((radio, index) => {
        expect(radio).toHaveAttribute('aria-checked');
        expect(radio).toHaveAttribute('aria-labelledby');
        expect(radio).toHaveAttribute('aria-describedby');
      });
    });

    it('should use semantic button elements for radio options', () => {
      render(<ModeSelector {...defaultProps} />);
      
      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach(radio => {
        expect(radio.tagName).toBe('BUTTON');
        expect(radio).toHaveAttribute('type', 'button');
      });
    });

    it('should have proper ARIA relationships between labels and descriptions', () => {
      render(<ModeSelector {...defaultProps} />);
      
      DEFAULT_MODES.forEach((mode, index) => {
        const radio = screen.getByTestId(`mode-option-${mode.id}`);
        const labelId = radio.getAttribute('aria-labelledby');
        const descriptionId = radio.getAttribute('aria-describedby');
        
        expect(labelId).toBeTruthy();
        expect(descriptionId).toBeTruthy();
        
        const label = document.getElementById(labelId!);
        const description = document.getElementById(descriptionId!);
        
        expect(label).toHaveTextContent(mode.label);
        expect(description).toHaveTextContent(mode.description);
      });
    });

    it('should indicate selected state with aria-checked', () => {
      render(<ModeSelector {...defaultProps} selectedMode="team-activity" />);
      
      const selectedRadio = screen.getByTestId('mode-option-team-activity');
      const unselectedRadio = screen.getByTestId('mode-option-my-activity');
      
      expect(selectedRadio).toHaveAttribute('aria-checked', 'true');
      expect(unselectedRadio).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have proper tabIndex management', () => {
      render(<ModeSelector {...defaultProps} selectedMode="my-work-activity" />);
      
      const radioButtons = screen.getAllByRole('radio');
      const selectedRadio = screen.getByTestId('mode-option-my-work-activity');
      
      // Only selected radio should be focusable
      expect(selectedRadio).toHaveAttribute('tabIndex', '0');
      
      radioButtons.forEach(radio => {
        if (radio !== selectedRadio) {
          expect(radio).toHaveAttribute('tabIndex', '-1');
        }
      });
    });

    it('should handle Arrow key navigation', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(<ModeSelector {...defaultProps} onChange={mockOnChange} />);
      
      const firstRadio = screen.getByTestId('mode-option-my-activity');
      firstRadio.focus();
      
      // Arrow Down should move to next option
      await user.keyboard('{ArrowDown}');
      expect(mockOnChange).toHaveBeenCalledWith('my-work-activity');
      
      // Reset mock and focus the next element manually to simulate real user interaction
      mockOnChange.mockClear();
      const secondRadio = screen.getByTestId('mode-option-my-work-activity');
      secondRadio.focus();
      
      // Arrow Up should move to previous option (wrapping to last)
      await user.keyboard('{ArrowUp}');
      expect(mockOnChange).toHaveBeenCalledWith('my-activity');
      
      // Reset mock and test wrapping from first to last
      mockOnChange.mockClear();
      firstRadio.focus();
      await user.keyboard('{ArrowUp}');
      expect(mockOnChange).toHaveBeenCalledWith('team-activity');
    });

    it('should handle Space and Enter key selection', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(<ModeSelector {...defaultProps} onChange={mockOnChange} />);
      
      const secondRadio = screen.getByTestId('mode-option-my-work-activity');
      secondRadio.focus();
      
      // Space should select the option
      await user.keyboard(' ');
      expect(mockOnChange).toHaveBeenCalledWith('my-work-activity');
      
      // Enter should also select the option
      await user.keyboard('{Enter}');
      expect(mockOnChange).toHaveBeenCalledWith('my-work-activity');
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce selection changes', async () => {
      const user = userEvent.setup();
      
      render(<ModeSelector {...defaultProps} />);
      
      const secondOption = screen.getByTestId('mode-option-my-work-activity');
      
      // Click should trigger announcement
      await user.click(secondOption);
      
      // Check for live region creation (useAriaAnnouncer creates these)
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('should provide proper accessible names', () => {
      render(<ModeSelector {...defaultProps} />);
      
      DEFAULT_MODES.forEach(mode => {
        const radio = screen.getByTestId(`mode-option-${mode.id}`);
        const labelId = radio.getAttribute('aria-labelledby');
        const label = document.getElementById(labelId!);
        
        expect(label).toHaveTextContent(mode.label);
      });
    });
  });

  describe('Disabled State', () => {
    it('should handle disabled state with proper ARIA attributes', () => {
      render(<ModeSelector {...defaultProps} disabled />);
      
      const radioGroup = screen.getByRole('radiogroup');
      const radioButtons = screen.getAllByRole('radio');
      
      expect(radioGroup).toHaveAttribute('aria-disabled', 'true');
      
      radioButtons.forEach(radio => {
        expect(radio).toHaveAttribute('aria-disabled', 'true');
        expect(radio).toHaveAttribute('tabIndex', '-1');
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<ModeSelector {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations when disabled', async () => {
      const { container } = render(<ModeSelector {...defaultProps} disabled />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations with custom modes', async () => {
      const customModes = [
        { id: 'my-activity' as ActivityMode, label: 'Personal', description: 'Your personal activity' },
        { id: 'team-activity' as ActivityMode, label: 'Team', description: 'Team activity' },
      ];
      
      const { container } = render(<ModeSelector {...defaultProps} modes={customModes} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});