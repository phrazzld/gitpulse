#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");
const getPort = require("get-port");
const handler = require("serve-handler");

// Global server reference for cleanup
let storybookServer = null;

/**
 * Sets the global server reference (used by the main script)
 * @param {http.Server|null} server - Server instance or null
 */
function setGlobalServer(server) {
  storybookServer = server;
}

/**
 * Gets the global server reference for testing
 * @returns {http.Server|null}
 */
function getGlobalServer() {
  return storybookServer;
}

/**
 * Starts a static HTTP server to serve the Storybook build
 * @param {string} staticDir - Directory containing the static build
 * @returns {Promise<{server: http.Server, port: number}>}
 */
async function startStaticServer(staticDir) {
  // Get an available port in the 3000-3100 range
  const port = await getPort();

  const server = http.createServer((req, res) => {
    return handler(req, res, {
      public: staticDir,
      cleanUrls: false,
      etag: true,
      symlinks: false,
    });
  });

  await new Promise((resolve, reject) => {
    server.listen(port, "127.0.0.1", () => {
      console.log(`Static server running at http://localhost:${port}`);
      resolve();
    });
    server.on("error", reject);
  });

  return { server, port };
}

/**
 * Filters story IDs based on staged files
 * @param {string[]} stagedFiles - List of staged story files
 * @param {string} storybookPath - Path to the Storybook build directory
 * @returns {string[]|null} - Array of relevant story IDs or null
 */
function getRelevantStoryIds(stagedFiles, storybookPath) {
  try {
    const storiesJsonPath = path.join(storybookPath, "stories.json");
    if (!fs.existsSync(storiesJsonPath)) {
      console.warn("stories.json not found, running all tests");
      return null;
    }

    const stories = JSON.parse(fs.readFileSync(storiesJsonPath, "utf-8"));
    
    // Normalize paths for cross-platform compatibility
    const normalizedStaged = stagedFiles.map((f) => 
      path.normalize(f).replace(/\\/g, '/')
    );

    if (process.env.DEBUG === "1") {
      console.log("Normalized staged files:", normalizedStaged);
    }

    const relevantIds = [];
    for (const [id, story] of Object.entries(stories.stories || {})) {
      // Skip if story has no importPath
      if (!story || !story.importPath) continue;
      
      // Normalize story import path
      const normalizedImportPath = story.importPath.replace(/\\/g, '/');
      
      if (process.env.DEBUG === "1" && relevantIds.length < 3) {
        console.log(`Checking story: ${id} with importPath: ${normalizedImportPath}`);
      }
      
      // Try multiple matching strategies to be more resilient
      const isRelevant = normalizedStaged.some((staged) => {
        // Direct inclusion check
        if (normalizedImportPath.includes(staged)) return true;
        
        // Check without src/ prefix
        const stagedWithoutSrc = staged.replace(/^src\//, '');
        if (normalizedImportPath.includes(stagedWithoutSrc)) return true;
        
        // Check just the filename part (most resilient but less precise)
        const stagedBasename = path.basename(staged);
        return normalizedImportPath.includes(stagedBasename);
      });
      
      if (isRelevant) {
        relevantIds.push(id);
        if (process.env.DEBUG === "1") {
          console.log(`  → Adding relevant story: ${id}`);
        }
      }
    }

    if (process.env.DEBUG === "1") {
      console.log(`Found ${relevantIds.length} relevant story IDs`);
    }

    // Return the array of IDs or an empty array (to allow explicit empty checking)
    return relevantIds;
  } catch (error) {
    console.error("Error filtering stories:", error);
    console.error(error.stack);
    return null;
  }
}

/**
 * Cleanup function that ensures the server is properly closed
 * @param {number} code - Exit code
 */
async function cleanupAndExit(code = 1) {
  if (storybookServer) {
    console.log("\nCleaning up server...");
    try {
      // Add timeout in case .close() hangs
      const closePromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Server close timeout reached, forcing exit");
          resolve();
        }, 5000); // 5 second timeout
        
        storybookServer.close(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
      
      await closePromise;
      console.log("Server closed");
    } catch (err) {
      console.error("Error while closing server:", err.message);
    } finally {
      storybookServer = null;
    }
  }
  
  // For testing purposes, don't immediately exit when running tests
if (require.main === module) {
  // Use setTimeout to ensure all async operations complete before exit
  setTimeout(() => {
    process.exit(code);
  }, 100);
} else {
  // When used in tests, just simulate the exit for verification
  process.emit('beforeExit', code);
}
}

// Enhanced signal handlers for graceful shutdown
// Handle ctrl+c
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT signal (Ctrl+C). Cleaning up...");
  cleanupAndExit(0);
});

// Handle kill command
process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM signal. Cleaning up...");
  cleanupAndExit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("\n💥 Uncaught Exception:", error.message);
  console.error(error.stack);
  cleanupAndExit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("\n💥 Unhandled Promise Rejection:", reason);
  cleanupAndExit(1);
});

// Export functions for testing
module.exports = {
  startStaticServer,
  getRelevantStoryIds,
  cleanupAndExit,
  setGlobalServer,
  getGlobalServer,
};
