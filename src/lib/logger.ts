/**
 * Production-safe logger utility
 * Automatically disables logging in production environment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

const defaultConfig: LoggerConfig = {
  enabled: !isProduction,
  level: isProduction ? 'error' : 'debug',
  prefix: '[Apadbandhav]',
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `${this.config.prefix} [${level.toUpperCase()}] ${timestamp}: ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  // Group logging for related operations
  group(label: string): void {
    if (this.config.enabled) {
      console.group(this.formatMessage('info', label));
    }
  }

  groupEnd(): void {
    if (this.config.enabled) {
      console.groupEnd();
    }
  }

  // Performance timing
  time(label: string): void {
    if (this.config.enabled) {
      console.time(`${this.config.prefix} ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.config.enabled) {
      console.timeEnd(`${this.config.prefix} ${label}`);
    }
  }

  // Create a child logger with a specific prefix
  createChild(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: `${this.config.prefix}[${prefix}]`,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for creating custom loggers
export { Logger };

// Convenience exports for common use cases
export const authLogger = logger.createChild('Auth');
export const deviceLogger = logger.createChild('Device');
export const locationLogger = logger.createChild('Location');
export const sosLogger = logger.createChild('SOS');
export const notificationLogger = logger.createChild('Notification');
export const apiLogger = logger.createChild('API');
