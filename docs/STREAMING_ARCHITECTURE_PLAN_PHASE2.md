# Streaming Product Analysis Architecture Plan - Phase 2

## Executive Summary

This plan details the implementation of **true AI streaming** for product analysis, focusing on Phase 2 of the overall architecture plan. The primary goal is to progressively display products in the UI as they are identified by the AI, providing immediate user feedback and significantly improved perceived performance. This phase will specifically focus on integrating streaming capabilities for the Gemini AI service first, and will also incorporate per-product Amazon search and scraping as products arrive.

## Implementation Plan - Phase 2: Frontend Streaming Client Updates

**Goal 1: Modify `extension/src/background/api-client.ts` for SSE Streaming**
*   Add a new function, `analyzeImageStreaming`, that establishes an `EventSource` connection to a new `/analyze-stream` endpoint on the server.
*   This function will take callbacks for `onProduct`, `onComplete`, and `onError` events.
*   The `onProduct` callback will receive individual `Product` objects as they are streamed from the server.
*   The `onComplete` callback will be triggered when the stream ends successfully.
*   The `onError` callback will handle any streaming errors.
*   The existing `analyzeImage` will remain for backward compatibility or fallback.

**Goal 2: Modify `extension/src/background/analysis-workflow.ts` to use Streaming API and perform per-product Amazon search/scraping**
*   Update `handleScreenshotAnalysis` to use the new `analyzeImageStreaming` function.
*   Implement the `onProduct` callback within `handleScreenshotAnalysis`. For each received product:
    *   Perform Amazon search and scraping for that individual product.
    *   Forward the scraped product data to the UI. This will involve a new message passing mechanism to the UI.
*   Implement `onComplete` and `onError` callbacks to signal the end of the streaming process or any errors to the UI.

**Goal 3: Modify `extension/src/ui/components/product-list.ts` for Incremental Updates**
*   Add a new method, `addProduct`, to `ProductList` that can dynamically add a single `ProductCard` to the list.
*   This `addProduct` method should incorporate the existing staggered animation for new products.
*   The `create` method will be simplified to initialize an empty list, and products will be added via `addProduct` as they arrive.
*   Ensure existing UI elements (loading states, error states) are maintained and updated appropriately during the streaming process.

**Goal 4: Establish Communication between Background Script and UI**
*   A message passing mechanism (e.g., `chrome.runtime.sendMessage` and `chrome.runtime.onMessage`) will be needed to send individual product data from the background script to the UI.

## Technical Architecture - Revised Streaming Flow (Phase 2 Focus)

```mermaid
graph TD
    A[Image Capture] --> B(Extension Background Script);
    B --> C{handleScreenshotAnalysis};
    C --> D[Call analyzeImageStreaming];
    D -- Establishes SSE --> E(Server /analyze-stream Endpoint);
    E -- Streams Product Events --> D;
    D -- onProduct Callback --> F{Perform Amazon Search/Scraping for Product};
    F --> G[Send Scraped Product to UI];
    G --> H(Extension UI Script);
    H --> I[ProductList.addProduct];
    I --> J[Display Product Card];
    D -- onComplete/onError --> K[Signal Stream End/Error to UI];
    K --> H;
    H --> L[Update UI Loading/Error State];