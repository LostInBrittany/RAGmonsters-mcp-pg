import { FastMCP } from "fastmcp";
import { registerToolsWithServer, initializeTools } from './tools/index.js';
import { registerResourcesWithServer, initializeResources } from './resources/index.js';
import { registerPromptsWithServer } from './prompts/index.js';
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import logger from './utils/logger.js';

// Load environment variables from .env file
dotenv.config();

// Database configuration
const dbConfig = {
  connectionString: process.env.POSTGRESQL_ADDON_URI,
  // Additional database configuration options can be added here
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
};

/**
 * Initialize the PostgreSQL connection pool
 */
export const initializeDbPool = () => {
  try {
    const pool = new Pool(dbConfig);
    console.log('PostgreSQL connection pool initialized');
    return pool;
  } catch (error) {
    console.error('Failed to initialize PostgreSQL connection pool:', error);
    throw error;
  }
};

/**
 * Create and configure the MCP server
 * @param {Object} dbPool - PostgreSQL connection pool
 * @returns {Server} Configured MCP server instance
 */
export const createMCPServer = async (dbPool) => {
  // Create a new MCP server instance
  const server = new FastMCP({
    name: 'RAGmonsters MCP Server',
    version: '0.1.0',
    description: 'A domain-specific MCP server for the RAGmonsters dataset',
  });

  // Initialize modules with database access
  initializeTools(dbPool);
  await initializeResources(dbPool);
  logger.info('Initialized modules with database pool');

  // Register tools, resources, and prompts
  registerToolsWithServer(server);
  registerResourcesWithServer(server);
  registerPromptsWithServer(server);

  logger.info('MCP server created and configured');
  return server;
};

/**
 * Initialize and start the MCP server
 */
export const initializeAndStartServer = async () => {
  const dbPool = initializeDbPool();
  const server = await createMCPServer(dbPool);

  logger.info('Starting MCP server with STDIO transport');
  server.start({
    transportType: "stdio",
  });

};

initializeAndStartServer();
