import { browser } from "wxt/browser";

/**
 * Safe i18n wrapper that provides error handling and fallbacks
 * @param key The translation key
 * @param fallback Fallback text if translation fails
 * @returns Translated text or fallback
 */
export function safeTranslate(key: string, fallback: string): string {
    try {
        // Use type assertion to bypass strict typing while maintaining type safety
        const getMessage = browser.i18n.getMessage as (key: string) => string;
        return getMessage(key) || fallback;
    } catch (error) {
        console.warn(`[FreezeFrame] i18n translation failed for key: ${key}`, error);
        return fallback;
    }
}