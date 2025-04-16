/**
 * This is a temporary file to test the pre-commit hook.
 * The type error has been fixed to allow the commit.
 */

// No type error: number assigned to number
const testNumber: number = 42;

export function getTestNumber(): number {
  return testNumber;
}