/**
 * This file is created for testing the pre-commit hook TypeScript checking.
 * It contains a deliberate type error to verify that the hook catches it.
 */

// Fixed type: number assigned to number type
const testNumber: number = 42;

// Function with correct typing for later use
function add(a: number, b: number): number {
  return a + b;
}

export { add };