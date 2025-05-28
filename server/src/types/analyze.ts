/**
 * Type definitions for image analysis endpoint
 */

export interface AnalyzeRequest {
  image: string; // base64 data URL
  metadata?: {
    timestamp: string;
  };
}

export interface AnalyzeResponse {
  success: boolean;
  timestamp: string;
  products: Product[];
  metadata: {
    processingTime: number;
  };
}

export interface Product {
  confidence: number; // 0-1
}

export interface AnalyzeErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    timestamp: string;
  };
}

export interface ImageValidationResult {
  isValid: boolean;
  width?: number;
  height?: number;
  format?: string;
  sizeBytes?: number;
  error?: string;
}