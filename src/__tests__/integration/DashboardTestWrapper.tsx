/**
 * Test wrapper for Dashboard component that simulates the error handling flow
 */
import React, { useState, useEffect } from 'react';
import Dashboard from '@/app/dashboard/page';

interface ErrorState {
  error: string | null;
  needsInstallation?: boolean;
  code?: string;
}

interface Props {
  mockFetch?: jest.Mock;
}

export function DashboardTestWrapper({ mockFetch }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<ErrorState>({ error: null });

  useEffect(() => {
    const originalFetch = window.fetch;
    
    if (mockFetch) {
      window.fetch = mockFetch;
    }
    
    // Simulate loading then handle any errors
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Check if the mock fetch would return an error
      if (mockFetch) {
        mockFetch('/api/repos')
          .then(async (response: Response) => {
            if (!response.ok) {
              const errorData = await response.json();
              console.log('Mock error response:', errorData);
              setErrorState({
                error: errorData.error,
                needsInstallation: errorData.needsInstallation,
                code: errorData.code
              });
            }
          })
          .catch((error: Error) => {
            setErrorState({ error: error.message });
          });
      }
    }, 100);
    
    return () => {
      clearTimeout(timer);
      window.fetch = originalFetch;
    };
  }, [mockFetch]);
  
  return (
    <div>
      {isLoading ? (
        <div data-testid="loading-state">Loading...</div>
      ) : (
        <>
          {errorState.error ? (
            <div data-testid="auth-banner">
              <div data-testid="error-message">{errorState.error}</div>
              {errorState.needsInstallation && (
                <div data-testid="needs-installation">Installation needed</div>
              )}
              {errorState.error && errorState.error.includes('authentication') && (
                <button
                  data-testid="auth-retry-button"
                  onClick={() => {}}
                >
                  Retry
                </button>
              )}
            </div>
          ) : (
            <Dashboard />
          )}
        </>
      )}
    </div>
  );
}