# UI Implementation Plan

This document outlines the revised plan to implement the UI triggering mechanism from scratch within the `extension` directory, without reusing any files from the `old_extension` directory. The verification process will involve logging in the browser where UI components would have been activated, with actual UI components to be implemented later.

## Plan Overview

```mermaid
graph TD
    A[Start: Implement New UI Triggering Framework] --> B[Create New UIManager File];
    B --> C[Implement Basic UIManager Class];
    C --> D[Update extension/src/content/main-content.ts];
    D --> E[Update extension/src/content/screenshot-capturer.ts];
    E --> F[Verify Basic UI Framework];
    F --> G[End: UI Framework Ready for Implementation];

    subgraph Create New UIManager File
        B1[Create extension/src/ui/ui-manager.ts];
    end

    subgraph Implement Basic UIManager Class
        C1[Define UIManager class with initialize, showUI, hideUI, cleanup methods];
        C2[Add a static create method for initialization];
        C3[Include basic console logs for method calls];
    end

    subgraph Update main-content.ts
        D1[Add import for new UIManager];
        D2[Add import for setUIManager from screenshot-capturer];
        D3[Initialize UIManager.create()];
        D4[Call setUIManager with UIManager instance];
    end

    subgraph Update screenshot-capturer.ts
        E1[Add UIManager import];
        E2[Declare uiManager variable];
        E3[Implement setUIManager function];
        E4[Update hideUI to use uiManager.hideUI()];
        E5[Update cleanupUI to use uiManager.cleanup()];
    end
```

## Detailed Step-by-Step Implementation

### Goal 1: Create a new `UIManager` file and a basic class structure.

*   **Action:** Create a new file `extension/src/ui/ui-manager.ts` with a minimal `UIManager` class. This class will serve as the central point for managing UI visibility and lifecycle, without implementing the actual UI components yet.

*   **Content for `extension/src/ui/ui-manager.ts`:**
    ```typescript
    // extension/src/ui/ui-manager.ts
    export class UIManager {
        private isInitialized: boolean = false;

        constructor() {
            console.log("[UIManager] Instance created.");
        }

        public initialize(): boolean {
            if (this.isInitialized) {
                console.log("[UIManager] Already initialized.");
                return true;
            }
            console.log("[UIManager] Initializing...");
            // In a real scenario, this would involve creating and appending UI elements to the DOM.
            // For now, it's just a placeholder.
            this.isInitialized = true;
            console.log("[UIManager] Initialized successfully.");
            return true;
        }

        public async showUI(): Promise<boolean> {
            if (!this.isInitialized) {
                console.warn("[UIManager] Not initialized. Cannot show UI.");
                return false;
            }
            console.log("[UIManager] Showing UI.");
            // Placeholder for showing UI elements
            return true;
        }

        public async hideUI(): Promise<boolean> {
            if (!this.isInitialized) {
                console.warn("[UIManager] Not initialized. Cannot hide UI.");
                return false;
            }
            console.log("[UIManager] Hiding UI.");
            // Placeholder for hiding UI elements
            return true;
        }

        public cleanup(): void {
            if (!this.isInitialized) {
                console.warn("[UIManager] Not initialized. Nothing to clean up.");
                return;
            }
            console.log("[UIManager] Cleaning up UI.");
            // Placeholder for removing UI elements from DOM and event listeners
            this.isInitialized = false;
        }

        public static create(): UIManager | null {
            try {
                const manager = new UIManager();
                if (manager.initialize()) {
                    return manager;
                }
                return null;
            } catch (error) {
                console.error("[UIManager] Failed to create UI Manager:", error);
                return null;
            }
        }
    }
    ```

### Goal 2: Update `main-content.ts` to use the new `UIManager`.

*   **File:** `extension/src/content/main-content.ts`
*   **Changes:**
    1.  Add the import for `UIManager`:
        ```typescript
        import { UIManager } from "../ui/ui-manager";
        ```
    2.  Modify the existing import from `screenshot-capturer` to include `setUIManager`:
        ```typescript
        import {
            initializeScreenshotCapturer,
            cleanupUI,
            setUIManager, // Add this
        }
        from "./screenshot-capturer";
        ```
    3.  Insert the `UIManager` initialization logic after `const cleanupVideoDetector = initializeVideoDetector();`:
        ```typescript
        const uiManagerInstance = UIManager.create();

        if (uiManagerInstance) {
            setUIManager(uiManagerInstance); // Pass the initialized UIManager to screenshot-capturer
        } else {
            console.error(
                "PauseShop UI: Failed to initialize UIManager in main-content.ts",
            );
        }
        ```

### Goal 3: Update `screenshot-capturer.ts` to integrate with the new `UIManager`.

*   **File:** `extension/src/content/screenshot-capturer.ts`
*   **Changes:**
    1.  Add the import for `UIManager`:
        ```typescript
        import { UIManager } from "../ui/ui-manager";
        ```
    2.  Declare a module-level variable for `uiManager`:
        ```typescript
        let uiManager: UIManager | null = null;
        ```
    3.  Implement the `setUIManager` function:
        ```typescript
        export const setUIManager = (manager: UIManager): void => {
            uiManager = manager;
        };
        ```
    4.  Modify `hideUI` to call the `UIManager`'s `hideUI` method:
        ```typescript
        export const hideUI = async (): Promise<void> => {
            await uiManager?.hideUI();
        };
        ```
    5.  Modify `cleanupUI` to call the `UIManager`'s `cleanup` method:
        ```typescript
        export const cleanupUI = (): void => {
            uiManager?.cleanup();
        };
        ```

### Goal 4: Verify and Test

*   **Action:** Once the code changes are applied, the next step will be to verify that the basic UI framework is correctly integrated. This will involve loading the modified extension in a browser and checking console logs to confirm `UIManager` initialization, and calls to `showUI`, `hideUI`, and `cleanup` as expected.