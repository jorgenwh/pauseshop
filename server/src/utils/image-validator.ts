/**
 * Image validation utilities for analyze endpoint
 */

import { ImageValidationResult } from "../types/analyze";

/**
 * Validates base64 image data
 * @param imageData Base64 data URL string
 * @returns ImageValidationResult with validation details
 */
export const validateImageData = (imageData: string): ImageValidationResult => {
    try {
        // Check if it's a valid data URL format
        if (!imageData.startsWith("data:")) {
            return {
                isValid: false,
                error: "Image data must be a valid data URL",
            };
        }

        // Extract MIME type and base64 data
        const [header, base64Data] = imageData.split(",");

        if (!header || !base64Data) {
            return {
                isValid: false,
                error: "Invalid data URL format",
            };
        }

        // Check MIME type
        const mimeMatch = header.match(/data:([^;]+)/);
        if (!mimeMatch) {
            return {
                isValid: false,
                error: "Could not extract MIME type from data URL",
            };
        }

        const mimeType = mimeMatch[1];
        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
        ];

        if (!allowedTypes.includes(mimeType)) {
            return {
                isValid: false,
                error: `Unsupported image format: ${mimeType}. Allowed formats: ${allowedTypes.join(", ")}`,
            };
        }

        // Validate base64 encoding
        try {
            const buffer = Buffer.from(base64Data, "base64");
            const sizeBytes = buffer.length;

            // Check file size (max 10MB)
            const maxSizeBytes = 10 * 1024 * 1024; // 10MB
            if (sizeBytes > maxSizeBytes) {
                return {
                    isValid: false,
                    error: `Image size too large: ${Math.round(sizeBytes / 1024 / 1024)}MB. Maximum allowed: 10MB`,
                };
            }

            return {
                isValid: true,
                format: mimeType,
                sizeBytes,
            };
        } catch (error) {
            return {
                isValid: false,
                error: "Invalid base64 encoding",
            };
        }
    } catch (error) {
        return {
            isValid: false,
            error: `Image validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
};
