import React from "react";
import { Repository } from "@/types/github";
import { Button, Card } from "@/components/library";
import { cn } from "@/components/library/utils/cn";
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
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <label className="text-sm text-electric-blue">
            TARGET REPOSITORIES
          </label>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowRepoList(!showRepoList)}
            className="ml-2 text-xs text-electric-blue border-electric-blue bg-black/30"
          >
            {showRepoList ? "HIDE" : "SHOW"} LIST
          </Button>
        </div>
        <div className="text-xs px-2 py-1 rounded flex items-center bg-black/30 border border-neon-green text-neon-green">
          DETECTED: {safeRepositories.length}
        </div>
      </div>

      {/* Repository info with cyber styling */}
      <Card
        padding="md"
        radius="md"
        shadow="sm"
        className="border-electric-blue bg-black/30"
      >
        {loading && safeRepositories.length === 0 ? (
          <div className="flex items-center justify-center p-3 text-foreground">
            <span className="inline-block w-4 h-4 border-2 border-neon-green border-t-transparent rounded-full animate-spin mr-2"></span>
            <span>SCANNING REPOSITORIES...</span>
          </div>
        ) : (
          <div>
            <div className="p-3 mb-3 border-b border-electric-blue/20 text-foreground">
              <div className="flex items-center justify-center mb-2">
                <span className="inline-block w-3 h-3 rounded-full mr-2 bg-neon-green"></span>
                <span>ANALYZING ALL ACCESSIBLE REPOSITORIES</span>
              </div>

              {/* Display filter information if applied */}
              {activeFilters.repositories.length > 0 && (
                <Card
                  padding="sm"
                  radius="md"
                  shadow="none"
                  className="mt-2 border-neon-green/20 bg-black/20"
                >
                  <div className="text-xs text-neon-green">ACTIVE FILTERS</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {/* Repository filters would be displayed here if implemented */}
                    {/* Group by section removed, always using chronological view */}
                  </div>
                </Card>
              )}

              {/* Repository stats summary */}
              {safeRepositories.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div className="border border-electric-blue/30 rounded px-2 py-1 flex flex-col items-center justify-center">
                    <div className="font-bold text-electric-blue">REPOS</div>
                    <div>{safeRepositories.length}</div>
                  </div>
                  <div className="border border-electric-blue/30 rounded px-2 py-1 flex flex-col items-center justify-center">
                    <div className="font-bold text-electric-blue">PRIVATE</div>
                    <div>
                      {safeRepositories.filter((repo) => repo.private).length}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Repository list (alphabetically sorted) */}
            {showRepoList && (
              <div className="max-h-60 overflow-y-auto text-foreground">
                {safeRepositories.length > 0 ? (
                  <div>
                    <div className="px-2 py-1 mb-2 bg-neon-green/10 text-neon-green">
                      <span className="text-xs">ALL REPOSITORIES</span>
                    </div>
                    <ul className="pl-1">
                      {/* Sort repositories alphabetically by full name */}
                      {[...safeRepositories]
                        .sort((a, b) => a.full_name.localeCompare(b.full_name))
                        .map((repo) => (
                          <li
                            key={repo.id}
                            className="text-xs py-1 flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <span
                                className={cn(
                                  "inline-block w-2 h-2 mr-2",
                                  repo.private
                                    ? "bg-crimson-red"
                                    : "bg-neon-green",
                                )}
                              ></span>
                              <span>{repo.full_name}</span>
                            </div>
                            <div className="flex items-center">
                              {repo.private && (
                                <span className="ml-2 text-xs px-1 rounded text-crimson-red bg-crimson-red/10">
                                  PRIVATE
                                </span>
                              )}
                              {repo.language && (
                                <span className="ml-2 text-xs px-1 rounded text-luminous-yellow bg-luminous-yellow/10">
                                  {repo.language}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : safeRepositories.length === 0 && !loading ? (
                  <div className="p-3 text-center text-crimson-red">
                    NO REPOSITORIES DETECTED
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
