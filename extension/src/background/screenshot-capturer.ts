/**
 * Screenshot capture functionality for the PauseShop background service worker
 */

export const captureScreenshot = async (windowId: number): Promise<string> => {
    const dataUrl: string = await chrome.tabs.captureVisibleTab(windowId, {
        format: "png",
    });
    return dataUrl;
};
