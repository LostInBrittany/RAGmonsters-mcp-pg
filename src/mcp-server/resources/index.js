/**
 * Resource definitions for the RAGmonsters MCP server
 */
import { initializeResources, loadSchema, loadCategories, loadSubcategories, loadHabitats } from './monsters.js';
import logger from '../utils/logger.js';

// Export the initialize function and resource loaders
export { initializeResources, loadSchema, loadCategories, loadSubcategories, loadHabitats };

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
    load: loadSchema
  });

  // Monster Categories resource
  server.addResource({
    uri: "ragmonsters://categories",
    name: "Monster Categories",
    mimeType: "text/plain",
    description: "List of all monster categories (e.g., Aquatic, Elemental, Spirit/Ethereal).",
    load: loadCategories
  });

  // Monster Subcategories resource
  server.addResource({
    uri: "ragmonsters://subcategories",
    name: "Monster Subcategories",
    mimeType: "text/plain",
    description: "List of all monster subcategories grouped by their parent category.",
    load: loadSubcategories
  });

  // Monster Habitats resource
  server.addResource({
    uri: "ragmonsters://habitats",
    name: "Monster Habitats",
    mimeType: "text/plain",
    description: "List of all habitats where monsters can be found.",
    load: loadHabitats
  });

  logger.info('Registered resources with the MCP server');
}
