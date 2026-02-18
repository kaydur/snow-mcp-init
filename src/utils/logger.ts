/**
 * Logging utility for the ServiceNow MCP Server
 * Provides structured logging with configurable log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  operation: string;
  message: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: unknown;
  duration?: number;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  /**
   * Set the logging level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get the current logging level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  /**
   * Sanitize sensitive data from parameters
   */
  private sanitize(params: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...params };
    const sensitiveKeys = ['password', 'token', 'authorization', 'auth', 'secret', 'apiKey', 'api_key'];

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Format a log entry
   */
  private format(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      `[${entry.operation}]`,
      entry.message,
    ];

    if (entry.params && Object.keys(entry.params).length > 0) {
      parts.push(`params=${JSON.stringify(entry.params)}`);
    }

    if (entry.result !== undefined) {
      parts.push(`result=${JSON.stringify(entry.result)}`);
    }

    if (entry.error !== undefined) {
      parts.push(`error=${JSON.stringify(entry.error)}`);
    }

    if (entry.duration !== undefined) {
      parts.push(`duration=${entry.duration}ms`);
    }

    return parts.join(' ');
  }

  /**
   * Log a message at the specified level
   */
  private log(level: LogLevel, operation: string, message: string, data?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'operation' | 'message'>>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      operation,
      message,
      ...data,
    };

    // Sanitize parameters if present
    if (entry.params) {
      entry.params = this.sanitize(entry.params);
    }

    const formatted = this.format(entry);

    // Output to appropriate stream
    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  /**
   * Log a debug message
   */
  debug(operation: string, message: string, data?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'operation' | 'message'>>): void {
    this.log('debug', operation, message, data);
  }

  /**
   * Log an info message
   */
  info(operation: string, message: string, data?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'operation' | 'message'>>): void {
    this.log('info', operation, message, data);
  }

  /**
   * Log a warning message
   */
  warn(operation: string, message: string, data?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'operation' | 'message'>>): void {
    this.log('warn', operation, message, data);
  }

  /**
   * Log an error message
   */
  error(operation: string, message: string, data?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'operation' | 'message'>>): void {
    this.log('error', operation, message, data);
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export the Logger class for testing
export { Logger };
