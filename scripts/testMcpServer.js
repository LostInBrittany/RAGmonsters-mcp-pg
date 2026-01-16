#!/usr/bin/env node

/**
 * Test script for the RAGmonsters MCP server
 * 
 * This script demonstrates how to use the custom MCP server with domain-specific tools.
 * It spawns the MCP server as a child process and interacts with it using the MCP client.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
// Import the MCP SDK
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
// Import file-based logger
import logger from './testLogger.js';

// Load environment variables
dotenv.config();

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

/**
 * Create an MCP client that connects to the server via STDIO
 * @returns {Client} The MCP client
 */
async function createClient() {
  // Create a transport that communicates with the server via STDIO
  logger.info('Creating STDIO transport to communicate with the server');

  const transport = new StdioClientTransport({
    command: "node",
    args: ["./src/mcp-server/index.js"],
    debug: true  // Enable debug mode for more verbose logging
  });

  // Create the MCP client with a longer timeout
  logger.info('Creating MCP client');
  const client = new Client(
    {
      name: "RAGmonsters-mcp-pg-client",
      version: "1.0.0",
      timeout: 10000  // Increase timeout to 120 seconds
    }
  );

  await client.connect(transport);
  logger.info("Client connected to server")
  return client;
}

/**
 * Test the getMonsters tool
 * @param {Client} client - The MCP client
 */
async function testGetMonsters(client) {
  logger.info('--- Testing getMonsters tool ---');

  try {
    // Get all monsters with default parameters (limit 10)
    logger.info('Getting monsters (default parameters)');
    const monsters = await client.callTool({
      name: 'getMonsters',
      arguments: {}
    });
    logger.info(`Retrieved ${monsters.content.length} monsters`);

    // Log the first monster
    logger.info('First monster');
    logger.logObject('Monster details', monsters.content[0].text);

    // Test filtering by habitat
    logger.info('Filtering by habitat (Volcanic Mountains)');
    const volcanicMonsters = await client.callTool({
      name: 'getMonsters',
      arguments: {
        filters: { habitat: 'Volcanic Mountains' }
      }
    });
    logger.info(`Retrieved ${volcanicMonsters.content.length} monsters from Volcanic Mountains`);
    logger.info(`Monster names: ${JSON.parse(volcanicMonsters.content[0].text).name}`);

    // Test sorting
    logger.info('Sorting by name in descending order');
    const sortedMonsters = await client.callTool({
      name: 'getMonsters',
      arguments: {
        sort: { field: 'name', direction: 'desc' },
        limit: 5
      }
    });
    logger.info(`Top 5 monsters sorted by name (desc): ${sortedMonsters.content.map(m => JSON.parse(m.text).name).join(', ')}`);

  } catch (error) {
    logger.error(`Error testing getMonsters: ${error.message}`);
    logger.error(error.stack);
  }
}

/**
 * Test the getMonsterById tool
 * @param {Client} client - The MCP client
 */
async function testGetMonsterById(client) {
  logger.info('--- Testing getMonsterById tool ---');

  try {
    // First get a monster ID from the getMonsters tool
    logger.info('Getting a monster ID for detailed lookup');
    const monsters = await client.callTool({
      name: "getMonsters",
      arguments: {
        limit: 1
      }
    });
    const monsterId = JSON.parse(monsters.content[0].text).id;

    logger.info(`Getting details for monster ID ${monsterId} (${JSON.parse(monsters.content[0].text).name})`);
    const monsterDetails = await client.callTool({
      name: 'getMonsterById',
      arguments: { monsterId }
    });

    // Parse the response
    const responseText = monsterDetails.content[0].text;
    const responseJson = JSON.parse(responseText);
    const monsterData = responseJson.data; // Structure change due to Principle 6

    // Log selected details
    logger.info('Monster details:');
    logger.info(responseText);

    logger.info(`Name: ${monsterData.name}`);
    logger.info(`Category: ${monsterData.category}`);
    logger.info(`Habitat: ${monsterData.habitat}`);

    const powers = monsterData.powers || {};
    logger.info(`Powers: ${powers.primary}, ${powers.secondary}, ${powers.special}`);

    // Log keywords and abilities
    if (monsterData.keywords) {
      logger.info('Keywords and Abilities:');
      monsterData.keywords.forEach(keyword => {
        logger.info(`- ${keyword.name} (Rating: ${keyword.rating})`);
        if (keyword.abilities) {
          keyword.abilities.forEach(ability => {
            logger.info(`  • ${ability.name} (${ability.mastery})`);
          });
        }
      });
    }

    // Log strengths and weaknesses
    if (monsterData.strengths) {
      logger.info('Strengths:');
      monsterData.strengths.forEach(strength => {
        logger.info(`- Strong against ${strength.target} (${strength.modifier})`);
      });
    }

    if (monsterData.weaknesses) {
      logger.info('Weaknesses:');
      monsterData.weaknesses.forEach(weakness => {
        logger.info(`- Weak against ${weakness.target} (${weakness.modifier})`);
      });
    }
  } catch (error) {
    logger.error(`Error testing getMonsterById: ${error.message}`);
    logger.error(error.stack);
  }
}

/**
 * Test metadata tools (categories, rarities, biomes)
 * @param {Client} client - The MCP client
 */
async function testMetadataTools(client) {
  logger.info('--- Testing Metadata Tools ---');

  try {
    // Test getCategories
    logger.info('Testing getCategories...');
    const categories = await client.callTool({ name: 'getCategories', arguments: {} });
    logger.info('Categories: ' + categories.content[0].text);

    // Test getRarities
    logger.info('Testing getRarities...');
    const rarities = await client.callTool({ name: 'getRarities', arguments: {} });
    logger.info('Rarities: ' + rarities.content[0].text);

    // Test getBiomes
    logger.info('Testing getBiomes...');
    const biomes = await client.callTool({ name: 'getBiomes', arguments: {} });
    logger.info('Biomes: ' + biomes.content[0].text);

    // Test getMonsters with biome filter if biomes exist
    const biomeList = JSON.parse(biomes.content[0].text);
    if (Array.isArray(biomeList) && biomeList.length > 0) {
      const testBiome = biomeList[0];
      logger.info(`Testing getMonsters with biome filter: ${testBiome}`);
      const monsters = await client.callTool({
        name: 'getMonsters',
        arguments: { filters: { biome: testBiome } }
      });
      logger.info(`Found monsters in biome ${testBiome}: ${monsters.content[0].text.substring(0, 100)}...`);
    }

  } catch (error) {
    logger.error(`Error testing metadata tools: ${error.message}`);
    logger.error(error.stack);
  }
}

/**
 * Main function to run the tests
 */
async function main() {
  try {
    logger.info('=== Starting MCP Client Tests ===');

    // Create the MCP client
    const client = await createClient();

    // List the tools
    logger.info('Listing available tools...');
    try {
      console.log('About to call listTools()...');
      const tools = await client.listTools();
      console.log('listTools() returned:', JSON.stringify(tools, null, 2));
      logger.logObject('Available tools', tools);

      // Check if tools array exists and has items
      if (!tools || !tools.tools || tools.tools.length === 0) {
        console.error('WARNING: No tools were returned from the server!');
        logger.error('WARNING: No tools were returned from the server!');
      }
    } catch (error) {
      console.error(`Error listing tools: ${error.message}`);
      console.error(error.stack);
      logger.error(`Error listing tools: ${error.message}`);
      logger.error(error.stack);
      throw error;
    }
    logger.info('Listing available tools completed');

    // Test the add two numbers tool
    //logger.info(`Test the add two numbers tool`);
    //const result = await client.callTool({
    //  name: 'add',
    //  arguments: { a: 10.0, b: 20.0 }
    //});

    //logger.info(`Result: ${result.content[0].text}`);

    // Test the tools
    await testGetMonsters(client);
    await testGetMonsterById(client);
    await testMetadataTools(client); // Added new test function

    logger.info('All tests completed successfully!');
  } catch (error) {
    logger.error(`Error running tests: ${error.message}`);
    logger.error(error.stack);
  } finally {
    // Close the logger
    logger.info('Test run completed');
    logger.close();
  }
}

// Run the tests
await main();
logger.info('Test ended');
process.exit(0);