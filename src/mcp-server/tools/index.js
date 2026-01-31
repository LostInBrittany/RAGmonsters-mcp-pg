/**
 * Tool definitions for the RAGmonsters MCP server
 */
import { getMonsters, getMonsterById, getHabitats, getCategories, getRarities, getBiomes, getSubcategories, getMonsterByHabitat, getMonsterByName, compareMonsters, initializeTools } from './monsters.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

// Export the tools and initialize function
export { getMonsters, getMonsterById, getHabitats, getCategories, getRarities, getBiomes, getSubcategories, getMonsterByHabitat, getMonsterByName, compareMonsters, initializeTools };

/**
 * Create a logged wrapper for a tool function
 * @param {string} toolName - Name of the tool
 * @param {Function} fn - The tool function to wrap
 * @returns {Function} Wrapped function with logging
 */
function withLogging(toolName, fn) {
  return async (params) => {
    logger.info(`[TOOL CALL] ${toolName} called with params: ${JSON.stringify(params)}`);
    const startTime = Date.now();
    try {
      const result = await fn(params);
      const duration = Date.now() - startTime;
      logger.info(`[TOOL RESULT] ${toolName} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[TOOL ERROR] ${toolName} failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  };
}

/**
 * Register all tools with an MCP server
 * @param {Object} server - The MCP server instance
 */
export function registerToolsWithServer(server) {
  // Register monster tools with logging wrappers
  server.addTool({
    name: 'getMonsters',
    description: 'Get a list of monsters with optional filtering, sorting, and pagination',
    parameters: z.object({
      filters: z.object({
        category: z.enum([
          'Anomaly/Phenomenon', 'Aquatic', 'Celestial/Cosmic',
          'Construct/Artificial', 'Elemental', 'Nature/Organic', 'Spirit/Ethereal'
        ]).optional().describe('Filter by monster category (must be one of the known categories)'),
        habitat: z.string().optional().describe('Filter by monster habitat'),
        biome: z.string().optional().describe('Filter by monster biome'),
        rarity: z.enum([
          'Common', 'Uncommon', 'Rare', 'Very Rare', 'Extremely Rare'
        ]).optional().describe('Filter by monster rarity')
      }).optional().describe('Optional filters for the query'),

      sort: z.object({
        field: z.string().optional().describe('Field to sort by (name, category, habitat, rarity)'),
        direction: z.enum(['asc', 'desc']).optional().describe('Sort direction (asc or desc)')
      }).optional().describe('Optional sorting parameters'),

      limit: z.number().int().min(1).optional().describe('Maximum number of results to return (default: 10, max: 50)')
    }),
    execute: withLogging('getMonsters', getMonsters)
  });

  server.addTool({
    name: 'getMonsterById',
    description: 'Get detailed information about a specific monster by ID',
    parameters: z.object({
      monsterId: z.number().describe('ID of the monster to retrieve')
    }),
    execute: withLogging('getMonsterById', getMonsterById)
  });

  server.addTool({
    name: 'getHabitats',
    description: 'Get a list of all available habitats in the database',
    parameters: z.object({}),
    execute: withLogging('getHabitats', getHabitats)
  });

  server.addTool({
    name: 'getCategories',
    description: 'Get a list of all available categories in the database',
    parameters: z.object({}),
    execute: withLogging('getCategories', getCategories)
  });

  server.addTool({
    name: 'getBiomes',
    description: 'Get a list of all available biomes in the database',
    parameters: z.object({}),
    execute: withLogging('getBiomes', getBiomes)
  });

  server.addTool({
    name: 'getRarities',
    description: 'Get a list of all available rarities in the database',
    parameters: z.object({}),
    execute: withLogging('getRarities', getRarities)
  });

  server.addTool({
    name: 'getSubcategories',
    description: 'Get a list of all subcategories with their parent categories. Optionally filter by category name.',
    parameters: z.object({
      categoryName: z.string().optional().describe('Optional category name to filter subcategories')
    }),
    execute: withLogging('getSubcategories', getSubcategories)
  });

  server.addTool({
    name: 'getMonsterByHabitat',
    description: 'Get monsters by habitat (exact match only). IMPORTANT: for best results, first call getHabitats to get a list of available habitats, then find the most appropriate one to use with this tool.',
    parameters: z.object({
      habitat: z.string().describe('Exact habitat name (must match exactly). For best results, first call getHabitats to get a list of available habitats, then find the most appropriate one to use with this tool.'),
      limit: z.number().optional().describe('Maximum number of results to return (default: 10)')
    }),
    execute: withLogging('getMonsterByHabitat', getMonsterByHabitat)
  });

  server.addTool({
    name: 'getMonsterByName',
    description: 'Get monsters by name (partial match, returns up to 5 matches)',
    parameters: z.object({
      name: z.string().describe('Name of the monster to search for (can be partial)')
    }),
    execute: withLogging('getMonsterByName', getMonsterByName)
  });

  server.addTool({
    name: 'compareMonsters',
    description: 'Compare two monsters side-by-side by name',
    parameters: z.object({
      monsterNameA: z.string().describe('Name of the first monster (exact or partial match if implemented)'),
      monsterNameB: z.string().describe('Name of the second monster (exact or partial match if implemented)')
    }),
    execute: withLogging('compareMonsters', compareMonsters)
  });

  logger.info(`Registered tools with the MCP server`);
  logger.info(`Available categories: monsters`);
}
