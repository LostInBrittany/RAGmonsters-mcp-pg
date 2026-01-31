/**
 * Monster-related MCP prompts
 *
 * These prompts are workflow templates that guide the LLM through
 * multi-step analysis using the available tools.
 */

/**
 * Analyze monster weakness prompt
 * Guides the LLM through a structured weakness analysis workflow
 */
export async function loadAnalyzeMonsterWeakness() {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Analyze the weaknesses of a monster and suggest counter-strategies.

Follow this workflow:
1. Use getMonsterByName to fetch the target monster's details
2. Use getMonsterById to get full details including weaknesses, flaws, and hindrances
3. Identify the monster's key vulnerabilities (weaknesses, flaws, elemental vulnerabilities)
4. Use getMonsters with filters to find potential counter-monsters:
   - Look for monsters with powers that exploit the target's weaknesses
   - Consider monsters from opposing categories or habitats
5. Rank the counter-monsters by effectiveness based on:
   - Direct power advantages
   - Resistance to the target's abilities
   - Rarity (more common = more accessible)
6. Provide a battle strategy summary with:
   - Top 3 recommended counter-monsters
   - Key tactics to exploit weaknesses
   - Dangers to avoid (the target's strengths)`
        }
      }
    ]
  };
}

/**
 * Compare monsters prompt
 * Guides the LLM through a structured comparison workflow
 */
export async function loadCompareMonsters() {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Compare two monsters in detail to determine advantages and matchup analysis.

Follow this workflow:
1. Use compareMonsters to get a side-by-side basic comparison
2. Use getMonsterById for each monster to get full details including:
   - Complete power sets (primary, secondary, special)
   - Keywords and abilities with ratings
   - Flaws and weaknesses
   - Strengths (augments) and hindrances
3. Analyze the matchup:
   - Which monster's powers counter the other's weaknesses?
   - Compare keyword ratings and ability masteries
   - Identify asymmetric advantages
4. Consider environmental factors:
   - Habitat advantages (home territory bonus)
   - Biome compatibility
5. Provide a verdict:
   - Overall advantage assessment
   - Situational factors that could flip the matchup
   - Recommended tactics for each side`
        }
      }
    ]
  };
}

/**
 * Explore habitat prompt
 * Guides the LLM through habitat exploration and ecosystem analysis
 */
export async function loadExploreHabitat() {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Explore a habitat and analyze its monster ecosystem.

Follow this workflow:
1. Use getHabitats to list available habitats (or use the ragmonsters://habitats resource)
2. Use getMonsterByHabitat to find all monsters in the target habitat
3. For key monsters, use getMonsterById to get detailed information
4. Analyze the ecosystem:
   - Categorize monsters by rarity (common to extremely rare)
   - Identify the apex predators (highest threat monsters)
   - Map the food chain / power hierarchy
   - Note category diversity (Aquatic, Elemental, Spirit, etc.)
5. Provide exploration guidance:
   - Danger assessment for the habitat
   - Most common encounters to expect
   - Rare monsters worth seeking
   - Recommended preparation and counter-strategies`
        }
      }
    ]
  };
}

/**
 * Build team prompt
 * Guides the LLM through team composition strategy
 */
export async function loadBuildTeam() {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Build an optimal monster team for a specific objective.

Follow this workflow:
1. Clarify the objective:
   - Target habitat/biome to explore?
   - Specific monster to hunt?
   - General purpose balanced team?
2. Use getCategories and getSubcategories to understand available monster types
3. Use getMonsters with appropriate filters to find candidates:
   - Consider category diversity for balanced coverage
   - Match habitat affinity if targeting a specific area
   - Balance rarity (rare monsters are powerful but hard to find)
4. For top candidates, use getMonsterById to evaluate:
   - Power synergies between team members
   - Coverage of each other's weaknesses
   - Complementary abilities
5. Recommend a team composition:
   - Primary team (3-5 monsters)
   - Role for each member (tank, damage, support, specialist)
   - Team synergies and combo strategies
   - Backup alternatives for each role`
        }
      }
    ]
  };
}
