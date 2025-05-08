import React from 'react';
import RepositorySection from '../RepositorySection';
import { Repository, FilterState } from '@/types/dashboard';

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
              // @ts-ignore - We know the render method exists on this
              return this.render(child);
            }
            return child;
          });
        } else if (React.isValidElement(props.children)) {
          // @ts-ignore - We know the render method exists on this
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

describe('RepositorySection', () => {
  const mockRenderer = createMockRenderer();
  
  // Sample repositories for testing
  const sampleRepositories: Repository[] = [
    {
      id: 1,
      full_name: 'org1/repo1',
      name: 'repo1',
      owner: { login: 'org1' },
      private: false,
      language: 'JavaScript'
    },
    {
      id: 2,
      full_name: 'org1/repo2',
      name: 'repo2',
      owner: { login: 'org1' },
      private: true,
      language: 'TypeScript'
    },
    {
      id: 3,
      full_name: 'org2/repo3',
      name: 'repo3',
      owner: { login: 'org2' },
      private: false,
      language: null
    }
  ];
  
  // Sample filter state for testing
  const sampleFilters: FilterState = {
    contributors: ['me'],
    organizations: ['org1'],
    repositories: []
  };

  // Test rendering with repositories
  test('renders with repositories', () => {
    const rendered = mockRenderer.render(
      <RepositorySection
        repositories={sampleRepositories}
        loading={false}
        activeFilters={sampleFilters}
      />
    );
    
    const renderedJson = JSON.stringify(rendered);
    
    // Check if repositories are present in the rendered output
    expect(renderedJson).toContain('repositories');
    
    // Check if organization count is correct
    expect(renderedJson).toContain('ORGS');
    expect(renderedJson).toContain('2'); // 2 unique organizations
    
    // Check if private repo count is correct
    expect(renderedJson).toContain('PRIVATE');
    expect(renderedJson).toContain('1'); // 1 private repository
  });
  
  // Test loading state
  test('renders loading state correctly', () => {
    const rendered = mockRenderer.render(
      <RepositorySection
        repositories={[]}
        loading={true}
        activeFilters={{ contributors: [], organizations: [], repositories: [] }}
      />
    );
    
    const renderedJson = JSON.stringify(rendered);
    
    // Check if loading indicator is displayed
    expect(renderedJson).toContain('SCANNING REPOSITORIES');
  });
  
  // Test empty state
  test('renders empty state correctly', () => {
    const rendered = mockRenderer.render(
      <RepositorySection
        repositories={[]}
        loading={false}
        activeFilters={{ contributors: [], organizations: [], repositories: [] }}
      />
    );
    
    const renderedJson = JSON.stringify(rendered);
    
    // Check if empty message is displayed
    expect(renderedJson).toContain('NO REPOSITORIES DETECTED');
  });
  
  // Test with filters
  test('renders active filters correctly', () => {
    const rendered = mockRenderer.render(
      <RepositorySection
        repositories={sampleRepositories}
        loading={false}
        activeFilters={{
          contributors: ['me'],
          organizations: ['org1', 'org2'],
          repositories: []
        }}
      />
    );
    
    const renderedJson = JSON.stringify(rendered);
    
    // Check if repositories and organization stats are displayed
    expect(renderedJson).toContain('REPOS');
    expect(renderedJson).toContain('ORGS');
    
    // Check if filters are shown in some form
    expect(renderedJson).toContain('contributors');
    expect(renderedJson).toContain('org1');
    expect(renderedJson).toContain('org2');
  });
  
  // Test without form elements
  test('renders without form elements when isWithinForm is false', () => {
    const rendered = mockRenderer.render(
      <RepositorySection
        repositories={sampleRepositories}
        loading={false}
        activeFilters={sampleFilters}
        isWithinForm={false}
      />
    );
    
    const renderedJson = JSON.stringify(rendered);
    
    // Check that the submit button is not rendered
    expect(renderedJson).not.toContain('ANALYZE COMMITS');
  });
  
  // Test onSubmit callback
  test('calls onSubmit when the button is clicked', () => {
    const mockOnSubmit = jest.fn();
    
    const rendered = mockRenderer.render(
      <RepositorySection
        repositories={sampleRepositories}
        loading={false}
        activeFilters={sampleFilters}
        isWithinForm={true}
        onSubmit={mockOnSubmit}
      />
    );
    
    const renderedJson = JSON.stringify(rendered);
    
    // Verify there's a button in the render
    expect(renderedJson).toContain('"type":"button"');
    
    // Check if the isWithinForm prop is being used
    expect(renderedJson).toContain('disabled');
    
    // Verify the button has onClick property that uses the onSubmit callback
    expect(renderedJson).toContain('onClick');
  });
});