/**
 * Test script to compare TypeScript type checking performance
 * with and without the skipLibCheck flag
 */

const { execSync } = require("child_process");
const fs = require("fs");

// Function to run the command and measure execution time
function runCommand(command) {
  console.log(`Running: ${command}`);
  const start = Date.now();

  try {
    execSync(command, { stdio: "inherit" });
    const end = Date.now();
    const duration = (end - start) / 1000; // in seconds
    console.log(`✅ Command completed in ${duration.toFixed(2)} seconds`);
    return { success: true, duration };
  } catch (error) {
    const end = Date.now();
    const duration = (end - start) / 1000; // in seconds
    console.log(`❌ Command failed after ${duration.toFixed(2)} seconds`);
    console.error(`Error: ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

// Test type checking with skipLibCheck (current behavior)
console.log("\n🔍 TESTING WITH --skipLibCheck FLAG (CURRENT BEHAVIOR)\n");
const withSkipResult = runCommand(
  "npx tsc --noEmit --skipLibCheck --project tsconfig.json",
);

// Test type checking without skipLibCheck
console.log("\n🔍 TESTING WITHOUT --skipLibCheck FLAG\n");
const withoutSkipResult = runCommand(
  "npx tsc --noEmit --project tsconfig.json",
);

// Compare and summarize results
console.log("\n📊 COMPARISON RESULTS\n");
console.log(
  `With skipLibCheck: ${withSkipResult.duration.toFixed(2)} seconds (${withSkipResult.success ? "Passed" : "Failed"})`,
);
console.log(
  `Without skipLibCheck: ${withoutSkipResult.duration.toFixed(2)} seconds (${withoutSkipResult.success ? "Passed" : "Failed"})`,
);

if (withSkipResult.success && withoutSkipResult.success) {
  const speedup = withoutSkipResult.duration / withSkipResult.duration;
  console.log(
    `\nSkipLibCheck makes type checking ${speedup.toFixed(2)}x faster`,
  );
} else if (withSkipResult.success && !withoutSkipResult.success) {
  console.log(
    "\nSkipLibCheck allows type checking to pass, while it fails without the flag",
  );
} else if (!withSkipResult.success && withoutSkipResult.success) {
  console.log(
    "\nType checking fails with skipLibCheck but passes without it (unexpected)",
  );
} else {
  console.log("\nType checking fails in both scenarios");
}

// Save results to a file
const results = {
  withSkipLibCheck: withSkipResult,
  withoutSkipLibCheck: withoutSkipResult,
  timestamp: new Date().toISOString(),
};

fs.writeFileSync(
  "skipLibCheck-test-results.json",
  JSON.stringify(results, null, 2),
);
console.log("\nResults saved to skipLibCheck-test-results.json");
