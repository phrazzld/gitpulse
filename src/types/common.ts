/**
 * Common utility types for the application
 *
 * This file defines reusable types that can be used across the codebase
 * to replace 'any' with more specific types.
 */

/**
 * Represents a generic record with string keys and unknown values
 * Use this instead of Record<string, any> or {[key: string]: any}
 */
export type GenericRecord = Record<string, unknown>;

/**
 * Represents JSON-serializable data
 * This type can be used for data that will be JSON.stringify'd or parsed
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

/**
 * Represents a JSON object
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * Represents a JSON array
 */
export type JsonArray = JsonValue[];

/**
 * Represents a log entry's data field
 * Use this for logger function data parameters
 */
export type LogData = Record<string, unknown>;

/**
 * Represents an error object with standard properties
 * Use this for error handling when you need to access common Error properties
 */
export interface ErrorLike {
  name?: string;
  message: string;
  stack?: string;
  [key: string]: unknown;
}

/**
 * Type for a generic function with any number of parameters and return type
 * Use this when you need to type a variable that holds a function reference
 */
export type GenericFunction = (...args: unknown[]) => unknown;

/**
 * Type for API response handlers
 * Use this for function parameters that will process API responses
 */
export type ApiResponseHandler<T> = (data: T) => void;

/**
 * Type for generic event handlers
 * Use this for event handlers when the exact event type isn't important
 */
export type GenericEventHandler = (event: { target: unknown }) => void;

/**
 * Type for a generic callback function
 * Use this for callback functions with specific parameter and return types
 */
export type Callback<T, R = void> = (data: T) => R;

/**
 * Type for generic cache data
 * Use this for data that will be stored in and retrieved from a cache
 */
export type CacheData<T = unknown> = T;

/**
 * Type for key-value cache parameters
 * Use this for functions that generate cache keys or ETags
 */
export type CacheParams = Record<string, unknown>;

/**
 * Type-safe generic function with specific parameter and return types
 * Use this instead of (...args: any[]) => any
 */
export type TypedFunction<
  TArgs extends unknown[] = unknown[],
  TReturn = unknown,
> = (...args: TArgs) => TReturn;

/**
 * Type for objects with dynamic string keys
 * Use this instead of {[key: string]: any}
 */
export type DynamicObject = {
  [key: string]: unknown;
};

/**
 * Type for generic promise handlers
 * Use this when working with promises of unknown value types
 */
export type PromiseHandler<T = unknown> = (value: T) => void | Promise<void>;

/**
 * Type for a date range object
 * Use this for date range selectors and filters
 */
export interface DateRange {
  since: string;
  until: string;
}

/**
 * More specific type for data objects with known key shape but unknown values
 * Use this when you know the shape of an object but not the exact value types
 */
export type ShapedObject<T extends Record<string, unknown>> = {
  [K in keyof T]: unknown;
};

/**
 * Type for generic configuration objects
 * Use this for configuration parameters with mixed types
 */
export interface ConfigObject {
  enabled?: boolean;
  timeout?: number;
  retries?: number;
  options?: Record<string, unknown>;
  [key: string]: unknown;
}
