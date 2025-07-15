import { languagePreference } from "../storage";
import { browser } from "wxt/browser";

/**
 * Gets the effective language to use based on user preference
 * @returns The language code to use (en, es, de, fr, it, ja)
 */
export async function getEffectiveLanguage(): Promise<string> {
    try {
        const preference = await languagePreference.getValue();
        
        if (preference === "auto") {
            // Use browser's default language
            return browser.i18n.getUILanguage().split('-')[0] || 'en';
        }
        
        return preference;
    } catch (error) {
        console.warn("[FreezeFrame] Failed to get language preference, using browser default", error);
        return browser.i18n.getUILanguage().split('-')[0] || 'en';
    }
}

/**
 * Safe i18n wrapper that uses language preference if available, falls back to browser.i18n.getMessage
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