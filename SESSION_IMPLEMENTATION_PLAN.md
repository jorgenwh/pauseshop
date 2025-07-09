# Plan for Session Management Implementation

This document outlines the plan to implement session management functionality in the FreezeFrame Chrome Extension.

### 1. Dependency Management

*   Add the `uuid` library to handle the generation of unique session IDs.
*   Add `uuid` to `dependencies` in `package.json`.
*   Add `@types/uuid` to `devDependencies` in `package.json`.

### 2. Session State Management

*   Create a new file `src/background/session-manager.ts` to encapsulate all session-related logic.
*   This manager will maintain a mapping between a `pauseId` and its corresponding `sessionId`.
*   It will expose methods to:
    *   `startSession(pauseId)`: Generates and stores a new session ID.
    *   `getSessionId(pauseId)`: Retrieves the session ID for a given pause.
    *   `endSession(pauseId)`: Ends a session and triggers cleanup.

### 3. API Client Updates (`src/background/api-client.ts`)

*   Modify the `AnalyzeRequest` interface to include an optional `sessionId`.
*   Update the `analyzeImageStreaming` function to accept a `sessionId` and include it in the `POST` request to `/analyze/stream`.
*   Create a new function `endSession(sessionId: string)` that sends a `POST` request to `/session/:sessionId/end` to terminate the session on the server.

### 4. Workflow Integration

*   **Session Start**: In `src/background/service-worker.ts`, when a `"registerPause"` message is received, call `sessionManager.startSession(pauseId)`.
*   **Sending Session ID**: In `src/background/analysis-workflow.ts`, the `handleScreenshotAnalysis` function will be updated to retrieve the `sessionId` from the `sessionManager` and pass it to `analyzeImageStreaming`.
*   **Session End**: In `src/background/service-worker.ts`, upon receiving a `"cancelPause"` message, call `sessionManager.endSession(pauseId)`, which will in turn call the new `apiClient.endSession()` function and clear the session from the manager.

### Flow Diagram

```mermaid
graph TD
    subgraph Service Worker (service-worker.ts)
        A[onMessage] --> B{Message Type};
        B -->|registerPause| C[sessionManager.startSession(pauseId)];
        B -->|registerFrame| D[handleScreenshotAnalysis(pauseId)];
        B -->|cancelPause| E[sessionManager.endSession(pauseId)];
    end

    subgraph Session Manager (session-manager.ts)
        F[sessions: Map<pauseId, sessionId>];
        C --> G[Generate sessionId];
        G --> H[Store: sessions.set(pauseId, sessionId)];
        D --> I[Get sessionId by pauseId];
        E --> J[apiClient.endSession(sessionId)];
        J --> K[Delete: sessions.delete(pauseId)];
    end

    subgraph Analysis Workflow (analysis-workflow.ts)
        I --> L[handleScreenshotAnalysis];
        L -- imageData, sessionId --> M[apiClient.analyzeImageStreaming];
    end

    subgraph API Client (api-client.ts)
        M -- imageData, sessionId --> N[POST /analyze/stream];
        J -- sessionId --> O[POST /session/:sessionId/end];
    end

    subgraph Server
        N --> P[Analysis Server];
        O --> Q[Session Endpoint];
    end