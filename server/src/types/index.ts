/**
 * Server type definitions for PauseShop backend
 */

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  memory: {
    used: string;
    total: string;
  };
}

export interface ErrorResponse {
  error: {
    message: string;
    status: number;
    timestamp: string;
    path: string;
    details?: any; // Only in development
  };
}

export interface ServerConfig {
  port: number;
  environment: string;
  corsOrigins: string[];
}

export interface AppLocals {
  startTime: Date;
  version: string;
}

declare global {
  namespace Express {
    interface Locals extends AppLocals {}
  }
}