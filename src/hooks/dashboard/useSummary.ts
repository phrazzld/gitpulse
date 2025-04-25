import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { ActivityMode, CommitSummary, DateRange, Installation } from '@/types/dashboard'
import { logger } from '@/lib/logger'

const MODULE_NAME = 'hooks:useSummary'

interface UseSummaryProps {
  dateRange: DateRange
  activityMode: ActivityMode
  organizations: readonly string[]
  repositories: readonly string[]
  contributors: readonly string[]
  installationIds: readonly number[]
}

interface UseSummaryResult {
  loading: boolean
  error: string | null
  summary: CommitSummary | null
  generateSummary: () => Promise<void>
  installations: readonly Installation[]
  currentInstallations: readonly Installation[]
  authMethod: string | null
}

/**
 * Hook for generating and managing summary data
 *
 * @param props - Configuration options for the hook
 * @returns - State and functions for working with summaries
 */
export function useSummary({
  dateRange,
  activityMode,
  organizations,
  repositories,
  contributors,
  installationIds,
}: UseSummaryProps): UseSummaryResult {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<CommitSummary | null>(null)
  const [installations, setInstallations] = useState<Installation[] | readonly Installation[]>([])
  const [currentInstallations, setCurrentInstallations] = useState<
    Installation[] | readonly Installation[]
  >([])
  const [authMethod, setAuthMethod] = useState<string | null>(null)

  // Function to handle API errors
  const handleApiError = useCallback((errorData: any, response: Response) => {
    // Check for installation needed error
    if (errorData.needsInstallation) {
      throw new Error(
        'GitHub App installation required. Please install the GitHub App to access all your repositories, including private ones.'
      )
    }

    // Check for auth errors
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
  }, [])

  // Function to generate a summary based on current filters
  const generateSummary = useCallback(async () => {
    if (!session?.accessToken && !installationIds.length) {
      logger.warn(MODULE_NAME, 'No authentication available for generating summary')
      setError('Authentication required. Please sign in again.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSummary(null)

      // Construct query parameters
      const params = new URLSearchParams({
        since: dateRange.since,
        until: dateRange.until,
      })

      // Add installation IDs if available
      if (installationIds.length > 0) {
        params.append('installation_ids', installationIds.join(','))
      }

      // Add filter parameters
      if (contributors.length > 0) {
        params.append('contributors', contributors.join(','))
      }

      if (organizations.length > 0) {
        params.append('organizations', organizations.join(','))
      }

      if (repositories.length > 0) {
        params.append('repositories', repositories.join(','))
      }

      // Always use chronological view
      params.append('groupBy', 'chronological')

      logger.info(MODULE_NAME, 'Generating summary with parameters', {
        dateRange,
        activityMode,
        installationIds: installationIds.length,
        filters: {
          contributors: contributors.length,
          organizations: organizations.length,
          repositories: repositories.length,
        },
      })

      const response = await fetch(`/api/summary?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        handleApiError(errorData, response)
      }

      const data = await response.json()
      setSummary(data)

      // Update auth method and installation information if available
      if (data.authMethod) {
        setAuthMethod(data.authMethod)
        logger.debug(MODULE_NAME, 'Using auth method', { method: data.authMethod })
      }

      if (data.installationIds && data.installationIds.length > 0) {
        logger.debug(MODULE_NAME, 'Using GitHub App installation IDs', {
          ids: data.installationIds,
        })
      }

      // Update installations list
      if (data.installations && data.installations.length > 0) {
        setInstallations(data.installations)
        logger.debug(MODULE_NAME, 'Available installations', {
          count: data.installations.length,
        })
      }

      // Update current installations
      if (data.currentInstallations && data.currentInstallations.length > 0) {
        setCurrentInstallations(data.currentInstallations)
        logger.debug(MODULE_NAME, 'Current installations', {
          accounts: data.currentInstallations.map((inst: Installation) => inst.account.login),
        })
      }

      logger.info(MODULE_NAME, 'Summary generation completed', {
        commitCount: data.stats?.totalCommits || 0,
        repositoryCount: data.stats?.repositories?.length || 0,
      })
    } catch (error: any) {
      logger.error(MODULE_NAME, 'Error generating summary', {
        error: error.message,
        activityMode,
        dateRange,
      })

      setError(error.message || 'Failed to generate summary. Please try again.')
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
    handleApiError,
  ])

  return {
    loading,
    error,
    summary,
    generateSummary,
    installations,
    currentInstallations,
    authMethod,
  }
}
