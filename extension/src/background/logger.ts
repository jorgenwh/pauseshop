/**
 * Logging utilities for the PauseShop background service worker
 */

/**
 * Logs a message
 * @param message The message to log
 */
export const log = (message: string): void => {
    console.log(`[Pauseshop Extension]: ${message}`);
};

/**
 * Logs a message with timestamp and log level
 * @param level The log level (info, error, warn)
 * @param message The message to log
 * @param context Optional context object to include in the log
 */
export const logWithTimestamp = (
    level: "info" | "error" | "warn",
    message: string,
    context?: unknown,
): void => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [Pauseshop Extension]: ${message}`;

    switch (level) {
        case "info":
            if (context) {
                console.info(logMessage, context);
            } else {
                console.info(logMessage);
            }
            break;
        case "error":
            if (context) {
                console.error(logMessage, context);
            } else {
                console.error(logMessage);
            }
            break;
        case "warn":
            if (context) {
                console.warn(logMessage, context);
            } else {
                console.warn(logMessage);
            }
            break;
    }
};
