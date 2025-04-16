#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Configuration
const LINE_THRESHOLD = 300;
const TOP_N_FILES = 5;

// Get files from command line arguments
const filesToCheck = process.argv.slice(2);

if (filesToCheck.length === 0) {
  console.log("No files to check.");
  process.exit(0);
}

// Function to count lines in a file
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.split("\n").length;
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return 0;
  }
}

// Track files exceeding threshold
const largeFiles = [];

// Check each file
console.log("\n🔍 Checking file sizes...");
filesToCheck.forEach((filePath) => {
  const lineCount = countLines(filePath);
  const relativePath = path.relative(process.cwd(), filePath);

  if (lineCount > LINE_THRESHOLD) {
    largeFiles.push({ path: relativePath, lines: lineCount });
    console.warn(
      `⚠️  WARNING: ${relativePath} has ${lineCount} lines (exceeds threshold of ${LINE_THRESHOLD})`,
    );
  }
});

// Sort large files by line count (descending)
largeFiles.sort((a, b) => b.lines - a.lines);

// Display summary if large files were found
if (largeFiles.length > 0) {
  console.log("\n📊 Summary of large files:");
  largeFiles.slice(0, TOP_N_FILES).forEach((file, index) => {
    console.log(`  ${index + 1}. ${file.path}: ${file.lines} lines`);
  });

  if (largeFiles.length > TOP_N_FILES) {
    console.log(
      `  ...and ${largeFiles.length - TOP_N_FILES} more file(s) exceeding the threshold`,
    );
  }

  console.log("\n💡 Consider refactoring these files to reduce their size.");
  console.log(
    `   The recommended maximum is ${LINE_THRESHOLD} lines per file.`,
  );
  console.log("   This is a warning only and does not prevent the commit.\n");
}

// Exit with success code (allow commit to proceed)
process.exit(0);
