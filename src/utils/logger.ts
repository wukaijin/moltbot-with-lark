import winston from "winston";

/**
 * Logger configuration type
 */
export interface LoggingConfig {
  level: string;
  format: string;
}

/**
 * Create a Winston logger instance
 */
export function createLogger(config: LoggingConfig): winston.Logger {
  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
      format:
        config.format === "json"
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            ),
    }),
  ];

  // Add file transport if needed (can be extended)
  // transports.push(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));

  const logger = winston.createLogger({
    level: config.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      config.format === "json"
        ? winston.format.json()
        : winston.format.simple(),
    ),
    transports,
  });

  return logger;
}

// Default logger instance (will be initialized with config)
let logger: winston.Logger | null = null;

/**
 * Get logger instance
 */
export function getLogger(): winston.Logger {
  if (!logger) {
    // Create a default logger if not initialized
    logger = createLogger({
      level: "info",
      format: "json",
    });
  }
  return logger;
}

/**
 * Initialize logger with configuration
 */
export function initLogger(config: LoggingConfig): void {
  logger = createLogger(config);
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(meta: Record<string, any>): winston.Logger {
  return getLogger().child(meta);
}
