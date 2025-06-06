/**
 * API client for server communication
 * Handles HTTP requests to the PauseShop backend server
 */

interface ServerConfig {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}

interface AnalyzeRequest {
    image: string;
    metadata?: {
        timestamp: string;
    };
}

export interface Product {
    name: string;
    category: ProductCategory;
    brand: string;
    primaryColor: string;
    secondaryColors: string[];
    features: string[];
    targetGender: TargetGender;
    searchTerms: string;
}

export interface StreamingCallbacks {
    onProduct: (product: Product) => void;
    onComplete: () => void;
    onError: (error: Event) => void;
}

enum ProductCategory {
    CLOTHING = "clothing",
    ELECTRONICS = "electronics",
    FURNITURE = "furniture",
    ACCESSORIES = "accessories",
    FOOTWEAR = "footwear",
    HOME_DECOR = "home_decor",
    BOOKS_MEDIA = "books_media",
    SPORTS_FITNESS = "sports_fitness",
    BEAUTY_PERSONAL_CARE = "beauty_personal_care",
    KITCHEN_DINING = "kitchen_dining",
    OTHER = "other",
}

enum TargetGender {
    MEN = "men",
    WOMEN = "women",
    UNISEX = "unisex",
    BOY = "boy",
    GIRL = "girl",
}

const defaultConfig: ServerConfig = {
    baseUrl: "http://localhost:3000",
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
};

/**
 * Sleeps for the specified number of milliseconds
 */
const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Makes an HTTP request with timeout and retry logic
 */
const makeRequest = async (
    url: string,
    options: RequestInit,
    config: ServerConfig,
    attempt: number = 1,
): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);

        if (attempt < config.retryAttempts) {
            console.log(
                `[API Client] Request failed (attempt ${attempt}/${config.retryAttempts}), retrying in ${config.retryDelay}ms...`,
            );
            await sleep(config.retryDelay);
            return makeRequest(url, options, config, attempt + 1);
        }

        throw error;
    }
};

/**
 * Sends image data to the server for streaming analysis
 * Uses a workaround to send POST data with EventSource by first initiating the stream
 */
export const analyzeImageStreaming = async (
    imageData: string,
    callbacks: StreamingCallbacks,
    config: Partial<ServerConfig> = {},
): Promise<EventSource | null> => {
    const fullConfig: ServerConfig = { ...defaultConfig, ...config };
    const url = `${fullConfig.baseUrl}/analyze/stream`;

    const request: AnalyzeRequest = {
        image: imageData,
        metadata: {
            timestamp: new Date().toISOString(),
        },
    };

    try {
        // Since EventSource only supports GET, we need to use fetch with streaming response
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "text/event-stream",
                "Cache-Control": "no-cache",
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error("Response body is null");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const processStream = async () => {
            try {
                let done = false;
                do {
                    const { done: currentDone, value } = await reader.read();
                    done = currentDone;

                    if (done) {
                        callbacks.onComplete();
                    } else {
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || ""; // Keep incomplete line in buffer

                        for (const line of lines) {
                            if (line.trim() === "") continue;

                            if (line.startsWith("event: ")) {
                                continue;
                            }

                            if (line.startsWith("data: ")) {
                                const data = line.substring(6).trim();

                                try {
                                    const parsedData = JSON.parse(data);

                                    // Handle different event types based on the parsed data structure
                                    if (
                                        parsedData.name &&
                                        parsedData.category
                                    ) {
                                        // This is a product event
                                        callbacks.onProduct(parsedData);
                                    } else if (
                                        parsedData.totalProducts !==
                                            undefined ||
                                        parsedData.processingTime !== undefined
                                    ) {
                                        // This is a complete event
                                        callbacks.onComplete();
                                        return;
                                    } else if (
                                        parsedData.message &&
                                        parsedData.code
                                    ) {
                                        // This is an error event
                                        callbacks.onError(
                                            new Event("server_error"),
                                        );
                                        return;
                                    }
                                } catch (parseError) {
                                    console.error(
                                        "[API Client] Error parsing streaming data:",
                                        parseError,
                                        "Data:",
                                        data,
                                    );
                                }
                            }
                        }
                    }
                } while (!done);
            } catch (error) {
                console.error("[API Client] Error reading stream:", error);
                callbacks.onError(new Event("stream_error"));
            }
        };

        processStream();

        // Return a mock EventSource-like object for compatibility
        return {
            close: () => {
                reader.cancel();
            },
            readyState: 1, // OPEN
            url: url,
        } as EventSource;
    } catch (error) {
        console.error(
            "[API Client] Failed to start streaming analysis:",
            error,
        );
        callbacks.onError(new Event("connection_error"));
        return null;
    }
};

/**
 * Tests server connectivity
 */
export const testServerConnection = async (
    config: Partial<ServerConfig> = {},
): Promise<boolean> => {
    const fullConfig: ServerConfig = { ...defaultConfig, ...config };
    const url = `${fullConfig.baseUrl}/health`;

    try {
        const response = await makeRequest(url, { method: "GET" }, fullConfig);
        return response.ok;
    } catch (error) {
        console.error("[API Client] Server connectivity test failed:", error);
        return false;
    }
};
