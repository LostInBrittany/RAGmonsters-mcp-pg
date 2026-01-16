/**
 * Tool definitions for the RAGmonsters MCP server
 */
import { getMonsters, getMonsterById, getHabitats, getCategories, getRarities, getBiomes, getMonsterByHabitat, getMonsterByName, compareMonsters, initializeTools } from './monsters.js';
import { z } from 'zod';
import logger from '../utils/logger.js';

// Export the tools and initialize function
export { getMonsters, getMonsterById, getHabitats, getCategories, getRarities, getBiomes, getMonsterByHabitat, getMonsterByName, compareMonsters, initializeTools };

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
    name: 'getCategories',
    description: 'Get a list of all available categories in the database',
    parameters: z.object({}),
    execute: getCategories
  });

  server.addTool({
    name: 'getBiomes',
    description: 'Get a list of all available biomes in the database',
    parameters: z.object({}),
    execute: getBiomes
  });

  server.addTool({
    name: 'getRarities',
    description: 'Get a list of all available rarities in the database',
    parameters: z.object({}),
    execute: getRarities
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

  server.addTool({
    name: 'compareMonsters',
    description: 'Compare two monsters side-by-side by name',
    parameters: z.object({
      monsterNameA: z.string().describe('Name of the first monster (exact or partial match if implemented)'),
      monsterNameB: z.string().describe('Name of the second monster (exact or partial match if implemented)')
    }),
    execute: compareMonsters
  });

  logger.info(`Registered tools with the MCP server`);
  logger.info(`Available categories: monsters`);
}
