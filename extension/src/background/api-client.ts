/**
 * API client for server communication
 * Handles HTTP requests to the PauseShop backend server
 */

interface ServerConfig {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}

interface AnalyzeRequest {
    image: string;
    metadata?: {
        timestamp: string;
    };
}

enum ProductCategory {
    CLOTHING = 'clothing',
    ELECTRONICS = 'electronics',
    FURNITURE = 'furniture',
    ACCESSORIES = 'accessories',
    FOOTWEAR = 'footwear',
    HOME_DECOR = 'home_decor',
    BOOKS_MEDIA = 'books_media',
    SPORTS_FITNESS = 'sports_fitness',
    BEAUTY_PERSONAL_CARE = 'beauty_personal_care',
    KITCHEN_DINING = 'kitchen_dining',
    OTHER = 'other'
}

enum TargetGender {
    MEN = 'men',
    WOMEN = 'women',
    UNISEX = 'unisex',
    BOY = 'boy',
    GIRL = 'girl'
}

interface AnalyzeResponse {
    success: boolean;
    timestamp: string;
    products: Array<{
        name: string;
        category: ProductCategory;
        brand: string;
        primaryColor: string;
        secondaryColors: string[];
        features: string[];
        targetGender: TargetGender;
        searchTerms: string;
    }>;
    metadata: {
        processingTime: number;
    };
}

interface AnalyzeErrorResponse {
    success: false;
    error: {
        message: string;
        code: string;
        timestamp: string;
    };
}

const defaultConfig: ServerConfig = {
    baseUrl: 'http://localhost:3000',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
};

/**
 * Sleeps for the specified number of milliseconds
 */
const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Makes an HTTP request with timeout and retry logic
 */
const makeRequest = async (
    url: string,
    options: RequestInit,
    config: ServerConfig,
    attempt: number = 1
): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (attempt < config.retryAttempts) {
            console.log(`[API Client] Request failed (attempt ${attempt}/${config.retryAttempts}), retrying in ${config.retryDelay}ms...`);
            await sleep(config.retryDelay);
            return makeRequest(url, options, config, attempt + 1);
        }
        
        throw error;
    }
};

/**
 * Sends image data to the server for analysis
 */
export const analyzeImage = async (
    imageData: string,
    config: Partial<ServerConfig> = {}
): Promise<AnalyzeResponse> => {
    const fullConfig: ServerConfig = { ...defaultConfig, ...config };
    const url = `${fullConfig.baseUrl}/analyze`;

    const request: AnalyzeRequest = {
        image: imageData,
        metadata: {
            timestamp: new Date().toISOString()
        }
    };

    console.log('[API Client] Sending image analysis request to server...');

    try {
        const response = await makeRequest(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        }, fullConfig);

        if (!response.ok) {
            // Try to parse error response
            try {
                const errorData: AnalyzeErrorResponse = await response.json();
                throw new Error(`Server error: ${errorData.error.message} (${errorData.error.code})`);
            } catch {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }

        const data: AnalyzeResponse = await response.json();
        console.log(`[API Client] Analysis successful: ${data.products.length} products detected in ${data.metadata.processingTime}ms`);
        
        return data;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[API Client] Failed to analyze image:', errorMessage);
        throw new Error(`Image analysis failed: ${errorMessage}`);
    }
};

/**
 * Tests server connectivity
 */
export const testServerConnection = async (
    config: Partial<ServerConfig> = {}
): Promise<boolean> => {
    const fullConfig: ServerConfig = { ...defaultConfig, ...config };
    const url = `${fullConfig.baseUrl}/health`;

    try {
        const response = await makeRequest(url, { method: 'GET' }, fullConfig);
        return response.ok;
    } catch (error) {
        console.error('[API Client] Server connectivity test failed:', error);
        return false;
    }
};
