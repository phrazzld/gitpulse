I dove into the stack­trace and reproduction steps and what I found is that nothing in your fetcher or hook was actually protecting you from a broken payload shape coming back from the API; as soon as you hit a commit object that didn’t look exactly like a GitHub‐API `Commit` (i.e. didn’t have a non‐null `.commit` block with `.message` on it), your `formatActivityCommits` thunk would do

```js
commit.commit.message
//     ^^^^^^
//  commit.commit is undefined → TypeError: cannot read 'message'
```

That blows up inside the `try { … formatActivityCommits() … }` in `createActivityFetcher`, gets caught by the outer `catch(e)`, and—because it’s an `Error`—we re‐throw it verbatim.  Then your `useProgressiveLoading` catches it and shoves that raw `TypeError` message into state, and ActivityFeed dutifully prints:

  “Failed to load activity data…: Cannot read properties of undefined (reading ‘message’)”

What we really want is to:

  1. Never let a raw `TypeError` around our commit formatter bubble out to the UI  
  2. Make `formatActivityCommits` resilient to slightly different shapes coming back  
  3. Turn any formatting‐time failure into a controlled, meaningful “Invalid data format” error  

Here’s the minimal patch to `src/lib/activity.ts` that accomplishes that.  It:

  • Uses optional chaining everywhere in `formatActivityCommits`, with sensible fallbacks  
  • Wraps the call to `formatActivityCommits` in its own `try/catch` and, on failure, throws a new, user‐friendly error  

------  

```ts
// src/lib/activity.ts
import { ActivityCommit } from '@/components/ActivityFeed';

/**
 * Formats commit data from API response into a format compatible with ActivityFeed
 * (defensively handles missing fields)
 */
export function formatActivityCommits(commits: any[]): ActivityCommit[] {
  if (!Array.isArray(commits)) {
    return [];
  }

  return commits.map((c) => {
    // sometimes our endpoints return a raw "MinimalCommit" or a GitHub Commit
    // normalize to the same shape
    const raw = c.commit != null ? c.commit : c;

    const message = typeof raw.message === 'string' ? raw.message : '';
    const authorBlock = raw.author ?? {};
    const authorName =
      typeof authorBlock.name === 'string'
        ? authorBlock.name
        : typeof c.author_name === 'string'
          ? c.author_name
          : 'Unknown';
    const authorDate =
      typeof authorBlock.date === 'string'
        ? authorBlock.date
        : typeof c.author_date === 'string'
          ? c.author_date
          : new Date().toISOString();

    return {
      sha: String(c.sha ?? ''),
      html_url: typeof c.html_url === 'string' ? c.html_url : undefined,
      commit: {
        message,
        author: {
          name: authorName,
          date: authorDate
        }
      },
      repository:
        c.repository != null
          ? {
              name: String(c.repository.name ?? ''),
              full_name: String(c.repository.full_name ?? ''),
              html_url:
                typeof c.repository.html_url === 'string'
                  ? c.repository.html_url
                  : undefined
            }
          : undefined,
      contributor:
        c.contributor != null
          ? {
              username: String(c.contributor.username ?? ''),
              displayName: String(c.contributor.displayName ?? ''),
              avatarUrl:
                c.contributor.avatarUrl != null
                  ? String(c.contributor.avatarUrl)
                  : null
            }
          : undefined
    };
  });
}

/**
 * Creates a fetcher function for the ActivityFeed component
 */
export function createActivityFetcher(
  baseUrl: string,
  params: Record<string, string>
) {
  return async (cursor: string | null, limit: number) => {
    try {
      const queryParams = new URLSearchParams({ ...params, limit: String(limit) });
      if (cursor) queryParams.append('cursor', cursor);

      const res = await fetch(`${baseUrl}?${queryParams}`);
      if (!res.ok) {
        // try to unwrap a JSON error
        try {
          const errJson = await res.json();
          throw new Error(
            typeof errJson.error === 'string'
              ? errJson.error
              : `Error ${res.status}: ${res.statusText}`
          );
        } catch {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
      }

      let payload: any;
      try {
        payload = await res.json();
      } catch {
        throw new Error('Invalid JSON from server');
      }

      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid response data structure');
      }

      // Here is the new, protected formatting step
      let formatted: ActivityCommit[];
      try {
        formatted = formatActivityCommits(payload.commits ?? []);
      } catch (formatErr) {
        console.error('Error formatting activity commits:', formatErr);
        throw new Error('Invalid activity data format');
      }

      return {
        data: formatted,
        nextCursor: payload.pagination?.nextCursor ?? null,
        hasMore: !!payload.pagination?.hasMore
      };
    } catch (err: unknown) {
      // if it's already an Error, pass it on; otherwise wrap
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unexpected error occurred while fetching activity data');
    }
  };
}
```

Key takeaways:

• We never do a raw `commit.commit.message` without checking `.commit` exists  
• Any formatting‐time exception is caught and replaced by a predictable “Invalid activity data format” error (so you never leak a `TypeError` about “reading ‘message’ of undefined”)  
• The rest of your chain (the hook wrapping, the UI concatenating `: ${state.error}`) stays exactly the same  

With that in place, if the API payload is missing a nested property, you get:

  “Failed to load activity data. Please try again.: Invalid activity data format”

instead of an unhelpful “Cannot read properties of undefined (reading 'message')”.