/**
 * Custom error classes for the application
 */

// Base application error
export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public isTransient: boolean;
  public originalError?: Error;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isTransient: boolean = false,
    originalError?: Error,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isTransient = isTransient;
    this.originalError = originalError;
    this.name = this.constructor.name;

    // Only capture stack trace if available (Node.js)
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

// Lark-related errors
export class LarkError extends AppError {
  constructor(
    message: string,
    public readonly larkCode?: string,
    isTransient: boolean = false,
    originalError?: Error,
  ) {
    super(message, "LARK_ERROR", 500, isTransient, originalError);
    this.name = "LarkError";
  }
}

export class LarkConnectionError extends LarkError {
  constructor(message: string, originalError?: Error) {
    super(message, undefined, true, originalError);
    this.name = "LarkConnectionError";
    this.statusCode = 503;
  }
}

export class LarkMessageError extends LarkError {
  constructor(message: string, originalError?: Error) {
    super(message, undefined, false, originalError);
    this.name = "LarkMessageError";
    this.statusCode = 400;
  }
}

// Moltbot-related errors
export class MoltbotError extends AppError {
  constructor(
    message: string,
    public readonly moltbotCode?: string,
    isTransient: boolean = false,
    originalError?: Error,
  ) {
    super(message, "MOLTBOT_ERROR", 500, isTransient, originalError);
    this.name = "MoltbotError";
  }
}

export class MoltbotConnectionError extends MoltbotError {
  constructor(message: string, originalError?: Error) {
    super(message, undefined, true, originalError);
    this.name = "MoltbotConnectionError";
    this.statusCode = 503;
  }
}

export class MoltbotStreamError extends MoltbotError {
  constructor(message: string, originalError?: Error) {
    super(message, undefined, true, originalError);
    this.name = "MoltbotStreamError";
    this.statusCode = 500;
  }
}

// Bridge-related errors
export class BridgeError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, "BRIDGE_ERROR", 500, false, originalError);
    this.name = "BridgeError";
  }
}

export class TransformationError extends BridgeError {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = "TransformationError";
    this.statusCode = 422;
  }
}

// Configuration errors
export class ConfigError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, "CONFIG_ERROR", 500, false, originalError);
    this.name = "ConfigError";
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message, "VALIDATION_ERROR", 400, false);
    this.name = "ValidationError";
  }
}

// Retry errors
export class RetryExhaustedError extends AppError {
  constructor(
    message: string,
    public readonly attempts: number,
    originalError?: Error,
  ) {
    super(message, "RETRY_EXHAUSTED", 503, false, originalError);
    this.name = "RetryExhaustedError";
  }
}

/**
 * Check if an error is transient (can be retried)
 */
export function isTransientError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isTransient;
  }

  // Check for common transient error patterns
  const transientPatterns = [
    /ECONNREFUSED/,
    /ETIMEDOUT/,
    /ENOTFOUND/,
    /ECONNRESET/,
    /EPIPE/,
    /timeout/,
    /network/,
    /temporary/,
  ];

  const errorMessage = error.message.toLowerCase();
  return transientPatterns.some((pattern) => pattern.test(errorMessage));
}

/**
 * Get a user-friendly error message
 */
export function getUserErrorMessage(error: Error): string {
  if (error instanceof ValidationError) {
    return `Validation error: ${error.message}`;
  }

  if (error instanceof ConfigError) {
    return "Configuration error. Please check your settings.";
  }

  if (
    error instanceof LarkConnectionError ||
    error instanceof MoltbotConnectionError
  ) {
    return "Connection error. Please try again later.";
  }

  if (error instanceof RetryExhaustedError) {
    return "Service temporarily unavailable. Please try again later.";
  }

  // Default message
  return "An unexpected error occurred. Please try again.";
}
