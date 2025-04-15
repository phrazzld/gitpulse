# Refactor `/api/repos` Route Handler

## Task Title
Refactor `/api/repos` Route Handler

## Implementation Approach
Update the `/api/repos/route.ts` handler to use the new authentication and data fetching modules by: (1) extracting GitHub authentication details (OAuth token and/or installation ID) from the user's session, (2) creating a `GitHubCredentials` object based on the available auth methods, (3) calling `createAuthenticatedOctokit` from the auth module to obtain an authenticated client, (4) passing this client to the refactored `fetchRepositories` or `fetchAppRepositories` function in the data module, and (5) maintaining the existing response format and error handling pattern.