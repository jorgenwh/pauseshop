/**
 * Logging utilities for the PauseShop background service worker
 */

import type { ScreenshotConfig } from './types';

/**
 * Logs a message if logging is enabled in the config
 * @param config The screenshot configuration containing logging settings
 * @param message The message to log
 */
export const log = (config: ScreenshotConfig, message: string): void => {
    if (config.enableLogging) {
        console.log(`${config.logPrefix}: ${message}`);
    }
};

/**
 * Logs a message with timestamp and log level
 * @param config The screenshot configuration containing logging settings
 * @param level The log level (info, error, warn)
 * @param message The message to log
 * @param context Optional context object to include in the log
 */
export const logWithTimestamp = (config: ScreenshotConfig, level: 'info' | 'error' | 'warn', message: string, context?: any): void => {
    if (config.enableLogging) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${config.logPrefix}: ${message}`;
        
        switch (level) {
            case 'info':
                if (context) {
                    console.info(logMessage, context);
                } else {
                    console.info(logMessage);
                }
                break;
            case 'error':
                if (context) {
                    console.error(logMessage, context);
                } else {
                    console.error(logMessage);
                }
                break;
            case 'warn':
                if (context) {
                    console.warn(logMessage, context);
                } else {
                    console.warn(logMessage);
                }
                break;
        }
    }
};