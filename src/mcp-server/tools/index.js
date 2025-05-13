/**
 * Tool definitions for the RAGmonsters MCP server
 */
import { getMonsters, getMonsterById, getHabitats, getMonsterByHabitat, getMonsterByName, initializeTools } from './monsters.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

// Export the tools and initialize function
export { getMonsters, getMonsterById, getHabitats, getMonsterByHabitat, getMonsterByName, initializeTools };

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

  server.addTool({
    name: 'getHabitats',
    description: 'Get a list of all available habitats in the database',
    parameters: z.object({}),
    execute: getHabitats
  });

  server.addTool({
    name: 'getMonsterByHabitat',
    description: 'Get monsters by habitat (exact match only). IMPORTANT: for best results, first call getHabitats to get a list of available habitats, then find the most appropriate one to use with this tool.',
    parameters: z.object({
      habitat: z.string().describe('Exact habitat name (must match exactly). For best results, first call getHabitats to get a list of available habitats, then find the most appropriate one to use with this tool.'),
      limit: z.number().optional().describe('Maximum number of results to return (default: 10)')
    }),
    execute: getMonsterByHabitat
  });

  server.addTool({
    name: 'getMonsterByName',
    description: 'Get monsters by name (partial match, returns up to 5 matches)',
    parameters: z.object({
      name: z.string().describe('Name of the monster to search for (can be partial)')
    }),
    execute: getMonsterByName
  });
  
  logger.info(`Registered 5 tools with the MCP server`);
  logger.info(`Available categories: monsters`);
}
