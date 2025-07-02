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
              app: "PauseShop",
              data: {
                clickedProduct: session,
                productStorage: session,
                clickHistory: history,
              },
            });
          } catch (error) {
            sendResponse({
              app: 'PauseShop',
              error: error instanceof Error ? error.message : String(error),
            });
          }
        })();
        return true; // Indicates an async response
      }
    },
  );
}