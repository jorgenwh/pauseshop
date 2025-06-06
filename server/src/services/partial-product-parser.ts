import { Product, PartialProductParser } from "../types/analyze";
import { validateAndSanitizeProducts } from "./analysis-utils";

export class DefaultPartialProductParser implements PartialProductParser {
    private buffer: string = "";

    parse(newContent: string): Product[] {
        this.buffer += newContent;
        const extractedProducts: Product[] = [];
        let lastSuccessfulParseIndex = 0;

        // This regex attempts to find complete JSON objects.
        // It's still a simplification and might not handle all edge cases
        // like deeply nested structures or escaped quotes within strings.
        // A more robust solution would involve a proper streaming JSON parser library.
        const jsonObjectRegex = /({(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*})/g;

        // Reset regex lastIndex to search from the beginning of the buffer each time
        jsonObjectRegex.lastIndex = 0;

        let match;
        while ((match = jsonObjectRegex.exec(this.buffer)) !== null) {
            try {
                const potentialJson = match[1]; // Capture group 1 contains the full JSON object
                const parsed = JSON.parse(potentialJson);

                // Check if it's a product or an array of products
                if (
                    parsed &&
                    typeof parsed === "object" &&
                    "name" in parsed &&
                    "category" in parsed
                ) {
                    extractedProducts.push(parsed as Product);
                    lastSuccessfulParseIndex = jsonObjectRegex.lastIndex;
                } else if (Array.isArray(parsed)) {
                    parsed.forEach((item) => {
                        if (
                            item &&
                            typeof item === "object" &&
                            "name" in item &&
                            "category" in item
                        ) {
                            extractedProducts.push(item as Product);
                        }
                    });
                    lastSuccessfulParseIndex = jsonObjectRegex.lastIndex;
                }
            } catch (e) {
                // If parsing fails, it means it's not a complete valid JSON object yet,
                // or it's not a product object. We need to continue searching from
                // the character after the current match attempt to avoid infinite loops
                // on malformed or incomplete JSON.
                jsonObjectRegex.lastIndex = match.index + 1;
            }
        }

        // Remove successfully parsed content from the buffer
        if (lastSuccessfulParseIndex > 0) {
            this.buffer = this.buffer.substring(lastSuccessfulParseIndex);
        }

        return validateAndSanitizeProducts(extractedProducts);
    }
}
