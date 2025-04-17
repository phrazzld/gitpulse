# Instances of 'any' Type in GitPulse Codebase

## Summary

This report identifies all instances of the `any` type in the GitPulse codebase. The `any` type should be replaced with more specific types to improve type safety and code quality.

## Production Code Instances

### `/src/lib/auth/githubAuth.ts`

- Line 363: Comment referring to 'any': _"Returns the ID of the first installation if any exist"_ (not a type usage)

### `/src/lib/auth/githubAuth.test.ts`

- Line 36: `const auth: any = async () => {`
- Line 128: `const auth: any = async () => {`

### `/src/lib/optimize.test.ts`

- Line 111: `const result = optimizeCommit(mockCommit as any);`

### `/src/app/dashboard/page.tsx`

- Line 245: `setError(null); // Clear any previous errors` (not a type usage)

### `/src/app/api/repos/route.ts`

- Line 290: `// For any other type of error, including generic GitHubError` (not a type usage)

### `/src/app/api/summary/route.ts`

- Line 90: `// If we don't have any installation IDs yet...` (not a type usage)
- Line 106: `// Log any invalid IDs that were filtered out` (not a type usage)
- Line 133: `// Also check for installation ID in cookies if we don't have any` (not a type usage)

### `/src/app/api/my-activity/route.ts`

- Line 51: `const session = await getServerSession(authOptions) as unknown as SessionInfo;`
- Line 88-89: `(session as any)?.profile?.login || "testuser"`

### `/src/hooks/useDebounce.ts`

- Line 52: `// Clear any pending timeouts when unmounting` (not a type usage)
- Line 66: `// Clear any pending timeout` (not a type usage)

## Test Code Instances

### `/src/__tests__/api-test-utils.ts`

- Line 227: `mockResolvedValue: (value: any) => jest.Mock;`
- Line 228: `mockResolvedValueOnce: (value: any) => jest.Mock;`
- Line 249: `const withAuthValidation = (handler: any) => {`
- Line 250: `return async (req: any) => {`
- Line 348: `installationId: expect.any(Number)`
- Line 361: `token: expect.any(String)`

### `/src/__tests__/api/repos.test.ts`

- Line 20-21: `// TypeScript hack: any cast to allow mockImplementation`
- Line 21: `(GET as any).mockImplementation(async (req: any) => {`
- Line 88: `...createApiHandlerTestHelper(GET as (req: NextRequest) => any),`
- Line 112: `expect(response.status).toEqual(expect.any(Number));`
- Line 130: `expect(response.status).toEqual(expect.any(Number));`

### `/src/__tests__/api/github-error-types.test.ts`

- Line 32: `response: { status: number; data: any },`
- Line 59: `error: expect.any(String)`
- Line 102: `const reposTestHelper = createApiHandlerTestHelper(getRepos as (req: NextRequest) => any);`
- Line 103: `const myActivityTestHelper = createApiHandlerTestHelper(getMyActivity as (req: NextRequest) => any);`
- Line 104: `const summaryTestHelper = createApiHandlerTestHelper(getSummary as (req: NextRequest) => any);`
- Line 463: `const verifyStandardErrorStructure = (response: { status: number; data: any }) => {`

### `/src/__tests__/api/my-activity.test.ts`

- Line 88-89: `// Use any to access profile property that's not in the Session type but exists in our mock`
- Line 164-165: `expect.any(String),`
- Line 202-203: `expect.any(String),`

### `/src/__tests__/api/summary.test.ts`

- Line 48: `const summaryTestHelper = createApiHandlerTestHelper(GET as (req: NextRequest) => any);`

### `/src/__tests__/api/error-handling.test.ts`

- Line 203: `const createMockRequest = () => ({ url: 'test/url' } as any);`

### `/src/__tests__/mock-api-error-handler.ts`

- Line 22: `[key: string]: any;`
- Line 30: `context: Record<string, any> = {},`
- Line 141: `export function mockWithErrorHandling<T extends any[]>(`

### `/src/__tests__/error-handling-test-utils.ts`

- References to 'any' in comments, constructor parameters, and property types
- Line 11: `private _body: any;`
- Line 13: `constructor(body: any, options: ...`
- Line 24: `static json(data: any, options: ...`
- Line 35-82: Multiple usages in constructor parameters

### `/src/__tests__/integration/dashboard.test.tsx`

- Line 89: `const mockComponentProps: Record<string, any> = {};`
- Multiple mock component functions with `props: any` parameters
- Line 203: `const mockFetchResponse = (response: any) => {`

### `/src/__tests__/integration/error-handling.test.tsx`

- Multiple interface properties using `any` or `Record<string, any>`

### `/src/__tests__/integration/DashboardTestWrapper.tsx`

- Line 28: `// Simulate loading then handle any errors` (not a type usage)

### `/src/__tests__/components/dashboard/FilterControls.test.tsx`

- Line 10: `default: ({ dateRange, onChange }: { dateRange: any; onChange: (range: any) => void }) => (`

### `/src/__tests__/components/dashboard/DashboardHeader.test.tsx`

- Line 17: `default: (props: any) => {`

## Type Definition Instances

### `/src/types/common.ts`

- Line 5: Comment: `* to replace 'any' with more specific types.`
- Line 10: Comment: `* Use this instead of Record<string, any> or {[key: string]: any}`
- Line 56: Comment: `* Type for a generic function with any number of parameters and return type`
- Line 95: `export type ActivityMode = 'my-activity' | 'my-work-activity' | 'team-activity';`

## Analysis

The instances of `any` can be categorized as:

1. **Test Code**: The majority of `any` usages are in test files, which is common but still should be improved for better type safety.

2. **Mock Functions and Handlers**: Many usages are in mocks and test helper functions.

3. **Type Assertions**: `as any` is used to bypass type checking in a few places.

4. **Comment References**: Some instances are just in comments referring to the word "any" in normal context, not as a type.

5. **Production Code**: Only a few instances in actual production code, which is good.

This report will be used as the basis for task T012 to define proper types to replace these `any` instances.
