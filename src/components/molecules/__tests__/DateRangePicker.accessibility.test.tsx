import React from 'react';
import { render } from '@testing-library/react';
import DateRangePicker from '../DateRangePicker';
import { assertAccessible, testAccessibilityForStates } from '@/lib/tests/axeTest';

// Sample date range for testing
const sampleDateRange = {
  since: '2023-01-01',
  until: '2023-01-31'
};

describe('DateRangePicker Accessibility', () => {
  it('should have no accessibility violations in default state', async () => {
    const handleChange = jest.fn();
    const { container } = render(
      <DateRangePicker 
        dateRange={sampleDateRange} 
        onChange={handleChange} 
      />
    );
    await assertAccessible(container);
  });

  it('should have no accessibility violations when disabled', async () => {
    const handleChange = jest.fn();
    const { container } = render(
      <DateRangePicker 
        dateRange={sampleDateRange} 
        onChange={handleChange} 
        disabled={true}
      />
    );
    await assertAccessible(container);
  });

  it('should test all common states for accessibility', async () => {
    const handleChange = jest.fn();
    
    await testAccessibilityForStates(
      (props) => render(
        <DateRangePicker 
          onChange={handleChange} 
          {...props} 
        />
      ),
      {
        default: { dateRange: sampleDateRange },
        disabled: { dateRange: sampleDateRange, disabled: true },
        customRange: { 
          dateRange: { 
            since: '2023-06-01', 
            until: '2023-07-15' 
          } 
        },
        sameDayRange: { 
          dateRange: { 
            since: '2023-02-15', 
            until: '2023-02-15' 
          } 
        }
      }
    );
  });

  describe('ARIA and form associations', () => {
    it('should have properly associated labels and inputs', () => {
      const handleChange = jest.fn();
      const { getByLabelText } = render(
        <DateRangePicker 
          dateRange={sampleDateRange} 
          onChange={handleChange} 
        />
      );
      
      // Verify that labels are correctly associated with inputs
      expect(getByLabelText('START DATE')).toHaveAttribute('id', 'since');
      expect(getByLabelText('END DATE')).toHaveAttribute('id', 'until');
    });
    
    it('should have appropriate constraints on date inputs', () => {
      const handleChange = jest.fn();
      const { getByLabelText } = render(
        <DateRangePicker 
          dateRange={sampleDateRange} 
          onChange={handleChange} 
        />
      );
      
      // Verify constraints between start and end dates
      const startDateInput = getByLabelText('START DATE') as HTMLInputElement;
      const endDateInput = getByLabelText('END DATE') as HTMLInputElement;
      
      expect(endDateInput).toHaveAttribute('min', sampleDateRange.since);
      expect(startDateInput).toHaveAttribute('max', sampleDateRange.until);
    });
  });

  describe('Interactive elements', () => {
    it('should have accessible quick select buttons', async () => {
      const handleChange = jest.fn();
      const { getAllByRole, container } = render(
        <DateRangePicker 
          dateRange={sampleDateRange} 
          onChange={handleChange} 
        />
      );
      
      // Check that all preset buttons are accessible
      const buttons = getAllByRole('button');
      expect(buttons).toHaveLength(4); // 4 preset buttons
      
      // Check the first button specifically
      expect(buttons[0]).toHaveTextContent('LAST 7 DAYS');
      expect(buttons[0]).not.toBeDisabled();
      
      await assertAccessible(container);
    });
    
    it('should indicate disabled state correctly on buttons when component is disabled', () => {
      const handleChange = jest.fn();
      const { getAllByRole } = render(
        <DateRangePicker 
          dateRange={sampleDateRange} 
          onChange={handleChange} 
          disabled={true}
        />
      );
      
      // Check that all preset buttons are disabled
      const buttons = getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });
});