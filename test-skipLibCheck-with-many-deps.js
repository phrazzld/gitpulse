/**
 * Test skipLibCheck with a large number of type declarations
 *
 * This script simulates a scenario with many type declaration files
 * to better evaluate the impact of skipLibCheck.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Create temporary directory with many .d.ts files
console.log("Creating temporary test directory with many declaration files...");

const TEST_DIR = "test-skip-lib-check-temp";
const NUM_FILES = 50; // Number of type declaration files to create

function createTemporaryFiles() {
  // Create test directory if it doesn't exist
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR);
  }

  // Create many .d.ts files with varying content
  for (let i = 0; i < NUM_FILES; i++) {
    // Alternate between valid and invalid type definitions
    const content =
      i % 2 === 0
        ? `
/**
 * Valid type declaration file ${i}
 */
export type TestType${i} = {
  id: number;
  name: string;
  data: Record<string, unknown>;
};

export function testFunction${i}(arg: TestType${i}): string {
  return arg.name;
}
`
        : `
/**
 * Invalid type declaration file ${i} with deliberate errors
 */
export type TestType${i} = {
  id: number;
  name: string;
  // Error: implicit any
  data: Record<string, any>;
};

// Error: missing parameter type
export function testFunction${i}(arg): string {
  return arg.missing; // Error: property doesn't exist
}
`;

    fs.writeFileSync(path.join(TEST_DIR, `test-file-${i}.d.ts`), content);
  }

  // Create a temporary tsconfig file for testing
  const tsConfig = {
    compilerOptions: {
      target: "ES2017",
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      skipLibCheck: false,
      lib: ["dom", "esnext"],
    },
    include: [`${TEST_DIR}/**/*.d.ts`],
  };

  fs.writeFileSync(
    path.join(TEST_DIR, "tsconfig.json"),
    JSON.stringify(tsConfig, null, 2),
  );
}

// Remove temporary files
function cleanupTemporaryFiles() {
  console.log("Cleaning up temporary files...");
  if (fs.existsSync(TEST_DIR)) {
    const files = fs.readdirSync(TEST_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(TEST_DIR, file));
    }
    fs.rmdirSync(TEST_DIR);
  }
}

// Function to run a command and measure execution time
function runCommand(command) {
  console.log(`Running: ${command}`);
  const start = Date.now();

  try {
    const output = execSync(command, { encoding: "utf8" });
    const end = Date.now();
    const duration = (end - start) / 1000;
    console.log(`✅ Command completed in ${duration.toFixed(2)} seconds`);
    return { success: true, duration, output };
  } catch (error) {
    const end = Date.now();
    const duration = (end - start) / 1000;
    console.log(`❌ Command failed after ${duration.toFixed(2)} seconds`);

    // Count the number of errors
    const errorLines = (error.stdout || "")
      .split("\n")
      .filter((line) => line.includes("error TS"));
    console.log(`   Found ${errorLines.length} type errors`);

    return {
      success: false,
      duration,
      errorCount: errorLines.length,
      errorSample: errorLines.slice(0, 3),
    };
  }
}

// Run tests with and without skipLibCheck
function runTests() {
  console.log(`\n🧪 Testing with ${NUM_FILES} declaration files...\n`);

  // Test with skipLibCheck enabled
  console.log("\n🔍 TESTING WITH --skipLibCheck FLAG\n");
  const withSkipResult = runCommand(
    `npx tsc --noEmit --skipLibCheck --project ${TEST_DIR}/tsconfig.json`,
  );

  // Test without skipLibCheck
  console.log("\n🔍 TESTING WITHOUT --skipLibCheck FLAG\n");
  const withoutSkipResult = runCommand(
    `npx tsc --noEmit --project ${TEST_DIR}/tsconfig.json`,
  );

  // Compare results
  console.log("\n📊 RESULTS COMPARISON\n");
  console.log(
    `With skipLibCheck:    ${withSkipResult.duration.toFixed(2)}s (${withSkipResult.success ? "Passed ✅" : `Failed ❌ with ${withSkipResult.errorCount} errors`})`,
  );
  console.log(
    `Without skipLibCheck: ${withoutSkipResult.duration.toFixed(2)}s (${withoutSkipResult.success ? "Passed ✅" : `Failed ❌ with ${withoutSkipResult.errorCount} errors`})`,
  );

  if (withSkipResult.success !== withoutSkipResult.success) {
    console.log("\n🔎 VALIDATION: skipLibCheck affects type checking results");

    if (withSkipResult.success && !withoutSkipResult.success) {
      console.log(
        "skipLibCheck allows type checking to pass by ignoring errors in declaration files",
      );
      if (
        withoutSkipResult.errorSample &&
        withoutSkipResult.errorSample.length > 0
      ) {
        console.log("\nSample errors that skipLibCheck ignores:");
        withoutSkipResult.errorSample.forEach((err) => console.log(`- ${err}`));
      }
    } else {
      console.log(
        "Unexpected: Type checking passes without skipLibCheck but fails with it",
      );
    }
  } else if (withSkipResult.success && withoutSkipResult.success) {
    console.log(
      "\n🔎 VALIDATION: skipLibCheck does not affect type checking results in this case",
    );
  }

  // Performance impact
  const performanceRatio = withoutSkipResult.duration / withSkipResult.duration;
  if (performanceRatio > 1.1) {
    console.log(
      `\n⏱️ PERFORMANCE: skipLibCheck is ${performanceRatio.toFixed(2)}x faster`,
    );
  } else if (performanceRatio < 0.9) {
    console.log(
      `\n⏱️ PERFORMANCE: skipLibCheck is ${(1 / performanceRatio).toFixed(2)}x slower`,
    );
  } else {
    console.log("\n⏱️ PERFORMANCE: No significant difference");
  }

  return {
    withSkipLibCheck: withSkipResult,
    withoutSkipLibCheck: withoutSkipResult,
  };
}

// Main execution
try {
  createTemporaryFiles();
  const results = runTests();
} finally {
  cleanupTemporaryFiles();
}
