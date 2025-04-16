// Utility functions for API caching and ETag handling

import { createHash } from 'crypto';
import { logger } from './logger';
import { NextRequest, NextResponse } from 'next/server';
import { compressedJsonResponse } from './compress';
import { optimizedJSONStringify } from './optimize';
import { SERVER_CACHE_TTL } from './constants';
import { ApiCacheOptions, CacheParams } from '@/types/api';
import { JsonValue } from '@/types/common';

const MODULE_NAME = 'cache';

/**
 * Generates a consistent ETag for response data
 * @param data The data to generate an ETag for
 * @returns A string ETag value
 */
export function generateETag(data: unknown): string {
  try {
    const jsonString = JSON.stringify(data);
    // Use MD5 as it's fast and sufficient for ETag purposes
    // In a production environment, consider using a more secure hash for sensitive data
    const hash = createHash('md5').update(jsonString).digest('hex');
    return `"${hash}"`;
  } catch (error) {
    logger.warn(MODULE_NAME, 'Error generating ETag', { error });
    // Fallback to a timestamp-based ETag if stringification fails
    return `"${Date.now().toString(36)}"`;
  }
}

/**
 * Determines if the request's If-None-Match header matches the ETag
 * @param request The NextRequest object
 * @param etag The ETag to compare against
 * @returns True if the ETags match (cache is valid)
 */
export function isCacheValid(request: NextRequest, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match');
  if (!ifNoneMatch) return false;
  
  // Simple exact match check
  if (ifNoneMatch === etag) return true;
  
  // Handle multiple ETags in the header (comma-separated list)
  const etags = ifNoneMatch.split(',').map(e => e.trim());
  return etags.includes(etag);
}

/**
 * Returns a 304 Not Modified response with appropriate headers
 * @param etag The ETag to include in the response
 * @param cacheControl Optional Cache-Control header value
 * @returns A NextResponse with 304 status
 */
export function notModifiedResponse(etag: string, cacheControl?: string): NextResponse {
  const headers: Record<string, string> = {
    'ETag': etag,
  };
  
  if (cacheControl) {
    headers['Cache-Control'] = cacheControl;
  }
  
  return new NextResponse(null, {
    status: 304,
    headers,
  });
}

/**
 * Returns a JSON response with caching headers
 * @param data The data to return as JSON
 * @param status The HTTP status code
 * @param options Additional response options
 * @returns A NextResponse with the data and caching headers
 */
export function cachedJsonResponse(
  data: unknown, 
  status: number = 200,
  options: ApiCacheOptions = {}
): NextResponse {
  const etag = options.etag || generateETag(data);
  
  // Use provided cache control or generate one with optional parameters
  const cacheControl = options.cacheControl || 
    generateCacheControl(
      options.maxAge || SERVER_CACHE_TTL.SHORT,
      options.staleWhileRevalidate,
      options.isPrivate !== undefined ? options.isPrivate : true
    );
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ETag': etag,
    'Cache-Control': cacheControl,
    ...options.extraHeaders
  };
  
  return NextResponse.json(data, {
    status,
    headers,
  });
}

/**
 * Creates an optimized and possibly compressed JSON response with caching headers
 * 
 * @param request - The original NextRequest to check for compression support
 * @param data - The data to return and potentially compress
 * @param status - HTTP status code
 * @param options - Additional options for the response
 * @returns - A NextResponse with optimized data and compression if applicable
 */
export async function optimizedJsonResponse(
  request: NextRequest,
  data: unknown, 
  status: number = 200,
  options: ApiCacheOptions = {}
): Promise<NextResponse> {
  const etag = options.etag || generateETag(data);
  
  // Use provided cache control or generate one with optional parameters
  const cacheControl = options.cacheControl || 
    generateCacheControl(
      options.maxAge || SERVER_CACHE_TTL.SHORT,
      options.staleWhileRevalidate,
      options.isPrivate !== undefined ? options.isPrivate : true
    );
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ETag': etag,
    'Cache-Control': cacheControl,
    ...options.extraHeaders
  };
  
  // Apply compression if enabled (default to true)
  const shouldCompress = options.compress !== false;
  
  if (shouldCompress) {
    // Use compressed response function if compression is enabled
    return await compressedJsonResponse(data, request, status, headers);
  } else {
    // Fall back to standard response without compression
    return NextResponse.json(data, {
      status,
      headers,
    });
  }
}

/**
 * Default caching options for different types of data (in seconds)
 * @deprecated Use SERVER_CACHE_TTL from constants.ts instead
 */
export const CacheTTL = SERVER_CACHE_TTL;

/**
 * Type for cache key primitive values
 */
type CacheKeyPrimitive = string | number | boolean | null | undefined;

/**
 * Type for cache key values that can be formatted
 */
type CacheKeyValue = 
  | CacheKeyPrimitive
  | Array<CacheKeyPrimitive> 
  | Record<string, CacheKeyPrimitive>;

/**
 * Formats a value consistently for use in cache keys
 * 
 * @param value Any value to be formatted for a cache key
 * @returns A string representation of the value
 */
function formatCacheValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return value.length ? value.sort().join(',') : 'empty';
  }
  if (typeof value === 'object') {
    // Sort object keys for consistency
    const sortedObj = Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce((result: Record<string, unknown>, key: string) => {
        result[key] = (value as Record<string, unknown>)[key];
        return result;
      }, {});
    return JSON.stringify(sortedObj);
  }
  return String(value);
}

/**
 * Generates a consistent cache key from a set of parameters
 * 
 * @param params Record of key-value pairs to include in the cache key
 * @param namespace Optional namespace to prefix the cache key
 * @returns A string cache key
 */
export function generateCacheKey(
  params: CacheParams,
  namespace?: string
): string {
  try {
    // Sort keys to ensure consistent ordering
    const sortedKeys = Object.keys(params).sort();
    
    // Build key parts
    const parts: string[] = [];
    
    // Add namespace if provided
    if (namespace) {
      parts.push(namespace);
    }
    
    // Add each parameter as key:value
    for (const key of sortedKeys) {
      const value = params[key];
      const formattedValue = formatCacheValue(value);
      parts.push(`${key}:${formattedValue}`);
    }
    
    return parts.join(':');
  } catch (error) {
    logger.warn(MODULE_NAME, 'Error generating cache key', { error, params });
    // Fallback to a simple timestamp if key generation fails
    return `fallback:${Date.now().toString(36)}`;
  }
}

/**
 * Generates a Cache-Control header value with appropriate directives
 * @param maxAge Max age in seconds
 * @param staleWhileRevalidate Time in seconds the resource is stale but still usable
 * @param isPrivate Whether the response is private or public
 * @returns A formatted Cache-Control header value
 */
export function generateCacheControl(
  maxAge: number = SERVER_CACHE_TTL.SHORT,
  staleWhileRevalidate: number = maxAge * 2,
  isPrivate: boolean = true
): string {
  const privacy = isPrivate ? 'private' : 'public';
  return `${privacy}, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
}