/**
 * CancellationRegistry manages AbortControllers for pause analysis operations
 * to prevent race conditions when multiple pause events trigger overlapping workflows
 */

export class CancellationRegistry {
    private controllers: Map<string, AbortController> = new Map();

    /**
     * Register a new pause operation with its pauseId
     * Automatically cancels any existing operation with the same pauseId
     */
    registerPause(pauseId: string): AbortController {
        // Cancel existing operation if it exists
        const hadExisting = this.controllers.has(pauseId);
        if (hadExisting) {
            console.log(`[PauseShop:CancellationRegistry] Cancelling previous pause before registering new one for pauseId: ${pauseId}`);
        }
        this.cancelPause(pauseId);

        // Create new AbortController
        const controller = new AbortController();
        this.controllers.set(pauseId, controller);

        console.log(`[PauseShop:CancellationRegistry] Registered pause for pauseId: ${pauseId}`);
        return controller;
    }

    /**
     * Cancel a specific pause operation by its pauseId
     */
    cancelPause(pauseId: string): void {
        const controller = this.controllers.get(pauseId);
        if (controller) {
            controller.abort();
            this.controllers.delete(pauseId);
            console.warn(`[PauseShop:CancellationRegistry] Cancelled pause for pauseId: ${pauseId}`);
        }
    }

    /**
     * Cancel all active pause operations
     */
    cancelAll(): void {
        this.controllers.forEach((controller, pauseId) => {
            controller.abort();
            console.warn(`[PauseShop:CancellationRegistry] Cancelled pause for pauseId: ${pauseId}`);
        });
        this.controllers.clear();
    }

    /**
     * Get the AbortSignal for a specific pauseId
     * Returns undefined if no controller exists for the pauseId
     */
    getAbortSignal(pauseId: string): AbortSignal | undefined {
        const controller = this.controllers.get(pauseId);
        console.log(`[PauseShop:CancellationRegistry] Getting abort signal for pauseId: ${pauseId}, exists: ${!!controller}`);
        return controller?.signal;
    }

    /**
     * Check if a pause operation is registered
     */
    isRegistered(pauseId: string): boolean {
        return this.controllers.has(pauseId);
    }

    /**
     * Clean up completed operations (those that weren't aborted)
     */
    cleanup(pauseId: string): void {
        const controller = this.controllers.get(pauseId);
        if (controller && !controller.signal.aborted) {
            this.controllers.delete(pauseId);
            console.log(`[PauseShop:CancellationRegistry] Cleaned up completed pause for pauseId: ${pauseId}`);
        }
    }
}

// Export singleton instance
export const cancellationRegistry = new CancellationRegistry();