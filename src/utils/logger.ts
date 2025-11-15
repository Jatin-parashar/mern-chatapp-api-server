/**
 * Logger setup with Pino:
 *
 * This logger configuration uses Pino for logging application events. It adjusts behavior based on the
 * environment (development or production), ensuring that:
 * - In **development**, logs are colorful, detailed, and pretty (helpful for debugging).
 * - In **production**, logs are minimal and concise for better performance and less noise.
 *
 * The `logLevel` adjusts based on the environment:
 * - In **development**, the log level is set to "debug", allowing logs from all levels including `debug` and `trace`.
 * - In **production**, the log level is set to "info", which only shows logs from `info`, `warn`, `error`, and `fatal` levels.
 *
 * You can configure the following log levels:
 * - `fatal`, `error`, `warn`, `info`, `debug`, `trace`.
 *
 * This module exports a logger instance that can be used throughout the application.
 *
 * @module logger
 */

import pino from "pino";
import { NODE_ENV } from "../config/envConfig.js";

const isDevelopment = NODE_ENV === "development";

// Production logger - JSON with human-readable fields
const productionLogger = pino({
  level: "info",
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        // Remove useless hostname in production
      };
    },
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  base: {
    env: NODE_ENV,
  },
});

// Development logger - pretty and colorful
const developmentLogger = pino(
  {
    level: "debug",
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  },
  pino.transport({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "yyyy-mm-dd HH:MM:ss.l",
      ignore: "pid,hostname",
      messageFormat: "{msg}",
      singleLine: true,
    },
  })
);

const logger = isDevelopment ? developmentLogger : productionLogger;

export default logger;

/**
 * Usage Examples:
 * 
 * // Simple logging
 * logger.info('User logged in');
 * 
 * // With structured context
 * logger.info({ userId: '123', action: 'login' }, 'User logged in');
 * 
 * // Error logging
 * logger.error({ err: error, userId: '123' }, 'Failed to process request');
 * 
 * // Request logging (use the middleware below)
 * logger.info({ 
 *   requestId: 'req-123', 
 *   method: 'POST', 
 *   path: '/api/messages',
 *   userId: '456'
 * }, 'Request completed');

 * Usage Examples:
 * 
 * // Simple logging
 * logger.info('User logged in');
 * 
 * // With structured context
 * logger.info({ userId: '123', action: 'login' }, 'User logged in');
 * 
 * // Error logging
 * logger.error({ err: error, userId: '123' }, 'Failed to process request');
 * 
 * // Request logging (use the middleware below)
 * logger.info({ 
 *   requestId: 'req-123', 
 *   method: 'POST', 
 *   path: '/api/messages',
 *   userId: '456'
 * }, 'Request completed');
 * 
 * Log Levels Description:
 *
 * Each log level corresponds to a different level of severity. Logs are filtered based on the level set in
 * the environment (`debug` for development, `info` for production).
 *
 * Levels are represented both by their string names and numeric values. The numeric value determines the
 * priority of the log level: higher numbers indicate more critical events that should be logged.
 *
 * Available log levels:
 *
 * - **fatal (60)**: Critical errors causing the application to shutdown.
 *   - Development: Logs full stack trace in red.
 *   - Production: Logs minimal fatal information, focusing on the critical error details.
 *
 * - **error (50)**: Standard errors that prevent the app from functioning properly.
 *   - Development: Logs full error details (stack traces).
 *   - Production: Concise error messages for alerts/monitoring.
 *
 * - **warn (40)**: Warnings indicating potential issues but not necessarily errors.
 *   - Development: More verbose warnings with extra context.
 *   - Production: Concise warnings logged for monitoring purposes.
 *
 * - **info (30)**: General operational information, user actions, and events.
 *   - Development: Verbose logging of user actions and app status for debugging.
 *   - Production: Concise operational logs for critical actions and status.
 *
 * - **debug (20)**: Detailed information used for debugging the app.
 *   - Development: Logs detailed internal states, function calls, and variables for debugging.
 *   - Production: Disabled in production due to verbosity.
 *
 * - **trace (10)**: Very detailed low-level information, useful for troubleshooting difficult issues.
 *   - Development: Logs extremely detailed steps or inner workings of functions.
 *   - Production: Disabled in production as it can cause unnecessary noise and performance issues.
 *
 * Usage of Logger:
 *
 * You can use the logger instance exported by this module throughout your app as follows:
 *
 * - `logger.trace('Detailed trace message')` - Use for very detailed trace information.
 * - `logger.debug('Debugging message')` - Use for general debugging information.
 * - `logger.info('General info message')` - Use for regular operational events.
 * - `logger.warn('Warning message')` - Use for potential issues.
 * - `logger.error('Error message')` - Use for handling errors.
 * - `logger.fatal('Fatal error message')` - Use for critical issues that cause the app to shut down.
 */
