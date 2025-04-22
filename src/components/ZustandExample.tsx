/**
 * Zustand Example Component
 *
 * This is a simple example component demonstrating how to use Zustand for state management.
 */

"use client";

import React, { useCallback } from "react";
import {
  useRepositories,
  useDashboardState,
  useStore,
  useUIState,
  StateSlice,
  useSafeSelector,
} from "@/state";
import { Repository } from "@/types/github";

/**
 * Example component using Zustand state management
 */
export default function ZustandExample() {
  // Access specific parts of dashboard state
  const { repositories, loading, error } = useRepositories();

  // Access UI state using explicit typing for expandedPanels
  const { togglePanel } = useUIState();
  const expandedPanels = useSafeSelector<string[], string[]>(
    (state) => state[StateSlice.Dashboard]?.expandedPanels,
    [],
  );

  // Get raw actions from store
  const handleRepositoryFetchSuccess = useStore(
    (state) => state[StateSlice.Dashboard].handleRepositoryFetchSuccess,
  );

  // Example action handler - would typically be connected to an API
  const handleAddRepository = useCallback(() => {
    // Create a mock repository
    const newRepo: Repository = {
      id: Math.floor(Date.now()),
      name: `Example Repository ${repositories.length + 1}`,
      full_name: `user/example-repo-${repositories.length + 1}`,
      description: "This is an example repository added via Zustand",
      url: "https://github.com/example/repository",
      html_url: "https://github.com/example/repository",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pushed_at: new Date().toISOString(),
      private: false,
      owner: {
        id: "user-1",
        login: "example-user",
        url: "https://github.com/example-user",
        html_url: "https://github.com/example-user",
        avatar_url: "https://github.com/avatar",
        type: "User",
      },
    };

    // Update state using the atomic update action
    handleRepositoryFetchSuccess([...repositories, newRepo]);
  }, [repositories, handleRepositoryFetchSuccess]);

  // Toggle panel expanded state
  const handleTogglePanel = useCallback(() => {
    togglePanel("example-panel");
  }, [togglePanel]);

  // Show loading state
  if (loading) {
    return (
      <div className="p-4 border rounded shadow-sm">
        Loading repositories...
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 border rounded shadow-sm text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-4 border rounded shadow-sm">
      <h2 className="text-xl font-bold mb-4">Zustand State Example</h2>

      <div className="mb-4">
        <button
          onClick={handleAddRepository}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
        >
          Add Example Repository
        </button>

        <button
          onClick={handleTogglePanel}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          {expandedPanels.includes("example-panel")
            ? "Collapse Panel"
            : "Expand Panel"}
        </button>
      </div>

      {expandedPanels.includes("example-panel") && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <p>This panel's expanded state is tracked in Zustand.</p>
          <p>Panel ID: example-panel</p>
          <p>All expanded panels: {expandedPanels.join(", ") || "None"}</p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">
          Repositories ({repositories.length})
        </h3>

        {repositories.length === 0 ? (
          <p className="text-gray-500">
            No repositories found. Add one to see it here.
          </p>
        ) : (
          <ul className="divide-y">
            {repositories.map((repo) => (
              <li key={repo.id} className="py-2">
                <div className="font-medium">{repo.name}</div>
                <div className="text-sm text-gray-500">
                  {repo.description || "No description"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
