export interface ModelPricing {
    promptCostPerMillionTokens: number;
    completionCostPerMillionTokens: number;
}

export const OPENAI_MODEL_PRICING: { [key: string]: ModelPricing } = {
    "gpt-4o-mini": {
        promptCostPerMillionTokens: 0.15,
        completionCostPerMillionTokens: 0.6,
    },
    // Add other OpenAI models here
};

export const GEMINI_MODEL_PRICING: { [key: string]: ModelPricing } = {
    "gemini-2.5-flash-preview-05-20": {
        promptCostPerMillionTokens: 0.30,
        completionCostPerMillionTokens: 2.50,
    },
    // Add other Gemini models here
};

export const REQUESTY_MODEL_PRICING: { [key: string]: ModelPricing } = {
    "google/gemini-2.0-flash-exp": {
        promptCostPerMillionTokens: 0.0, // Example value, adjust as needed
        completionCostPerMillionTokens: 0.0, // Example value, adjust as needed
    },
    "gemini-2.5-flash-preview-05-20": {
        promptCostPerMillionTokens: 0.15,
        completionCostPerMillionTokens: 0.6,
    },
    "gpt-4o-mini": {
        promptCostPerMillionTokens: 0.15,
        completionCostPerMillionTokens: 0.6,
    },
    // Add other Requesty models here
};

export const OPENROUTER_MODEL_PRICING: { [key: string]: ModelPricing } = {
    "google/gemini-2.5-flash-preview-05-20": {
        promptCostPerMillionTokens: 0.15,
        completionCostPerMillionTokens: 0.6,
    },
    // Add other OpenRouter models here
};
