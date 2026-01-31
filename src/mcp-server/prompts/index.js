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
 * Register all prompts with an MCP server
 * @param {Object} server - The MCP server instance
 */
export function registerPromptsWithServer(server) {
  // Analyze Monster Weakness prompt
  server.addPrompt({
    name: "analyze_monster_weakness",
    description: "Structured workflow to analyze a monster's weaknesses and find effective counter-strategies",
    load: loadAnalyzeMonsterWeakness
  });

  // Compare Monsters prompt
  server.addPrompt({
    name: "compare_monsters",
    description: "Detailed comparison framework for analyzing matchups between two monsters",
    load: loadCompareMonsters
  });

  // Explore Habitat prompt
  server.addPrompt({
    name: "explore_habitat",
    description: "Ecosystem analysis workflow for exploring a habitat and understanding its monster population",
    load: loadExploreHabitat
  });

  // Build Team prompt
  server.addPrompt({
    name: "build_team",
    description: "Team composition strategy workflow for building an optimal monster team",
    load: loadBuildTeam
  });

  logger.info('Registered prompts with the MCP server');
}
