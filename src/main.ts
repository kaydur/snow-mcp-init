#!/usr/bin/env node

/**
 * Main entry point for the ServiceNow MCP Server
 * 
 * Loads configuration, initializes the server, and handles graceful shutdown.
 */

import dotenv from 'dotenv';
import { ConfigurationManager } from './config/ConfigurationManager.js';
import { MCPServer } from './server/MCPServer.js';
import { logger } from './utils/logger.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Main function to start the server
 */
async function main() {
  let server: MCPServer | null = null;

  try {
    // Load configuration from environment variables
    logger.info('main', 'Loading configuration');
    const config = ConfigurationManager.loadConfig();

    // Set logger level from configuration
    if (config.logLevel) {
      logger.setLevel(config.logLevel);
    }

    // Test connectivity to ServiceNow instance
    logger.info('main', 'Testing connectivity to ServiceNow instance');
    const isConnected = await ConfigurationManager.testConnectivity(config);
    
    if (!isConnected) {
      logger.warn('main', 'Connectivity test failed, but continuing startup. Please verify your ServiceNow instance URL and credentials.');
    } else {
      logger.info('main', 'Connectivity test successful');
    }

    // Create and start MCP server
    logger.info('main', 'Creating MCP Server instance');
    server = new MCPServer(config);

    logger.info('main', 'Starting MCP Server');
    await server.start();

    logger.info('main', 'ServiceNow MCP Server is running');

  } catch (error) {
    // Handle startup errors gracefully
    if (error instanceof Error) {
      logger.error('main', 'Failed to start server', {
        error: { message: error.message, stack: error.stack }
      });
      console.error(`Error: ${error.message}`);
    } else {
      logger.error('main', 'Failed to start server with unknown error', {
        error: String(error)
      });
      console.error('An unknown error occurred during startup');
    }
    process.exit(1);
  }

  // Set up signal handlers for graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info('main', `Received ${signal}, shutting down gracefully`);
    
    if (server) {
      try {
        await server.stop();
        logger.info('main', 'Server stopped successfully');
      } catch (error) {
        logger.error('main', 'Error during shutdown', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    process.exit(0);
  };

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle SIGTERM (kill command)
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('main', 'Uncaught exception', {
      error: { message: error.message, stack: error.stack }
    });
    console.error('Uncaught exception:', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    logger.error('main', 'Unhandled promise rejection', {
      error: reason instanceof Error ? { message: reason.message, stack: reason.stack } : String(reason)
    });
    console.error('Unhandled promise rejection:', reason);
    process.exit(1);
  });
}

// Start the server
main();
