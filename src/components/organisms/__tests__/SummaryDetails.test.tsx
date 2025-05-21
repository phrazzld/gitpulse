/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import SummaryDetails from '../SummaryDetails';
import { AISummary } from '@/types/dashboard';

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
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the key themes section with correct title', () => {
    render(<SummaryDetails aiSummary={mockAISummary} />);
    
    // Find the section by heading
    const headingElement = screen.getByText('IDENTIFIED PATTERNS');
    const sectionElement = headingElement.closest('div')?.parentElement;
    
    expect(headingElement).toBeInTheDocument();
    
    // Test that each theme is in the section
    mockAISummary.keyThemes.forEach(theme => {
      expect(screen.getByText(theme)).toBeInTheDocument();
    });
  });

  test('renders the technical areas section correctly', () => {
    render(<SummaryDetails aiSummary={mockAISummary} />);
    
    // Find the section by heading
    const headingElement = screen.getByText('TECHNICAL FOCUS AREAS');
    const sectionElement = headingElement.closest('div')?.parentElement;
    
    expect(headingElement).toBeInTheDocument();
    expect(sectionElement).not.toBeNull();
    
    // Verify section contains the technical areas
    if (sectionElement) {
      // Look for each area name within the section
      mockAISummary.technicalAreas.forEach(area => {
        expect(within(sectionElement).getByText(area.name)).toBeInTheDocument();
        // Find the area element and within it look for the count
        const areaElement = within(sectionElement).getByText(area.name).closest('div');
        if (areaElement) {
          expect(within(areaElement).getByText(String(area.count))).toBeInTheDocument();
        }
      });
    }
  });

  test('renders the accomplishments section correctly', () => {
    render(<SummaryDetails aiSummary={mockAISummary} />);
    
    // Find the section by heading
    const headingElement = screen.getByText('KEY ACHIEVEMENTS');
    const sectionElement = headingElement.closest('div')?.parentElement;
    
    expect(headingElement).toBeInTheDocument();
    
    // Test that each accomplishment is present
    mockAISummary.accomplishments.forEach(accomplishment => {
      expect(screen.getByText(accomplishment)).toBeInTheDocument();
    });
  });

  test('renders the commit types section correctly', () => {
    render(<SummaryDetails aiSummary={mockAISummary} />);
    
    // Find the section by heading
    const headingElement = screen.getByText('COMMIT CLASSIFICATION');
    const sectionElement = headingElement.closest('div')?.parentElement;
    
    expect(headingElement).toBeInTheDocument();
    expect(sectionElement).not.toBeNull();
    
    if (sectionElement) {
      // For each commit type, ensure it and its details are rendered
      mockAISummary.commitsByType.forEach(commitType => {
        // Find the commit type element
        const typeElement = within(sectionElement).getByText(commitType.type);
        expect(typeElement).toBeInTheDocument();
        
        // Find the parent element containing both type and count
        const typeContainer = typeElement.closest('div')?.parentElement;
        if (typeContainer) {
          // Check for description within the container
          expect(within(typeContainer).getByText(commitType.description)).toBeInTheDocument();
          
          // Check for count, which should be in the same div as the type
          const typeRow = typeElement.closest('div');
          if (typeRow) {
            expect(within(typeRow).getByText(String(commitType.count))).toBeInTheDocument();
          }
        }
      });
    }
  });

  test('renders the timeline highlights section correctly', () => {
    render(<SummaryDetails aiSummary={mockAISummary} />);
    
    // Find the section by heading
    const headingElement = screen.getByText('TEMPORAL ANALYSIS');
    const sectionElement = headingElement.closest('div')?.parentElement;
    
    expect(headingElement).toBeInTheDocument();
    expect(sectionElement).not.toBeNull();
    
    if (sectionElement) {
      // Test that each timeline highlight description is present
      mockAISummary.timelineHighlights.forEach(highlight => {
        expect(within(sectionElement).getByText(highlight.description)).toBeInTheDocument();
      });
      
      // Verify dates are formatted - we're not checking exact format since it can vary by locale
      const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(dateElements.length).toBe(mockAISummary.timelineHighlights.length);
    }
  });

  test('renders the overall summary section correctly', () => {
    render(<SummaryDetails aiSummary={mockAISummary} />);
    
    // Find the section by heading
    const headingElement = screen.getByText('COMPREHENSIVE ANALYSIS');
    const sectionElement = headingElement.closest('div')?.parentElement;
    
    expect(headingElement).toBeInTheDocument();
    expect(sectionElement).not.toBeNull();
    
    if (sectionElement) {
      // Terminal command text should be present
      expect(within(sectionElement).getByText('$ AI_ANALYSIS --detailed-output')).toBeInTheDocument();
      
      // Overall summary text should be present (partial match to handle wrapping)
      const summaryContainer = within(sectionElement).getByText((content) => 
        content.includes('This period was characterized')
      );
      expect(summaryContainer).toBeInTheDocument();
    }
  });

  test('applies additional className when provided', () => {
    const { container } = render(
      <SummaryDetails aiSummary={mockAISummary} className="additional-class" />
    );
    
    // Check that the root div has the additional class
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass('additional-class');
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

    render(<SummaryDetails aiSummary={emptySummary} />);
    
    // All sections should still render their titles
    expect(screen.getByText('IDENTIFIED PATTERNS')).toBeInTheDocument();
    expect(screen.getByText('TECHNICAL FOCUS AREAS')).toBeInTheDocument();
    expect(screen.getByText('KEY ACHIEVEMENTS')).toBeInTheDocument();
    expect(screen.getByText('COMMIT CLASSIFICATION')).toBeInTheDocument();
    expect(screen.getByText('TEMPORAL ANALYSIS')).toBeInTheDocument();
    expect(screen.getByText('COMPREHENSIVE ANALYSIS')).toBeInTheDocument();
    
    // The overall summary should still be displayed
    expect(screen.getByText('No significant activity in this period.')).toBeInTheDocument();
  });
  
  test('renders all sections in the correct order', () => {
    render(<SummaryDetails aiSummary={mockAISummary} />);
    
    const sections = [
      'IDENTIFIED PATTERNS',
      'TECHNICAL FOCUS AREAS',
      'KEY ACHIEVEMENTS',
      'COMMIT CLASSIFICATION',
      'TEMPORAL ANALYSIS',
      'COMPREHENSIVE ANALYSIS'
    ];
    
    // Get all section headings
    const headings = screen.getAllByText((content, element) => {
      return element?.nodeName.toLowerCase() === 'h3' && sections.includes(content);
    });
    
    // Check that they're in the correct order
    sections.forEach((section, index) => {
      expect(headings[index]).toHaveTextContent(section);
    });
  });
});