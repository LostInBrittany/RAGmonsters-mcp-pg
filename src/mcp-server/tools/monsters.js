/**
 * Monster-related MCP tools
 */
import { executeQuery } from '../utils/db.js';
import logger from '../utils/logger.js';

// Module-level database pool
let dbPool = null;

/**
 * Initialize the monsters module with a database pool
 * @param {Object} pool - PostgreSQL connection pool
 */
export function initializeTools(pool) {
  dbPool = pool;
  logger.info('Monsters module initialized with database pool');
}

/**
 * Get a list of monsters with optional filtering, sorting, and pagination
 * 
 * @param {Object} params - Tool parameters
 * @param {Object} [params.filters] - Optional filters for the query
 * @param {string} [params.filters.category] - Filter by monster category
 * @param {string} [params.filters.habitat] - Filter by monster habitat
 * @param {string} [params.filters.rarity] - Filter by monster rarity
 * @param {Object} [params.sort] - Optional sorting parameters
 * @param {string} [params.sort.field] - Field to sort by (e.g., 'name', 'category')
 * @param {string} [params.sort.direction] - Sort direction ('asc' or 'desc')
 * @param {number} [params.limit] - Maximum number of results to return
 * @param {number} [params.offset] - Number of results to skip (for pagination)
 * @returns {Promise<Array>} List of monsters
 */
export async function getMonsters(params = {}) {
  try {
    if (!dbPool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }
    
    logger.info(`getMonsters called with params: ${JSON.stringify(params)}`);
    const { filters = {}, sort = {}, limit = 10, offset = 0 } = params;
    
    // Start building the query
    let query = `
      SELECT 
        m.monster_id,
        m.name,
        m.category,
        m.habitat,
        m.rarity,
        m.primary_power,
        m.secondary_power,
        m.special_ability
      FROM 
        monsters m
      WHERE 1=1
    `;
    
    // Build parameter array for prepared statement
    const queryParams = [];
    
    // Add filters
    if (filters.category) {
      queryParams.push(filters.category);
      query += ` AND m.category = $${queryParams.length}`;
    }
    
    if (filters.habitat) {
      queryParams.push(filters.habitat);
      query += ` AND m.habitat = $${queryParams.length}`;
    }
    
    if (filters.rarity) {
      queryParams.push(filters.rarity);
      query += ` AND m.rarity = $${queryParams.length}`;
    }
    
    // Add sorting
    if (sort.field) {
      // Validate sort field to prevent SQL injection
      const validSortFields = ['name', 'category', 'habitat', 'rarity'];
      const sortField = validSortFields.includes(sort.field) ? sort.field : 'name';
      
      // Validate sort direction
      const sortDirection = sort.direction?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      
      query += ` ORDER BY m.${sortField} ${sortDirection}`;
    } else {
      // Default sort by name
      query += ` ORDER BY m.name ASC`;
    }
    
    // Add pagination
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const monsters = await executeQuery(dbPool, query, queryParams);
    
    logger.info(`getMonsters returning ${monsters.length} monsters`);
    logger.debug(`First monster in results: ${JSON.stringify(monsters[0] || {})}`);
    
    // Format the response
    return { content:monsters.map(monster => ({
      type: 'text',
      text: JSON.stringify({
        id: monster.monster_id,
        name: monster.name,
        category: monster.category,
        habitat: monster.habitat,
        rarity: monster.rarity,
        powers: {
          primary: monster.primary_power,
          secondary: monster.secondary_power,
          special: monster.special_ability
        }
      }),
    }))};
  } catch (error) {
    logger.error(`Error in getMonsters: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}

/**
 * Get detailed information about a specific monster by ID
 * 
 * @param {Object} params - Tool parameters
 * @param {number} params.monsterId - ID of the monster to retrieve
 * @returns {Promise<Object>} Detailed monster information
 */
export async function getMonsterById(params) {
  try {
    if (!dbPool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }
    
    logger.info(`getMonsterById called with params: ${JSON.stringify(params)}`);
    
    const { monsterId } = params;
    
    if (!monsterId) {
      logger.error('Monster ID is required but was not provided');
      throw new Error('Monster ID is required');
    }
    
    logger.debug(`Fetching monster with ID: ${monsterId}`);
    // Get basic monster information
    const monsterQuery = `
      SELECT 
        m.*
      FROM 
        monsters m
      WHERE 
        m.monster_id = $1
    `;
    
    const monsters = await executeQuery(dbPool, monsterQuery, [monsterId]);
    
    if (monsters.length === 0) {
      throw new Error(`Monster with ID ${monsterId} not found`);
    }
    
    const monster = monsters[0];
    
    // Get monster's abilities and keywords
    const abilitiesQuery = `
      SELECT 
        k.keyword_name,
        k.rating,
        a.ability_name,
        a.mastery_value
      FROM 
        questworlds_stats qs
      JOIN 
        keywords k ON qs.stats_id = k.stats_id
      JOIN 
        abilities a ON k.keyword_id = a.keyword_id
      WHERE 
        qs.monster_id = $1
      ORDER BY 
        k.keyword_name, a.ability_name
    `;
    
    const abilities = await executeQuery(dbPool, abilitiesQuery, [monsterId]);
    
    // Get monster's flaws
    const flawsQuery = `
      SELECT 
        f.flaw_name,
        f.rating
      FROM 
        questworlds_stats qs
      JOIN 
        flaws f ON qs.stats_id = f.stats_id
      WHERE 
        qs.monster_id = $1
      ORDER BY 
        f.rating DESC
    `;
    
    const flaws = await executeQuery(dbPool, flawsQuery, [monsterId]);
    
    // Get monster's strengths (augments)
    const strengthsQuery = `
      SELECT 
        target_name,
        modifier
      FROM 
        augments
      WHERE 
        monster_id = $1
    `;
    
    const strengths = await executeQuery(dbPool, strengthsQuery, [monsterId]);
    
    // Get monster's weaknesses (hindrances)
    const weaknessesQuery = `
      SELECT 
        target_name,
        modifier
      FROM 
        hindrances
      WHERE 
        monster_id = $1
    `;
    
    const weaknesses = await executeQuery(dbPool, weaknessesQuery, [monsterId]);
    
    // Organize abilities by keyword
    const keywordAbilities = {};
    abilities.forEach(item => {
      if (!keywordAbilities[item.keyword_name]) {
        keywordAbilities[item.keyword_name] = {
          name: item.keyword_name,
          rating: item.rating,
          abilities: []
        };
      }
      
      keywordAbilities[item.keyword_name].abilities.push({
        name: item.ability_name,
        mastery: item.mastery_value
      });
    });
    
    // Format the response
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          id: monster.monster_id,
          name: monster.name,
          category: monster.category,
          habitat: monster.habitat,
          rarity: monster.rarity,
          discovery: monster.discovery,
          physicalAttributes: {
            height: monster.height,
            weight: monster.weight,
            appearance: monster.appearance
          },
          powers: {
            primary: monster.primary_power,
            secondary: monster.secondary_power,
            special: monster.special_ability
          },
          keywords: Object.values(keywordAbilities),
          flaws: flaws.map(flaw => ({
            name: flaw.flaw_name,
            rating: flaw.rating
          })),
          strengths: strengths.map(strength => ({
            target: strength.target_name,
            modifier: strength.modifier
          })),
          weaknesses: weaknesses.map(weakness => ({
            target: weakness.target_name,
            modifier: weakness.modifier
          }))
        })
      }]
    };
  } catch (error) {
    logger.error(`Error in getMonsterById: ${error.message}`);
    logger.error(error.stack);
    throw new Error(`Failed to retrieve monster details: ${error.message}`);
  }
}

/**
 * Get a list of all available habitats in the database
 * 
 * @returns {Promise<Array>} List of all habitat names
 */
export async function getHabitats() {
  try {
    if (!dbPool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }
    
    logger.info('getHabitats called');
    
    // Query to get distinct habitats
    const query = `
      SELECT DISTINCT habitat
      FROM monsters
      WHERE habitat IS NOT NULL
      ORDER BY habitat ASC
    `;
    
    const results = await executeQuery(dbPool, query);
    
    // Extract habitat names
    const habitats = results.map(row => row.habitat);
    
    logger.info(`getHabitats returning ${habitats.length} habitats`);
    
    // Format the response
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(habitats)
      }]
    };
  } catch (error) {
    logger.error(`Error in getHabitats: ${error.message}`);
    logger.error(error.stack);
    throw new Error(`Failed to retrieve habitats: ${error.message}`);
  }
}

/**
 * Get monsters by habitat (exact match only)
 * 
 * @param {Object} params - Tool parameters
 * @param {string} params.habitat - Exact habitat name
 * @param {number} [params.limit=10] - Maximum number of results to return
 * @returns {Promise<Object>} Monsters matching the habitat
 */
export async function getMonsterByHabitat(params) {
  try {
    if (!dbPool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }
    
    logger.info(`getMonsterByHabitat called with params: ${JSON.stringify(params)}`);
    
    const { habitat, limit = 10 } = params;
    
    if (!habitat) {
      throw new Error('Habitat parameter is required');
    }
    
    // Query monsters with the exact habitat name
    const query = `
      SELECT 
        m.monster_id,
        m.name,
        m.category,
        m.habitat,
        m.rarity,
        m.primary_power,
        m.secondary_power,
        m.special_ability
      FROM 
        monsters m
      WHERE 
        m.habitat = $1
      ORDER BY 
        m.name ASC
      LIMIT $2
    `;
    
    const monsters = await executeQuery(dbPool, query, [habitat, limit]);
    
    logger.info(`getMonsterByHabitat returning ${monsters.length} monsters for habitat "${habitat}"`);
    
    // Format the response
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          monsters: monsters.map(monster => ({
            id: monster.monster_id,
            name: monster.name,
            category: monster.category,
            habitat: monster.habitat,
            rarity: monster.rarity,
            powers: {
              primary: monster.primary_power,
              secondary: monster.secondary_power,
              special: monster.special_ability
            }
          })),
          habitat: habitat,
          count: monsters.length
        })
      }]
    };
  } catch (error) {
    logger.error(`Error in getMonsterByHabitat: ${error.message}`);
    logger.error(error.stack);
    throw new Error(`Failed to retrieve monsters by habitat: ${error.message}`);
  }
}

/**
 * Get a monster by its name (partial match)
 * 
 * @param {Object} params - Tool parameters
 * @param {string} params.name - Name of the monster to search for (can be partial)
 * @returns {Promise<Object>} Monster information if found
 */
export async function getMonsterByName(params) {
  try {
    if (!dbPool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }
    
    logger.info(`getMonsterByName called with params: ${JSON.stringify(params)}`);
    
    const { name } = params;
    
    if (!name) {
      throw new Error('Monster name is required');
    }
    
    // Simple partial match query (case insensitive)
    const query = `
      SELECT 
        m.monster_id,
        m.name,
        m.category,
        m.habitat,
        m.rarity,
        m.primary_power,
        m.secondary_power,
        m.special_ability
      FROM 
        monsters m
      WHERE 
        LOWER(m.name) LIKE LOWER($1)
      ORDER BY
        m.name ASC
      LIMIT 5
    `;
    
    const monsters = await executeQuery(dbPool, query, [`%${name}%`]);
    
    if (monsters.length === 0) {
      logger.info(`No monsters found with name: ${name}`);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            found: false,
            message: `No monsters found with name: ${name}`
          })
        }]
      };
    }
    
    // Format the response for the matches
    logger.info(`Found ${monsters.length} monsters matching name: ${name}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          found: true,
          count: monsters.length,
          monsters: monsters.map(monster => ({
            id: monster.monster_id,
            name: monster.name,
            category: monster.category,
            habitat: monster.habitat,
            rarity: monster.rarity,
            powers: {
              primary: monster.primary_power,
              secondary: monster.secondary_power,
              special: monster.special_ability
            }
          }))
        })
      }]
    };
  } catch (error) {
    logger.error(`Error in getMonsterByName: ${error.message}`);
    logger.error(error.stack);
    throw new Error(`Failed to retrieve monster by name: ${error.message}`);
  }
}
