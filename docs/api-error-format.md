# API Error Response Format

This document defines the standard API error response format used across all GitPulse API routes.

## Standard Error Response Structure

All API error responses follow this JSON structure:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": "Additional error details or debugging information",
  "requestId": "unique-request-id-for-tracking",
  "metadata": {
    "additionalProperty1": "value1",
    "additionalProperty2": "value2"
  }
}
```

### Required Fields

| Field   | Type   | Description                                             |
| ------- | ------ | ------------------------------------------------------- |
| `error` | string | The primary error message intended for display to users |
| `code`  | string | A machine-readable error code for programmatic handling |

### Optional Fields

| Field               | Type    | Description                                                   |
| ------------------- | ------- | ------------------------------------------------------------- |
| `details`           | string  | More detailed error information, primarily for developers     |
| `requestId`         | string  | Unique identifier for tracking this error across systems      |
| `signOutRequired`   | boolean | Whether the client should sign the user out due to this error |
| `needsInstallation` | boolean | Whether the GitHub App needs to be installed                  |
| `resetAt`           | string  | ISO timestamp when a rate limit will reset                    |
| `metadata`          | object  | Additional structured data related to the error               |

## Standard Error Codes

GitPulse uses standardized error codes to help clients handle errors consistently.

### Common Error Codes

| Code               | Description              | HTTP Status |
| ------------------ | ------------------------ | ----------- |
| `API_ERROR`        | Generic API error        | 500         |
| `VALIDATION_ERROR` | Invalid input parameters | 400         |
| `UNKNOWN_ERROR`    | Unclassified error       | 500         |

### GitHub-Related Error Codes

| Code                      | Description                        | HTTP Status |
| ------------------------- | ---------------------------------- | ----------- |
| `GITHUB_AUTH_ERROR`       | General authentication error       | 403         |
| `GITHUB_TOKEN_ERROR`      | Invalid or expired token           | 403         |
| `GITHUB_SCOPE_ERROR`      | Missing required token permissions | 403         |
| `GITHUB_RATE_LIMIT_ERROR` | API rate limit exceeded            | 429         |
| `GITHUB_NOT_FOUND_ERROR`  | Requested resource not found       | 404         |
| `GITHUB_API_ERROR`        | Error from GitHub API              | Various     |
| `GITHUB_APP_CONFIG_ERROR` | GitHub App configuration issue     | 500         |
| `GITHUB_ERROR`            | Other GitHub-related error         | 500         |

## HTTP Status Codes

| Status | Description                                                                    |
| ------ | ------------------------------------------------------------------------------ |
| 400    | Bad Request - typically for validation errors                                  |
| 403    | Forbidden - used for auth errors (instead of 401 to prevent browser redirects) |
| 404    | Not Found - for missing resources                                              |
| 429    | Too Many Requests - for rate limit errors                                      |
| 500    | Server Error - for internal errors                                             |

## Headers

All error responses include:

- `Content-Type: application/json`
- `X-Request-ID: [same as requestId in response body]`

## Example Error Responses

### Authentication Error

```json
{
  "error": "GitHub authentication failed",
  "code": "GITHUB_TOKEN_ERROR",
  "details": "Authentication token is invalid or expired",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
  "signOutRequired": true
}
```

### Rate Limit Error

```json
{
  "error": "GitHub API rate limit exceeded",
  "code": "GITHUB_RATE_LIMIT_ERROR",
  "details": "API rate limit of 5000 exceeded",
  "requestId": "b2c3d4e5-f6a7-8901-bcde-23456789abcd",
  "resetAt": "2023-04-20T15:30:45.123Z",
  "metadata": {
    "secondsUntilReset": 3600,
    "minutesUntilReset": 60
  }
}
```

### Validation Error

```json
{
  "error": "Validation error",
  "code": "VALIDATION_ERROR",
  "details": "since parameter must be a valid ISO date string",
  "requestId": "c3d4e5f6-a7b8-9012-cdef-3456789abcde"
}
```
