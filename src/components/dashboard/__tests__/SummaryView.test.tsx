/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SummaryView from '../SummaryView';
import { ActivityMode, CommitSummary, DateRange, FilterState } from '@/types/dashboard';

// Mock the ActivityFeed component to avoid testing its logic here
jest.mock('@/components/ActivityFeed', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(props => (
    <div className="activity-feed" data-testid="activity-feed" data-show-contributor={String(props.showContributor)} />
  ))
}));

// Also mock any potentially imported ActivityFeed from the organisms folder
jest.mock('@/components/organisms/ActivityFeed', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(props => (
    <div className="activity-feed-organism" data-testid="activity-feed" data-show-contributor={String(props.showContributor)} />
  ))
}));

// Mock the child components
jest.mock('@/components/dashboard/SummaryStats', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(props => (
    <div data-testid="summary-stats">
      <h3>METRICS OVERVIEW</h3>
      <p data-testid="commit-count">{props.summary?.stats.totalCommits}</p>
      <p data-testid="repo-count">{props.summary?.stats.repositories.length}</p>
      <p data-testid="days-count">{props.summary?.stats.dates.length}</p>
    </div>
  ))
}));

jest.mock('@/components/dashboard/SummaryDetails', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(props => (
    <div data-testid="summary-details">
      <h3>IDENTIFIED PATTERNS</h3>
      <div data-testid="key-themes">
        {props.aiSummary?.keyThemes.map((theme: string, i: number) => (
          <span key={i} data-testid={`theme-${i}`}>{theme}</span>
        ))}
      </div>
      <h3>TECHNICAL FOCUS AREAS</h3>
      <div data-testid="technical-areas">
        {props.aiSummary?.technicalAreas.map((area: any, i: number) => (
          <div key={i} data-testid={`area-${i}`}>
            <span>{area.name}</span>
            <span>{area.count}</span>
          </div>
        ))}
      </div>
      <h3>KEY ACHIEVEMENTS</h3>
      <div data-testid="achievements">
        {props.aiSummary?.accomplishments.map((item: string, i: number) => (
          <div key={i} data-testid={`achievement-${i}`}>{item}</div>
        ))}
      </div>
      <h3>COMMIT CLASSIFICATION</h3>
      <div data-testid="commit-types">
        {props.aiSummary?.commitsByType.map((type: any, i: number) => (
          <div key={i} data-testid={`commit-type-${i}`}>
            <h4>{type.type}</h4>
            <span>{type.count}</span>
            <p>{type.description}</p>
          </div>
        ))}
      </div>
      <h3>TEMPORAL ANALYSIS</h3>
      <div data-testid="timeline">
        {props.aiSummary?.timelineHighlights.map((highlight: any, i: number) => (
          <div key={i} data-testid={`timeline-${i}`}>
            <div>{new Date(highlight.date).toLocaleDateString()}</div>
            <div>{highlight.description}</div>
          </div>
        ))}
      </div>
      <h3>COMPREHENSIVE ANALYSIS</h3>
      <div data-testid="overall-summary">{props.aiSummary?.overallSummary}</div>
    </div>
  ))
}));

// Mock the createActivityFetcher
jest.mock('@/lib/activity', () => ({
  createActivityFetcher: jest.fn(() => jest.fn())
}));

describe('SummaryView', () => {
  // Test data
  const dateRange: DateRange = {
    since: '2023-01-01',
    until: '2023-01-31'
  };

  const activeFilters: FilterState = {
    contributors: ['me'],
    organizations: ['testorg'],
    repositories: []
  };

  const installationIds: readonly number[] = [123];

  const mockSummary: CommitSummary = {
    user: 'testuser',
    commits: [],
    stats: {
      totalCommits: 42,
      repositories: ['repo1', 'repo2', 'repo3'],
      dates: ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04']
    },
    aiSummary: {
      keyThemes: ['Frontend Development', 'Bug Fixes', 'Performance Improvements'],
      technicalAreas: [
        { name: 'React Components', count: 12 },
        { name: 'API Endpoints', count: 8 },
        { name: 'Unit Tests', count: 20 }
      ],
      accomplishments: [
        'Rewrote authentication logic for improved security',
        'Optimized component rendering by 30%',
        'Added test coverage for critical features'
      ],
      commitsByType: [
        { type: 'feat', count: 15, description: 'New features added to the application' },
        { type: 'fix', count: 12, description: 'Bug fixes and issue resolution' },
        { type: 'refactor', count: 8, description: 'Code restructuring without functionality changes' }
      ],
      timelineHighlights: [
        { date: '2023-01-02', description: 'Implemented core authentication logic' },
        { date: '2023-01-10', description: 'Completed performance optimization phase' },
        { date: '2023-01-25', description: 'Deployed major feature update' }
      ],
      overallSummary: 'This period was characterized by significant improvements to the application core, with a focus on security and performance enhancements. The work demonstrates systematic refactoring alongside new feature development.'
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when summary is null', () => {
    render(
      <SummaryView
        summary={null}
        activityMode="my-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
      />
    );
    
    // The component should not render anything with a null summary
    expect(document.body.textContent).toBe('');
  });

  test('renders the header with username correctly', () => {
    render(
      <SummaryView
        summary={mockSummary}
        activityMode="my-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
      />
    );
    
    // Check for header content
    expect(screen.getByText('COMMIT ANALYSIS: TESTUSER')).toBeInTheDocument();
    expect(screen.getByText('ANALYSIS COMPLETE')).toBeInTheDocument();
  });

  test('displays the activity feed section with correct props', () => {
    render(
      <SummaryView
        summary={mockSummary}
        activityMode="my-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
      />
    );
    
    // Check for activity feed section
    expect(screen.getByText('COMMIT ACTIVITY')).toBeInTheDocument();
    
    // Look for the activity feed in the document - using a more flexible approach
    const activityFeedEls = document.querySelectorAll('[data-testid="activity-feed"], .activity-feed, .activity-feed-organism');
    expect(activityFeedEls.length).toBeGreaterThan(0);
    
    // Check at least one of the activity feeds has the correct data attribute
    let hasCorrectAttribute = false;
    activityFeedEls.forEach(el => {
      if (el.getAttribute('data-show-contributor') === 'false') {
        hasCorrectAttribute = true;
      }
    });
    expect(hasCorrectAttribute).toBe(true);
  });

  test('displays metrics through SummaryStats component', () => {
    render(
      <SummaryView
        summary={mockSummary}
        activityMode="my-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
      />
    );
    
    // Verify SummaryStats is rendered with correct data
    const statsComponent = screen.getByTestId('summary-stats');
    expect(statsComponent).toBeInTheDocument();
    expect(screen.getByText('METRICS OVERVIEW')).toBeInTheDocument();
    expect(screen.getByTestId('commit-count')).toHaveTextContent('42');
    expect(screen.getByTestId('repo-count')).toHaveTextContent('3');
    expect(screen.getByTestId('days-count')).toHaveTextContent('4');
  });

  test('displays all AI analysis sections when aiSummary is provided', () => {
    render(
      <SummaryView
        summary={mockSummary}
        activityMode="my-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
      />
    );
    
    // Verify SummaryDetails component is rendered with AI summary data
    const detailsComponent = screen.getByTestId('summary-details');
    expect(detailsComponent).toBeInTheDocument();
    
    // Check for section headers
    expect(screen.getByText('IDENTIFIED PATTERNS')).toBeInTheDocument();
    expect(screen.getByText('TECHNICAL FOCUS AREAS')).toBeInTheDocument();
    expect(screen.getByText('KEY ACHIEVEMENTS')).toBeInTheDocument();
    expect(screen.getByText('COMMIT CLASSIFICATION')).toBeInTheDocument();
    expect(screen.getByText('TEMPORAL ANALYSIS')).toBeInTheDocument();
    expect(screen.getByText('COMPREHENSIVE ANALYSIS')).toBeInTheDocument();
    
    // Check for specific content items
    expect(screen.getByTestId('theme-0')).toHaveTextContent('Frontend Development');
    expect(screen.getByTestId('area-0')).toHaveTextContent('React Components');
    expect(screen.getByTestId('achievement-0')).toHaveTextContent('Rewrote authentication logic');
    expect(screen.getByTestId('commit-type-0')).toHaveTextContent('feat');
    expect(screen.getByTestId('timeline-0')).toHaveTextContent('Implemented core authentication logic');
    expect(screen.getByTestId('overall-summary')).toHaveTextContent('This period was characterized by');
  });

  test('uses team-activity mode for contributor visibility', () => {
    render(
      <SummaryView
        summary={mockSummary}
        activityMode="team-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
      />
    );
    
    // Look for the activity feed in the document - using a more flexible approach
    const activityFeedEls = document.querySelectorAll('[data-testid="activity-feed"], .activity-feed, .activity-feed-organism');
    expect(activityFeedEls.length).toBeGreaterThan(0);
    
    // Check at least one of the activity feeds has the correct data attribute
    let hasCorrectAttribute = false;
    activityFeedEls.forEach(el => {
      if (el.getAttribute('data-show-contributor') === 'true') {
        hasCorrectAttribute = true;
      }
    });
    expect(hasCorrectAttribute).toBe(true);
  });

  test('handles loading state correctly', () => {
    render(
      <SummaryView
        summary={mockSummary}
        activityMode="my-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
        loading={true}
      />
    );
    
    // Even with loading=true, component should render normally since loading handling is in parent components
    expect(screen.getByText('COMMIT ANALYSIS: TESTUSER')).toBeInTheDocument();
    
    // Look for the activity feed in the document - using a more flexible approach
    const activityFeedEls = document.querySelectorAll('[data-testid="activity-feed"], .activity-feed, .activity-feed-organism');
    expect(activityFeedEls.length).toBeGreaterThan(0);
  });
});