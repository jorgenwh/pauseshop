/**
 * Amazon HTTP client for executing search requests
 * Handles rate limiting, retry logic, and realistic browser headers
 */

import {
    AmazonSearchBatch,
    AmazonSearchResult,
    AmazonHttpConfig,
    AmazonSearchExecutionResult,
    AmazonSearchExecutionBatch,
} from "../types/amazon";

// Default configuration for Amazon HTTP requests
const DEFAULT_HTTP_CONFIG: AmazonHttpConfig = {
    maxConcurrentRequests: 3,
    requestDelayMs: 1500,
    timeoutMs: 10000,
    maxRetries: 2,
    userAgentRotation: true,
};

// Realistic user agents for rotation
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
];

// Request queue to manage concurrency
interface QueuedRequest {
    searchResult: AmazonSearchResult;
    resolve: (result: AmazonSearchExecutionResult) => void;
    reject: (error: Error) => void;
    retryCount: number;
}

class AmazonHttpClient {
    private requestQueue: QueuedRequest[] = [];
    private activeRequests = 0;
    private config: AmazonHttpConfig;
    private userAgentIndex = 0;

    constructor(config: AmazonHttpConfig = DEFAULT_HTTP_CONFIG) {
        this.config = config;
    }

    /**
     * Generates realistic headers for Amazon requests
     */
    private generateRealisticHeaders(_url: string): HeadersInit {
        const userAgent = this.config.userAgentRotation
            ? USER_AGENTS[this.userAgentIndex % USER_AGENTS.length]
            : USER_AGENTS[0];

        if (this.config.userAgentRotation) {
            this.userAgentIndex++;
        }

        return {
            "User-Agent": userAgent,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0",
        };
    }

    /**
     * Implements rate limiting delay
     */
    private async handleRateLimit(): Promise<void> {
        const delay = this.config.requestDelayMs + Math.random() * 500; // Add jitter
        return new Promise((resolve) => setTimeout(resolve, delay));
    }

    /**
     * Executes a single Amazon search request with retry logic
     */
    private async executeAmazonSearchWithRetry(
        searchResult: AmazonSearchResult,
        retryCount = 0,
    ): Promise<AmazonSearchExecutionResult> {
        const startTime = Date.now();

        try {
            // Apply rate limiting
            if (this.activeRequests > 0) {
                await this.handleRateLimit();
            }

            this.activeRequests++;

            // Generate headers
            const headers = this.generateRealisticHeaders(
                searchResult.searchUrl,
            );

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                this.config.timeoutMs,
            );

            try {
                const response = await fetch(searchResult.searchUrl, {
                    method: "GET",
                    headers,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);
                const responseTime = Date.now() - startTime;

                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}: ${response.statusText}`,
                    );
                }

                const htmlContent = await response.text();

                // Validate response content
                if (!htmlContent || htmlContent.length < 100) {
                    throw new Error("Invalid or empty response content");
                }

                // Check for Amazon blocking indicators
                if (
                    htmlContent.includes("captcha") ||
                    htmlContent.includes(
                        "Enter the characters you see below",
                    ) ||
                    htmlContent.includes("Robot Check")
                ) {
                    throw new Error("Amazon anti-bot protection detected");
                }

                return {
                    productId: searchResult.productId,
                    searchUrl: searchResult.searchUrl,
                    success: true,
                    htmlContent,
                    statusCode: response.status,
                    responseTime,
                    retryCount,
                    originalSearchResult: searchResult,
                };
            } catch (fetchError) {
                clearTimeout(timeoutId);

                if (
                    fetchError instanceof Error &&
                    fetchError.name === "AbortError"
                ) {
                    throw new Error(
                        `Request timeout after ${this.config.timeoutMs}ms`,
                    );
                }

                throw fetchError;
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

            // Retry logic
            if (retryCount < this.config.maxRetries) {
                console.warn(
                    `Amazon request failed (attempt ${retryCount + 1}/${this.config.maxRetries + 1}): ${errorMessage}`,
                );

                // Exponential backoff with jitter
                const backoffDelay =
                    1000 * Math.pow(2, retryCount) + Math.random() * 1000;
                await new Promise((resolve) =>
                    setTimeout(resolve, backoffDelay),
                );

                return this.executeAmazonSearchWithRetry(
                    searchResult,
                    retryCount + 1,
                );
            }

            // Final failure
            return {
                productId: searchResult.productId,
                searchUrl: searchResult.searchUrl,
                success: false,
                error: errorMessage,
                responseTime,
                retryCount,
                originalSearchResult: searchResult,
            };
        } finally {
            this.activeRequests--;
        }
    }

    /**
     * Processes the request queue with concurrency control
     */
    private async processQueue(): Promise<void> {
        while (
            this.requestQueue.length > 0 &&
            this.activeRequests < this.config.maxConcurrentRequests
        ) {
            const queuedRequest = this.requestQueue.shift();
            if (!queuedRequest) continue;

            // Process request asynchronously
            this.executeAmazonSearchWithRetry(
                queuedRequest.searchResult,
                queuedRequest.retryCount,
            )
                .then(queuedRequest.resolve)
                .catch(queuedRequest.reject);
        }
    }

    /**
     * Executes a single Amazon search request
     */
    async executeAmazonSearch(
        searchResult: AmazonSearchResult,
    ): Promise<AmazonSearchExecutionResult> {
        return new Promise<AmazonSearchExecutionResult>((resolve, reject) => {
            this.requestQueue.push({
                searchResult,
                resolve,
                reject,
                retryCount: 0,
            });

            this.processQueue();
        });
    }

    /**
     * Executes multiple Amazon search requests in batch
     */
    async executeAmazonSearchBatch(
        searchBatch: AmazonSearchBatch,
    ): Promise<AmazonSearchExecutionBatch> {
        const startTime = Date.now();
        const executionResults: AmazonSearchExecutionResult[] = [];

        try {
            // Filter out failed search results from Task 3.1
            const validSearchResults = searchBatch.searchResults.filter(
                (result) => result.searchUrl && result.searchUrl.length > 0,
            );

            if (validSearchResults.length === 0) {
                return {
                    executionResults: [],
                    config: this.config,
                    metadata: {
                        totalRequests: 0,
                        successfulRequests: 0,
                        failedRequests: 0,
                        totalExecutionTime: Date.now() - startTime,
                        averageResponseTime: 0,
                    },
                };
            }

            // Execute all requests
            const promises = validSearchResults.map((searchResult) =>
                this.executeAmazonSearch(searchResult),
            );

            const results = await Promise.all(promises);
            executionResults.push(...results);

            // Calculate metadata
            const totalExecutionTime = Date.now() - startTime;
            const successfulRequests = executionResults.filter(
                (r) => r.success,
            ).length;
            const failedRequests = executionResults.length - successfulRequests;
            const totalResponseTime = executionResults.reduce(
                (sum, r) => sum + r.responseTime,
                0,
            );
            const averageResponseTime =
                executionResults.length > 0
                    ? totalResponseTime / executionResults.length
                    : 0;

            return {
                executionResults,
                config: this.config,
                metadata: {
                    totalRequests: executionResults.length,
                    successfulRequests,
                    failedRequests,
                    totalExecutionTime,
                    averageResponseTime,
                },
            };
        } catch (error) {
            console.error("Batch execution failed:", error);

            return {
                executionResults,
                config: this.config,
                metadata: {
                    totalRequests: searchBatch.searchResults.length,
                    successfulRequests: 0,
                    failedRequests: searchBatch.searchResults.length,
                    totalExecutionTime: Date.now() - startTime,
                    averageResponseTime: 0,
                },
            };
        }
    }
}

/**
 * Executes Amazon search requests for multiple products
 */
export const executeAmazonSearchBatch = async (
    searchBatch: AmazonSearchBatch,
    config: Partial<AmazonHttpConfig> = {},
): Promise<AmazonSearchExecutionBatch> => {
    const fullConfig: AmazonHttpConfig = { ...DEFAULT_HTTP_CONFIG, ...config };
    const client = new AmazonHttpClient(fullConfig);
    return client.executeAmazonSearchBatch(searchBatch);
};

/**
 * Executes a single Amazon search request (convenience function)
 */
export const executeAmazonSearch = async (
    searchResult: AmazonSearchResult,
    config: Partial<AmazonHttpConfig> = {},
): Promise<AmazonSearchExecutionResult> => {
    const fullConfig: AmazonHttpConfig = { ...DEFAULT_HTTP_CONFIG, ...config };
    const client = new AmazonHttpClient(fullConfig);
    return client.executeAmazonSearch(searchResult);
};

/**
 * Gets the default HTTP configuration
 */
export const getDefaultHttpConfig = (): AmazonHttpConfig => {
    return { ...DEFAULT_HTTP_CONFIG };
};
