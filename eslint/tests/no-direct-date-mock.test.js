/**
 * Tests for the no-direct-date-mock ESLint rule
 */

const rule = require('../rules/no-direct-date-mock');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
});

const errorMessage = 'Direct date mocking is not allowed in test files. Use the dateMock utility instead:\n\nimport { createMockDate } from \'@/lib/tests/dateMock\';\n\nconst { restore } = createMockDate(\'2023-01-01T00:00:00Z\');\n// Your test code here\nrestore();';

ruleTester.run('no-direct-date-mock', rule, {
  valid: [
    // Non-test files should be ignored
    {
      code: 'global.Date = jest.fn();',
      filename: 'src/utils/helper.js',
    },
    // Allowed files should be ignored
    {
      code: 'global.Date = MockDate;',
      filename: 'src/lib/tests/dateMock.ts',
    },
    // Using dateMock utility is allowed
    {
      code: `
        import { createMockDate } from '@/lib/tests/dateMock';
        const { restore } = createMockDate('2023-01-01');
      `,
      filename: 'src/components/__tests__/Component.test.ts',
    },
    // Regular Date usage is allowed
    {
      code: 'const now = Date.now();',
      filename: 'src/components/__tests__/Component.test.ts',
    },
    {
      code: 'const date = new Date();',
      filename: 'src/components/__tests__/Component.test.ts',
    },
  ],

  invalid: [
    // Direct global.Date assignment
    {
      code: 'global.Date = jest.fn();',
      filename: 'src/components/__tests__/Component.test.ts',
      errors: [{ messageId: 'noDirectDateMock' }],
    },
    // Direct Date.now assignment
    {
      code: 'Date.now = jest.fn(() => 1234567890);',
      filename: 'src/utils/helper.test.js',
      errors: [{ messageId: 'noDirectDateMock' }],
    },
    // jest.spyOn on global.Date
    {
      code: 'jest.spyOn(global, "Date");',
      filename: 'src/__tests__/app.test.ts',
      errors: [{ messageId: 'noDirectDateMock' }],
    },
    // jest.spyOn on Date.now
    {
      code: 'jest.spyOn(Date, "now");',
      filename: 'src/services/__tests__/api.test.ts',
      errors: [{ messageId: 'noDirectDateMock' }],
    },
    // Object.defineProperty on Date
    {
      code: 'Object.defineProperty(Date, "now", { value: () => 123 });',
      filename: 'src/components/Component.test.tsx',
      errors: [{ messageId: 'noDirectDateMock' }],
    },
    // Multiple violations in one file
    {
      code: `
        global.Date = jest.fn();
        Date.now = () => 123;
      `,
      filename: 'src/utils/__tests__/dates.test.ts',
      errors: [
        { messageId: 'noDirectDateMock' },
        { messageId: 'noDirectDateMock' },
      ],
    },
  ],
});