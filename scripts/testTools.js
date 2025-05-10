#!/usr/bin/env node

/**
 * Direct test script for RAGmonsters MCP tools
 * 
 * This script tests the domain-specific tools directly without using the MCP server/client architecture.
 * It's useful for verifying that the tools work correctly with the database.
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { getMonsters, getMonsterById, initializeTools } from '../src/mcp-server/tools/monsters.js';

// Load environment variables
dotenv.config();

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  connectionString: process.env.POSTGRESQL_ADDON_URI,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create a database pool
const pool = new Pool(dbConfig);

/**
 * Test the getMonsters tool
 */
async function testGetMonsters() {
  console.log('\n--- Testing getMonsters tool ---');
  
  try {
      // Initialize the tools with the database pool
    initializeTools(pool);
    
    // Get all monsters with default parameters (limit 10)
    console.log('Getting monsters (default parameters):');
    const monsters = await getMonsters({});
    console.log(`Retrieved ${monsters.length} monsters`);
    
    // Print the first monster
    console.log('\nFirst monster:');
    console.log(JSON.stringify(monsters[0], null, 2));
    
    // Test filtering by habitat
    console.log('\nFiltering by habitat (Volcanic Mountains):');
    const volcanicMonsters = await getMonsters({
      filters: { habitat: 'Volcanic Mountains' }
    });
    console.log(`Retrieved ${volcanicMonsters.length} monsters from Volcanic Mountains`);
    console.log('Monster names:', volcanicMonsters.map(m => m.name).join(', '));
    
    // Test sorting
    console.log('\nSorting by name in descending order:');
    const sortedMonsters = await getMonsters({
      sort: { field: 'name', direction: 'desc' },
      limit: 5
    });
    console.log('Top 5 monsters sorted by name (desc):', sortedMonsters.map(m => m.name).join(', '));
    
    // Test pagination
    console.log('\nPagination (limit 5, offset 10):');
    const paginatedMonsters = await getMonsters({
      limit: 5,
      offset: 10
    });
    console.log('Paginated monsters (5 results, starting from 10):', paginatedMonsters.map(m => m.name).join(', '));
    
    return monsters[0].id; // Return the first monster ID for the next test
    
  } catch (error) {
    console.error('Error testing getMonsters:', error);
    throw error;
  }
}

/**
 * Test the getMonsterById tool
 * @param {number} monsterId - ID of a monster to retrieve
 */
async function testGetMonsterById(monsterId) {
  console.log('\n--- Testing getMonsterById tool ---');
  
  try {
    // Get monster details (tools already initialized with the database pool)
    console.log(`Getting details for monster ID ${monsterId}:`);
    const monsterDetails = await getMonsterById({ monsterId });
    
    // Print selected details
    console.log('\nMonster details:');
    console.log(`Name: ${monsterDetails.name}`);
    console.log(`Category: ${monsterDetails.category}`);
    console.log(`Habitat: ${monsterDetails.habitat}`);
    console.log(`Rarity: ${monsterDetails.rarity}`);
    console.log(`Powers: ${monsterDetails.powers.primary}, ${monsterDetails.powers.secondary}, ${monsterDetails.powers.special}`);
    
    console.log('\nKeywords and Abilities:');
    monsterDetails.keywords.forEach(keyword => {
      console.log(`- ${keyword.name} (Rating: ${keyword.rating})`);
      keyword.abilities.forEach(ability => {
        console.log(`  • ${ability.name} (${ability.mastery})`);
      });
    });
    
    console.log('\nStrengths:');
    monsterDetails.strengths.forEach(strength => {
      console.log(`- Strong against ${strength.target} (${strength.modifier})`);
    });
    
    console.log('\nWeaknesses:');
    monsterDetails.weaknesses.forEach(weakness => {
      console.log(`- Weak against ${weakness.target} (${weakness.modifier})`);
    });
    
  } catch (error) {
    console.error('Error testing getMonsterById:', error);
    throw error;
  }
}

/**
 * Main function to run the tests
 */
async function main() {
  try {
    console.log('Testing direct access to domain-specific tools...');
    
    // Test getMonsters and get a monster ID
    const monsterId = await testGetMonsters();
    
    // Test getMonsterById with the retrieved ID
    if (monsterId) {
      await testGetMonsterById(monsterId);
    }
    
    console.log('\nAll tests completed successfully!');
    
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    // Close the database pool
    await pool.end();
    console.log('Database connection closed.');
  }
}

// Run the tests
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
