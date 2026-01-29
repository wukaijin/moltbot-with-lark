import { getLogger } from "./logger";
import { isTransientError, RetryExhaustedError } from "./errors";

const logger = getLogger();

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: Error) => boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: isTransientError,
};

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  config: Required<RetryConfig>,
): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
    config.maxDelay,
  );

  // Add some jitter to avoid thundering herd
  const jitter = delay * 0.1 * Math.random();
  return delay + jitter;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
  context?: string,
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const { maxAttempts, retryableErrors } = finalConfig;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      const shouldRetry = retryableErrors(lastError);

      if (!shouldRetry || attempt >= maxAttempts) {
        logger.error(`Operation failed after ${attempt} attempt(s)`, {
          context,
          error: lastError.message,
          stack: lastError.stack,
        });

        if (attempt >= maxAttempts) {
          throw new RetryExhaustedError(
            `Operation failed after ${maxAttempts} attempts`,
            maxAttempts,
            lastError,
          );
        }

        throw lastError;
      }

      // Calculate delay and wait before retry
      const delay = calculateDelay(attempt, finalConfig);

      logger.warn(
        `Attempt ${attempt} failed, retrying in ${delay.toFixed(0)}ms`,
        {
          context,
          error: lastError.message,
          attempt,
          nextAttemptIn: delay,
        },
      );

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Create a retry wrapper for a function
 */
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config: RetryConfig = {},
  context?: string,
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    return retry(() => fn(...args), config, context);
  };
}
