/**
 * Tool definitions for the RAGmonsters MCP server
 */
import { getMonsters, getMonsterById, initializeTools } from './monsters.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

// Export the tools and initialize function
export { getMonsters, getMonsterById, initializeTools };

/**
 * Register all tools with an MCP server
 * @param {Object} server - The MCP server instance
 */
export function registerToolsWithServer(server) {
  // Register monster tools
  server.addTool({
    name: 'getMonsters',
    description: 'Get a list of monsters with optional filtering, sorting, and pagination',
    parameters: z.object({
      filters: z.object({
        category: z.string().optional().describe('Filter by monster category'),
        habitat: z.string().optional().describe('Filter by monster habitat'),
        rarity: z.string().optional().describe('Filter by monster rarity')
      }).optional().describe('Optional filters for the query'),
      
      sort: z.object({
        field: z.string().optional().describe('Field to sort by (name, category, habitat, rarity)'),
        direction: z.enum(['asc', 'desc']).optional().describe('Sort direction (asc or desc)')
      }).optional().describe('Optional sorting parameters'),
      
      limit: z.number().optional().describe('Maximum number of results to return (default: 10)'),
      offset: z.number().optional().describe('Number of results to skip for pagination (default: 0)')
    }),
    execute: getMonsters
  });
  
  server.addTool({
    name: 'getMonsterById',
    description: 'Get detailed information about a specific monster by ID',
    parameters: z.object({
      monsterId: z.number().describe('ID of the monster to retrieve')
    }),
    execute: getMonsterById
  });
  logger.info(`Registered 2 tools with the MCP server`);
  logger.info(`Available categories: monsters`);
}
