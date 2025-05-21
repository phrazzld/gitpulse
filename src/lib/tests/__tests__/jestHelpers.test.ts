import { 
  formatObject, 
  formatDiff,
  findFirstDifference
} from '../jestHelpers';

describe('Jest Helper Functions', () => {
  describe('formatObject', () => {
    it('formats primitive values correctly', () => {
      expect(formatObject(null)).toBe('null');
      expect(formatObject(undefined)).toBe('undefined');
      expect(formatObject(123)).toBe('123');
      expect(formatObject('test')).toBe('"test"');
      expect(formatObject(true)).toBe('true');
    });

    it('formats simple objects correctly', () => {
      const result = formatObject({ a: 1, b: 'test' }).replace(/\s+/g, ' ');
      expect(result).toContain('"a": 1');
      expect(result).toContain('"b": "test"');
    });

    it('formats nested objects with indentation', () => {
      const obj = { 
        a: 1, 
        b: { 
          c: 'test',
          d: [1, 2, 3]
        }
      };
      const result = formatObject(obj);
      expect(result).toContain('"a": 1');
      expect(result).toContain('"b": {');
      expect(result).toContain('"c": "test"');
      expect(result).toContain('"d": [');
    });

    it('handles empty objects and arrays', () => {
      expect(formatObject({})).toBe('{}');
      expect(formatObject([])).toBe('[]');
    });
  });

  describe('formatDiff', () => {
    it('formats the difference between objects', () => {
      const actual = { a: 1, b: 'wrong' };
      const expected = { a: 1, b: 'correct' };
      
      const result = formatDiff(actual, expected);
      
      expect(result).toContain('Expected:');
      expect(result).toContain('Received:');
      expect(result).toContain('"b": "correct"');
      expect(result).toContain('"b": "wrong"');
    });

    it('includes a custom message when provided', () => {
      const actual = [1, 2, 3];
      const expected = [1, 2, 4];
      
      const result = formatDiff(actual, expected, 'Arrays differ at index 2');
      
      expect(result).toContain('Arrays differ at index 2');
      // Values should be present but may be formatted with whitespace
      expect(result).toContain('3');
      expect(result).toContain('4');
      // Verify the diff contains the arrays in some form
      expect(result).toMatch(/\[\s*1\s*,\s*2\s*,\s*3\s*\]/);
      expect(result).toMatch(/\[\s*1\s*,\s*2\s*,\s*4\s*\]/);
    });
  });

  describe('findFirstDifference', () => {
    it('identifies type mismatches', () => {
      expect(findFirstDifference(123, '123')).toContain('Type mismatch');
    });

    it('finds differences in simple values', () => {
      expect(findFirstDifference(5, 10)).toContain('Value mismatch');
    });

    it('identifies missing keys in objects', () => {
      const actual = { a: 1 };
      const expected = { a: 1, b: 2 };
      
      expect(findFirstDifference(actual, expected)).toContain('Missing keys');
      expect(findFirstDifference(actual, expected)).toContain('b');
    });

    it('identifies extra keys in objects', () => {
      const actual = { a: 1, b: 2, c: 3 };
      const expected = { a: 1, b: 2 };
      
      expect(findFirstDifference(actual, expected)).toContain('Extra keys');
      expect(findFirstDifference(actual, expected)).toContain('c');
    });

    it('finds differences in nested objects', () => {
      const actual = { a: 1, b: { c: 'wrong' } };
      const expected = { a: 1, b: { c: 'correct' } };
      
      expect(findFirstDifference(actual, expected)).toContain('difference at key "c"');
    });

    it('finds differences in arrays', () => {
      const actual = [1, 2, 'wrong'];
      const expected = [1, 2, 'correct'];
      
      expect(findFirstDifference(actual, expected)).toContain('index 2');
    });

    it('identifies array length differences', () => {
      const actual = [1, 2];
      const expected = [1, 2, 3];
      
      expect(findFirstDifference(actual, expected)).toContain('Array length mismatch');
    });
  });
});