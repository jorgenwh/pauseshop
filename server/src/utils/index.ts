/**
 * Utility functions for PauseShop server
 */

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);
    
    return `${size} ${sizes[i]}`;
};

/**
 * Get server uptime in seconds
 */
export const getUptime = (startTime: Date): number => {
    return Math.floor((Date.now() - startTime.getTime()) / 1000);
};

/**
 * Get memory usage information
 */
export const getMemoryUsage = () => {
    const usage = process.memoryUsage();
    return {
        used: formatBytes(usage.heapUsed),
        total: formatBytes(usage.heapTotal)
    };
};

/**
 * Get environment name with fallback
 */
export const getEnvironment = (): string => {
    return process.env.NODE_ENV || 'development';
};

/**
 * Get server version from package.json
 */
export const getVersion = (): string => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pkg = require('../../package.json');
        return pkg.version || '1.0.0';
    } catch {
        return '1.0.0';
    }
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
    return getEnvironment() === 'development';
};