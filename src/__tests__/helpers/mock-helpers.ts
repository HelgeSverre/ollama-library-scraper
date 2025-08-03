import { vi, expect } from 'vitest';
import type { Response } from 'node-fetch';

/**
 * Create a mock fetch response
 * @param html - The HTML content to return
 * @param status - The HTTP status code (default: 200)
 * @returns A mock Response object
 */
export const createMockResponse = (html: string, status = 200): Partial<Response> => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: getStatusText(status),
  text: vi.fn().mockResolvedValue(html),
  headers: {
    get: (name: string) => {
      if (name.toLowerCase() === 'content-type') {
        return 'text/html; charset=utf-8';
      }
      return null;
    },
  } as any,
});

/**
 * Create a mock error response
 * @param status - The HTTP status code
 * @param message - Optional error message
 * @returns A mock Response object representing an error
 */
export const createMockErrorResponse = (status: number, message?: string): Partial<Response> => ({
  ok: false,
  status,
  statusText: getStatusText(status),
  text: vi.fn().mockResolvedValue(message || `Error ${status}`),
  headers: {
    get: () => null,
  } as any,
});

/**
 * Create a mock network error
 * @param message - The error message
 * @returns A rejected promise with the error
 */
export const createNetworkError = (message = 'Network error'): Promise<never> =>
  Promise.reject(new Error(message));

/**
 * Get standard HTTP status text
 * @param status - The HTTP status code
 * @returns The status text
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    404: 'Not Found',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  };

  return statusTexts[status] || 'Unknown';
}

/**
 * Setup fetch mock with a specific response
 * @param mockFetch - The mocked fetch function
 * @param response - The response to return
 */
export const setupFetchMock = (
  mockFetch: ReturnType<typeof vi.mocked<typeof fetch>>,
  response: Partial<Response> | Promise<never>
): void => {
  if (response instanceof Promise) {
    mockFetch.mockRejectedValueOnce(response);
  } else {
    mockFetch.mockResolvedValueOnce(response as any);
  }
};

/**
 * Setup fetch mock with multiple responses
 * @param mockFetch - The mocked fetch function
 * @param responses - Array of responses to return in order
 */
export const setupMultipleFetchMocks = (
  mockFetch: ReturnType<typeof vi.mocked<typeof fetch>>,
  responses: Array<Partial<Response> | Promise<never>>
): void => {
  responses.forEach(response => {
    if (response instanceof Promise) {
      mockFetch.mockRejectedValueOnce(response);
    } else {
      mockFetch.mockResolvedValueOnce(response as any);
    }
  });
};

/**
 * Assert that fetch was called with the expected URL
 * @param mockFetch - The mocked fetch function
 * @param expectedUrl - The expected URL
 * @param callIndex - Which call to check (default: 0)
 */
export const expectFetchCalledWith = (
  mockFetch: ReturnType<typeof vi.mocked<typeof fetch>>,
  expectedUrl: string,
  callIndex = 0
): void => {
  expect(mockFetch).toHaveBeenCalledTimes(callIndex + 1);
  expect(mockFetch.mock.calls[callIndex][0]).toBe(expectedUrl);
};

/**
 * Create a delay promise for testing timeouts
 * @param ms - Milliseconds to delay
 * @returns A promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a mock response that simulates slow network
 * @param html - The HTML content to return
 * @param delayMs - Delay in milliseconds
 * @param status - The HTTP status code (default: 200)
 * @returns A mock Response object with delay
 */
export const createSlowMockResponse = (
  html: string,
  delayMs: number,
  status = 200
): Partial<Response> => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: getStatusText(status),
  text: vi.fn().mockImplementation(async () => {
    await delay(delayMs);
    return html;
  }),
  headers: {
    get: (name: string) => {
      if (name.toLowerCase() === 'content-type') {
        return 'text/html; charset=utf-8';
      }
      return null;
    },
  } as any,
});

/**
 * Create a mock response for rate limiting (429)
 * @param retryAfter - Retry-After header value in seconds
 * @returns A mock Response object representing rate limiting
 */
export const createRateLimitResponse = (retryAfter = 60): Partial<Response> => ({
  ok: false,
  status: 429,
  statusText: 'Too Many Requests',
  text: vi.fn().mockResolvedValue('Rate limit exceeded'),
  headers: {
    get: (name: string) => {
      if (name.toLowerCase() === 'retry-after') {
        return retryAfter.toString();
      }
      if (name.toLowerCase() === 'content-type') {
        return 'text/plain';
      }
      return null;
    },
  } as any,
});

/**
 * Create a mock response with specific headers
 * @param html - The HTML content to return
 * @param headers - Additional headers to include
 * @param status - The HTTP status code (default: 200)
 * @returns A mock Response object with custom headers
 */
export const createMockResponseWithHeaders = (
  html: string,
  headers: Record<string, string> = {},
  status = 200
): Partial<Response> => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: getStatusText(status),
  text: vi.fn().mockResolvedValue(html),
  headers: {
    get: (name: string) => {
      const lowerName = name.toLowerCase();

      // Check custom headers first
      for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === lowerName) {
          return value;
        }
      }

      // Default headers
      if (lowerName === 'content-type') {
        return 'text/html; charset=utf-8';
      }

      return null;
    },
  } as any,
});

/**
 * Create a mock response that simulates chunked/streaming response
 * @param chunks - Array of HTML chunks to return
 * @param chunkDelay - Delay between chunks in milliseconds
 * @returns A mock Response object that streams chunks
 */
export const createStreamingMockResponse = (
  chunks: string[],
  chunkDelay = 100
): Partial<Response> => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  text: vi.fn().mockImplementation(async () => {
    let result = '';
    for (const chunk of chunks) {
      await delay(chunkDelay);
      result += chunk;
    }
    return result;
  }),
  headers: {
    get: (name: string) => {
      if (name.toLowerCase() === 'content-type') {
        return 'text/html; charset=utf-8';
      }
      if (name.toLowerCase() === 'transfer-encoding') {
        return 'chunked';
      }
      return null;
    },
  } as any,
});

/**
 * Setup fetch mock with sequential responses (for testing pagination, etc.)
 * @param mockFetch - The mocked fetch function
 * @param responses - Array of responses to return in sequence
 * @param onComplete - Optional callback when all responses are consumed
 */
export const setupSequentialFetchMocks = (
  mockFetch: ReturnType<typeof vi.mocked<typeof fetch>>,
  responses: Array<Partial<Response> | Promise<never>>,
  onComplete?: () => void
): void => {
  let callCount = 0;

  mockFetch.mockImplementation(async (...args) => {
    if (callCount >= responses.length) {
      if (onComplete) onComplete();
      throw new Error('No more mock responses available');
    }

    const response = responses[callCount++];

    if (response instanceof Promise) {
      throw await response;
    }

    return response as any;
  });
};

/**
 * Assert that fetch was called with specific headers
 * @param mockFetch - The mocked fetch function
 * @param expectedHeaders - Expected headers object
 * @param callIndex - Which call to check (default: 0)
 */
export const expectFetchCalledWithHeaders = (
  mockFetch: ReturnType<typeof vi.mocked<typeof fetch>>,
  expectedHeaders: Record<string, string>,
  callIndex = 0
): void => {
  expect(mockFetch).toHaveBeenCalledTimes(callIndex + 1);

  const call = mockFetch.mock.calls[callIndex];
  const options = call[1] as any;

  if (options && options.headers) {
    for (const [key, value] of Object.entries(expectedHeaders)) {
      expect(options.headers[key]).toBe(value);
    }
  } else {
    throw new Error('No headers found in fetch call');
  }
};

/**
 * Create a test suite for retry logic testing
 * @param attempts - Number of attempts before success
 * @param errorStatus - HTTP status to return for failed attempts
 * @returns Array of mock responses (errors followed by success)
 */
export const createRetryTestResponses = (
  attempts: number,
  successHtml: string,
  errorStatus = 500
): Array<Partial<Response>> => {
  const responses: Array<Partial<Response>> = [];

  // Add error responses
  for (let i = 0; i < attempts - 1; i++) {
    responses.push(createMockErrorResponse(errorStatus));
  }

  // Add success response
  responses.push(createMockResponse(successHtml));

  return responses;
};

export default {
  createMockResponse,
  createMockErrorResponse,
  createNetworkError,
  createSlowMockResponse,
  createRateLimitResponse,
  createMockResponseWithHeaders,
  createStreamingMockResponse,
  setupFetchMock,
  setupMultipleFetchMocks,
  setupSequentialFetchMocks,
  expectFetchCalledWith,
  expectFetchCalledWithHeaders,
  createRetryTestResponses,
  delay,
};
