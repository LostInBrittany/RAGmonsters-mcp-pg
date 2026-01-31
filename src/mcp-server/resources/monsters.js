/**
 * Monster-related MCP resources
 */
import { executeQuery } from '../utils/db.js';
import logger from '../utils/logger.js';

// Module-level database pool
let dbPool = null;

// Cached resource data (loaded once at initialization)
let cachedCategories = null;
let cachedSubcategories = null;
let cachedHabitats = null;

/**
 * Initialize the resources module with a database pool
 * Fetches and caches reference data once at startup
 * @param {Object} pool - PostgreSQL connection pool
 */
export async function initializeResources(pool) {
  dbPool = pool;

  try {
    // Fetch categories
    const categories = await executeQuery(dbPool,
      'SELECT category_id, category_name FROM ragmonsters.categories ORDER BY category_name ASC'
    );
    cachedCategories = categories.map(c => c.category_name);

    // Fetch subcategories with their parent categories
    const subcategories = await executeQuery(dbPool, `
      SELECT s.subcategory_name, c.category_name
      FROM ragmonsters.subcategories s
      JOIN ragmonsters.categories c ON s.category_id = c.category_id
      ORDER BY c.category_name ASC, s.subcategory_name ASC
    `);
    cachedSubcategories = subcategories.map(s => ({
      name: s.subcategory_name,
      category: s.category_name
    }));

    // Fetch habitats
    const habitats = await executeQuery(dbPool,
      'SELECT DISTINCT habitat FROM ragmonsters.monsters WHERE habitat IS NOT NULL ORDER BY habitat ASC'
    );
    cachedHabitats = habitats.map(h => h.habitat);

    logger.info(`Resources initialized: ${cachedCategories.length} categories, ${cachedSubcategories.length} subcategories, ${cachedHabitats.length} habitats`);
  } catch (error) {
    logger.error(`Failed to initialize resources: ${error.message}`);
    throw error;
  }
}

/**
 * Load the database schema resource
 * @returns {Promise<Object>} Schema description
 */
export async function loadSchema() {
  return {
    text: `RAGmonsters Database Schema

Monster {
  id: Integer (primary key)
  name: String (unique)
  category: String (from categories table)
  subcategory: String (from subcategories table)
  habitat: String
  biome: String
  rarity: Enum(Common, Uncommon, Rare, Very Rare, Extremely Rare)
  discovery: Text (discovery story)
  height: String
  weight: String
  appearance: Text
  primary_power: String
  secondary_power: String
  special_ability: String
  weakness: Text
  behavior_ecology: Text
  notable_specimens: Text
}

Category {
  category_id: Integer (primary key)
  category_name: String (unique)
}

Subcategory {
  subcategory_id: Integer (primary key)
  subcategory_name: String
  category_id: Integer (foreign key to Category)
}

QuestWorlds Stats (for game mechanics) {
  Keywords: name + rating
  Abilities: name + mastery value (linked to keywords)
  Flaws: name + rating
  Augments: target + modifier (strengths)
  Hindrances: target + modifier (weaknesses)
}`
  };
}

/**
 * Load monster categories resource
 * @returns {Promise<Object>} List of categories
 */
export async function loadCategories() {
  return {
    text: cachedCategories
      ? `Monster Categories:\n${cachedCategories.map(c => `- ${c}`).join('\n')}`
      : 'Categories not loaded. Server may not be fully initialized.'
  };
}

/**
 * Load monster subcategories resource
 * @returns {Promise<Object>} List of subcategories grouped by category
 */
export async function loadSubcategories() {
  if (!cachedSubcategories) {
    return { text: 'Subcategories not loaded. Server may not be fully initialized.' };
  }

  // Group by category
  const byCategory = {};
  for (const sub of cachedSubcategories) {
    if (!byCategory[sub.category]) {
      byCategory[sub.category] = [];
    }
    byCategory[sub.category].push(sub.name);
  }

  let text = 'Monster Subcategories:\n';
  for (const [category, subs] of Object.entries(byCategory)) {
    text += `\n${category}:\n`;
    text += subs.map(s => `  - ${s}`).join('\n') + '\n';
  }

  return { text };
}

/**
 * Load monster habitats resource
 * @returns {Promise<Object>} List of habitats
 */
export async function loadHabitats() {
  return {
    text: cachedHabitats
      ? `Monster Habitats:\n${cachedHabitats.map(h => `- ${h}`).join('\n')}`
      : 'Habitats not loaded. Server may not be fully initialized.'
  };
}
