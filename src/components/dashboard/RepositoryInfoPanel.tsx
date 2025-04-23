import React from "react";
import { Repository } from "@/types/github";
import { useFilters, useUIState } from "@/state";

interface RepositoryInfoPanelProps {
  repositories?: Repository[];
  loading?: boolean;
}

export default function RepositoryInfoPanel({
  repositories = [],
  loading = false,
}: RepositoryInfoPanelProps) {
  // Still need some state from Zustand hooks
  const { filters: activeFilters } = useFilters();
  const { showRepoList, setShowRepoList } = useUIState();

  // Add defensive check for repositories
  const safeRepositories = repositories || [];

  return (
    <div>
      <div>
        <div>
          <label>TARGET REPOSITORIES</label>
          <button onClick={() => setShowRepoList(!showRepoList)}>
            {showRepoList ? "HIDE" : "SHOW"} LIST
          </button>
        </div>
        <div>DETECTED: {safeRepositories.length}</div>
      </div>

      <div>
        {loading && safeRepositories.length === 0 ? (
          <div>
            <span></span>
            <span>SCANNING REPOSITORIES...</span>
          </div>
        ) : (
          <div>
            <div>
              <div>
                <span></span>
                <span>ANALYZING ALL ACCESSIBLE REPOSITORIES</span>
              </div>

              {/* Display filter information if applied */}
              {activeFilters.repositories.length > 0 && (
                <div>
                  <div>ACTIVE FILTERS</div>
                  <div>
                    {/* Repository filters would be displayed here if implemented */}
                    {/* Group by section removed, always using chronological view */}
                  </div>
                </div>
              )}

              {/* Repository stats summary */}
              {safeRepositories.length > 0 && (
                <div>
                  <div>
                    <div>REPOS</div>
                    <div>{safeRepositories.length}</div>
                  </div>
                  <div>
                    <div>PRIVATE</div>
                    <div>
                      {safeRepositories.filter((repo) => repo.private).length}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Repository list (alphabetically sorted) */}
            {showRepoList && (
              <div>
                {safeRepositories.length > 0 ? (
                  <div>
                    <div>
                      <span>ALL REPOSITORIES</span>
                    </div>
                    <ul>
                      {/* Sort repositories alphabetically by full name */}
                      {[...safeRepositories]
                        .sort((a, b) => a.full_name.localeCompare(b.full_name))
                        .map((repo) => (
                          <li key={repo.id}>
                            <div>
                              <span></span>
                              <span>{repo.full_name}</span>
                            </div>
                            <div>
                              {repo.private && <span>PRIVATE</span>}
                              {repo.language && <span>{repo.language}</span>}
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : safeRepositories.length === 0 && !loading ? (
                  <div>NO REPOSITORIES DETECTED</div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
