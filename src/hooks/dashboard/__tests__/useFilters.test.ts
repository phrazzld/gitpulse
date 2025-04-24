/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useFilters } from '../useFilters';
import { ActivityMode, FilterState } from '@/types/dashboard';

// Mock the logger to avoid actual logging during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('useFilters', () => {
  // Test default initialization
  it('should initialize with default values when no props provided', () => {
    const { result } = renderHook(() => useFilters());
    
    expect(result.current.filters).toEqual({
      contributors: [],
      organizations: [],
      repositories: []
    });
    
    expect(result.current.activityMode).toBe('my-activity');
  });
  
  // Test custom initialization
  it('should initialize with provided values', () => {
    const initialFilters: Partial<FilterState> = {
      contributors: ['user1', 'user2'],
      organizations: ['org1'],
      repositories: ['repo1', 'repo2']
    };
    
    const initialMode: ActivityMode = 'team-activity';
    
    const { result } = renderHook(() => useFilters({
      initialFilters,
      initialMode
    }));
    
    expect(result.current.filters).toEqual({
      contributors: ['user1', 'user2'],
      organizations: ['org1'],
      repositories: ['repo1', 'repo2']
    });
    
    expect(result.current.activityMode).toBe('team-activity');
  });
  
  // Test setContributors function
  it('should update contributors correctly', () => {
    const { result } = renderHook(() => useFilters());
    
    act(() => {
      result.current.setContributors(['user1', 'user2']);
    });
    
    expect(result.current.filters.contributors).toEqual(['user1', 'user2']);
    expect(result.current.filters.organizations).toEqual([]);
    expect(result.current.filters.repositories).toEqual([]);
  });
  
  // Test setOrganizations function
  it('should update organizations correctly', () => {
    const { result } = renderHook(() => useFilters());
    
    act(() => {
      result.current.setOrganizations(['org1', 'org2']);
    });
    
    expect(result.current.filters.contributors).toEqual([]);
    expect(result.current.filters.organizations).toEqual(['org1', 'org2']);
    expect(result.current.filters.repositories).toEqual([]);
  });
  
  // Test setRepositories function
  it('should update repositories correctly', () => {
    const { result } = renderHook(() => useFilters());
    
    act(() => {
      result.current.setRepositories(['repo1', 'repo2']);
    });
    
    expect(result.current.filters.contributors).toEqual([]);
    expect(result.current.filters.organizations).toEqual([]);
    expect(result.current.filters.repositories).toEqual(['repo1', 'repo2']);
  });
  
  // Test setAllFilters function
  it('should update all filters correctly', () => {
    const { result } = renderHook(() => useFilters());
    
    const newFilters: FilterState = {
      contributors: ['user1', 'user2'],
      organizations: ['org1', 'org2'],
      repositories: ['repo1', 'repo2']
    };
    
    act(() => {
      result.current.setAllFilters(newFilters);
    });
    
    expect(result.current.filters).toEqual(newFilters);
  });
  
  // Test setActivityMode function
  it('should update activity mode and adjust filters for my-activity mode', () => {
    const initialFilters: Partial<FilterState> = {
      contributors: ['user1', 'user2'],
      organizations: ['org1', 'org2'],
      repositories: ['repo1']
    };
    
    const { result } = renderHook(() => useFilters({ initialFilters }));
    
    act(() => {
      result.current.setActivityMode('my-activity');
    });
    
    expect(result.current.activityMode).toBe('my-activity');
    expect(result.current.filters.contributors).toEqual(['me']);
    expect(result.current.filters.organizations).toEqual([]);
    expect(result.current.filters.repositories).toEqual(['repo1']);
  });
  
  // Test setActivityMode function for work activity
  it('should update activity mode and adjust filters for my-work-activity mode', () => {
    const initialFilters: Partial<FilterState> = {
      contributors: ['user1', 'user2'],
      organizations: ['org1', 'org2'],
      repositories: ['repo1']
    };
    
    const { result } = renderHook(() => useFilters({ initialFilters }));
    
    act(() => {
      result.current.setActivityMode('my-work-activity');
    });
    
    expect(result.current.activityMode).toBe('my-work-activity');
    expect(result.current.filters.contributors).toEqual(['me']);
    expect(result.current.filters.organizations).toEqual(['org1', 'org2']);
    expect(result.current.filters.repositories).toEqual(['repo1']);
  });
  
  // Test setActivityMode function for team activity
  it('should update activity mode and adjust filters for team-activity mode', () => {
    const initialFilters: Partial<FilterState> = {
      contributors: ['user1', 'user2'],
      organizations: ['org1', 'org2'],
      repositories: ['repo1']
    };
    
    const { result } = renderHook(() => useFilters({ initialFilters }));
    
    act(() => {
      result.current.setActivityMode('team-activity');
    });
    
    expect(result.current.activityMode).toBe('team-activity');
    expect(result.current.filters.contributors).toEqual([]);
    expect(result.current.filters.organizations).toEqual(['org1', 'org2']);
    expect(result.current.filters.repositories).toEqual(['repo1']);
  });
  
  // Test resetFilters function
  it('should reset filters to initial state', () => {
    const initialFilters: Partial<FilterState> = {
      contributors: ['user1'],
      organizations: ['org1'],
      repositories: ['repo1']
    };
    
    const { result } = renderHook(() => useFilters({ initialFilters }));
    
    // Change filters
    act(() => {
      result.current.setContributors(['user2', 'user3']);
      result.current.setOrganizations(['org2']);
      result.current.setRepositories(['repo2', 'repo3']);
      result.current.setActivityMode('team-activity');
    });
    
    // Verify changed state
    expect(result.current.filters).not.toEqual({
      contributors: ['user1'],
      organizations: ['org1'],
      repositories: ['repo1']
    });
    expect(result.current.activityMode).toBe('team-activity');
    
    // Reset filters
    act(() => {
      result.current.resetFilters();
    });
    
    // Verify reset to initial state
    expect(result.current.filters).toEqual({
      contributors: ['user1'],
      organizations: ['org1'],
      repositories: ['repo1']
    });
    expect(result.current.activityMode).toBe('my-activity');
  });
  
  // Test immutability of returned state
  it('should maintain immutability when updating filters', () => {
    const { result } = renderHook(() => useFilters());
    
    const originalFilters = result.current.filters;
    
    act(() => {
      result.current.setContributors(['user1']);
    });
    
    // Original object should not be modified
    expect(originalFilters).not.toBe(result.current.filters);
    expect(originalFilters.contributors).toEqual([]);
    
    const filtersBeforeOrgsUpdate = result.current.filters;
    
    act(() => {
      result.current.setOrganizations(['org1']);
    });
    
    // Previous filters object should not be modified
    expect(filtersBeforeOrgsUpdate).not.toBe(result.current.filters);
    expect(filtersBeforeOrgsUpdate.organizations).toEqual([]);
  });
});