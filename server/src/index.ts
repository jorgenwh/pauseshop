/**
 * PauseShop Server Entry Point
 */

import createApp from './app';
import { getEnvironment } from './utils';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const ENVIRONMENT = getEnvironment();

const startServer = async (): Promise<void> => {
  try {
    const app = createApp();
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 PauseShop Server running on port ${PORT}`);
      console.log(`📍 Environment: ${ENVIRONMENT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('✅ HTTP server closed');
        console.log('👋 PauseShop Server stopped gracefully');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.log('⚠️  Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();