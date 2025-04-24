import React from 'react';
import SummaryView from '../SummaryView';
import { ActivityMode, CommitSummary, DateRange, FilterState } from '@/types/dashboard';

// Mock the ActivityFeed component to avoid testing its logic here
jest.mock('@/components/ActivityFeed', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(props => (
    <div data-testid="activity-feed" data-show-contributor={String(props.showContributor)} />
  ))
}));

// Mock the createActivityFetcher
jest.mock('@/lib/activity', () => ({
  createActivityFetcher: jest.fn(() => jest.fn())
}));

// Create mock element for testing
interface MockElement {
  type: string;
  props: Record<string, any>;
  children?: MockElement[] | string | number;
}

interface MockRenderer {
  render: (component: React.ReactElement) => MockElement;
}

const createMockRenderer = (): MockRenderer => {
  return {
    render: (component: React.ReactElement): MockElement => {
      // Extract type and props from component
      const type = component.type;
      const props = component.props as Record<string, any>;
      
      let renderedType = '';
      if (typeof type === 'string') {
        renderedType = type;
      } else if (typeof type === 'function') {
        // For function components, use the name
        renderedType = type.name || 'Unknown';
      } else {
        renderedType = 'Unknown';
      }
      
      let children: MockElement[] | string | number | undefined;
      
      // Handle children prop
      if (props.children) {
        if (Array.isArray(props.children)) {
          children = props.children.map((child: any) => {
            if (React.isValidElement(child)) {
              // @ts-ignore - We know the render method exists on our renderer
              return this.render(child);
            }
            return child;
          });
        } else if (React.isValidElement(props.children)) {
          // @ts-ignore - We know the render method exists on our renderer
          children = this.render(props.children);
        } else {
          children = props.children;
        }
      }
      
      // Create the rendered element
      const renderedElement: MockElement = {
        type: renderedType,
        props: { ...props, children: undefined },
      };
      
      if (children !== undefined) {
        renderedElement.children = children;
      }
      
      return renderedElement;
    }
  };
};

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

  // Create the mock renderer
  const mockRenderer = createMockRenderer();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when summary is null', () => {
    const rendered = mockRenderer.render(
      <SummaryView
        summary={null}
        activityMode="my-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
      />
    );
    
    expect(rendered).toBeUndefined();
  });

  test('renders the header with username correctly', () => {
    const rendered = mockRenderer.render(
      <SummaryView
        summary={mockSummary}
        activityMode="my-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
      />
    );
    
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('COMMIT ANALYSIS: TESTUSER');
    expect(renderedJson).toContain('ANALYSIS COMPLETE');
  });

  test('displays the activity feed section with correct props', () => {
    const rendered = mockRenderer.render(
      <SummaryView
        summary={mockSummary}
        activityMode="my-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
      />
    );
    
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('COMMIT ACTIVITY');
    expect(renderedJson).toContain('activity-feed');
    expect(renderedJson).toContain('"data-show-contributor":"false"');
  });

  test('displays metrics correctly', () => {
    const rendered = mockRenderer.render(
      <SummaryView
        summary={mockSummary}
        activityMode="my-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
      />
    );
    
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('METRICS OVERVIEW');
    expect(renderedJson).toContain('42'); // Commit count
    expect(renderedJson).toContain('3'); // Repositories count - from mockSummary.stats.repositories.length
    expect(renderedJson).toContain('4'); // Active days count - from mockSummary.stats.dates.length
  });

  test('displays all AI analysis sections when aiSummary is provided', () => {
    const rendered = mockRenderer.render(
      <SummaryView
        summary={mockSummary}
        activityMode="my-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
      />
    );
    
    const renderedJson = JSON.stringify(rendered);
    
    // Check for section headers
    expect(renderedJson).toContain('IDENTIFIED PATTERNS');
    expect(renderedJson).toContain('TECHNICAL FOCUS AREAS');
    expect(renderedJson).toContain('KEY ACHIEVEMENTS');
    expect(renderedJson).toContain('COMMIT CLASSIFICATION');
    expect(renderedJson).toContain('TEMPORAL ANALYSIS');
    expect(renderedJson).toContain('COMPREHENSIVE ANALYSIS');
    
    // Check for specific content items
    expect(renderedJson).toContain('Frontend Development');
    expect(renderedJson).toContain('React Components');
    expect(renderedJson).toContain('Rewrote authentication logic');
    expect(renderedJson).toContain('feat');
    expect(renderedJson).toContain('Implemented core authentication logic');
    expect(renderedJson).toContain('This period was characterized by');
  });

  test('uses team-activity mode for contributor visibility', () => {
    const rendered = mockRenderer.render(
      <SummaryView
        summary={mockSummary}
        activityMode="team-activity"
        dateRange={dateRange}
        activeFilters={activeFilters}
        installationIds={installationIds}
      />
    );
    
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('activity-feed');
    expect(renderedJson).toContain('"data-show-contributor":"true"');
  });
});