/**
 * Amazon HTTP client for executing search requests
 * Handles rate limiting, retry logic, and realistic browser headers
 */

import {
    AMAZON_MAX_CONCURRENT_REQUESTS,
    AMAZON_MAX_RETRIES,
    AMAZON_REQUEST_DELAY_MS,
    AMAZON_TIMEOUT_MS,
    AMAZON_USER_AGENT_ROTATE,
} from "../background/constants";
import { AmazonSearch, AmazonSearchResult } from "../types/amazon";

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
];

// Request queue to manage concurrency
interface QueuedRequest {
    search: AmazonSearch;
    resolve: (result: AmazonSearchResult | null) => void;
    reject: (error: Error) => void;
    retryCount: number;
    signal?: AbortSignal;
}

class AmazonHttpClient {
    private requestQueue: QueuedRequest[] = [];
    private activeRequests = 0;
    private userAgentIndex = 0;

    constructor() {}

    /**
     * Generates realistic headers for Amazon requests
     */
    private generateRealisticHeaders(_url: string): HeadersInit {
        const userAgent = AMAZON_USER_AGENT_ROTATE
            ? USER_AGENTS[this.userAgentIndex % USER_AGENTS.length]
            : USER_AGENTS[0];

        if (AMAZON_USER_AGENT_ROTATE) {
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

    private async handleRateLimit(): Promise<void> {
        const delay = AMAZON_REQUEST_DELAY_MS + Math.random() * 500; // Add jitter
        return new Promise((resolve) => setTimeout(resolve, delay));
    }

    /**
     * Executes a single Amazon search request with retry logic
     */
    private async executeAmazonSearchWithRetry(
        search: AmazonSearch,
        retryCount = 0,
        signal?: AbortSignal,
    ): Promise<AmazonSearchResult | null> {
        try {
            // Check if already aborted
            if (signal?.aborted) {
                throw new DOMException('Operation aborted', 'AbortError');
            }
            if (this.activeRequests > 0) {
                await this.handleRateLimit();
            }

            this.activeRequests++;

            const headers = this.generateRealisticHeaders(search.searchUrl);

            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                AMAZON_TIMEOUT_MS,
            );

            // Combine timeout signal with provided signal
            const combinedSignal = signal
                ? AbortSignal.any([controller.signal, signal])
                : controller.signal;

            try {
                const response = await fetch(search.searchUrl, {
                    method: "GET",
                    headers,
                    signal: combinedSignal,
                });

                clearTimeout(timeoutId);

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
                    id: search.id,
                    searchUrl: search.searchUrl,
                    htmlContent,
                    search: search,
                };
            } catch (fetchError) {
                clearTimeout(timeoutId);

                if (
                    fetchError instanceof Error &&
                    fetchError.name === "AbortError"
                ) {
                    // Check if it was our timeout or external abort
                    if (signal?.aborted) {
                        throw fetchError; // Re-throw external abort
                    }
                    throw new Error(
                        `Request timeout after ${AMAZON_TIMEOUT_MS}ms`,
                    );
                }

                throw fetchError;
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";

            // Don't retry on abort
            if (error instanceof Error && error.name === 'AbortError') {
                throw error;
            }

            // Retry logic
            if (retryCount < AMAZON_MAX_RETRIES) {
                console.warn(
                    `Amazon request failed (attempt ${retryCount + 1}/${AMAZON_MAX_RETRIES + 1}): ${errorMessage}`,
                );

                // Exponential backoff with jitter
                const backoffDelay =
                    1000 * Math.pow(2, retryCount) + Math.random() * 1000;
                await new Promise((resolve) =>
                    setTimeout(resolve, backoffDelay),
                );

                return this.executeAmazonSearchWithRetry(
                    search,
                    retryCount + 1,
                    signal,
                );
            }
            return null;
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
            this.activeRequests < AMAZON_MAX_CONCURRENT_REQUESTS
        ) {
            const queuedRequest = this.requestQueue.shift();
            if (!queuedRequest) continue;

            // Process request asynchronously
            this.executeAmazonSearchWithRetry(
                queuedRequest.search,
                queuedRequest.retryCount,
                queuedRequest.signal,
            )
                .then(queuedRequest.resolve)
                .catch(queuedRequest.reject);
        }
    }

    /**
     * Executes a single Amazon search request
     */
    async executeAmazonSearch(
        search: AmazonSearch,
        signal?: AbortSignal,
    ): Promise<AmazonSearchResult | null> {
        return new Promise<AmazonSearchResult | null>((resolve, reject) => {
            // If already aborted, reject immediately
            if (signal?.aborted) {
                reject(new DOMException('Operation aborted', 'AbortError'));
                return;
            }

            this.requestQueue.push({
                search,
                resolve,
                reject,
                retryCount: 0,
                signal,
            });

            this.processQueue();
        });
    }
}

/**
 * Executes a single Amazon search request (convenience function)
 */
export const executeAmazonSearch = async (
    search: AmazonSearch,
    signal?: AbortSignal,
): Promise<AmazonSearchResult | null> => {
    const client = new AmazonHttpClient();
    return client.executeAmazonSearch(search, signal);
};
