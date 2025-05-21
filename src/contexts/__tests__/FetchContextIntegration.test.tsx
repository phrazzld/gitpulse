/**
 * Integration tests for FetchContext
 * 
 * This file demonstrates how to use the FetchContext in a real component
 * and how to test it with a custom fetch implementation.
 */

import React, { useState, useEffect } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { FetchProvider, useFetch } from '../FetchContext';

// Mock response data
const mockUserData = { id: 1, name: 'John Doe', email: 'john@example.com' };

// A simple component that uses the useFetch hook to load data
function UserProfile({ userId }: { userId: number }) {
  const fetch = useFetch();
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        setLoading(true);
        setError(null);

        // Use the fetch function from context
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load user: ${response.status}`);
        }

        const userData = await response.json();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setUser(userData);
          setLoading(false);
        }
      } catch (err) {
        // Only update state if component is still mounted
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
          setLoading(false);
        }
      }
    }

    loadUser();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [fetch, userId]);

  if (loading) return <div data-testid="loading">Loading user...</div>;
  if (error) return <div data-testid="error">{error}</div>;
  if (!user) return <div data-testid="no-data">No user data</div>;

  return (
    <div data-testid="user-profile">
      <h2 data-testid="user-name">{user.name}</h2>
      <p data-testid="user-email">{user.email}</p>
    </div>
  );
}

describe('FetchContext Integration', () => {
  it('successfully loads and displays user data using injected fetch', async () => {
    // Create a mock fetch implementation
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockUserData),
    }) as unknown as typeof fetch;

    // Render the component with the mock fetch implementation
    render(
      <FetchProvider fetchImplementation={mockFetch}>
        <UserProfile userId={1} />
      </FetchProvider>
    );

    // Initially, the loading state should be displayed
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByTestId('user-profile')).toBeInTheDocument();
    });

    // Verify the mock fetch was called with the correct URL
    expect(mockFetch).toHaveBeenCalledWith('/api/users/1');

    // Verify the user data is displayed correctly
    expect(screen.getByTestId('user-name')).toHaveTextContent(mockUserData.name);
    expect(screen.getByTestId('user-email')).toHaveTextContent(mockUserData.email);
  });

  it('handles API errors appropriately', async () => {
    // Create a mock fetch implementation that returns an error
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as unknown as typeof fetch;

    // Render the component with the mock fetch implementation
    render(
      <FetchProvider fetchImplementation={mockFetch}>
        <UserProfile userId={999} />
      </FetchProvider>
    );

    // Initially, the loading state should be displayed
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    // Verify the error message is displayed
    expect(screen.getByTestId('error')).toHaveTextContent('Failed to load user: 404');

    // Verify the mock fetch was called with the correct URL
    expect(mockFetch).toHaveBeenCalledWith('/api/users/999');
  });

  it('handles network errors appropriately', async () => {
    // Create a mock fetch implementation that throws a network error
    const mockFetch = jest.fn().mockImplementation(() => {
      throw new Error('Network error');
    }) as unknown as typeof fetch;

    // Render the component with the mock fetch implementation
    render(
      <FetchProvider fetchImplementation={mockFetch}>
        <UserProfile userId={1} />
      </FetchProvider>
    );

    // The error happens so quickly that the loading state might not be captured
    // So we skip checking for it

    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    // Verify the error message is displayed
    expect(screen.getByTestId('error')).toHaveTextContent('Network error');

    // Verify the mock fetch was called with the correct URL
    expect(mockFetch).toHaveBeenCalledWith('/api/users/1');
  });
});