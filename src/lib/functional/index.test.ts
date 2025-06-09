import {
  pipe,
  compose,
  identity,
  constant,
  prop,
  pick,
  omit,
  groupBy,
  uniqueBy,
  sortBy,
  filter,
  map,
  take,
  skip,
  partition,
  chunk,
  isEmpty,
  isNotEmpty
} from './index';

describe('Functional Programming Utilities', () => {
  describe('pipe', () => {
    it('should return value unchanged when no functions provided', () => {
      expect(pipe(42)).toBe(42);
      expect(pipe('hello')).toBe('hello');
      expect(pipe(null)).toBe(null);
    });

    it('should apply single function', () => {
      const double = (x: number) => x * 2;
      expect(pipe(5, double)).toBe(10);
    });

    it('should apply multiple functions left to right', () => {
      const add1 = (x: number) => x + 1;
      const double = (x: number) => x * 2;
      const toString = (x: number) => x.toString();

      expect(pipe(5, add1, double, toString)).toBe('12');
    });

    it('should handle type transformations', () => {
      expect(pipe(123, (x: number) => x.toString(), (s: string) => s.length, (n: number) => n % 2 === 0)).toBe(false); // length is 3, which is odd
    });

    it('should not mutate input arrays', () => {
      const input = [1, 2, 3];
      const double = (arr: number[]) => arr.map(x => x * 2);
      const result = pipe(input, double);
      
      expect(input).toEqual([1, 2, 3]); // original unchanged
      expect(result).toEqual([2, 4, 6]);
    });
  });

  describe('compose', () => {
    it('should apply single function', () => {
      const double = (x: number) => x * 2;
      const composed = compose(double);
      expect(composed(5)).toBe(10);
    });

    it('should apply multiple functions right to left', () => {
      const add1 = (x: number) => x + 1;
      const double = (x: number) => x * 2;
      const toString = (x: number) => x.toString();

      // compose(toString, double, add1)(5) === toString(double(add1(5)))
      const composed = compose(toString as any, double, add1);
      expect(composed(5)).toBe('12');
    });

    it('should handle type transformations', () => {
      const toString = (x: number) => x.toString();
      const getLength = (s: string) => s.length;
      const isEven = (n: number) => n % 2 === 0;
      const composed = compose(isEven, getLength, toString);
      expect(composed(123)).toBe(false); // 123 -> "123" -> 3 -> false
    });

    it('should be equivalent to pipe in reverse order', () => {
      const add1 = (x: number) => x + 1;
      const double = (x: number) => x * 2;

      const piped = pipe(5, add1, double);
      const composed = compose(double, add1)(5);

      expect(piped).toBe(composed);
    });
  });

  describe('identity', () => {
    it('should return input unchanged', () => {
      expect(identity(42)).toBe(42);
      expect(identity('hello')).toBe('hello');
      expect(identity(null)).toBe(null);
      expect(identity(undefined)).toBe(undefined);
      
      const obj = { a: 1 };
      expect(identity(obj)).toBe(obj);
    });
  });

  describe('constant', () => {
    it('should return constant value regardless of input', () => {
      const const42 = constant(42);
      expect(const42()).toBe(42);
      
      const constHello = constant('hello');
      expect(constHello()).toBe('hello');
    });
  });

  describe('prop', () => {
    it('should extract property from object', () => {
      const obj: { name: string; age: number; city: string } = { name: 'John', age: 30, city: 'NYC' };
      
      expect(prop<typeof obj, 'name'>('name')(obj)).toBe('John');
      expect(prop<typeof obj, 'age'>('age')(obj)).toBe(30);
      expect(prop<typeof obj, 'city'>('city')(obj)).toBe('NYC');
    });

    it('should work with nested properties when accessing first level', () => {
      const obj: { user: { name: string }; count: number } = { user: { name: 'John' }, count: 5 };
      expect(prop<typeof obj, 'user'>('user')(obj)).toEqual({ name: 'John' });
      expect(prop<typeof obj, 'count'>('count')(obj)).toBe(5);
    });
  });

  describe('pick', () => {
    it('should pick specified properties', () => {
      const obj: { name: string; age: number; city: string; country: string } = { name: 'John', age: 30, city: 'NYC', country: 'USA' };
      const result = pick<typeof obj, 'name' | 'city'>(['name', 'city'])(obj);
      
      expect(result).toEqual({ name: 'John', city: 'NYC' });
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should not mutate original object', () => {
      const obj: { name: string; age: number } = { name: 'John', age: 30 };
      const result = pick<typeof obj, 'name'>(['name'])(obj);
      
      expect(obj).toEqual({ name: 'John', age: 30 });
      expect(result).not.toBe(obj);
    });

    it('should handle empty keys array', () => {
      const obj: { name: string; age: number } = { name: 'John', age: 30 };
      const result = pick([])(obj);
      
      expect(result).toEqual({});
    });
  });

  describe('omit', () => {
    it('should omit specified properties', () => {
      const obj: { name: string; age: number; city: string; country: string } = { name: 'John', age: 30, city: 'NYC', country: 'USA' };
      const result = omit<typeof obj, 'age' | 'country'>(['age', 'country'])(obj);
      
      expect(result).toEqual({ name: 'John', city: 'NYC' });
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should not mutate original object', () => {
      const obj: { name: string; age: number } = { name: 'John', age: 30 };
      const result = omit<typeof obj, 'age'>(['age'])(obj);
      
      expect(obj).toEqual({ name: 'John', age: 30 });
      expect(result).not.toBe(obj);
    });

    it('should handle empty keys array', () => {
      const obj: { name: string; age: number } = { name: 'John', age: 30 };
      const result = omit([])(obj);
      
      expect(result).toEqual({ name: 'John', age: 30 });
      expect(result).not.toBe(obj);
    });
  });

  describe('groupBy', () => {
    it('should group array items by key function', () => {
      const people = [
        { name: 'John', age: 25, city: 'NYC' },
        { name: 'Jane', age: 30, city: 'LA' },
        { name: 'Bob', age: 25, city: 'NYC' },
        { name: 'Alice', age: 30, city: 'Chicago' }
      ];

      const byAge = groupBy((person: typeof people[0]) => person.age)(people);
      expect(byAge).toEqual({
        25: [
          { name: 'John', age: 25, city: 'NYC' },
          { name: 'Bob', age: 25, city: 'NYC' }
        ],
        30: [
          { name: 'Jane', age: 30, city: 'LA' },
          { name: 'Alice', age: 30, city: 'Chicago' }
        ]
      });

      const byCity = groupBy((person: typeof people[0]) => person.city)(people);
      expect(byCity.NYC).toHaveLength(2);
      expect(byCity.LA).toHaveLength(1);
      expect(byCity.Chicago).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const result = groupBy((x: number) => x % 2)([]);
      expect(result).toEqual({});
    });

    it('should not mutate original array', () => {
      const arr = [1, 2, 3, 4];
      const result = groupBy((x: number) => x % 2)(arr);
      
      expect(arr).toEqual([1, 2, 3, 4]);
      expect(result).toEqual({
        1: [1, 3],
        0: [2, 4]
      });
    });
  });

  describe('uniqueBy', () => {
    it('should remove duplicates based on key function', () => {
      const people = [
        { name: 'John', id: 1 },
        { name: 'Jane', id: 2 },
        { name: 'John', id: 1 }, // duplicate
        { name: 'Bob', id: 3 }
      ];

      const unique = uniqueBy((person: typeof people[0]) => person.id)(people);
      expect(unique).toHaveLength(3);
      expect(unique.map(p => p.name)).toEqual(['John', 'Jane', 'Bob']);
    });

    it('should preserve first occurrence of duplicates', () => {
      const items = [
        { value: 'a', order: 1 },
        { value: 'b', order: 2 },
        { value: 'a', order: 3 } // duplicate with different order
      ];

      const unique = uniqueBy((item: typeof items[0]) => item.value)(items);
      expect(unique).toEqual([
        { value: 'a', order: 1 }, // first occurrence preserved
        { value: 'b', order: 2 }
      ]);
    });

    it('should handle empty array', () => {
      const result = uniqueBy((x: number) => x)([]);
      expect(result).toEqual([]);
    });

    it('should not mutate original array', () => {
      const arr = [1, 2, 1, 3];
      const result = uniqueBy((x: number) => x)(arr);
      
      expect(arr).toEqual([1, 2, 1, 3]);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('sortBy', () => {
    it('should sort array by comparator function', () => {
      const numbers = [3, 1, 4, 1, 5, 9, 2, 6];
      const sorted = sortBy((a: number, b: number) => a - b)(numbers);
      
      expect(sorted).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
    });

    it('should sort objects by property', () => {
      const people = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 }
      ];

      const sortedByAge = sortBy((a: typeof people[0], b: typeof people[0]) => a.age - b.age)(people);
      expect(sortedByAge.map(p => p.name)).toEqual(['Jane', 'John', 'Bob']);
    });

    it('should not mutate original array', () => {
      const arr = [3, 1, 2];
      const result = sortBy((a: number, b: number) => a - b)(arr);
      
      expect(arr).toEqual([3, 1, 2]);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('filter', () => {
    it('should filter array by predicate', () => {
      const numbers = [1, 2, 3, 4, 5, 6];
      const evens = filter((x: number) => x % 2 === 0)(numbers);
      
      expect(evens).toEqual([2, 4, 6]);
    });

    it('should handle empty array', () => {
      const result = filter((x: number) => x > 0)([]);
      expect(result).toEqual([]);
    });

    it('should not mutate original array', () => {
      const arr = [1, 2, 3, 4];
      const result = filter((x: number) => x > 2)(arr);
      
      expect(arr).toEqual([1, 2, 3, 4]);
      expect(result).toEqual([3, 4]);
    });
  });

  describe('map', () => {
    it('should transform array elements', () => {
      const numbers = [1, 2, 3, 4];
      const doubled = map((x: number) => x * 2)(numbers);
      
      expect(doubled).toEqual([2, 4, 6, 8]);
    });

    it('should handle type transformations', () => {
      const numbers = [1, 2, 3];
      const strings = map((x: number) => x.toString())(numbers);
      
      expect(strings).toEqual(['1', '2', '3']);
    });

    it('should handle empty array', () => {
      const result = map((x: number) => x * 2)([]);
      expect(result).toEqual([]);
    });

    it('should not mutate original array', () => {
      const arr = [1, 2, 3];
      const result = map((x: number) => x * 2)(arr);
      
      expect(arr).toEqual([1, 2, 3]);
      expect(result).toEqual([2, 4, 6]);
    });
  });

  describe('take', () => {
    it('should take first n elements', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(take(3)(arr)).toEqual([1, 2, 3]);
      expect(take(0)(arr)).toEqual([]);
      expect(take(10)(arr)).toEqual([1, 2, 3, 4, 5]); // more than length
    });

    it('should handle empty array', () => {
      expect(take(3)([])).toEqual([]);
    });

    it('should not mutate original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = take(3)(arr);
      
      expect(arr).toEqual([1, 2, 3, 4, 5]);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('skip', () => {
    it('should skip first n elements', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(skip(2)(arr)).toEqual([3, 4, 5]);
      expect(skip(0)(arr)).toEqual([1, 2, 3, 4, 5]);
      expect(skip(10)(arr)).toEqual([]); // more than length
    });

    it('should handle empty array', () => {
      expect(skip(3)([])).toEqual([]);
    });

    it('should not mutate original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = skip(2)(arr);
      
      expect(arr).toEqual([1, 2, 3, 4, 5]);
      expect(result).toEqual([3, 4, 5]);
    });
  });

  describe('partition', () => {
    it('should partition array based on predicate', () => {
      const numbers = [1, 2, 3, 4, 5, 6];
      const [evens, odds] = partition((x: number) => x % 2 === 0)(numbers);
      
      expect(evens).toEqual([2, 4, 6]);
      expect(odds).toEqual([1, 3, 5]);
    });

    it('should handle empty array', () => {
      const [pass, fail] = partition((x: number) => x > 0)([]);
      expect(pass).toEqual([]);
      expect(fail).toEqual([]);
    });

    it('should handle all true predicate', () => {
      const [pass, fail] = partition((x: number) => true)([1, 2, 3]);
      expect(pass).toEqual([1, 2, 3]);
      expect(fail).toEqual([]);
    });

    it('should handle all false predicate', () => {
      const [pass, fail] = partition((x: number) => false)([1, 2, 3]);
      expect(pass).toEqual([]);
      expect(fail).toEqual([1, 2, 3]);
    });

    it('should not mutate original array', () => {
      const arr = [1, 2, 3, 4];
      const result = partition((x: number) => x % 2 === 0)(arr);
      
      expect(arr).toEqual([1, 2, 3, 4]);
      expect(result).toEqual([[2, 4], [1, 3]]);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks of specified size', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8];
      expect(chunk(3)(arr)).toEqual([[1, 2, 3], [4, 5, 6], [7, 8]]);
      expect(chunk(2)(arr)).toEqual([[1, 2], [3, 4], [5, 6], [7, 8]]);
      expect(chunk(1)(arr)).toEqual([[1], [2], [3], [4], [5], [6], [7], [8]]);
    });

    it('should handle chunk size larger than array', () => {
      const arr = [1, 2, 3];
      expect(chunk(5)(arr)).toEqual([[1, 2, 3]]);
    });

    it('should handle empty array', () => {
      expect(chunk(3)([])).toEqual([]);
    });

    it('should not mutate original array', () => {
      const arr = [1, 2, 3, 4, 5, 6];
      const result = chunk(2)(arr);
      
      expect(arr).toEqual([1, 2, 3, 4, 5, 6]);
      expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty array', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('should return false for non-empty array', () => {
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('should return false for empty array', () => {
      expect(isNotEmpty([])).toBe(false);
    });

    it('should return true for non-empty array', () => {
      expect(isNotEmpty([1])).toBe(true);
      expect(isNotEmpty([1, 2, 3])).toBe(true);
    });
  });

  describe('function composition and immutability', () => {
    it('should allow complex function composition', () => {
      const data = [
        { name: 'John', age: 25, score: 85 },
        { name: 'Jane', age: 30, score: 92 },
        { name: 'Bob', age: 25, score: 78 },
        { name: 'Alice', age: 28, score: 95 }
      ];

      // Complex transformation using pipe
      const result = pipe(
        data,
        filter((person: typeof data[0]) => person.age >= 25),
        sortBy((a: typeof data[0], b: typeof data[0]) => b.score - a.score),
        take(2),
        map((person: typeof data[0]) => person.name)
      );

      expect(result).toEqual(['Alice', 'Jane']);
    });

    it('should maintain immutability throughout pipeline', () => {
      const original = [1, 2, 3, 4, 5];
      
      const result = pipe(
        original,
        filter((x: number) => x % 2 === 0),
        map((x: number) => x * 2),
        sortBy((a: number, b: number) => b - a)
      );

      expect(original).toEqual([1, 2, 3, 4, 5]); // unchanged
      expect(result).toEqual([8, 4]); // transformed
    });

    it('should work with groupBy in complex scenarios', () => {
      const commits = [
        { repo: 'frontend', author: 'john', date: '2023-01-01' },
        { repo: 'backend', author: 'jane', date: '2023-01-01' },
        { repo: 'frontend', author: 'bob', date: '2023-01-02' },
        { repo: 'frontend', author: 'john', date: '2023-01-02' }
      ];

      const repoStats = pipe(
        commits,
        groupBy((commit: typeof commits[0]) => commit.repo),
        Object.entries,
        map(([repo, repoCommits]: [string, typeof commits]) => ({
          repo,
          commitCount: repoCommits.length,
          uniqueAuthors: uniqueBy((c: typeof repoCommits[0]) => c.author)(repoCommits).length
        }))
      );

      expect(repoStats).toEqual([
        { repo: 'frontend', commitCount: 3, uniqueAuthors: 2 },
        { repo: 'backend', commitCount: 1, uniqueAuthors: 1 }
      ]);
    });
  });
});