import { useEffect } from 'react';
import { useAriaAnnouncer } from '@/lib/accessibility/useAriaAnnouncer';

export interface LoadingAnnouncerProps {
  /**
   * Whether the component is in a loading state
   */
  isLoading: boolean;

  /**
   * Message to announce when loading starts
   * @default 'Loading'
   */
  loadingMessage?: string;

  /**
   * Message to announce when operation completes successfully
   * @default 'Operation completed successfully'
   */
  successMessage?: string;

  /**
   * Message to announce when an error occurs
   * @default 'An error occurred'
   */
  errorMessage?: string;

  /**
   * Whether the operation encountered an error
   * @default false
   */
  hasError?: boolean;

  /**
   * Whether the operation completed successfully
   * @default false
   */
  isSuccess?: boolean;
}

/**
 * A utility component for announcing loading, success, and error states to screen readers.
 * This component doesn't render any visible UI - it only manages aria announcements.
 *
 * @example
 * ```tsx
 * <LoadingAnnouncer
 *   isLoading={isSubmitting}
 *   loadingMessage="Submitting your data"
 *   successMessage="Your data has been saved"
 *   hasError={!!error}
 *   errorMessage={error?.message}
 *   isSuccess={isSubmitSuccessful}
 * />
 * ```
 */
export default function LoadingAnnouncer({
  isLoading,
  loadingMessage = 'Loading',
  successMessage = 'Operation completed successfully',
  errorMessage = 'An error occurred',
  hasError = false,
  isSuccess = false
}: LoadingAnnouncerProps) {
  const { announce } = useAriaAnnouncer();
  
  // Announce loading state changes
  useEffect(() => {
    if (isLoading) {
      announce(loadingMessage, 'polite');
    } else if (hasError) {
      announce(errorMessage, 'assertive'); // Use assertive for errors
    } else if (isSuccess) {
      announce(successMessage, 'polite');
    }
  }, [
    isLoading, 
    hasError, 
    isSuccess, 
    loadingMessage, 
    errorMessage, 
    successMessage, 
    announce
  ]);
  
  // This component doesn't render anything visually
  return null;
}