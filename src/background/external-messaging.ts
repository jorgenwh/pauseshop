/**
 * Handles messages from external websites, such as pauseshop.net
 */

import { sessionData, clickHistory } from "../storage";

/**
 * Initializes the listener for external messages.
 */
export function initializeExternalMessaging() {
    browser.runtime.onMessageExternal.addListener(
        (message, sender, sendResponse) => {
            if (message.command === 'identify_and_get_data') {
                (async () => {
                    try {
                        const session = await sessionData.getValue();
                        const history = await clickHistory.getValue();

                        sendResponse({
                            // TODO: more robust handshake mechanism
                            app: "FreezeFrame",
                            data: {
                                clickedProduct: session?.clickedProduct ?? null,
                                productStorage: session
                                    ? {
                                        pauseId: session.pauseId,
                                        productGroups: session.productGroups,
                                    }
                                    : null,
                                clickHistory: history,
                            },
                        });
                    } catch (error) {
                        sendResponse({
                            app: 'FreezeFrame',
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                })();
                return true; // Indicates an async response
            }

            if (message.command === 'update_click_history') {
                (async () => {
                    try {
                        const updatedHistory = message.clickHistory;

                        // Validate the data structure
                        if (!Array.isArray(updatedHistory)) {
                            throw new Error('Invalid click history data format');
                        }

                        // Update the extension's click history storage
                        await clickHistory.setValue(updatedHistory);

                        sendResponse({
                            // TODO: more robust handshake mechanism
                            app: "FreezeFrame",
                            success: true,
                        });
                    } catch (error) {
                        sendResponse({
                            // TODO: more robust handshake mechanism
                            app: 'FreezeFrame',
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                })();
                return true; // Indicates an async response
            }
        },
    );
}
