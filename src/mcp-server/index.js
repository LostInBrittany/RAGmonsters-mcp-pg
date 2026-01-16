import { FastMCP } from "fastmcp";
import { z } from "zod";
import { registerToolsWithServer, initializeTools } from './tools/index.js';
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
export const createMCPServer = (dbPool) => {
  // Create a new MCP server instance
  const server = new FastMCP({
    name: 'RAGmonsters MCP Server',
    version: '0.1.0',
    description: 'A domain-specific MCP server for the RAGmonsters dataset',
  });

  // Initialize the monsters module with the database pool
  initializeTools(dbPool);
  logger.info('Initialized monsters module with database pool');

  // Register all tools from our tools module
  registerToolsWithServer(server);

  server.addTool({
    name: "add",
    description: "Add two numbers",
    parameters: z.object({
      a: z.number(),
      b: z.number(),
    }),
    execute: async (args) => {
      return String(args.a + args.b);
    },
  });

  // Resource: Database Schema (Principle 2)
  server.addResource({
    uri: "ragmonsters://schema",
    name: "RAGmonsters Database Schema",
    mimeType: "text/plain",
    description: "Schema definition for the monsters database, describing available columns and types.",
    load: async () => {
      return {
        text: `
          Monster {
            id: ID!
            name: String!
            category: Enum(Aquatic, Elemental, Spirit/Ethereal, ...)
            rarity: Enum(Common, Rare, Very Rare, ...)
            habitat: String
            biome: String
            powers: {
              primary: String
              secondary: String
              special: String
            }
          }
        `
      };
    }
  });

  // Prompt: Answering Style (Principle 3 - Guidance)
  server.addPrompt({
    name: "answering-style",
    description: "Guidelines for how to answer questions about monsters",
    load: async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "How should I answer questions about RAGmonsters?"
            }
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: "When discussing monsters:\n1. Always cite the monster's Name and ID.\n2. Mention the source policy if available.\n3. Be concise but descriptive about their powers.\n4. If the category is 'Extremely Rare', emphasize the danger."
            }
          }
        ]
      };
    }
  });


  // Resource: Query Tips (Method 2: Documentation)
  server.addResource({
    uri: "ragmonsters://docs/query-tips",
    name: "Query Tips",
    mimeType: "text/plain",
    description: "A compact note on how to query effectively.",
    load: async () => {
      return {
        text: "Tips for querying RAGmonsters:\n" +
          "1. Use getMonsters for discovery (searching by habitat, category, etc.).\n" +
          "2. Use getMonsterById for detailed stats, powers, and weaknesses.\n" +
          "3. Use getHabitats/getCategories to see available filter values first.\n" +
          "4. When comparing monsters, retrieve their details separately if needed."
      };
    }
  });

  // Resource: Images (Method 2: Assets - Placeholder)
  server.addResourceTemplate({
    uriTemplate: "ragmonsters://images/{monsterId}",
    name: "Monster Image",
    mimeType: "image/png",
    description: "Read-only access to monster artwork (placeholder).",
    arguments: [
      { name: "monsterId", description: "ID of the monster" }
    ],
    load: async (params) => {
      const monsterId = params.monsterId;
      return {
        text: `[Image Placeholder for Monster ID ${monsterId}]\n(Visual: A terrifying creature lurks here...)`
      };
    }
  });

  // Prompt: Disambiguation (Method 3: Guidance)
  server.addPrompt({
    name: "disambiguation",
    description: "Instructions for handling ambiguity when multiple monsters match",
    load: async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: "What if my search matches multiple monsters?"
            }
          },
          {
            role: "assistant",
            content: {
              type: "text",
              text: "If multiple monsters match the user's query:\n" +
                "1. Do NOT guess.\n" +
                "2. List the matching options with their IDs and Categories.\n" +
                "3. Ask the user to clarify which one they mean.\n" +
                "4. Example: 'Did you mean the Aquatic Abyssalurk (ID 1) or the Construct Abyssal-Droid (ID 99)?'"
            }
          }
        ]
      };
    }
  });

  logger.info('MCP server created and configured');
  return server;
};

/**
 * Initialize and start the MCP server
 */
export const initializeAndStartServer = async () => {
  const dbPool = initializeDbPool();
  const server = createMCPServer(dbPool);

  logger.info('Starting MCP server with STDIO transport');
  server.start({
    transportType: "stdio",
  });

};

initializeAndStartServer();
