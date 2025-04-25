import React, { useState } from 'react'
import { Repository, FilterState } from '@/types/dashboard'

export interface RepositorySectionProps {
  /**
   * List of repositories to display
   */
  repositories: readonly Repository[]

  /**
   * Whether repositories are being loaded
   */
  loading: boolean

  /**
   * Active filters to display
   */
  activeFilters: FilterState

  /**
   * Initial visibility state of the repository list
   */
  initialShowRepoList?: boolean

  /**
   * Whether the component is within a form element
   * Controls whether the section has a submit button
   */
  isWithinForm?: boolean

  /**
   * Optional callback for submit action
   * Only used when isWithinForm is true
   */
  onSubmit?: () => void
}

/**
 * Repository Section component displaying repository information and list
 */
export default function RepositorySection({
  repositories,
  loading,
  activeFilters,
  initialShowRepoList = true,
  isWithinForm = true,
  onSubmit,
}: RepositorySectionProps) {
  const [showRepoList, setShowRepoList] = useState(initialShowRepoList)

  /**
   * Group repositories by organization
   */
  const groupRepositoriesByOrg = (): [string, Repository[]][] => {
    const reposByOrg: Record<string, Repository[]> = {}

    repositories.forEach(repo => {
      const orgName = repo.full_name.split('/')[0]
      if (!reposByOrg[orgName]) {
        reposByOrg[orgName] = []
      }
      reposByOrg[orgName].push(repo)
    })

    // Sort organizations by repo count (descending)
    return Object.entries(reposByOrg).sort(
      ([, reposA], [, reposB]) => reposB.length - reposA.length
    )
  }

  const renderRepositorySection = () => (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <label className="text-sm" style={{ color: 'var(--electric-blue)' }}>
            TARGET REPOSITORIES
          </label>
          <button
            type="button"
            onClick={() => setShowRepoList(!showRepoList)}
            className="ml-2 text-xs px-2 py-0.5 rounded transition-all duration-200"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: 'var(--electric-blue)',
              border: '1px solid var(--electric-blue)',
            }}
          >
            {showRepoList ? 'HIDE' : 'SHOW'} LIST
          </button>
        </div>
        <div
          className="text-xs px-2 py-1 rounded flex items-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--neon-green)',
            color: 'var(--neon-green)',
          }}
        >
          DETECTED: {repositories.length}
        </div>
      </div>

      {/* Repository info with cyber styling */}
      <div
        className="border rounded-md p-3"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderColor: 'var(--electric-blue)',
          boxShadow: 'inset 0 0 10px rgba(59, 142, 234, 0.1)',
        }}
      >
        {loading && repositories.length === 0 ? (
          <div
            className="flex items-center justify-center p-3"
            style={{ color: 'var(--foreground)' }}
          >
            <span
              className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2"
              style={{ borderColor: 'var(--neon-green)', borderTopColor: 'transparent' }}
            ></span>
            <span>SCANNING REPOSITORIES...</span>
          </div>
        ) : (
          <div>
            <div
              className="p-3 mb-3 border-b"
              style={{ color: 'var(--foreground)', borderColor: 'rgba(59, 142, 234, 0.2)' }}
            >
              <div className="flex items-center justify-center mb-2">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: 'var(--neon-green)' }}
                ></span>
                <span>ANALYZING ALL ACCESSIBLE REPOSITORIES</span>
              </div>

              {/* Display filter information if applied */}
              {(activeFilters.contributors.length > 0 ||
                activeFilters.organizations.length > 0 ||
                activeFilters.repositories.length > 0) && (
                <div
                  className="mt-2 p-2 border rounded"
                  style={{
                    borderColor: 'rgba(0, 255, 135, 0.2)',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div className="text-xs" style={{ color: 'var(--neon-green)' }}>
                    ACTIVE FILTERS
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {activeFilters.contributors.length > 0 && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: 'rgba(0, 255, 135, 0.1)',
                          color: 'var(--foreground)',
                        }}
                      >
                        Contributors:{' '}
                        {activeFilters.contributors.includes('me')
                          ? 'Only Me'
                          : activeFilters.contributors.join(', ')}
                      </span>
                    )}
                    {activeFilters.organizations.length > 0 && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: 'rgba(59, 142, 234, 0.1)',
                          color: 'var(--foreground)',
                        }}
                      >
                        Orgs: {activeFilters.organizations.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Repository stats summary */}
              {repositories.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                  <div
                    className="border rounded px-2 py-1 flex flex-col items-center justify-center"
                    style={{ borderColor: 'rgba(59, 142, 234, 0.3)' }}
                  >
                    <div className="font-bold" style={{ color: 'var(--electric-blue)' }}>
                      REPOS
                    </div>
                    <div>{repositories.length}</div>
                  </div>
                  <div
                    className="border rounded px-2 py-1 flex flex-col items-center justify-center"
                    style={{ borderColor: 'rgba(59, 142, 234, 0.3)' }}
                  >
                    <div className="font-bold" style={{ color: 'var(--electric-blue)' }}>
                      ORGS
                    </div>
                    <div>
                      {new Set(repositories.map(repo => repo.full_name.split('/')[0])).size}
                    </div>
                  </div>
                  <div
                    className="border rounded px-2 py-1 flex flex-col items-center justify-center"
                    style={{ borderColor: 'rgba(59, 142, 234, 0.3)' }}
                  >
                    <div className="font-bold" style={{ color: 'var(--electric-blue)' }}>
                      PRIVATE
                    </div>
                    <div>{repositories.filter(repo => repo.private).length}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Repository list with organization grouping */}
            {showRepoList && (
              <div className="max-h-60 overflow-y-auto" style={{ color: 'var(--foreground)' }}>
                {repositories.length > 0 ? (
                  groupRepositoriesByOrg().map(([org, repos]) => (
                    <div key={org} className="mb-3">
                      <div
                        className="flex items-center px-2 py-1 mb-1"
                        style={{
                          backgroundColor: 'rgba(59, 142, 234, 0.1)',
                          color: 'var(--electric-blue)',
                        }}
                      >
                        <span className="font-bold">{org}</span>
                        <span
                          className="ml-2 text-xs px-1 rounded"
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          }}
                        >
                          {repos.length}
                        </span>
                      </div>

                      <ul className="pl-3">
                        {repos.map(repo => (
                          <li
                            key={repo.id}
                            className="text-xs py-1 flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <span
                                className="inline-block w-2 h-2 mr-2"
                                style={{
                                  backgroundColor: repo.private
                                    ? 'var(--crimson-red)'
                                    : 'var(--neon-green)',
                                }}
                              ></span>
                              <span>{repo.name}</span>
                            </div>
                            <div className="flex items-center">
                              {repo.private && (
                                <span
                                  className="ml-2 text-xs px-1 rounded"
                                  style={{
                                    color: 'var(--crimson-red)',
                                    backgroundColor: 'rgba(255, 59, 48, 0.1)',
                                  }}
                                >
                                  PRIVATE
                                </span>
                              )}
                              {repo.language && (
                                <span
                                  className="ml-2 text-xs px-1 rounded"
                                  style={{
                                    color: 'var(--luminous-yellow)',
                                    backgroundColor: 'rgba(255, 200, 87, 0.1)',
                                  }}
                                >
                                  {repo.language}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : repositories.length === 0 && !loading ? (
                  <div className="p-3 text-center" style={{ color: 'var(--crimson-red)' }}>
                    NO REPOSITORIES DETECTED
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {isWithinForm && (
        <div className="flex justify-end pt-4">
          <button
            type={onSubmit ? 'button' : 'submit'}
            onClick={onSubmit}
            disabled={loading}
            title="Analyze your GitHub commits and generate activity summary with AI insights"
            className="px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center"
            style={{
              backgroundColor: loading ? 'rgba(0, 0, 0, 0.3)' : 'var(--dark-slate)',
              color: 'var(--neon-green)',
              border: '2px solid var(--neon-green)',
              boxShadow: loading ? 'none' : '0 0 10px rgba(0, 255, 135, 0.2)',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'var(--neon-green)'
                e.currentTarget.style.color = 'var(--dark-slate)'
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 135, 0.4)'
              }
            }}
            onMouseOut={e => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'var(--dark-slate)'
                e.currentTarget.style.color = 'var(--neon-green)'
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 135, 0.2)'
              }
            }}
          >
            {loading ? (
              <>
                <span
                  className="mr-2 inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--neon-green)', borderTopColor: 'transparent' }}
                ></span>
                ANALYZING DATA...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z"
                    clipRule="evenodd"
                  />
                </svg>
                ANALYZE COMMITS
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )

  return renderRepositorySection()
}
