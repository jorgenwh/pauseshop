import { AnalysisService, AnalysisProvider, Product, StreamingCallbacks, GeminiResponse, OpenAIResponse, RequestyResponse, OpenRouterResponse } from '../types/analyze';
import { AnalysisProviderFactory } from './analysis-provider-factory';

interface AnalysisOptions {
    preferStreaming?: boolean;
    timeout?: number;
    metadata?: Record<string, any>;
}

interface AnalysisResult {
    products: Product[];
    metadata: {
        processingTime: number;
        usedStreaming: boolean;
        provider: AnalysisProvider;
        usage?: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
            thoughtsTokenCount?: number;
            candidatesTokenCount?: number;
        };
    };
}

interface StreamingAnalysisCallbacks extends StreamingCallbacks {
    onStart?: () => void;
    onProgress?: (progress: { processed: number, estimated: number }) => void;
}

export class StreamingAnalysisService {
    private provider: AnalysisService;

    constructor() {
        this.provider = AnalysisProviderFactory.createProvider();
    }

    public async analyzeImage(imageData: string, options: AnalysisOptions = {}): Promise<AnalysisResult> {
        const startTime = Date.now();
        const supportsStreaming = this.provider.supportsStreaming();
        const useStreaming = options.preferStreaming !== false && supportsStreaming;

        if (useStreaming) {
            return this.analyzeWithStreaming(imageData, options);
        } else {
            return this.analyzeWithBatch(imageData, options);
        }
    }

    public async analyzeImageStreaming(imageData: string, callbacks: StreamingAnalysisCallbacks): Promise<void> {
        const startTime = Date.now();
        const products: Product[] = [];

        callbacks.onStart?.();

        try {
            await this.provider.analyzeImageStreaming(imageData, {
                onProduct: (product: Product) => {
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

    private async analyzeWithStreaming(imageData: string, options: AnalysisOptions): Promise<AnalysisResult> {
        const products: Product[] = [];
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const callbacks: StreamingCallbacks = {
                onProduct: (product: Product) => {
                    products.push(product);
                },
                onComplete: (response: GeminiResponse | OpenAIResponse | RequestyResponse | OpenRouterResponse) => {
                    resolve({
                        products,
                        metadata: {
                            processingTime: Date.now() - startTime,
                            usedStreaming: true,
                            provider: AnalysisProviderFactory.getCurrentProvider(),
                            usage: response.usage
                        }
                    });
                },
                onError: (error: Error) => {
                    reject(error);
                }
            };

            this.provider.analyzeImageStreaming(imageData, callbacks).catch(reject);
        });
    }

    private async analyzeWithBatch(imageData: string, options: AnalysisOptions): Promise<AnalysisResult> {
        const startTime = Date.now();
        const response = await this.provider.analyzeImage(imageData);
        const products = this.provider.parseResponseToProducts(response.content);

        return {
            products,
            metadata: {
                processingTime: Date.now() - startTime,
                usedStreaming: false,
                provider: AnalysisProviderFactory.getCurrentProvider(),
                usage: response.usage
            }
        };
    }
}