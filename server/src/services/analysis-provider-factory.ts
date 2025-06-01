/**
 * Analysis Provider Factory
 * Creates the appropriate analysis service based on environment configuration
 */

import { OpenAIService } from './openai-service';
import { RequestyService } from './requesty-service';
import {
  AnalysisService,
  AnalysisProvider,
  OpenAIConfig,
  RequestyConfig
} from '../types/analyze';

/**
 * Get OpenAI configuration from environment variables
 */
const getOpenAIConfig = (): OpenAIConfig => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required');
    }

    return {
        apiKey,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
    };
};

/**
 * Get Requesty configuration from environment variables
 */
const getRequestyConfig = (): RequestyConfig => {
    const apiKey = process.env.REQUESTY_API_KEY;
    if (!apiKey) {
        throw new Error('REQUESTY_API_KEY environment variable is required');
    }

    return {
        apiKey,
        model: process.env.REQUESTY_MODEL || 'google/gemini-2.0-flash-exp',
        maxTokens: parseInt(process.env.REQUESTY_MAX_TOKENS || '1000'),
        siteUrl: process.env.REQUESTY_SITE_URL,
        siteName: process.env.REQUESTY_SITE_NAME,
    };
};

/**
 * Analysis Provider Factory
 * Creates the appropriate analysis service based on the ANALYSIS_PROVIDER environment variable
 */
export class AnalysisProviderFactory {
    /**
     * Create an analysis service instance based on environment configuration
     */
    static createProvider(): AnalysisService {
        const provider = (process.env.ANALYSIS_PROVIDER || 'openai').toLowerCase() as AnalysisProvider;

        switch (provider) {
            case AnalysisProvider.OPENAI:
                try {
                    const config = getOpenAIConfig();
                    return new OpenAIService(config);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`[PROVIDER_FACTORY] Failed to create OpenAI provider: ${errorMessage}`);
                    throw new Error(`OpenAI provider configuration error: ${errorMessage}`);
                }
            case AnalysisProvider.REQUESTY:
                try {
                    const config = getRequestyConfig();
                    return new RequestyService(config);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`[PROVIDER_FACTORY] Failed to create Requesty provider: ${errorMessage}`);
                    throw new Error(`Requesty provider configuration error: ${errorMessage}`);
                }
            default:
                {
                    const errorMessage = `Unknown analysis provider: ${provider}. Supported providers: ${Object.values(AnalysisProvider).join(', ')}`;
                    console.error(`[PROVIDER_FACTORY] ${errorMessage}`);
                    throw new Error(errorMessage);
                }
        }
    }

    /**
     * Get the current provider type from environment
     */
    static getCurrentProvider(): AnalysisProvider {
        return (process.env.ANALYSIS_PROVIDER || 'openai').toLowerCase() as AnalysisProvider;
    }

    /**
     * Validate that the current provider configuration is valid
     */
    static validateProviderConfig(): { isValid: boolean; error?: string } {
        try {
            const provider = AnalysisProviderFactory.getCurrentProvider();

            switch (provider) {
                case AnalysisProvider.OPENAI:
                    getOpenAIConfig();
                    return { isValid: true };

                case AnalysisProvider.REQUESTY:
                    getRequestyConfig();
                    return { isValid: true };

                default:
                    return {
                        isValid: false,
                        error: `Unknown provider: ${provider}`
                    };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                isValid: false,
                error: errorMessage
            };
        }
    }
}
