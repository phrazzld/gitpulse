import React from 'react';
import SummaryDetails from '../SummaryDetails';
import { AISummary } from '@/types/dashboard';

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

describe('SummaryDetails', () => {
  // Test data
  const mockAISummary: AISummary = {
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
  };

  // Create the mock renderer
  const mockRenderer = createMockRenderer();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the key themes section with correct title', () => {
    const rendered = mockRenderer.render(
      <SummaryDetails aiSummary={mockAISummary} />
    );
    
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('IDENTIFIED PATTERNS');
    expect(renderedJson).toContain('Frontend Development');
    expect(renderedJson).toContain('Bug Fixes');
    expect(renderedJson).toContain('Performance Improvements');
  });

  test('renders the technical areas section correctly', () => {
    const rendered = mockRenderer.render(
      <SummaryDetails aiSummary={mockAISummary} />
    );
    
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('TECHNICAL FOCUS AREAS');
    expect(renderedJson).toContain('React Components');
    expect(renderedJson).toContain('API Endpoints');
    expect(renderedJson).toContain('Unit Tests');
    expect(renderedJson).toContain('12'); // Count for React Components
    expect(renderedJson).toContain('8'); // Count for API Endpoints
    expect(renderedJson).toContain('20'); // Count for Unit Tests
  });

  test('renders the accomplishments section correctly', () => {
    const rendered = mockRenderer.render(
      <SummaryDetails aiSummary={mockAISummary} />
    );
    
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('KEY ACHIEVEMENTS');
    expect(renderedJson).toContain('Rewrote authentication logic for improved security');
    expect(renderedJson).toContain('Optimized component rendering by 30%');
    expect(renderedJson).toContain('Added test coverage for critical features');
  });

  test('renders the commit types section correctly', () => {
    const rendered = mockRenderer.render(
      <SummaryDetails aiSummary={mockAISummary} />
    );
    
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('COMMIT CLASSIFICATION');
    expect(renderedJson).toContain('feat');
    expect(renderedJson).toContain('fix');
    expect(renderedJson).toContain('refactor');
    expect(renderedJson).toContain('New features added to the application');
    expect(renderedJson).toContain('Bug fixes and issue resolution');
    expect(renderedJson).toContain('Code restructuring without functionality changes');
  });

  test('renders the timeline highlights section correctly', () => {
    const rendered = mockRenderer.render(
      <SummaryDetails aiSummary={mockAISummary} />
    );
    
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('TEMPORAL ANALYSIS');
    expect(renderedJson).toContain('Implemented core authentication logic');
    expect(renderedJson).toContain('Completed performance optimization phase');
    expect(renderedJson).toContain('Deployed major feature update');
  });

  test('renders the overall summary section correctly', () => {
    const rendered = mockRenderer.render(
      <SummaryDetails aiSummary={mockAISummary} />
    );
    
    const renderedJson = JSON.stringify(rendered);
    expect(renderedJson).toContain('COMPREHENSIVE ANALYSIS');
    expect(renderedJson).toContain('AI_ANALYSIS --detailed-output');
    expect(renderedJson).toContain('This period was characterized by significant improvements');
  });

  test('applies additional className when provided', () => {
    const rendered = mockRenderer.render(
      <SummaryDetails aiSummary={mockAISummary} className="additional-class" />
    );
    
    expect(rendered.props.className).toContain('additional-class');
  });

  test('renders with empty arrays in the data', () => {
    const emptySummary: AISummary = {
      keyThemes: [],
      technicalAreas: [],
      accomplishments: [],
      commitsByType: [],
      timelineHighlights: [],
      overallSummary: 'No significant activity in this period.'
    };

    const rendered = mockRenderer.render(
      <SummaryDetails aiSummary={emptySummary} />
    );
    
    const renderedJson = JSON.stringify(rendered);
    
    // All sections should still render their titles
    expect(renderedJson).toContain('IDENTIFIED PATTERNS');
    expect(renderedJson).toContain('TECHNICAL FOCUS AREAS');
    expect(renderedJson).toContain('KEY ACHIEVEMENTS');
    expect(renderedJson).toContain('COMMIT CLASSIFICATION');
    expect(renderedJson).toContain('TEMPORAL ANALYSIS');
    expect(renderedJson).toContain('COMPREHENSIVE ANALYSIS');
    
    // The overall summary should still be displayed
    expect(renderedJson).toContain('No significant activity in this period.');
  });
});