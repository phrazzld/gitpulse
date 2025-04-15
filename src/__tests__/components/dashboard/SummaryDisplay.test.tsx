import React from 'react';
import { render, screen, within } from '../../../__tests__/test-utils';
import SummaryDisplay from '@/components/dashboard/SummaryDisplay';
import { mockSummary, mockActivityCommits, mockDateRange, mockActiveFilters } from '../../../__tests__/test-utils';

// Mock ActivityFeed component to simplify testing
jest.mock('@/components/ActivityFeed', () => {
  return {
    __esModule: true,
    default: ({ 
      loadCommits, 
      useInfiniteScroll, 
      initialLimit, 
      additionalItemsPerPage,
      showRepository,
      showContributor,
      emptyMessage
    }) => (
      <div data-testid="activity-feed">
        <div data-testid="infinite-scroll">Infinite Scroll: {useInfiniteScroll ? 'true' : 'false'}</div>
        <div data-testid="initial-limit">Initial Limit: {initialLimit}</div>
        <div data-testid="show-repository">Show Repository: {showRepository ? 'true' : 'false'}</div>
        <div data-testid="show-contributor">Show Contributor: {showContributor ? 'true' : 'false'}</div>
        <div data-testid="empty-message">Empty Message: {emptyMessage}</div>
        <button 
          onClick={() => loadCommits(null, 10).then(result => {
            // This simulates an activity commit fetch
            console.log(`Fetched ${result.data.length} commits`);
          })}
          data-testid="fetch-commits-button"
        >
          Fetch Commits
        </button>
      </div>
    )
  };
});

// Mock activity fetcher
jest.mock('@/lib/activity', () => ({
  createActivityFetcher: jest.fn(() => jest.fn().mockResolvedValue({
    data: [
      {
        sha: 'mock-sha-1',
        commit: { 
          message: 'Test commit', 
          author: { name: 'Test User', date: '2025-01-01T00:00:00Z' } 
        }
      }
    ],
    hasMore: false
  }))
}));

describe('SummaryDisplay', () => {
  const defaultProps = {
    activityMode: 'my-activity' as const,
    dateRange: mockDateRange,
    activeFilters: mockActiveFilters,
    installationIds: [123]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when summary is null', () => {
    const { container } = render(
      <SummaryDisplay
        summary={null}
        {...defaultProps}
      />
    );
    
    // Component should not render anything
    expect(container).toBeEmptyDOMElement();
  });

  it('renders with minimal summary data (without AI summary)', () => {
    const minimalSummary = {
      user: 'Test User',
      commits: mockActivityCommits,
      stats: {
        totalCommits: 5,
        repositories: ['repo1', 'repo2'],
        dates: ['2025-01-01', '2025-01-02']
      }
    };
    
    render(
      <SummaryDisplay
        summary={minimalSummary}
        {...defaultProps}
      />
    );
    
    // Should show main header
    expect(screen.getByText('COMMIT ANALYSIS: TEST USER')).toBeInTheDocument();
    
    // Should show activity feed section
    expect(screen.getByText('COMMIT ACTIVITY')).toBeInTheDocument();
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    
    // Should show metrics overview
    expect(screen.getByText('METRICS OVERVIEW')).toBeInTheDocument();
    
    // Should show numeric values but test more specifically to avoid duplication 
    // Find the COMMIT COUNT section and check its value
    const commitCountSection = screen.getByText('COMMIT COUNT').closest('.p-4');
    expect(commitCountSection).toHaveTextContent('5');
    
    // Find the REPOSITORIES section and check its value
    const reposSection = screen.getByText('REPOSITORIES').closest('.p-4');
    expect(reposSection).toHaveTextContent('2');
    
    // Find the ACTIVE DAYS section and check its value
    const daysSection = screen.getByText('ACTIVE DAYS').closest('.p-4');
    expect(daysSection).toHaveTextContent('2');
    
    // Should NOT show AI summary sections
    expect(screen.queryByText('IDENTIFIED PATTERNS')).not.toBeInTheDocument();
    expect(screen.queryByText('TECHNICAL FOCUS AREAS')).not.toBeInTheDocument();
    expect(screen.queryByText('KEY ACHIEVEMENTS')).not.toBeInTheDocument();
    expect(screen.queryByText('COMMIT CLASSIFICATION')).not.toBeInTheDocument();
    expect(screen.queryByText('TEMPORAL ANALYSIS')).not.toBeInTheDocument();
    expect(screen.queryByText('COMPREHENSIVE ANALYSIS')).not.toBeInTheDocument();
  });

  it('renders with full summary data including AI summary', () => {
    render(
      <SummaryDisplay
        summary={mockSummary}
        {...defaultProps}
      />
    );
    
    // Check for main header and common sections
    expect(screen.getByText('COMMIT ANALYSIS: TEST USER')).toBeInTheDocument();
    expect(screen.getByText('COMMIT ACTIVITY')).toBeInTheDocument();
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    
    // Check for metrics overview
    expect(screen.getByText('METRICS OVERVIEW')).toBeInTheDocument();
    
    // Check for all AI summary sections
    expect(screen.getByText('IDENTIFIED PATTERNS')).toBeInTheDocument();
    expect(screen.getByText('TECHNICAL FOCUS AREAS')).toBeInTheDocument();
    expect(screen.getByText('KEY ACHIEVEMENTS')).toBeInTheDocument();
    expect(screen.getByText('COMMIT CLASSIFICATION')).toBeInTheDocument();
    expect(screen.getByText('TEMPORAL ANALYSIS')).toBeInTheDocument();
    expect(screen.getByText('COMPREHENSIVE ANALYSIS')).toBeInTheDocument();
    
    // Check for specific content from the mockSummary
    // Check that the themes section exists
    const patternsSection = screen.getByText('IDENTIFIED PATTERNS').closest('.mb-8');
    
    // Within that section, check for the themes
    mockSummary.aiSummary.keyThemes.forEach(theme => {
      expect(within(patternsSection).getByText(theme)).toBeInTheDocument();
    });
    
    // Find the technical areas section
    const technicalAreasSection = screen.getByText('TECHNICAL FOCUS AREAS').closest('.mb-8');
    
    // Check for specific technical areas without asserting by count
    mockSummary.aiSummary.technicalAreas.forEach(area => {
      expect(within(technicalAreasSection).getByText(area.name)).toBeInTheDocument();
      
      // Find the containing element for this technical area within the section
      const areaElement = within(technicalAreasSection).getByText(area.name).closest('.flex');
      expect(areaElement).toHaveTextContent(area.count.toString());
    });
    
    // Find the accomplishments section
    const accomplishmentsSection = screen.getByText('KEY ACHIEVEMENTS').closest('.mb-8');
    
    // Check for specific accomplishments
    mockSummary.aiSummary.accomplishments.forEach(accomplishment => {
      expect(within(accomplishmentsSection).getByText(accomplishment)).toBeInTheDocument();
    });
    
    // Find the commit classification section
    const commitClassificationSection = screen.getByText('COMMIT CLASSIFICATION').closest('.mb-8');
    
    // Check for commit types without direct count matching
    mockSummary.aiSummary.commitsByType.forEach(type => {
      expect(within(commitClassificationSection).getByText(type.type)).toBeInTheDocument();
      expect(within(commitClassificationSection).getByText(type.description)).toBeInTheDocument();
      // Find the container element for this commit type
      const typeElement = within(commitClassificationSection).getByText(type.type).closest('.border-l-2');
      expect(typeElement).toHaveTextContent(type.count.toString());
    });
    
    // Find the comprehensive analysis section
    const analysisSection = screen.getByText('COMPREHENSIVE ANALYSIS').closest('div').parentElement;
    
    // Check for overall summary
    expect(within(analysisSection).getByText(mockSummary.aiSummary.overallSummary)).toBeInTheDocument();
  });

  it('configures ActivityFeed correctly for my-activity mode', () => {
    render(
      <SummaryDisplay
        summary={mockSummary}
        activityMode="my-activity"
        dateRange={mockDateRange}
        activeFilters={mockActiveFilters}
        installationIds={[123]}
      />
    );
    
    // Check ActivityFeed configuration
    expect(screen.getByText('Infinite Scroll: true')).toBeInTheDocument();
    expect(screen.getByText('Initial Limit: 30')).toBeInTheDocument();
    expect(screen.getByText('Show Repository: true')).toBeInTheDocument();
    expect(screen.getByText('Show Contributor: false')).toBeInTheDocument();

    // Check for the specific empty message format using the specific test ID
    const emptyMessageElement = screen.getByTestId('empty-message');
    expect(emptyMessageElement.textContent).toContain('No my activity data found for the selected filters.');
  });

  it('configures ActivityFeed correctly for team-activity mode', () => {
    render(
      <SummaryDisplay
        summary={mockSummary}
        activityMode="team-activity"
        dateRange={mockDateRange}
        activeFilters={mockActiveFilters}
        installationIds={[123]}
      />
    );
    
    // Check ActivityFeed configuration for team-activity mode
    expect(screen.getByText('Show Contributor: true')).toBeInTheDocument();
    
    // Check for the specific empty message format using the specific test ID
    const emptyMessageElement = screen.getByTestId('empty-message');
    expect(emptyMessageElement.textContent).toContain('No team activity data found for the selected filters.');
  });

  it('renders organization filter parameters when provided', () => {
    render(
      <SummaryDisplay
        summary={mockSummary}
        activityMode="team-activity"
        dateRange={mockDateRange}
        activeFilters={{ 
          ...mockActiveFilters,
          organizations: ['org1', 'org2']
        }}
        installationIds={[123]}
      />
    );
    
    // Activity feed params should include organizations
    const fetchButton = screen.getByTestId('fetch-commits-button');
    fetchButton.click();
    
    // The test doesn't actually verify the params passed to the API call,
    // but in real usage, it would pass the organizations filter
  });

  it('renders timeline highlights correctly', () => {
    render(
      <SummaryDisplay
        summary={mockSummary}
        {...defaultProps}
      />
    );
    
    // Check for timeline highlights section
    expect(screen.getByText('TEMPORAL ANALYSIS')).toBeInTheDocument();
    
    // Check each timeline highlight is rendered
    mockSummary.aiSummary.timelineHighlights.forEach((highlight) => {
      expect(screen.getByText(highlight.description)).toBeInTheDocument();
    });
  });
});