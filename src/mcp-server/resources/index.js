/**
 * Resource definitions for the RAGmonsters MCP server
 */
import { initializeResources, loadSchema, loadCategories, loadSubcategories, loadHabitats } from './monsters.js';
import logger from '../utils/logger.js';

// Export the initialize function and resource loaders
export { initializeResources, loadSchema, loadCategories, loadSubcategories, loadHabitats };

/**
 * Create a logged wrapper for a resource loader function
 * @param {string} resourceUri - URI of the resource
 * @param {Function} fn - The resource loader function to wrap
 * @returns {Function} Wrapped function with logging
 */
function withLogging(resourceUri, fn) {
  return async (params) => {
    logger.info(`[RESOURCE READ] ${resourceUri} accessed`);
    const startTime = Date.now();
    try {
      const result = await fn(params);
      const duration = Date.now() - startTime;
      logger.info(`[RESOURCE RESULT] ${resourceUri} loaded in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[RESOURCE ERROR] ${resourceUri} failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  };
}

/**
 * Register all resources with an MCP server
 * @param {Object} server - The MCP server instance
 */
export function registerResourcesWithServer(server) {
  // Database Schema resource
  server.addResource({
    uri: "ragmonsters://schema",
    name: "RAGmonsters Database Schema",
    mimeType: "text/plain",
    description: "Schema definition for the monsters database, describing available tables, columns and types.",
    load: withLogging("ragmonsters://schema", loadSchema)
  });

  // Monster Categories resource
  server.addResource({
    uri: "ragmonsters://categories",
    name: "Monster Categories",
    mimeType: "text/plain",
    description: "List of all monster categories (e.g., Aquatic, Elemental, Spirit/Ethereal).",
    load: withLogging("ragmonsters://categories", loadCategories)
  });

  // Monster Subcategories resource
  server.addResource({
    uri: "ragmonsters://subcategories",
    name: "Monster Subcategories",
    mimeType: "text/plain",
    description: "List of all monster subcategories grouped by their parent category.",
    load: withLogging("ragmonsters://subcategories", loadSubcategories)
  });

  // Monster Habitats resource
  server.addResource({
    uri: "ragmonsters://habitats",
    name: "Monster Habitats",
    mimeType: "text/plain",
    description: "List of all habitats where monsters can be found.",
    load: withLogging("ragmonsters://habitats", loadHabitats)
  });

  logger.info('Registered resources with the MCP server');
}
