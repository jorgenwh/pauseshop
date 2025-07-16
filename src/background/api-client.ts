/**
 * API client for server communication
 * Handles HTTP requests to the FreezeFrame backend server
 */

import { Product } from "../types/common";
import { getEndpointUrl } from "./server-config";
import { browser } from "wxt/browser";

interface AnalyzeRequest {
    image: string;
    sessionId: string; // Server expects 'sessionId' field, but we'll use pauseId as the value
    metadata?: {
        timestamp: string;
    };
}

export interface StreamingCallbacks {
    onProduct: (product: Product) => void;
    onComplete: (response?: unknown) => void;
    onError: (error: Event) => void;
}

/**
 * Sends image data to the server for streaming analysis
 * Uses a workaround to send POST data with EventSource by first initiating the stream
 */
export const analyzeImageStreaming = async (
    imageData: string,
    callbacks: StreamingCallbacks,
    pauseId: string,
    signal?: AbortSignal,
): Promise<void> => {
    // Get the endpoint URL using the server-config helper
    const url = getEndpointUrl('/analyze/stream');

    const request: AnalyzeRequest = {
        image: imageData,
        sessionId: pauseId, // Use pauseId as the sessionId value
        metadata: {
            timestamp: new Date().toISOString(),
        },
    };

    console.log(`[FreezeFrame:ApiClient] Starting streaming analysis for pauseId: ${pauseId}`);

    try {
        // Since EventSource only supports GET, we need to use fetch with streaming response
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "text/event-stream",
                "Cache-Control": "no-cache",
                "Accept-Language": browser.i18n.getUILanguage(),
            },
            body: JSON.stringify(request),
            signal: signal,
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
                    // Check if aborted
                    if (signal?.aborted) {
                        console.log(`[FreezeFrame:ApiClient] Streaming aborted - cancelling reader`);
                        reader.cancel();
                        throw new DOMException('Operation aborted', 'AbortError');
                    }

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
                                        parsedData.iconCategory &&
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
                                        "[FreezeFrame:ApiClient] Error parsing streaming data:",
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
                // Re-throw AbortError
                if (error instanceof Error && error.name === 'AbortError') {
                    console.warn(`[FreezeFrame:ApiClient] Stream reading aborted`);
                    throw error;
                }
                console.error("[FreezeFrame:ApiClient] Error reading stream:", error);
                callbacks.onError(new Event("stream_error"));
            }
        };

        await processStream();
    } catch (error) {
        // Re-throw AbortError to be handled by the caller
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn(`[FreezeFrame:ApiClient] Streaming analysis aborted during initialization`);
            throw error;
        }
        console.error(
            "[FreezeFrame:ApiClient] Failed to start streaming analysis:",
            error,
        );
        callbacks.onError(new Event("connection_error"));
    }
};

/**
 * Notifies the server to end a session.
 * @param pauseId The ID of the session to end.
 */
export const endSession = async (pauseId: string): Promise<void> => {
    const url = getEndpointUrl(`/session/${pauseId}/end`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "Accept-Language": browser.i18n.getUILanguage(),
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        console.log(`[FreezeFrame:ApiClient] Session ended successfully for pauseId: ${pauseId}`);
    } catch (error) {
        console.error(`[FreezeFrame:ApiClient] Failed to end session for pauseId: ${pauseId}`, error);
        // Re-throw the error to be handled by the caller
        throw error;
    }
};
