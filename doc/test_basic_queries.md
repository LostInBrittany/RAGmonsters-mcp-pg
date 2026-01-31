## Test Tools (basic queries):

1. "What monsters live in the Deep Ocean Trenches?" - tests `getMonsterByHabitat` (should suggest calling getHabitats first)
2. "Tell me about Abyssalurk" - tests `getMonsterByName` + `getMonsterById`
3. "What categories of monsters exist?" - tests `getCategories`
"Compare Abyssalurk and Pyroclasm" - tests `compareMonsters`

## Test Resources (reference data):

5. "What habitats are available in the database?" - should use the `ragmonsters://habitats` resource or getHabitats tool
6. "Show me the database schema" - tests if the LLM uses `ragmonsters://schema`

## Test Prompts (workflow templates):

7. "Analyze the weaknesses of Shadowmere and suggest counters" - should trigger `analyze_monster_weakness` workflow
8. "I want to explore the Volcanic Peaks - what should I expect?" - should trigger `explore_habitat` workflow
9. "Build me a team to hunt in the Frozen Tundra" - should trigger `build_team` workflow

## Test multi-step reasoning:

10. "Find me the rarest Elemental monsters and tell me their weaknesses" - requires multiple tool calls

Start with questions 1-4 to verify basic tool functionality, then try 7-9 to see if the prompts guide the LLM through the workflows.