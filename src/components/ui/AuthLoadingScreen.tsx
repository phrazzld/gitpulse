'use client';

import React from 'react';
import AuthLoadingCard from './AuthLoadingCard';

/**
 * Props for the AuthLoadingScreen component.
 */
interface AuthLoadingScreenProps {
  /**
   * Primary message displayed as a title within the card.
   * @default 'Verifying Authentication'
   */
  message?: string;

  /**
   * Secondary message displayed below the status line within the card.
   * @default 'Please wait while we verify your credentials'
   */
  subMessage?: string;

  /**
   * Status line message displayed with animation.
   * @default 'System access verification in progress...'
   */
  statusMessage?: string;

  /**
   * Optional footer message displayed at the bottom of the card.
   * @default 'SECURE CONNECTION ESTABLISHED'
   */
  footerMessage?: string;

  /**
   * Optional CSS class name to apply to the container element.
   */
  className?: string;
}

/**
 * A stylized full-screen loading indicator typically used during authentication flows.
 *
 * Features a terminal-inspired aesthetic with configurable messages. Uses shadcn
 * components for consistent styling across the application.
 *
 * @example Basic Usage
 * ```tsx
 * <AuthLoadingScreen />
 * ```
 *
 * @example Custom Messages
 * ```tsx
 * <AuthLoadingScreen
 *   message="Initializing Secure Session"
 *   subMessage="Establishing encrypted connection..."
 *   statusMessage="Contacting authorization server..."
 * />
 * ```
 */
export default function AuthLoadingScreen({
  message = 'Verifying Authentication',
  subMessage = 'Please wait while we verify your credentials',
  statusMessage = 'System access verification in progress...',
  footerMessage = 'SECURE CONNECTION ESTABLISHED',
  className = '',
}: AuthLoadingScreenProps) {
  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 bg-background ${className}`}
      role="alert"
      aria-live="assertive"
      aria-busy="true"
      aria-label={message}
    >
      <AuthLoadingCard
        message={message}
        subMessage={subMessage}
        statusMessage={statusMessage}
        footerMessage={footerMessage}
      />
    </div>
  );
}