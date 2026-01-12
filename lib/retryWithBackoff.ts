/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param options - Configuration options
 * @returns Promise that resolves with the function result
 * @throws Error if all retries are exhausted
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    onRetry
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt);
      const delayMs = Math.min(exponentialDelay, maxDelayMs);

      // Add jitter (±20%) to prevent thundering herd
      const jitter = delayMs * 0.2 * (Math.random() - 0.5);
      const finalDelay = Math.round(delayMs + jitter);

      // Call retry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt + 1, finalDelay);
      }

      console.log(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed: ${lastError.message}. ` +
        `Retrying in ${finalDelay}ms...`
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError;
}

/**
 * Retry fetch requests with exponential backoff
 * Automatically retries on network errors and 5xx status codes
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, init);

    // Retry on 5xx server errors
    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    // Don't retry on 4xx client errors (except 429 Too Many Requests)
    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
      return response;
    }

    // Retry on 429 Too Many Requests
    if (response.status === 429) {
      throw new Error('Rate limited (429)');
    }

    return response;
  }, options);
}
