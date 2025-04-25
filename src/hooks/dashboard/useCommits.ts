import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ActivityMode, CommitSummary, DateRange } from '@/types/dashboard'
import { createActivityFetcher } from '@/lib/activity'
import { logger } from '@/lib/logger'

const MODULE_NAME = 'hooks:useCommits'

interface UseCommitsProps {
  dateRange: DateRange
  activityMode: ActivityMode
  organizations: readonly string[]
  repositories: readonly string[]
  contributors: readonly string[]
  installationIds: readonly number[]
}

interface UseCommitsResult {
  loading: boolean
  error: string | null
  commits: any[]
  summary: CommitSummary | null
  fetchCommits: () => Promise<void>
}

/**
 * Hook for fetching and managing commits data
 *
 * @param props - Configuration options for the hook
 * @returns - State and functions for working with commits
 */
export function useCommits({
  dateRange,
  activityMode,
  organizations,
  repositories,
  contributors,
  installationIds,
}: UseCommitsProps): UseCommitsResult {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [commits, setCommits] = useState<any[]>([])
  const [summary, setSummary] = useState<CommitSummary | null>(null)

  // Function to fetch commits from the API
  const fetchCommits = useCallback(async () => {
    if (!session?.accessToken && !installationIds.length) {
      logger.warn(MODULE_NAME, 'No authentication available for fetching commits')
      setError('Authentication required. Please sign in again.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSummary(null)

      // Construct query parameters
      const params: Record<string, string> = {
        since: dateRange.since,
        until: dateRange.until,
      }

      // Add installation IDs if available
      if (installationIds.length > 0) {
        params.installation_ids = installationIds.join(',')
      }

      // Add filter parameters
      if (contributors.length > 0) {
        params.contributors = contributors.join(',')
      }

      if (organizations.length > 0) {
        params.organizations = organizations.join(',')
      }

      if (repositories.length > 0) {
        params.repositories = repositories.join(',')
      }

      // Always use chronological view
      params.groupBy = 'chronological'

      // Determine which API endpoint to use based on the current mode
      let apiEndpoint = '/api/my-activity'

      if (activityMode === 'my-work-activity') {
        apiEndpoint = '/api/my-org-activity'
      } else if (activityMode === 'team-activity') {
        apiEndpoint = '/api/team-activity'
      }

      // Fetch the data
      const response = await fetch(`/api/summary?${new URLSearchParams(params).toString()}`)

      if (!response.ok) {
        const errorData = await response.json()

        // Handle specific error types
        if (errorData.needsInstallation) {
          throw new Error(
            'GitHub App installation required. Please install the GitHub App to access all your repositories, including private ones.'
          )
        }

        if (
          response.status === 401 ||
          response.status === 403 ||
          errorData.code === 'GITHUB_AUTH_ERROR' ||
          errorData.code === 'GITHUB_APP_CONFIG_ERROR'
        ) {
          throw new Error(
            'GitHub authentication issue detected. Your token may be invalid, expired, or missing required permissions. Please sign out and sign in again to grant all necessary permissions.'
          )
        }

        throw new Error(errorData.error || 'Failed to generate summary')
      }

      const data = await response.json()

      // Update state with fetched data
      setCommits(data.commits || [])
      setSummary(data)

      logger.info(MODULE_NAME, 'Successfully fetched commits', {
        count: data.commits?.length || 0,
        mode: activityMode,
      })
    } catch (error: any) {
      logger.error(MODULE_NAME, 'Error fetching commits', {
        error: error.message,
        mode: activityMode,
        dateRange,
      })

      setError(error.message || 'Failed to fetch commits. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [
    session?.accessToken,
    dateRange,
    activityMode,
    organizations,
    repositories,
    contributors,
    installationIds,
  ])

  // Create the activity fetcher for progressive loading
  const getActivityFetcher = useCallback(
    (cursor: string | null, limit: number) => {
      // Build appropriate parameters based on current mode
      const params: Record<string, string> = {
        since: dateRange.since,
        until: dateRange.until,
      }

      // Add organization filter if applicable
      if (organizations.length > 0) {
        params.organizations = organizations.join(',')
      }

      // If installation IDs available, include them
      if (installationIds.length > 0) {
        params.installation_ids = installationIds.join(',')
      }

      // Determine which API endpoint to use based on the current mode
      let apiEndpoint = '/api/my-activity'

      if (activityMode === 'my-work-activity') {
        apiEndpoint = '/api/my-org-activity'
      } else if (activityMode === 'team-activity') {
        apiEndpoint = '/api/team-activity'
      }

      // Create and return the fetcher
      return createActivityFetcher(apiEndpoint, params)(cursor, limit)
    },
    [activityMode, dateRange, organizations, installationIds]
  )

  return {
    loading,
    error,
    commits,
    summary,
    fetchCommits,
  }
}
