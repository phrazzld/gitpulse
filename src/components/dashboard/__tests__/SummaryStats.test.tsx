import React from 'react';
import { render, screen } from '@testing-library/react';
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
    expect(screen.getByText('COMMIT COUNT')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument(); // The total commits value
  });

  test('displays repository count correctly', () => {
    render(<SummaryStats summary={mockSummary} />);
    expect(screen.getByText('REPOSITORIES')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // The length of the repositories array
  });

  test('displays active days count correctly', () => {
    render(<SummaryStats summary={mockSummary} />);
    expect(screen.getByText('ACTIVE DAYS')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // The length of the dates array
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
    
    // Check for all the zero values
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(3); // Should find 3 zeros (totalCommits, repositories length, dates length)
  });
});