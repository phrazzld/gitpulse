import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
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
    render(
      <RepositorySection
        repositories={sampleRepositories}
        loading={false}
        activeFilters={sampleFilters}
      />
    );
    
    // Check if repository count is displayed correctly
    expect(screen.getByText('DETECTED: 3')).toBeInTheDocument();
    
    // Check if organization count is correct
    expect(screen.getByText('ORGS')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 unique organizations
    
    // Check if private repo count is correct
    expect(screen.getByText('PRIVATE')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 private repository
  });
  
  // Test loading state
  test('renders loading state correctly', () => {
    render(
      <RepositorySection
        repositories={[]}
        loading={true}
        activeFilters={{ contributors: [], organizations: [], repositories: [] }}
      />
    );
    
    // Check if loading indicator is displayed
    expect(screen.getByText('SCANNING REPOSITORIES...')).toBeInTheDocument();
  });
  
  // Test empty state
  test('renders empty state correctly', () => {
    render(
      <RepositorySection
        repositories={[]}
        loading={false}
        activeFilters={{ contributors: [], organizations: [], repositories: [] }}
      />
    );
    
    // Check if empty message is displayed
    expect(screen.getByText('NO REPOSITORIES DETECTED')).toBeInTheDocument();
  });
  
  // Test with filters
  test('renders active filters correctly', () => {
    render(
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
    
    // Check if filter information is displayed
    expect(screen.getByText(/Contributors:/)).toBeInTheDocument();
    expect(screen.getByText(/Only Me/)).toBeInTheDocument();
    expect(screen.getByText(/Orgs:/)).toBeInTheDocument();
    expect(screen.getByText(/org1, org2/)).toBeInTheDocument();
  });
  
  // Test without form elements
  test('renders without form elements when isWithinForm is false', () => {
    render(
      <RepositorySection
        repositories={sampleRepositories}
        loading={false}
        activeFilters={sampleFilters}
        isWithinForm={false}
      />
    );
    
    // Check that the submit button is not rendered
    expect(screen.queryByText('ANALYZE COMMITS')).not.toBeInTheDocument();
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
    
    // Find and click the button
    const button = screen.getByText('ANALYZE COMMITS');
    fireEvent.click(button);
    
    // Check if onSubmit was called
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });
  
  // Test toggle repository list
  test('toggles repository list when toggle button is clicked', () => {
    render(
      <RepositorySection
        repositories={sampleRepositories}
        loading={false}
        activeFilters={sampleFilters}
        initialShowRepoList={true}
      />
    );
    
    // Initially the repo list should be visible
    expect(screen.getByText('org1')).toBeInTheDocument();
    expect(screen.getByText('org2')).toBeInTheDocument();
    
    // Find and click the toggle button
    const toggleButton = screen.getByText('HIDE LIST');
    fireEvent.click(toggleButton);
    
    // Repository list should no longer be visible
    expect(screen.queryByText('org1')).not.toBeInTheDocument();
    expect(screen.queryByText('org2')).not.toBeInTheDocument();
    
    // Button text should be updated
    expect(screen.getByText('SHOW LIST')).toBeInTheDocument();
  });

  // Test showing repository details
  test('displays repository details correctly', () => {
    render(
      <RepositorySection
        repositories={sampleRepositories}
        loading={false}
        activeFilters={sampleFilters}
      />
    );
    
    // Check if repository names are displayed
    expect(screen.getByText('repo1')).toBeInTheDocument();
    expect(screen.getByText('repo2')).toBeInTheDocument();
    expect(screen.getByText('repo3')).toBeInTheDocument();
    
    // Check if repository languages are displayed
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    
    // Check if private label is displayed for the private repository
    const privateLabels = screen.getAllByText('PRIVATE');
    expect(privateLabels.length).toBe(2); // One in the stats and one next to repo2
  });
});