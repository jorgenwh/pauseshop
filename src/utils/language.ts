import { browser } from "wxt/browser";

/**
 * Safe i18n wrapper that provides error handling and fallbacks
 * @param key The translation key
 * @param fallback Fallback text if translation fails
 * @returns Translated text or fallback
 */
export function safeTranslate(key: string, fallback: string): string {
    try {
        return browser.i18n.getMessage(key as any) || fallback;
    } catch (error) {
        console.warn(`[FreezeFrame] i18n translation failed for key: ${key}`, error);
        return fallback;
    }
}