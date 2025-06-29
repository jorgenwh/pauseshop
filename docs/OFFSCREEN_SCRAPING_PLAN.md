# Offscreen Document Scraping Implementation Plan

## Overview

To improve the quality of Amazon search results, this plan outlines the implementation of a new scraping strategy using Chrome's Offscreen Document API. This will allow the extension to execute searches within a full browser context, more closely mimicking a manual user search and capturing dynamically rendered content. The existing `fetch`-based scraping logic will be retained as a robust fallback mechanism.

## 1. Potential Drawbacks & Failure Modes

-   **`X-Frame-Options` Blocking**: The primary risk is that Amazon's security headers (`X-Frame-Options` or `Content-Security-Policy`) may prevent the page from being rendered inside the offscreen document's `<iframe>`. The plan includes a fallback to the original `fetch` method to mitigate this.
-   **Increased Resource Usage**: Offscreen documents are more memory and CPU intensive than `fetch` requests. The implementation will mitigate this by creating and destroying the document on-demand.
-   **Slower Execution Time**: This method is inherently slower as it must wait for the full page to render. A timeout will be implemented to prevent indefinite hangs.
-   **Bot Detection**: While less likely than with `fetch`, sophisticated anti-bot systems could still potentially identify and block the headless environment.

## 2. Implementation Steps

### Step 2.1: Update Manifest and Create Offscreen Files

1.  **Add Permission in `wxt.config.ts`**: Add the `"offscreen"` permission to the manifest to enable the API.
2.  **Create Offscreen HTML File**: Create `entrypoints/offscreen/index.html` to serve as the host for the offscreen document.
3.  **Create Offscreen Script File**: Create `entrypoints/offscreen/main.ts`, which will contain the logic for performing the scrape inside the hidden page.

### Step 2.2: Create a New Offscreen HTTP Client

1.  **Create New File**: Create `src/amazon/amazon-offscreen-client.ts`.
2.  **Implement `executeAmazonSearchOffscreen`**: This function will manage the lifecycle of the offscreen document:
    -   Check if an offscreen document already exists.
    -   If not, create one using `chrome.offscreen.createDocument`.
    -   Send a message to the offscreen script with the `searchUrl`.
    -   Handle the response, resolving with the scraped HTML or rejecting on error.
    -   Implement a timeout for the entire operation.
    -   Ensure the offscreen document is closed after the operation completes or fails.

### Step 2.3: Implement the Offscreen Scraping Logic

1.  **Add Logic to `entrypoints/offscreen/main.ts`**:
    -   Add a `chrome.runtime.onMessage` listener to receive scraping requests from the background script.
    -   Implement a `scrapeUrl` function that:
        -   Creates an `<iframe>` element.
        -   Sets its `src` to the Amazon search URL.
        -   Appends it to the document body.
        -   Waits for the `iframe` to fully load using `onload`.
        -   Includes an additional delay (`setTimeout`) to allow for dynamically rendered content to appear.
        -   Extracts the `innerHTML` of the loaded iframe.
        -   Cleans up by removing the iframe.
        -   Sends the HTML content back as a response.

### Step 2.4: Integrate the Fallback Strategy

1.  **Create Orchestrator File**: Create `src/amazon/amazon-orchestrator.ts`.
2.  **Implement `executeAmazonSearchWithFallback`**: This high-level function will be the new entry point for performing a search.
    -   It will first attempt to call `executeAmazonSearchOffscreen`.
    -   If the offscreen method fails for any reason (e.g., timeout, `X-Frame-Options` error), its `catch` block will trigger.
    -   Inside the `catch` block, it will log a warning and then call the original `fetch`-based `executeAmazonSearch` from `amazon-http-client.ts`.
    -   If the fallback method also fails, it will log a final error and return `null`.
3.  **Update Call Sites**: Refactor the background script (likely in `src/background/analysis-workflow.ts` or a similar file) to call `executeAmazonSearchWithFallback` instead of `executeAmazonSearch`.

## 3. Flow Diagram

```mermaid
graph TD
    A[Start Search] --> B{executeAmazonSearchWithFallback};
    B --> C[Attempt Offscreen Scrape];
    C --> D{Success?};
    D -- Yes --> E[Return High-Quality HTML];
    D -- No --> F[Log Warning & Fallback];
    F --> G[Attempt Fetch Scrape];
    G --> H{Success?};
    H -- Yes --> I[Return Raw HTML];
    H -- No --> J[Log Error & Return Null];
    E --> K[End];
    I --> K;
    J --> K;
end