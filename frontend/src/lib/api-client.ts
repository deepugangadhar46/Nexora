/**
 * Enhanced API Client with Retry Logic and Error Handling
 */
import { API_BASE_URL } from './config';
import { tokenManager } from './auth/tokenManager';

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryOn?: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryOn: [408, 429, 500, 502, 503, 504], // Retry on these status codes
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced fetch with automatic retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = {}
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= (config.maxRetries || 0); attempt++) {
    try {
      const response = await fetch(url, options);

      // If response is ok or shouldn't retry, return it
      if (response.ok || !config.retryOn?.includes(response.status)) {
        return response;
      }

      // If we should retry, throw to trigger retry logic
      if (attempt < (config.maxRetries || 0)) {
        console.warn(`Request failed with status ${response.status}. Retrying... (${attempt + 1}/${config.maxRetries})`);
        await sleep((config.retryDelay || 1000) * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }

      // Last attempt failed
      return response;
    } catch (error) {
      lastError = error as Error;

      // If network error and we have retries left
      if (attempt < (config.maxRetries || 0)) {
        console.warn(`Network error. Retrying... (${attempt + 1}/${config.maxRetries})`, error);
        await sleep((config.retryDelay || 1000) * Math.pow(2, attempt));
        continue;
      }

      // No more retries
      throw lastError;
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * API Error class with enhanced information
 */
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Parse error response and create APIError
 */
export async function handleAPIError(response: Response): Promise<never> {
  let errorData: any;
  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText };
  }

  const isRetryable = [408, 429, 500, 502, 503, 504].includes(response.status);
  
  throw new APIError(
    response.status,
    errorData.message || errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
    errorData,
    isRetryable
  );
}

/**
 * Make API request with retry and error handling
 * Automatically includes auth token if available
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retryConfig?: RetryConfig
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get valid token (will refresh if needed)
  const token = await tokenManager.getValidToken();
  
  // Merge headers with auth token
  const headers = {
    ...options.headers,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const response = await fetchWithRetry(url, { ...options, headers }, retryConfig);

  if (!response.ok) {
    await handleAPIError(response);
  }

  return response.json();
}

/**
 * GET request
 */
export async function apiGet<T = any>(
  endpoint: string,
  retryConfig?: RetryConfig
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' }, retryConfig);
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  retryConfig?: RetryConfig
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    },
    retryConfig
  );
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  retryConfig?: RetryConfig
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    },
    retryConfig
  );
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(
  endpoint: string,
  retryConfig?: RetryConfig
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'DELETE',
    },
    retryConfig
  );
}
