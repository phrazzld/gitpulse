/**
 * ESLint rule to enforce usage of dateMock.ts instead of direct date mocking
 * 
 * This rule prevents direct manipulation of global.Date or Date.now in test files
 * and encourages the use of the centralized dateMock utility.
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct date mocking in test files',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noDirectDateMock: 'Direct date mocking is not allowed in test files. Use the dateMock utility instead:\n\nimport { createMockDate } from \'@/lib/tests/dateMock\';\n\nconst { restore } = createMockDate(\'2023-01-01T00:00:00Z\');\n// Your test code here\nrestore();',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedFiles: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        },
        additionalProperties: false
      }
    ]
  },

  create(context) {
    const allowedFiles = context.options[0]?.allowedFiles || ['src/lib/tests/dateMock.ts'];
    const filename = context.getFilename();
    
    // Check if current file is in the allowed list
    if (allowedFiles.some(allowed => filename.endsWith(allowed))) {
      return {};
    }

    // Only apply this rule to test files
    const isTestFile = filename.includes('.test.') || 
                      filename.includes('.spec.') || 
                      filename.includes('__tests__');
    
    if (!isTestFile) {
      return {};
    }

    return {
      // Check for global.Date assignment
      AssignmentExpression(node) {
        if (
          node.left.type === 'MemberExpression' &&
          node.left.object.type === 'Identifier' &&
          node.left.object.name === 'global' &&
          node.left.property.type === 'Identifier' &&
          node.left.property.name === 'Date'
        ) {
          context.report({
            node,
            messageId: 'noDirectDateMock'
          });
        }
        
        // Check for Date.now assignment
        if (
          node.left.type === 'MemberExpression' &&
          node.left.object.type === 'Identifier' &&
          node.left.object.name === 'Date' &&
          node.left.property.type === 'Identifier' &&
          node.left.property.name === 'now'
        ) {
          context.report({
            node,
            messageId: 'noDirectDateMock'
          });
        }
      },

      // Check for jest.spyOn(global, 'Date')
      CallExpression(node) {
        // Check for jest.spyOn patterns
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'jest' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'spyOn' &&
          node.arguments.length >= 2
        ) {
          const [obj, method] = node.arguments;
          
          // Check if spying on global.Date
          if (
            obj.type === 'Identifier' &&
            obj.name === 'global' &&
            method.type === 'Literal' &&
            method.value === 'Date'
          ) {
            context.report({
              node,
              messageId: 'noDirectDateMock'
            });
          }
          
          // Check if spying on Date.now
          if (
            obj.type === 'Identifier' &&
            obj.name === 'Date' &&
            method.type === 'Literal' &&
            method.value === 'now'
          ) {
            context.report({
              node,
              messageId: 'noDirectDateMock'
            });
          }
        }
        
        // Check for Object.defineProperty on Date
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'Object' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'defineProperty' &&
          node.arguments.length >= 2
        ) {
          const [obj] = node.arguments;
          
          if (
            obj.type === 'Identifier' &&
            obj.name === 'Date'
          ) {
            context.report({
              node,
              messageId: 'noDirectDateMock'
            });
          }
        }
      }
    };
  }
};