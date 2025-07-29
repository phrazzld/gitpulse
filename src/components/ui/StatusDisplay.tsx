'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Props for the StatusDisplay component
 * @internal
 */
interface StatusDisplayProps {
  /** Status line message */
  statusMessage: string;
  /** Secondary message */
  subMessage: string;
}

/**
 * Displays the animated status messages and spinner within the AuthLoadingCard.
 * Uses shadcn Card component and Lucide icons.
 * @internal
 */
export default function StatusDisplay({ statusMessage, subMessage }: StatusDisplayProps) {
  return (
    <Card>
      <CardContent className="flex items-start space-x-4 p-4">
        {/* Spinner */}
        <div className="text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="sr-only">Loading...</span>
        </div>

        {/* Messages */}
        <div className="space-y-2 flex-1">
          <p className="text-sm animate-pulse text-muted-foreground">
            {statusMessage}
          </p>
          <p className="text-xs text-muted-foreground">
            {subMessage}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}