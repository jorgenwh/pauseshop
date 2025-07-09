/**
 * Server configuration constants
 * This file centralizes server URL configurations
 */

// Server environment types
export type ServerEnvironment = 'remote' | 'local';

// Server URLs for different environments
export const SERVER_URLS = {
    remote: 'https://pauseshop-server-rfrxaro25a-uc.a.run.app',
    local: 'http://localhost:3000'
};

// Website URLs for different environments
export const WEBSITE_URLS = {
    remote: 'https://freeze-frame.net',
    local: 'http://localhost:5173'
};

// Helper function to get base URL for the current environment
export const getServerBaseUrl = (): string => {
    const serverEnv = (process.env.SERVER_ENV as ServerEnvironment) || 'remote';
    return SERVER_URLS[serverEnv] || SERVER_URLS.remote;
};

// Helper function to get website URL for the current environment
export const getWebsiteBaseUrl = (): string => {
    const serverEnv = (process.env.SERVER_ENV as ServerEnvironment) || 'remote';
    return WEBSITE_URLS[serverEnv] || WEBSITE_URLS.remote;
};

// Helper function to get full endpoint URL
export const getEndpointUrl = (endpoint: string): string => {
    const baseUrl = getServerBaseUrl();
    return `${baseUrl}${endpoint}`;
};
