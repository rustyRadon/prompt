export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setMaxLogs(max: number): void {
    this.maxLogs = max;
    this.trimLogs();
  }

  debug(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    this.log(LogLevel.DEBUG, message, context, userId, requestId);
  }

  info(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    this.log(LogLevel.INFO, message, context, userId, requestId);
  }

  warn(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    this.log(LogLevel.WARN, message, context, userId, requestId);
  }

  error(message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    this.log(LogLevel.ERROR, message, context, userId, requestId);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, userId?: string, requestId?: string): void {
    if (level < this.logLevel) return;

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      userId,
      requestId
    };

    this.logs.push(logEntry);
    this.trimLogs();

    // Output to console
    this.outputToConsole(logEntry);
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelStr = LogLevel[entry.level];
    const userIdStr = entry.userId ? ` [${entry.userId}]` : '';
    const requestIdStr = entry.requestId ? ` [${entry.requestId}]` : '';
    
    let message = `[${timestamp}] ${levelStr}${userIdStr}${requestIdStr}: ${entry.message}`;
    
    if (entry.context) {
      message += `\nContext: ${JSON.stringify(entry.context, null, 2)}`;
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
    }
  }

  private trimLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(level?: LogLevel, userId?: string, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    byUser: Record<string, number>;
  } {
    const byLevel: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    this.logs.forEach(log => {
      const levelName = LogLevel[log.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;

      if (log.userId) {
        byUser[log.userId] = (byUser[log.userId] || 0) + 1;
      }
    });

    return {
      total: this.logs.length,
      byLevel,
      byUser
    };
  }
}

export const logger = Logger.getInstance();
