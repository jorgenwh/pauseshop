/**
 * Handles messages from external websites, such as pauseshop.net
 */

import { clickedProductInfo, productStorage } from '../storage';

/**
 * Initializes the listener for external messages.
 */
export function initializeExternalMessaging() {
  browser.runtime.onMessageExternal.addListener(
    (message, sender, sendResponse) => {
      if (message.command === 'identify_and_get_data') {
        (async () => {
          try {
            const [clickedProduct, productData] = await Promise.all([
              clickedProductInfo.getValue(),
              productStorage.getValue(),
            ]);

            sendResponse({
              app: 'PauseShop',
              data: {
                clickedProduct,
                productStorage: productData,
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