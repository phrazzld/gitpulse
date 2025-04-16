#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Configuration
// Using the consistent threshold of 400 lines as per FILE_SIZE_THRESHOLD_DECISION.md
const LINE_THRESHOLD = 400;
const TOP_N_FILES = 5;
const EXCLUDE_BLANK_LINES = true;
const EXCLUDE_COMMENTS = true;

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
    let lines = content.split("\n");

    if (EXCLUDE_BLANK_LINES) {
      lines = lines.filter((line) => line.trim().length > 0);
    }

    if (EXCLUDE_COMMENTS) {
      // Detect file type by extension to apply appropriate comment patterns
      const ext = path.extname(filePath).toLowerCase();
      const isJsOrTs = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"].includes(
        ext,
      );
      const isCss = [".css", ".scss", ".less"].includes(ext);
      const isHtml = [".html", ".htm", ".jsx", ".tsx"].includes(ext);
      const isMarkdown = [".md", ".markdown"].includes(ext);

      // Apply appropriate comment filtering based on file type
      if (isJsOrTs) {
        // Filter out JS/TS comments (// and /* */)
        lines = lines.filter((line) => {
          const trimmed = line.trim();
          return !(
            trimmed.startsWith("//") ||
            trimmed.startsWith("/*") ||
            trimmed.endsWith("*/") ||
            trimmed.includes("* ")
          );
        });
      } else if (isCss) {
        // Filter out CSS comments (/* */)
        lines = lines.filter((line) => {
          const trimmed = line.trim();
          return !(
            trimmed.startsWith("/*") ||
            trimmed.endsWith("*/") ||
            trimmed.includes("* ")
          );
        });
      } else if (isHtml) {
        // Filter out HTML comments (<!-- -->)
        lines = lines.filter((line) => {
          const trimmed = line.trim();
          return !(
            trimmed.startsWith("<!--") ||
            trimmed.endsWith("-->") ||
            trimmed.includes("-->")
          );
        });
      } else if (isMarkdown) {
        // We don't filter markdown comments as they're part of the content
      }
    }

    return lines.length;
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
      `⚠️  WARNING: ${relativePath} has ${lineCount} significant lines ` +
        `(exceeds threshold of ${LINE_THRESHOLD}, ${EXCLUDE_BLANK_LINES ? "excluding blank lines" : "including all lines"}` +
        `${EXCLUDE_COMMENTS ? " and comments" : ""})`,
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
    `   The recommended maximum is ${LINE_THRESHOLD} significant lines per file ` +
      `(${EXCLUDE_BLANK_LINES ? "excluding blank lines" : "including all lines"}` +
      `${EXCLUDE_COMMENTS ? " and comments" : ""}).`,
  );
  console.log("   This is a warning only and does not prevent the commit.\n");
}

// Exit with success code (allow commit to proceed)
process.exit(0);
