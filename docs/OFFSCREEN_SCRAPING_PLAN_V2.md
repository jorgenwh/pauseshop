# Offscreen Document Scraping Implementation Plan (v2)

## Overview

This plan details the implementation of a robust scraping strategy using Chrome's Offscreen Document API, augmented by the `declarativeNetRequest` API. The goal is to bypass Amazon's `X-Frame-Options` and `Content-Security-Policy` headers, allowing their pages to be rendered in an iframe within the extension. This will provide high-quality, fully-rendered HTML for parsing, closely mimicking a manual user search. The existing `fetch`-based logic will be kept as a fallback.

## 1. Implementation Steps

### Step 1: Update Manifest (`wxt.config.ts`)

1.  **Add Permissions**: Add the `declarativeNetRequest` and `declarativeNetRequestWithHostAccess` permissions to the manifest.
2.  **Define Rule Resources**: Declare a new `declarative_net_request` field in the manifest, pointing to a `rules.json` file that will contain our header modification rules.

### Step 2: Create the Declarative Net Request Ruleset

1.  **Create `rules.json`**: Create a new file at `public/rules.json`.
2.  **Define Header Removal Rule**: Inside this file, define a rule that:
    -   Is assigned a unique ID.
    -   Targets all main frame requests directed to any Amazon domain (`*.amazon.com`, `*.amazon.co.uk`, etc.).
    -   Specifies an `action` of type `modifyHeaders`.
    -   Includes a `responseHeaders` array to remove the `x-frame-options` and `content-security-policy` headers.

### Step 3: Update Offscreen Scraping Logic

The existing offscreen document files (`entrypoints/offscreen/index.html`, `entrypoints/offscreen/main.ts`, and `src/amazon/amazon-offscreen-client.ts`) and the orchestrator (`src/amazon/amazon-orchestrator.ts`) can remain as they are. The `declarativeNetRequest` rule operates transparently in the background, so no changes to the offscreen client logic are needed. The fallback mechanism will also remain in place.

## 2. Revised Flow Diagram

The core logic flow remains the same as the original plan, but the success of the "Offscreen Scrape" step is now enabled by the new background rule.

```mermaid
graph TD
    subgraph "Browser Internals"
        A[Network Request to Amazon] --> B{declarativeNetRequest API};
        B -- "Matches amazon.com" --> C[Rule Applied: Remove X-Frame-Options];
        C --> D[Modified Response Headers];
    end

    subgraph "Extension Logic"
        E[Start Search] --> F{executeAmazonSearchWithFallback};
        F --> G[Attempt Offscreen Scrape];
        G -- "Loads iframe" --> A;
        D --> H[Iframe Renders Successfully];
        H --> I[Return High-Quality HTML];
        I --> J[End];
    end

    F -- "Fallback on Error" --> K[Execute Fetch Scrape];
    K --> J;