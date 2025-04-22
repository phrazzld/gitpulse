"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/lib/logger";
import { Card } from "@/components/library";

/**
 * Props for the DashboardErrorBoundary component
 */
interface DashboardErrorBoundaryProps {
  /** The child components to render within the boundary */
  children: ReactNode;

  /** An ID to uniquely identify this error boundary instance */
  componentId: string;

  /** Custom fallback component to render when an error occurs */
  fallback?: (props: DashboardErrorFallbackProps) => ReactNode;

  /** Additional context information to log with errors */
  contextInfo?: Record<string, unknown>;
}

/**
 * Props passed to the fallback component when an error occurs
 */
export interface DashboardErrorFallbackProps {
  /** The error that was caught */
  error: Error;

  /** Information about the component stack where the error occurred */
  errorInfo: ErrorInfo | null;

  /** The unique ID of the error boundary that caught the error */
  componentId: string;

  /** Function to retry rendering the protected component */
  retry: () => void;

  /** Additional context that was provided to the error boundary */
  contextInfo?: Record<string, unknown>;
}

/**
 * State for the DashboardErrorBoundary component
 */
interface DashboardErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;

  /** The error that occurred */
  error: Error | null;

  /** Information about the component stack where the error occurred */
  errorInfo: ErrorInfo | null;

  /** An incrementing counter used to trigger re-renders when retrying */
  retryCount: number;
}

/**
 * Dashboard Error Boundary Component
 *
 * A specialized error boundary for dashboard components that provides:
 * - Detailed error logging with component context
 * - Visual feedback that matches dashboard design
 * - Retry mechanism to attempt recovery
 * - Component isolation to prevent full dashboard crashes
 */
export default class DashboardErrorBoundary extends Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  /**
   * Update state when an error occurs to trigger fallback rendering
   */
  static getDerivedStateFromError(
    error: Error,
  ): Partial<DashboardErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Capture additional error information and log the error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Set error info for display
    this.setState({ errorInfo });

    // Log the error with structured contextual information
    logger.error(
      "DashboardErrorBoundary",
      `Error in ${this.props.componentId}`,
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        componentStack: errorInfo.componentStack,
        componentId: this.props.componentId,
        contextInfo: this.props.contextInfo || {},
        retryCount: this.state.retryCount,
      },
    );
  }

  /**
   * Reset error state to try rendering the component again
   */
  handleRetry = (): void => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided, otherwise use default fallback
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          componentId: this.props.componentId,
          retry: this.handleRetry,
          contextInfo: this.props.contextInfo,
        });
      }

      // Default fallback UI that matches dashboard styling
      return (
        <Card
          padding="lg"
          radius="md"
          shadow="md"
          className="border"
          style={{
            backgroundColor: "hsla(var(--dark-slate), 0.7)",
            borderColor: "hsl(var(--red))",
            boxShadow: "0 0 15px rgba(255, 0, 0, 0.15)",
          }}
        >
          <h2
            className="text-lg font-bold mb-2"
            style={{ color: "hsl(var(--red))" }}
          >
            Component Error: {this.props.componentId}
          </h2>

          <p className="text-gray-300 mb-4">
            An error occurred while rendering this component. Other parts of the
            dashboard should continue to function.
          </p>

          <div className="mb-4">
            <pre className="p-2 bg-black bg-opacity-50 rounded text-xs text-gray-300 overflow-auto max-h-24">
              {this.state.error.toString()}
            </pre>
          </div>

          <button
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-md transition-colors"
            style={{
              backgroundColor: "hsl(var(--red))",
              color: "white",
            }}
          >
            Retry
          </button>
        </Card>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}
