/**
 * Global error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';
import { isDevelopment } from '../utils';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const globalErrorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error.message || 'Internal Server Error';
  
  const errorResponse: ErrorResponse = {
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  };

  // Include error details in development
  if (isDevelopment()) {
    errorResponse.error.details = {
      stack: error.stack,
      body: req.body,
      query: req.query,
      params: req.params
    };
  }

  // Log error in development
  if (isDevelopment()) {
    console.error(`[ERROR] ${message}`, error.stack);
  }

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      status: 404,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  };

  res.status(404).json(errorResponse);
};

export const asyncWrapper = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};