/**
 * Hook for generating and managing summary data using effect-based architecture
 * Refactored to use functional core/imperative shell pattern
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { ActivityMode, CommitSummary, DateRange, Installation } from '@/types/dashboard';
import { logger } from '@/lib/logger';
import { summaryService } from '@/services/workflows/summary';
import { 
  createSummaryRequest, 
  validateSummaryRequestConfig,
  applyUserContextToRequest,
  type SummaryRequestConfig 
} from './utils/summary-params';
import { 
  createSessionDataProvider,
  transformDashboardError,
  type DashboardDataProvider 
} from './adapters/summary-data-provider';
import type { SummaryStats } from '@/core/types/index';

const MODULE_NAME = 'hooks:useSummary';

interface UseSummaryProps {
  dateRange: DateRange;
  activityMode: ActivityMode;
  organizations: readonly string[];
  repositories: readonly string[];
  contributors: readonly string[];
  installationIds: readonly number[];
}

interface UseSummaryResult {
  loading: boolean;
  error: string | null;
  summary: CommitSummary | null;
  generateSummary: () => Promise<void>;
  installations: readonly Installation[];
  currentInstallations: readonly Installation[];
  authMethod: string | null;
}

/**
 * Hook for generating and managing summary data using effect-based architecture
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
  installationIds
}: UseSummaryProps): UseSummaryResult {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CommitSummary | null>(null);
  const [installations, setInstallations] = useState<Installation[] | readonly Installation[]>([]);
  const [currentInstallations, setCurrentInstallations] = useState<Installation[] | readonly Installation[]>([]);
  const [authMethod, setAuthMethod] = useState<string | null>(null);

  // Ref to track current effect execution for cleanup
  const currentEffectRef = useRef<{ cancelled: boolean } | null>(null);

  /**
   * Transform SummaryStats to legacy CommitSummary format
   * Pure function for backward compatibility
   */
  const transformStatsToSummary = useCallback((
    stats: SummaryStats, 
    rawCommits: any[] = [],
    userContext: any = {}
  ): CommitSummary => {
    return {
      user: session?.user?.name || undefined,
      commits: rawCommits,
      stats: {
        totalCommits: stats.totalCommits,
        repositories: stats.repositories,
        dates: Object.keys(stats.commitsByDay).sort()
      },
      aiSummary: undefined, // Will be populated by legacy API compatibility layer
      filterInfo: {
        contributors: contributors.length > 0 ? [...contributors] : null,
        organizations: organizations.length > 0 ? [...organizations] : null,
        repositories: repositories.length > 0 ? [...repositories] : null,
        dateRange: { since: dateRange.since, until: dateRange.until }
      },
      authMethod: userContext.authMethod || 'oauth',
      installationId: userContext.installationIds?.[0] || null
    };
  }, [session?.user?.name, dateRange, contributors, organizations, repositories]);

  /**
   * Generate summary using effect-based architecture
   * Integrates validation, data fetching, and statistics calculation
   */
  const generateSummary = useCallback(async () => {
    // Validate authentication
    if (!session?.accessToken && !installationIds.length) {
      logger.warn(MODULE_NAME, 'No authentication available for generating summary');
      setError('Authentication required. Please sign in again.');
      return;
    }

    // Cancel any ongoing effect
    if (currentEffectRef.current) {
      currentEffectRef.current.cancelled = true;
    }

    // Create new effect context
    const effectContext = { cancelled: false };
    currentEffectRef.current = effectContext;

    try {
      setLoading(true);
      setError(null);
      setSummary(null);

      // Create request configuration
      const requestConfig: SummaryRequestConfig = {
        dateRange,
        activityMode,
        organizations,
        repositories,
        contributors
      };

      // Validate configuration
      const validationErrors = validateSummaryRequestConfig(requestConfig);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid configuration: ${validationErrors.join(', ')}`);
      }

      // Apply user context (handle 'me' contributor and activity mode)
      const contextualConfig = applyUserContextToRequest(requestConfig, session?.user?.name || undefined);

      logger.info(MODULE_NAME, 'Generating summary with effect-based service', {
        dateRange,
        activityMode,
        installationIds: installationIds.length,
        filters: {
          contributors: contextualConfig.contributors.length,
          organizations: contextualConfig.organizations.length,
          repositories: contextualConfig.repositories.length
        }
      });

      // Create data provider with session context
      const dataProvider: DashboardDataProvider = createSessionDataProvider(
        session,
        installationIds,
        repositories
      );

      // Fetch filtered repositories if needed
      const filteredRepositories = await dataProvider.fetchFilteredRepositories(contextualConfig)();
      
      // Check if effect was cancelled
      if (effectContext.cancelled) {
        logger.debug(MODULE_NAME, 'Effect cancelled during repository fetching');
        return;
      }

      if (filteredRepositories.length === 0) {
        throw new Error('No repositories found matching your filter criteria. Please adjust your organization or repository filters.');
      }

      // Create summary request with filtered repositories
      const summaryRequest = createSummaryRequest({
        ...contextualConfig,
        repositories: filteredRepositories
      });

      // Execute effect-based summary service
      const summaryEffect = summaryService.generateSummary(summaryRequest, dataProvider);
      const summaryStats = await summaryEffect();

      // Check if effect was cancelled after execution
      if (effectContext.cancelled) {
        logger.debug(MODULE_NAME, 'Effect cancelled after summary generation');
        return;
      }

      logger.info(MODULE_NAME, 'Summary generation completed', {
        totalCommits: summaryStats.totalCommits,
        uniqueAuthors: summaryStats.uniqueAuthors,
        repositories: summaryStats.repositories.length
      });

      // For now, create empty commits array for backward compatibility
      // In the future, this could be optimized to not fetch raw commits unless needed
      const legacySummary = transformStatsToSummary(summaryStats, [], {
        authMethod: installationIds.length > 0 ? 'github_app' : 'oauth',
        installationIds: installationIds.length > 0 ? installationIds : null
      });

      setSummary(legacySummary);
      
      // Update auth method
      setAuthMethod(installationIds.length > 0 ? 'github_app' : 'oauth');

    } catch (error: any) {
      // Check if effect was cancelled during error handling
      if (effectContext.cancelled) {
        logger.debug(MODULE_NAME, 'Effect cancelled during error handling');
        return;
      }

      logger.error(MODULE_NAME, 'Error generating summary', { 
        error: error.message,
        activityMode,
        dateRange
      });
      
      // Transform error to user-friendly message
      const transformedError = transformDashboardError(error);
      setError(transformedError.message);
    } finally {
      // Only update loading state if effect wasn't cancelled
      if (!effectContext.cancelled) {
        setLoading(false);
      }
      
      // Clear effect reference if this is still the current effect
      if (currentEffectRef.current === effectContext) {
        currentEffectRef.current = null;
      }
    }
  }, [
    session,
    dateRange, 
    activityMode, 
    organizations, 
    repositories,
    contributors,
    installationIds,
    transformStatsToSummary
  ]);

  // Cleanup effect on unmount
  useEffect(() => {
    return () => {
      if (currentEffectRef.current) {
        currentEffectRef.current.cancelled = true;
      }
    };
  }, []);

  return {
    loading,
    error,
    summary,
    generateSummary,
    installations,
    currentInstallations,
    authMethod
  };
}