i'm getting a couple bugs when i try to view this project locally. it loads, but:

Error: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
at createUnhandledError (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_43e3ffb8._.js:879:71)
at handleClientError (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_43e3ffb8._.js:1052:56)
at console.error (http://localhost:3000/_next/static/chunks/node_modules_next_dist_client_43e3ffb8._.js:1191:56)
at getRootForUpdatedFiber (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_2ce9398a._.js:4702:143)
at enqueueConcurrentHookUpdate (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_2ce9398a._.js:4685:16)
at dispatchSetStateInternal (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_2ce9398a._.js:6448:22)
at dispatchSetState (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_2ce9398a._.js:6421:9)
at handleRepositoryFetchSuccess (http://localhost:3000/_next/static/chunks/src_9dc17f84._.js:5204:5)
at useRepositoryFetching.useCallback[fetchRepositories] (http://localhost:3000/_next/static/chunks/src_9dc17f84._.js:4873:24)
