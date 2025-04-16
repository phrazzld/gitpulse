/**
 * Mock utilities for testing error handling
 * This file should not import any Next.js code directly to avoid test issues
 */

// Mock NextResponse for testing
export class MockNextResponse {
  status: number;
  statusText: string;
  headers: Map<string, string>;
  private _body: any;

  constructor(body: any, options: { status?: number; statusText?: string; headers?: Record<string, string> } = {}) {
    this._body = body;
    this.status = options.status || 200;
    this.statusText = options.statusText || '';
    this.headers = new Map(Object.entries(options.headers || {}));
  }

  async json() {
    return this._body;
  }

  static json(data: any, options: { status?: number; headers?: Record<string, string> } = {}) {
    return new MockNextResponse(data, {
      status: options.status || 200,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
  }
}

// Mock error classes that match the real ones but don't depend on Next.js
export class MockGitHubError extends Error {
  public readonly cause?: Error;
  public readonly context?: Record<string, any>;

  constructor(message: string, options?: ErrorOptions & { context?: Record<string, any> }) {
    super(message, options);
    this.name = this.constructor.name;
    this.cause = options?.cause instanceof Error ? options?.cause : undefined;
    this.context = options?.context;
  }
}

export class MockGitHubConfigError extends MockGitHubError {
  constructor(message: string, options?: ErrorOptions & { context?: Record<string, any> }) {
    super(message, options);
  }
}

export class MockGitHubAuthError extends MockGitHubError {
  public readonly status: number;

  constructor(message: string, options?: ErrorOptions & { status?: number, context?: Record<string, any> }) {
    super(message, options);
    this.status = options?.status ?? 401;
  }
}

export class MockGitHubNotFoundError extends MockGitHubError {
  public readonly status: number = 404;

  constructor(message: string, options?: ErrorOptions & { context?: Record<string, any> }) {
    super(message, options);
  }
}

export class MockGitHubRateLimitError extends MockGitHubError {
  public readonly status: number;
  public readonly resetTimestamp?: number;

  constructor(message: string, options?: ErrorOptions & { status?: number, resetTimestamp?: number, context?: Record<string, any> }) {
    super(message, options);
    this.status = options?.status ?? 429;
    this.resetTimestamp = options?.resetTimestamp;
  }
}

export class MockGitHubApiError extends MockGitHubError {
  public readonly status: number;

  constructor(message: string, options?: ErrorOptions & { status?: number, context?: Record<string, any> }) {
    super(message, options);
    this.status = options?.status ?? 500;
  }
}

// Mock error generators
export const mockErrors = {
  // Config error (status 500)
  createConfigError: () => new MockGitHubConfigError("GitHub App not properly configured", {
    context: { functionName: "testFunction" }
  }),
  
  // Auth errors (status 403)
  createAuthError: () => new MockGitHubAuthError("GitHub authentication failed", {
    status: 403,
    context: { functionName: "testFunction" }
  }),
  createTokenError: () => new MockGitHubAuthError("GitHub token is invalid or expired", {
    status: 403,
    context: { functionName: "testFunction" }
  }),
  createScopeError: () => new MockGitHubAuthError("GitHub token is missing required scope", {
    status: 403,
    context: { functionName: "testFunction" }
  }),
  
  // Rate limit error (status 429)
  createRateLimitError: () => new MockGitHubRateLimitError("GitHub API rate limit exceeded", {
    status: 429,
    resetTimestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    context: { functionName: "testFunction" }
  }),
  
  // Not found error (status 404)
  createNotFoundError: () => new MockGitHubNotFoundError("Repository not found", {
    context: { functionName: "testFunction" }
  }),
  
  // API error (variable status)
  createApiError: (status = 500) => new MockGitHubApiError("GitHub API operation failed", {
    status,
    context: { functionName: "testFunction" }
  }),
  
  // Generic GitHub error (status 500)
  createGitHubError: () => new MockGitHubError("Generic GitHub error", {
    context: { functionName: "testFunction" }
  }),
  
  // Regular JS error (status 500)
  createJsError: () => new Error("Standard JavaScript error")
};