import { promises as fs } from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

export async function writeServerLog(message: string): Promise<void> {
  try {
    // Ensure log directory exists
    await fs.mkdir(LOG_DIR, { recursive: true });

    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(LOG_DIR, `app-${date}.log`);

    // Append message to log file
    await fs.appendFile(logFile, message + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
} 