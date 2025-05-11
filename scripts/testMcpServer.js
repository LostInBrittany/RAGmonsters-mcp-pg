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
    
    // Log selected details
    logger.info('Monster details:');
    logger.info(JSON.stringify(monsterDetails.content[0].text));
    logger.info(`Name: ${JSON.parse(monsterDetails.content[0].text).name}`);
    logger.info(`Category: ${JSON.parse(monsterDetails.content[0].text).category}`);
    logger.info(`Habitat: ${JSON.parse(monsterDetails.content[0].text).habitat}`);
    logger.info(`Powers: ${JSON.parse(monsterDetails.content[0].text).powers.primary}, ${JSON.parse(monsterDetails.content[0].text).powers.secondary}, ${JSON.parse(monsterDetails.content[0].text).powers.special}`);
    
    // Log keywords and abilities
    logger.info('Keywords and Abilities:');
    JSON.parse(monsterDetails.content[0].text).keywords.forEach(keyword => {
      logger.info(`- ${keyword.name} (Rating: ${keyword.rating})`);
      keyword.abilities.forEach(ability => {
        logger.info(`  • ${ability.name} (${ability.mastery})`);
      });
    });
    
    // Log strengths and weaknesses
    logger.info('Strengths:');
    JSON.parse(monsterDetails.content[0].text).strengths.forEach(strength => {
      logger.info(`- Strong against ${strength.target} (${strength.modifier})`);
    });
    
    logger.info('Weaknesses:');
    JSON.parse(monsterDetails.content[0].text).weaknesses.forEach(weakness => {
      logger.info(`- Weak against ${weakness.target} (${weakness.modifier})`);
    });
  } catch (error) {
    logger.error(`Error testing getMonsterById: ${error.message}`);
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