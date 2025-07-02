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
      // Check if the message is a request for storage data
      if (message.command === 'getStorage') {
        console.log('Storage data requested from website:', sender.origin);
        // Use an async function to handle storage retrieval
        (async () => {
          try {
            // Retrieve all items from local storage
            const allStorage = {
              clickedProduct: await clickedProductInfo.getValue(),
              productStorage: await productStorage.getValue(),
            };
            // Send the retrieved items back to the website
            sendResponse({ success: true, data: allStorage });
          } catch (error) {
            // Handle any errors that occur during storage retrieval
            sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
          }
        })();
        // Return true to indicate that the response will be sent asynchronously
        return true;
      }
    },
  );
}