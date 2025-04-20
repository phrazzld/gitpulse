# T009 Plan - Implement Server-Side Validation for API Routes

## Task Definition
- **ID:** T009
- **Type:** feature 
- **Priority:** p1
- **Context:** plan.md · cr‑04 Add input validation for user input
- **Action:**
  1. Identify all API routes that accept user input.
  2. Implement server-side validation for incoming request data.
  3. Return appropriate error responses for invalid input.
- **Done‑when:**
  1. Server-side validation is present for all API routes accepting user input.
  2. Invalid requests are rejected with clear error messages.
- **Depends‑on:** none

## Analysis

### Identified API Routes Requiring Validation
1. `/api/github/setup/route.ts` - Accepts `installation_id` parameter
2. `/api/my-activity/route.ts` - Accepts query parameters: `since`, `until`, `cursor`, `limit`
3. `/api/summary/route.ts` - Accepts query parameters: `since`, `until`, `contributors`, `repositories`, `organizations`, `installation_ids`
4. `/api/repos/route.ts` - Accepts `installation_id` parameter

### Current Validation Status
- **Zod** library already in place for schema validation
- Existing schemas in `validation.ts` include:
  - `dateSchema`, `dateRangeSchema` for dates
  - `emailSchema`, `usernameSchema`, `passwordSchema` for user info
  - `searchQuerySchema` for search queries
  - `repoNameSchema` for repo names
- `validateSchema<T>()` utility function available
- Error handling utility `withErrorHandling` available

### New Schemas Needed
1. `installationIdSchema` - For validating GitHub App installation IDs
2. `cursorSchema` - For validating pagination cursors
3. `limitSchema` - For validating pagination limits
4. `contributorsSchema` - For validating contributor parameters
5. `repositoriesSchema` - For validating repository parameters
6. `organizationsSchema` - For validating organization parameters

## Implementation Plan

### 1. Extend Validation Library (`validation.ts`)
- Add new schemas for all identified parameter types
- Create helper functions for query parameter validation

### 2. Implement Validation In Each API Route
- Wrap each API route with validation before processing
- Standardize error responses for validation failures
- Use existing error handling utilities

### 3. Test Implementation
- Test valid inputs
- Test invalid inputs (malformed, missing required, out of bounds)
- Verify error responses

## Implementation Details

### Enhanced Validation Library
Will add the following schemas to `validation.ts`:

```typescript
// Installation ID validation
export const installationIdSchema = z.coerce
  .number()
  .int("Installation ID must be an integer")
  .positive("Installation ID must be positive");

// Pagination cursor validation
export const cursorSchema = z.string().optional();

// Pagination limit validation  
export const limitSchema = z.coerce
  .number()
  .int("Limit must be an integer")
  .min(1, "Limit must be at least 1")
  .max(100, "Limit cannot exceed 100")
  .default(50);

// Contributors validation (array of contributor IDs or usernames)
export const contributorsSchema = z
  .string()
  .transform((val) => val.split(',').map((v) => v.trim()))
  .or(z.array(z.string()))
  .optional();

// Repositories validation (array of repository names)
export const repositoriesSchema = z
  .string()
  .transform((val) => val.split(',').map((v) => v.trim()))
  .or(z.array(z.string()))
  .optional();

// Organizations validation (array of organization names)
export const organizationsSchema = z
  .string()
  .transform((val) => val.split(',').map((v) => v.trim()))
  .or(z.array(z.string()))
  .optional();
```

### Query Parameter Extraction Utility

```typescript
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodType<T>
): {
  success: boolean;
  data?: T;
  error?: string;
} {
  // Convert URLSearchParams to object
  const params = Object.fromEntries(searchParams.entries());
  return validateSchema(schema, params);
}
```

### Apply to API Routes
For each route, validate the query parameters as early as possible, and return standardized error responses.