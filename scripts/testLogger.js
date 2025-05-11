/**
 * Simple file-based logger for the test scripts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default log file path
const DEFAULT_LOG_FILE = path.join(__dirname, '../logs/test-client.log');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Logger class for writing logs to a file
 */
class Logger {
  constructor(logFile = DEFAULT_LOG_FILE) {
    this.logFile = logFile;
    
    // Clear the log file when creating a new logger
    fs.writeFileSync(logFile, '', { flag: 'w' });
    
    // Log initialization
    this.info(`Logger initialized at ${new Date().toISOString()}`);
  }
  
  /**
   * Format a log message with timestamp and level
   * @param {string} level - Log level (INFO, ERROR, etc.)
   * @param {string} message - Log message
   * @returns {string} Formatted log message
   */
  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}\n`;
  }
  
  /**
   * Write a log message to the file
   * @param {string} level - Log level
   * @param {string} message - Log message
   */
  log(level, message) {
    const formattedMessage = this.formatMessage(level, message);
    
    // Use synchronous file operations to avoid STDIO conflicts
    try {
      fs.appendFileSync(this.logFile, formattedMessage);
      
      // Also output to console for debugging
      if (level === 'ERROR') {
        console.error(formattedMessage.trim());
      }
    } catch (error) {
      console.error(`Failed to write log: ${error.message}`);
    }
  }
  
  /**
   * Log an info message
   * @param {string} message - Log message
   */
  info(message) {
    this.log('INFO', message);
  }
  
  /**
   * Log an error message
   * @param {string} message - Log message
   */
  error(message) {
    this.log('ERROR', message);
  }
  
  /**
   * Log a debug message
   * @param {string} message - Log message
   */
  debug(message) {
    this.log('DEBUG', message);
  }
  
  /**
   * Log an object as JSON
   * @param {string} label - Label for the object
   * @param {Object} obj - Object to log
   */
  logObject(label, obj) {
    try {
      const json = JSON.stringify(obj, null, 2);
      this.info(`${label}: ${json}`);
    } catch (error) {
      this.error(`Failed to stringify object ${label}: ${error.message}`);
    }
  }
  
  /**
   * Close the log stream
   */
  close() {
    this.info(`Logger closed at ${new Date().toISOString()}`);
    // No need to close anything with synchronous file operations
  }
}

// Create and export a singleton logger instance
const logger = new Logger();
export default logger;
