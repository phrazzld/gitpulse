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
    const normalizedStaged = stagedFiles.map((f) => path.normalize(f));

    const relevantIds = [];
    for (const [id, story] of Object.entries(stories.stories)) {
      if (
        normalizedStaged.some((staged) => story.importPath.includes(staged))
      ) {
        relevantIds.push(id);
      }
    }

    return relevantIds.length > 0 ? relevantIds : null;
  } catch (error) {
    console.error("Error filtering stories:", error);
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
    await new Promise((resolve) => storybookServer.close(resolve));
    console.log("Server closed");
    storybookServer = null;
  }
  process.exit(code);
}

// Set up signal handlers for graceful shutdown
process.on("SIGINT", () => cleanupAndExit());
process.on("SIGTERM", () => cleanupAndExit());

// Export functions for testing
module.exports = {
  startStaticServer,
  getRelevantStoryIds,
  cleanupAndExit,
  setGlobalServer,
  getGlobalServer,
};
