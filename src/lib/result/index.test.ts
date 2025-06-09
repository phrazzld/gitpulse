import {
  Result,
  Success,
  Failure,
  success,
  failure,
  map,
  flatMap,
  mapError,
  fold,
  isSuccess,
  isFailure,
  getOrElse,
  getOrElseWith,
  fromPromise,
  tryCatch,
  tryCatchAsync,
  combine,
  tap,
  tapError
} from './index';

describe('Result Type System', () => {
  describe('Basic Construction', () => {
    it('should create success result', () => {
      const result = success(42);
      expect(result).toEqual({ success: true, data: 42 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('should create failure result', () => {
      const error = new Error('Something went wrong');
      const result = failure(error);
      expect(result).toEqual({ success: false, error });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });

    it('should handle different data types', () => {
      const stringResult = success('hello');
      const objectResult = success({ name: 'John', age: 30 });
      const arrayResult = success([1, 2, 3]);
      const nullResult = success(null);

      expect(stringResult.data).toBe('hello');
      expect(objectResult.data).toEqual({ name: 'John', age: 30 });
      expect(arrayResult.data).toEqual([1, 2, 3]);
      expect(nullResult.data).toBe(null);
    });

    it('should handle different error types', () => {
      const stringError = failure('string error');
      const customError = failure({ code: 404, message: 'Not found' });
      const errorObject = failure(new Error('runtime error'));

      expect(stringError.error).toBe('string error');
      expect(customError.error).toEqual({ code: 404, message: 'Not found' });
      expect(errorObject.error).toBeInstanceOf(Error);
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify success results', () => {
      const successResult = success(42);
      const failureResult = failure(new Error('error'));

      expect(isSuccess(successResult)).toBe(true);
      expect(isSuccess(failureResult)).toBe(false);

      // Type narrowing verification
      if (isSuccess(successResult)) {
        expect(successResult.data).toBe(42);
      }
    });

    it('should correctly identify failure results', () => {
      const successResult = success(42);
      const failureResult = failure(new Error('error'));

      expect(isFailure(successResult)).toBe(false);
      expect(isFailure(failureResult)).toBe(true);

      // Type narrowing verification
      if (isFailure(failureResult)) {
        expect(failureResult.error.message).toBe('error');
      }
    });

    it('should enable type-safe destructuring', () => {
      const processResult = (result: Result<number, string>) => {
        if (result.success) {
          return `Success: ${result.data * 2}`;
        } else {
          return `Error: ${result.error}`;
        }
      };

      expect(processResult(success(21))).toBe('Success: 42');
      expect(processResult(failure('division by zero'))).toBe('Error: division by zero');
    });
  });

  describe('Monadic Operations', () => {
    describe('map', () => {
      it('should transform success data', () => {
        const result = success(5);
        const doubled = map((x: number) => x * 2)(result);

        expect(doubled).toEqual(success(10));
      });

      it('should pass through failure unchanged', () => {
        const error = new Error('error');
        const result: Result<number, Error> = failure(error);
        const doubled = map((x: number) => x * 2)(result);

        expect(doubled).toEqual(failure(error));
      });

      it('should handle type transformations', () => {
        const result = success(123);
        const stringified = map((x: number) => x.toString())(result);

        expect(stringified).toEqual(success('123'));
      });

      it('should compose with multiple transformations', () => {
        const result = success(5);
        const transformed = map((x: number) => x * 2)(
          map((x: number) => x + 1)(result)
        );

        expect(transformed).toEqual(success(12)); // (5 + 1) * 2
      });
    });

    describe('flatMap', () => {
      it('should chain successful operations', () => {
        const divide = (a: number, b: number): Result<number, string> =>
          b === 0 ? failure('Division by zero') : success(a / b);

        const result = success(10);
        const chained = flatMap((x: number) => divide(x, 2))(result);

        expect(chained).toEqual(success(5));
      });

      it('should short-circuit on failure', () => {
        const divide = (a: number, b: number): Result<number, string> =>
          b === 0 ? failure('Division by zero') : success(a / b);

        const result = success(10);
        const chained = flatMap((x: number) => divide(x, 0))(result);

        expect(chained).toEqual(failure('Division by zero'));
      });

      it('should pass through existing failures', () => {
        const divide = (a: number, b: number): Result<number, string> =>
          b === 0 ? failure('Division by zero') : success(a / b);

        const result: Result<number, string> = failure('Initial error');
        const chained = flatMap((x: number) => divide(x, 2))(result);

        expect(chained).toEqual(failure('Initial error'));
      });

      it('should compose multiple operations', () => {
        const add = (x: number) => (y: number): Result<number, string> => success(x + y);
        const multiply = (x: number) => (y: number): Result<number, string> => success(x * y);

        const result = success(5);
        const composed = flatMap(add(3))(
          flatMap(multiply(2))(result)
        );

        expect(composed).toEqual(success(13)); // (5 * 2) + 3
      });
    });

    describe('fold', () => {
      it('should handle success case', () => {
        const result = success(42);
        const folded = fold(
          (data: number) => `Value: ${data}`,
          (error: string) => `Error: ${error}`
        )(result);

        expect(folded).toBe('Value: 42');
      });

      it('should handle failure case', () => {
        const result: Result<number, string> = failure('Something went wrong');
        const folded = fold(
          (data: number) => `Value: ${data}`,
          (error: string) => `Error: ${error}`
        )(result);

        expect(folded).toBe('Error: Something went wrong');
      });

      it('should enable different return types', () => {
        const result: Result<string, Error> = success('hello');
        const folded = fold(
          (data: string) => data.length,
          (error: Error) => -1
        )(result);

        expect(folded).toBe(5);
      });
    });
  });

  describe('Error Handling', () => {
    describe('mapError', () => {
      it('should transform failure error', () => {
        const result: Result<number, string> = failure('not found');
        const mapped = mapError((error: string) => new Error(error))(result);

        expect(mapped.success).toBe(false);
        if (!mapped.success) {
          expect(mapped.error).toBeInstanceOf(Error);
          expect(mapped.error.message).toBe('not found');
        }
      });

      it('should pass through success unchanged', () => {
        const result: Result<number, string> = success(42);
        const mapped = mapError((error: string) => new Error(error))(result);

        expect(mapped).toEqual(success(42));
      });
    });

    describe('getOrElse', () => {
      it('should return data for success', () => {
        const result = success(42);
        const value = getOrElse(0)(result);

        expect(value).toBe(42);
      });

      it('should return default for failure', () => {
        const result: Result<number, string> = failure('error');
        const value = getOrElse(0)(result);

        expect(value).toBe(0);
      });
    });

    describe('getOrElseWith', () => {
      it('should return data for success', () => {
        const result = success(42);
        const value = getOrElseWith(() => 0)(result);

        expect(value).toBe(42);
      });

      it('should call function for failure', () => {
        const result: Result<number, string> = failure('error');
        const mockFn = jest.fn(() => 0);
        const value = getOrElseWith(mockFn)(result);

        expect(value).toBe(0);
        expect(mockFn).toHaveBeenCalled();
      });
    });
  });

  describe('Async Operations', () => {
    describe('fromPromise', () => {
      it('should convert resolved promise to success', async () => {
        const promise = Promise.resolve(42);
        const result = await fromPromise(promise);

        expect(result).toEqual(success(42));
      });

      it('should convert rejected promise to failure', async () => {
        const error = new Error('async error');
        const promise = Promise.reject(error);
        const result = await fromPromise(promise);

        expect(result).toEqual(failure(error));
      });

      it('should convert non-Error rejection to Error', async () => {
        const promise = Promise.reject('string error');
        const result = await fromPromise(promise);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(Error);
          expect(result.error.message).toBe('string error');
        }
      });
    });

    describe('tryCatch', () => {
      it('should convert successful function to success result', () => {
        const fn = (x: number, y: number) => x + y;
        const safeFn = tryCatch(fn);
        const result = safeFn(5, 3);

        expect(result).toEqual(success(8));
      });

      it('should convert throwing function to failure result', () => {
        const fn = () => {
          throw new Error('something went wrong');
        };
        const safeFn = tryCatch(fn);
        const result = safeFn();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe('something went wrong');
        }
      });

      it('should handle non-Error throws', () => {
        const fn = () => {
          throw 'string error';
        };
        const safeFn = tryCatch(fn);
        const result = safeFn();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBeInstanceOf(Error);
          expect(result.error.message).toBe('string error');
        }
      });
    });

    describe('tryCatchAsync', () => {
      it('should convert successful async function to success result', async () => {
        const fn = async (x: number, y: number) => x + y;
        const safeFn = tryCatchAsync(fn);
        const result = await safeFn(5, 3);

        expect(result).toEqual(success(8));
      });

      it('should convert throwing async function to failure result', async () => {
        const fn = async () => {
          throw new Error('async error');
        };
        const safeFn = tryCatchAsync(fn);
        const result = await safeFn();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.message).toBe('async error');
        }
      });
    });
  });

  describe('Utility Operations', () => {
    describe('combine', () => {
      it('should combine multiple success results', () => {
        const result1 = success(1);
        const result2 = success('hello');
        const result3 = success(true);
        
        const combined = combine(result1, result2, result3);

        expect(combined).toEqual(success([1, 'hello', true]));
      });

      it('should fail if any result is failure', () => {
        const result1 = success(1);
        const result2: Result<string, Error> = failure(new Error('error1'));
        const result3: Result<boolean, Error> = failure(new Error('error2'));
        
        const combined = combine(result1, result2, result3);

        expect(combined.success).toBe(false);
        if (!combined.success) {
          expect(combined.error.message).toBe('error1; error2');
        }
      });
    });

    describe('tap', () => {
      it('should apply function to success data without changing result', () => {
        const mockFn = jest.fn();
        const result = success(42);
        const tapped = tap(mockFn)(result);

        expect(tapped).toEqual(success(42));
        expect(mockFn).toHaveBeenCalledWith(42);
      });

      it('should not apply function to failure', () => {
        const mockFn = jest.fn();
        const result: Result<number, string> = failure('error');
        const tapped = tap(mockFn)(result);

        expect(tapped).toEqual(failure('error'));
        expect(mockFn).not.toHaveBeenCalled();
      });
    });

    describe('tapError', () => {
      it('should apply function to failure error without changing result', () => {
        const mockFn = jest.fn();
        const result: Result<number, string> = failure('error');
        const tapped = tapError(mockFn)(result);

        expect(tapped).toEqual(failure('error'));
        expect(mockFn).toHaveBeenCalledWith('error');
      });

      it('should not apply function to success', () => {
        const mockFn = jest.fn();
        const result = success(42);
        const tapped = tapError(mockFn)(result);

        expect(tapped).toEqual(success(42));
        expect(mockFn).not.toHaveBeenCalled();
      });
    });
  });

  describe('Complex Compositions', () => {
    it('should compose operations in complex workflows', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const validateEmail = (email: string): Result<string, string> =>
        email.includes('@') ? success(email) : failure('Invalid email');

      const createUser = (name: string, email: string): Result<User, string> =>
        success({ id: Math.floor(Math.random() * 1000), name, email });

      const processUserCreation = (name: string, email: string): Result<User, string> =>
        flatMap((validEmail: string) => createUser(name, validEmail))(
          validateEmail(email)
        );

      const validResult = processUserCreation('John', 'john@example.com');
      expect(validResult.success).toBe(true);
      if (validResult.success) {
        expect(validResult.data.name).toBe('John');
        expect(validResult.data.email).toBe('john@example.com');
      }

      const invalidResult = processUserCreation('John', 'invalid-email');
      expect(invalidResult).toEqual(failure('Invalid email'));
    });

    it('should maintain type safety through complex transformations', () => {
      const parseNumber = (str: string): Result<number, string> => {
        const num = parseFloat(str);
        return isNaN(num) ? failure('Not a number') : success(num);
      };

      const divide = (a: number, b: number): Result<number, string> =>
        b === 0 ? failure('Division by zero') : success(a / b);

      const formatResult = (num: number): string => `Result: ${num.toFixed(2)}`;

      const calculate = (aStr: string, bStr: string): Result<string, string> =>
        flatMap((a: number) =>
          flatMap((b: number) =>
            map(formatResult)(divide(a, b))
          )(parseNumber(bStr))
        )(parseNumber(aStr)) as Result<string, string>;

      expect(calculate('10', '2')).toEqual(success('Result: 5.00'));
      expect(calculate('10', 'abc')).toEqual(failure('Not a number'));
      expect(calculate('10', '0')).toEqual(failure('Division by zero'));
    });
  });
});