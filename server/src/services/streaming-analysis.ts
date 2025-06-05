import { AnalysisService, Product, StreamingCallbacks, GeminiResponse, OpenAIResponse, RequestyResponse, OpenRouterResponse } from '../types/analyze';
import { AnalysisProviderFactory } from './analysis-provider-factory';

interface StreamingAnalysisCallbacks extends StreamingCallbacks {
    onStart?: () => void;
    onProgress?: (progress: { processed: number, estimated: number }) => void;
}

export class StreamingAnalysisService {
    private provider: AnalysisService;

    constructor() {
        this.provider = AnalysisProviderFactory.createProvider();
    }

    public async analyzeImageStreaming(imageData: string, callbacks: StreamingAnalysisCallbacks): Promise<void> {
        const products: Product[] = [];

        callbacks.onStart?.();

        try {
            await this.provider.analyzeImageStreaming(imageData, {
                onProduct: (product: Product) => {
                    const timestamp = new Date().toISOString();
                    console.info(`[${timestamp}] Product found and streamed to frontend:`, {
                        name: product.name,
                        brand: product.brand,
                        category: product.category,
                        primaryColor: product.primaryColor,
                        searchTerms: product.searchTerms,
                        targetGender: product.targetGender,
                        features: product.features.slice(0, 3) // Log first 3 features to avoid clutter
                    });
                    
                    products.push(product);
                    callbacks.onProduct(product);
                    // Optional: callbacks.onProgress?.({ processed: products.length, estimated: -1 });
                },
                onComplete: (response: GeminiResponse | OpenAIResponse | RequestyResponse | OpenRouterResponse) => {
                    callbacks.onComplete(response);
                },
                onError: (error: Error) => {
                    callbacks.onError(error);
                }
            });
        } catch (error) {
            callbacks.onError(error as Error);
        }
    }
}
