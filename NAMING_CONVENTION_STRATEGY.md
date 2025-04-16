# GitPulse Naming Convention Strategy

## Snake_Case to CamelCase Conversion

This document outlines our standardized approach for handling naming conventions in GitPulse, particularly when receiving `snake_case` data from external APIs (like GitHub) and using `camelCase` internally.

## Strategy Overview

1. **Types & Interfaces**

   - External API types use `snake_case` properties to match the API schema
   - Internal types use `camelCase` properties consistently
   - Interface documentation should clearly mention when properties have been converted

2. **Conversion Boundaries**

   - Conversions should happen at the API boundary (data fetching layer)
   - Use explicit transformation functions like those in `optimize.ts`
   - Return strongly typed internal representations

3. **Conversion Functions**
   - Implement explicit mapping functions for all API responses
   - Document the property name changes
   - Group related transformation functions

## Implementation Guidelines

### 1. API Response Type Definitions

For each external API endpoint, define two types:

1. An external type that mirrors the API's `snake_case` properties
2. An internal type using `camelCase` properties

Example:

```typescript
// External type (matches GitHub API)
export interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  // Other GitHub properties...
}

// Internal type (used throughout the application)
export interface Repository {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
  // Other properties...
}
```

### 2. Transformation Functions

Create explicit transformation functions for converting between external and internal representations:

```typescript
export function transformRepository(repo: GithubRepository): Repository {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    owner: {
      login: repo.owner.login,
      avatarUrl: repo.owner.avatar_url,
    },
    // Transform other properties...
  };
}
```

### 3. Handling Nested Properties

For nested properties, use recursive transformation or dedicated sub-object transformers:

```typescript
export function transformUser(user: GithubUser): User {
  return {
    id: user.id,
    login: user.login,
    displayName: user.name || user.login,
    avatarUrl: user.avatar_url,
    profile: user.profile ? transformProfile(user.profile) : undefined,
  };
}
```

### 4. API Layer Implementation

In the API layer, fetch data and immediately transform it:

```typescript
async function fetchRepositories(octokit: Octokit): Promise<Repository[]> {
  const response = await octokit.request("GET /user/repos");
  return response.data.map(transformRepository);
}
```

### 5. Backward Compatibility

When dealing with mixed interfaces or transitioning legacy code:

1. Use the `optimize.ts` module approach with interface support for both naming conventions
2. Gradually migrate to the explicit transformation functions
3. Prioritize consistent naming in the UI layer

Example of a transitional approach:

```typescript
// Supporting both naming patterns during migration
export interface ContributorLike {
  username?: string;
  login?: string;
  displayName?: string;
  name?: string;
  avatarUrl?: string;
  avatar_url?: string;
  // Other properties...
}

export function optimizeContributor(
  contributor: ContributorLike,
): MinimalContributor {
  return {
    username: contributor.username || contributor.login || "unknown",
    displayName:
      contributor.displayName ||
      contributor.name ||
      contributor.username ||
      "Unknown",
    avatarUrl: contributor.avatarUrl || contributor.avatar_url || null,
  };
}
```

## Benefits of This Approach

1. **Type Safety**: Using strongly typed interfaces ensures correct property access
2. **Developer Experience**: Consistent internal naming conventions improve readability
3. **API Isolation**: Changes to external APIs only affect transformation functions
4. **Maintainability**: Clear boundary between external and internal data structures
5. **Clarity**: Explicit transformations make data flow more understandable

## Implementation Plan

Tasks T009 and T010 will implement this strategy by:

1. Refactoring `src/lib/optimize.ts` to consistently follow this pattern
2. Updating `src/lib/activity.ts` to use the same transformation approach
3. Ensuring all API boundaries follow these conventions

This approach aligns with GitPulse's Core Principles of Explicitness and Consistency while improving the overall type safety of the application.
