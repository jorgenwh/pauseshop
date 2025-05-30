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