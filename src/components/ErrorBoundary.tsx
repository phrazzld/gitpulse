"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: (error: Error, errorInfo: string) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child component trees, logs them, and displays a fallback UI
 * instead of the component tree that crashed.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: "",
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: "",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error("Error caught by boundary:", error);
    console.error("Component stack:", errorInfo.componentStack);

    // Update error info for display
    this.setState({
      errorInfo: errorInfo.componentStack || "",
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return this.props.fallback(this.state.error!, this.state.errorInfo);
    }

    // No error, render children normally
    return this.props.children;
  }
}
