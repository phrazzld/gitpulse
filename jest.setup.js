/**
 * Jest setup file - runs before each test file
 *
 * NOTE: Jest configuration files run in a Node.js CommonJS context.
 * ES Module import syntax (import x from 'y') is not supported here.
 * Always use require() for importing modules in Jest configuration files.
 */
require('@testing-library/jest-dom')

/**
 * MOCKING POLICY (CRITICAL)
 * -------------------------
 * 1. NO MOCKING INTERNAL COLLABORATORS: Mocking internal classes, functions, or modules
 *    within the same service/application is STRICTLY FORBIDDEN.
 *
 * 2. MOCK ONLY TRUE EXTERNAL BOUNDARIES: Mocking is permissible ONLY for interfaces
 *    representing genuinely external systems:
 *    - Network I/O (external APIs)
 *    - Databases
 *    - Filesystem
 *    - System Clock
 *    - External Message Brokers
 *
 * 3. ABSTRACT FIRST: Always access external dependencies via interfaces defined
 *    within the codebase. Mock these local abstractions, not the external systems directly.
 *
 * 4. REFACTOR INSTEAD OF INTERNAL MOCKING: If you feel the need to mock an internal
 *    component, this indicates a design issue (high coupling, poor separation).
 *    The REQUIRED ACTION is to refactor the code under test:
 *    - Extract pure functions
 *    - Introduce interfaces
 *    - Use dependency injection
 *    - Break down components
 */

// Add any custom global setup needed for tests
