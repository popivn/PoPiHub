import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Helper ghi log ra file theo ngày.
 * Mỗi ngày một file có tên ddmmyyyy.txt (ví dụ: 27082026.txt),
 * được lưu trong thư mục <project-root>/logs.
 *
 * Cách dùng:
 *   import { logs } from '../common/logs.helper';
 *   logs.info('User logged in', 'UsersService');
 *   logs.error('Firestore read failed', 'PlayersService');
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const LOG_DIR = join(process.cwd(), 'logs');

function ensureLogDir(): void {
  mkdirSync(LOG_DIR, { recursive: true });
}

/** Tên file log theo ngày hiện tại: ddmmyyyy.txt */
function getLogFileName(date: Date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}${mm}${yyyy}.txt`;
}

/** Timestamp dạng HH:mm:ss.SSS */
function formatTimestamp(date: Date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mi}:${ss}.${ms}`;
}

function writeLog(level: LogLevel, message: string, context?: string): void {
  ensureLogDir();
  const now = new Date();
  const file = join(LOG_DIR, getLogFileName(now));
  const ctx = context ? `[${context}] ` : '';
  const line = `[${formatTimestamp(now)}] [${level.toUpperCase()}] ${ctx}${message}\n`;
  appendFileSync(file, line, 'utf8');
}

export const logs = {
  info: (message: string, context?: string): void => writeLog('info', message, context),
  warn: (message: string, context?: string): void => writeLog('warn', message, context),
  error: (message: string, context?: string): void => writeLog('error', message, context),
  debug: (message: string, context?: string): void => writeLog('debug', message, context),
};

/** Viết log mức info (shortcut cho logs.info) */
export function log(message: string, context?: string): void {
  writeLog('info', message, context);
}

export default logs;
