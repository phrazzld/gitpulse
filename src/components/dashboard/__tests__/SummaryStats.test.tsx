import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SummaryStats from '../SummaryStats';
import { CommitSummary } from '@/types/dashboard';

describe('SummaryStats', () => {
  // Test data
  const mockSummary: CommitSummary = {
    user: 'testuser',
    commits: [],
    stats: {
      totalCommits: 42,
      repositories: ['repo1', 'repo2', 'repo3'],
      dates: ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04']
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with the correct metrics overview title', () => {
    render(<SummaryStats summary={mockSummary} />);
    expect(screen.getByText('METRICS OVERVIEW')).toBeInTheDocument();
  });

  test('displays commit count correctly', () => {
    render(<SummaryStats summary={mockSummary} />);
    
    // Check for the label
    expect(screen.getByText('COMMIT COUNT')).toBeInTheDocument();
    
    // Check for the value using a more precise selector
    const commitCountValue = screen.getByText('42');
    expect(commitCountValue).toBeInTheDocument();
    
    // Verify the structure
    const commitCountSection = screen.getByText('COMMIT COUNT').closest('div');
    expect(commitCountSection).toContainElement(commitCountValue);
  });

  test('displays repository count correctly', () => {
    render(<SummaryStats summary={mockSummary} />);
    
    // Check for the label
    expect(screen.getByText('REPOSITORIES')).toBeInTheDocument();
    
    // Check for the value using a more precise selector
    const repoCountValue = screen.getByText('3');
    expect(repoCountValue).toBeInTheDocument();
    
    // Verify the structure
    const repoCountSection = screen.getByText('REPOSITORIES').closest('div');
    expect(repoCountSection).toContainElement(repoCountValue);
  });

  test('displays active days count correctly', () => {
    render(<SummaryStats summary={mockSummary} />);
    
    // Check for the label
    expect(screen.getByText('ACTIVE DAYS')).toBeInTheDocument();
    
    // Check for the value using a more precise selector
    const activeDaysValue = screen.getByText('4');
    expect(activeDaysValue).toBeInTheDocument();
    
    // Verify the structure
    const activeDaysSection = screen.getByText('ACTIVE DAYS').closest('div');
    expect(activeDaysSection).toContainElement(activeDaysValue);
  });

  test('applies additional className when provided', () => {
    const { container } = render(<SummaryStats summary={mockSummary} className="additional-class" />);
    const rootElement = container.firstChild as HTMLElement;
    expect(rootElement).toHaveClass('additional-class');
  });

  test('renders with zero values when stats are empty', () => {
    const emptySummary: CommitSummary = {
      user: 'testuser',
      commits: [],
      stats: {
        totalCommits: 0,
        repositories: [],
        dates: []
      }
    };

    render(<SummaryStats summary={emptySummary} />);
    
    // Check for specific zero values in each section
    const commitCountSection = screen.getByText('COMMIT COUNT').closest('div');
    const repoCountSection = screen.getByText('REPOSITORIES').closest('div');
    const activeDaysSection = screen.getByText('ACTIVE DAYS').closest('div');
    
    expect(commitCountSection).toHaveTextContent('0');
    expect(repoCountSection).toHaveTextContent('0');
    expect(activeDaysSection).toHaveTextContent('0');
  });
  
  test('handles null or undefined summary gracefully', () => {
    // @ts-ignore - intentionally passing null to test error handling
    expect(() => render(<SummaryStats summary={null} />)).not.toThrow();
    
    // Re-render with undefined
    // @ts-ignore - intentionally passing undefined to test error handling
    expect(() => render(<SummaryStats summary={undefined} />)).not.toThrow();
  });
});