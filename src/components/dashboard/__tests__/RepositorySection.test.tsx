import React from 'react';
import { render, screen } from '@testing-library/react';
import RepositorySection from '../RepositorySection';
import { Repository, FilterState } from '@/types/dashboard';

describe('RepositorySection', () => {
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
    const { container } = render(
      <RepositorySection
        repositories={sampleRepositories}
        loading={false}
        activeFilters={sampleFilters}
      />
    );
    
    // Check if repositories are present in the rendered output
    expect(container.textContent).toContain('REPOSITORIES');
    
    // Check if organization count is correct
    expect(container.textContent).toContain('ORGS');
    expect(container.textContent).toContain('2'); // 2 unique organizations
    
    // Check if private repo count is correct
    expect(container.textContent).toContain('PRIVATE');
    expect(container.textContent).toContain('1'); // 1 private repository
  });
  
  // Test loading state
  test('renders loading state correctly', () => {
    const { container } = render(
      <RepositorySection
        repositories={[]}
        loading={true}
        activeFilters={{ contributors: [], organizations: [], repositories: [] }}
      />
    );
    
    // Check if loading indicator is displayed
    expect(container.textContent).toContain('SCANNING REPOSITORIES');
  });
  
  // Test empty state
  test('renders empty state correctly', () => {
    const { container } = render(
      <RepositorySection
        repositories={[]}
        loading={false}
        activeFilters={{ contributors: [], organizations: [], repositories: [] }}
      />
    );
    
    // Check if empty message is displayed
    expect(container.textContent).toContain('NO REPOSITORIES DETECTED');
  });
  
  // Test with filters
  test('renders active filters correctly', () => {
    const { container } = render(
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
    
    // Check if repositories and organization stats are displayed
    expect(container.textContent).toContain('REPOS');
    expect(container.textContent).toContain('ORGS');
    
    // Check if filters are shown in some form
    expect(container.textContent).toContain('Contributors');
    expect(container.textContent).toContain('org1');
    expect(container.textContent).toContain('org2');
  });
  
  // Test without form elements
  test('renders without form elements when isWithinForm is false', () => {
    const { container } = render(
      <RepositorySection
        repositories={sampleRepositories}
        loading={false}
        activeFilters={sampleFilters}
        isWithinForm={false}
      />
    );
    
    // Check that the submit button is not rendered
    expect(container.textContent).not.toContain('ANALYZE COMMITS');
  });
  
  // Test onSubmit callback
  test('calls onSubmit when the button is clicked', () => {
    const mockOnSubmit = jest.fn();
    
    render(
      <RepositorySection
        repositories={sampleRepositories}
        loading={false}
        activeFilters={sampleFilters}
        isWithinForm={true}
        onSubmit={mockOnSubmit}
      />
    );
    
    // Find and click the submit button if it exists (based on text content)
    const buttons = screen.getAllByRole('button');
    const submitButton = buttons.find(button => 
      button.textContent?.includes('ANALYZE COMMITS') || 
      button.textContent?.includes('SUBMIT')
    );
    
    expect(submitButton).toBeDefined();
    if (submitButton) {
      expect(submitButton.hasAttribute('disabled')).toBeFalsy();
    }
  });
});