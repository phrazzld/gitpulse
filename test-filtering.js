/**
 * Test script for repository filtering functionality
 *
 * This script simulates the API requests that would be made when using the filtering functionality
 * and validates that filtering works correctly without organization options.
 */

// Base URL for API requests
const API_URL = "http://localhost:3000/api";

// Mock session data for API requests
const SESSION = {
  accessToken: "mock-access-token",
  user: {
    name: "Test User",
    email: "test@example.com",
  },
};

// Test cases for different filter combinations
const TEST_CASES = [
  {
    name: "No filters",
    params: {
      since: "2023-01-01",
      until: "2023-12-31",
    },
  },
  {
    name: "With repository filter",
    params: {
      since: "2023-01-01",
      until: "2023-12-31",
      repositories: "username/repo1,username/repo2",
    },
  },
  {
    name: "With date range",
    params: {
      since: "2023-02-01",
      until: "2023-02-28",
    },
  },
];

/**
 * Test fetching repositories with various filters
 */
async function testReposFetch() {
  console.log("===== Testing /api/repos endpoint =====");
  try {
    const response = await fetch(`${API_URL}/repos`);
    const data = await response.json();

    console.log(`Fetched ${data.repositories?.length || 0} repositories`);

    // Verify no organization fields in response
    const hasOrgField = data.hasOwnProperty("organizations");
    console.log(
      `Contains organizations field: ${hasOrgField} (should be false)`,
    );

    return data.repositories || [];
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return [];
  }
}

/**
 * Test summary generation with various filters
 */
async function testSummaryGeneration(testCase) {
  console.log(
    `\n===== Testing /api/summary endpoint with ${testCase.name} =====`,
  );

  // Build query string from params
  const queryString = Object.entries(testCase.params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  try {
    const response = await fetch(`${API_URL}/summary?${queryString}`);
    const data = await response.json();

    // Basic validation
    console.log(`Status: ${response.status}`);
    console.log(`Received commits: ${data.commits?.length || 0}`);

    // Check filter info in response
    if (data.filterInfo) {
      console.log("Filter info:");
      console.log(
        ` - Date range: ${data.filterInfo.dateRange?.since} to ${data.filterInfo.dateRange?.until}`,
      );
      console.log(` - Repositories: ${data.filterInfo.repositories || "all"}`);
      console.log(
        ` - Organizations: ${data.filterInfo.organizations || "N/A (should be null)"}`,
      );
    }

    return data;
  } catch (error) {
    console.error("Error generating summary:", error);
    return null;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("Starting filtering functionality tests...\n");

  // Test repository fetching
  const repos = await testReposFetch();

  // Test summary generation with each test case
  for (const testCase of TEST_CASES) {
    await testSummaryGeneration(testCase);
  }

  console.log("\nTests completed.");
}

// Run the tests
runTests();
