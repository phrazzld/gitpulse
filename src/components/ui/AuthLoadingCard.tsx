'use client';

import React from 'react';
import StatusDisplay from './StatusDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

/**
 * Props for the AuthLoadingCard component
 * @internal
 */
interface AuthLoadingCardProps {
  /** Primary message title */
  message: string;
  /** Status line message for StatusDisplay */
  statusMessage: string;
  /** Secondary message for StatusDisplay */
  subMessage: string;
  /** Optional footer message */
  footerMessage?: string;
}

/**
 * The central card element for the AuthLoadingScreen, featuring a terminal-like interface.
 * Uses shadcn Card components for consistent styling.
 * @internal
 */
export default function AuthLoadingCard({
  message,
  statusMessage,
  subMessage,
  footerMessage,
}: AuthLoadingCardProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        {/* Terminal-style header dots */}
        <div className="flex items-center mb-4">
          <div className="flex space-x-1 mr-3">
            <div className="w-2 h-2 rounded-full bg-destructive" aria-hidden="true" />
            <div className="w-2 h-2 rounded-full bg-secondary" aria-hidden="true" />
            <div className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
          </div>
          <div className="h-px flex-grow bg-border" aria-hidden="true" />
        </div>
        <CardTitle className="text-center">
          {message}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Status Display (already using shadcn) */}
        <StatusDisplay statusMessage={statusMessage} subMessage={subMessage} />
      </CardContent>

      {/* Footer */}
      {footerMessage && (
        <CardFooter className="flex flex-col">
          <p className="text-xs text-muted-foreground text-center">
            {footerMessage}
          </p>
          <div className="flex justify-center items-center mt-2" aria-hidden="true">
            <div className="h-px w-8 bg-border" />
            <div className="px-2 text-muted-foreground">•</div>
            <div className="h-px w-8 bg-border" />
          </div>
        </CardFooter>
      )}
    </Card>
  );
}