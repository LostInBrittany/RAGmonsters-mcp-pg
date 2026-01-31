/**
 * Prompt definitions for the RAGmonsters MCP server
 *
 * Prompts are workflow templates that guide the LLM through
 * multi-step analysis and strategy generation using available tools.
 */
import {
  loadAnalyzeMonsterWeakness,
  loadCompareMonsters,
  loadExploreHabitat,
  loadBuildTeam
} from './monsters.js';
import logger from '../utils/logger.js';

// Export the prompt loaders
export { loadAnalyzeMonsterWeakness, loadCompareMonsters, loadExploreHabitat, loadBuildTeam };

/**
 * Create a logged wrapper for a prompt loader function
 * @param {string} promptName - Name of the prompt
 * @param {Function} fn - The prompt loader function to wrap
 * @returns {Function} Wrapped function with logging
 */
function withLogging(promptName, fn) {
  return async (params) => {
    logger.info(`[PROMPT GET] ${promptName} requested`);
    const startTime = Date.now();
    try {
      const result = await fn(params);
      const duration = Date.now() - startTime;
      logger.info(`[PROMPT RESULT] ${promptName} loaded in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[PROMPT ERROR] ${promptName} failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  };
}

/**
 * Register all prompts with an MCP server
 * @param {Object} server - The MCP server instance
 */
export function registerPromptsWithServer(server) {
  // Analyze Monster Weakness prompt
  server.addPrompt({
    name: "analyze_monster_weakness",
    description: "Structured workflow to analyze a monster's weaknesses and find effective counter-strategies",
    load: withLogging("analyze_monster_weakness", loadAnalyzeMonsterWeakness)
  });

  // Compare Monsters prompt
  server.addPrompt({
    name: "compare_monsters",
    description: "Detailed comparison framework for analyzing matchups between two monsters",
    load: withLogging("compare_monsters", loadCompareMonsters)
  });

  // Explore Habitat prompt
  server.addPrompt({
    name: "explore_habitat",
    description: "Ecosystem analysis workflow for exploring a habitat and understanding its monster population",
    load: withLogging("explore_habitat", loadExploreHabitat)
  });

  // Build Team prompt
  server.addPrompt({
    name: "build_team",
    description: "Team composition strategy workflow for building an optimal monster team",
    load: withLogging("build_team", loadBuildTeam)
  });

  logger.info('Registered prompts with the MCP server');
}
