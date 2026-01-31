import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { loadMcpTools } from '@langchain/mcp-adapters';
import logger from './mcp-server/utils/logger.js';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const model = new ChatOpenAI({
  modelName: process.env.LLM_API_MODEL || 'gpt-5-mini',
  apiKey: process.env.LLM_API_KEY,
  temperature: 1,
  configuration: {
    baseURL: process.env.LLM_API_URL || 'https://api.openai.com/v1',
  }
});

// Cache for MCP resources and prompts (loaded once at agent creation)
let cachedResources = null;
let cachedPrompts = null;

/**
 * Fetch all resources from the MCP server using raw SDK client
 * @param {Client} mcpClient - Raw MCP client instance from @modelcontextprotocol/sdk
 * @returns {Promise<Object>} - Object with resource URIs as keys and content as values
 */
async function fetchResources(mcpClient) {
  const resources = {};

  try {
    // List available resources
    const resourceList = await mcpClient.listResources();
    logger.info(`Fetching ${resourceList.resources.length} resources from MCP server`);

    // Read each resource
    for (const resource of resourceList.resources) {
      try {
        const content = await mcpClient.readResource({ uri: resource.uri });
        const textContent = content.contents?.[0]?.text || '';
        resources[resource.uri] = {
          name: resource.name,
          description: resource.description,
          content: textContent
        };
        logger.info(`[RESOURCE FETCHED] ${resource.uri}`);
      } catch (error) {
        logger.error(`Failed to read resource ${resource.uri}: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error(`Failed to list resources: ${error.message}`);
  }

  return resources;
}

/**
 * Fetch all prompts from the MCP server using raw SDK client
 * @param {Client} mcpClient - Raw MCP client instance from @modelcontextprotocol/sdk
 * @returns {Promise<Object>} - Object with prompt names as keys and content as values
 */
async function fetchPrompts(mcpClient) {
  const prompts = {};

  try {
    // List available prompts
    const promptList = await mcpClient.listPrompts();
    logger.info(`Fetching ${promptList.prompts.length} prompts from MCP server`);

    // Get each prompt's content
    for (const prompt of promptList.prompts) {
      try {
        const promptContent = await mcpClient.getPrompt({ name: prompt.name });
        const textContent = promptContent.messages?.[0]?.content?.text ||
                           promptContent.messages?.[0]?.content || '';
        prompts[prompt.name] = {
          name: prompt.name,
          description: prompt.description,
          content: typeof textContent === 'string' ? textContent : JSON.stringify(textContent)
        };
        logger.info(`[PROMPT FETCHED] ${prompt.name}`);
      } catch (error) {
        logger.error(`Failed to get prompt ${prompt.name}: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error(`Failed to list prompts: ${error.message}`);
  }

  return prompts;
}

/**
 * Create a LangChain agent with the provided MCP client
 * Fetches and caches resources and prompts for injection into system message
 * @param {Client} mcpClient - Raw MCP client instance from @modelcontextprotocol/sdk
 * @returns {Object} - The LangChain ReAct agent
 */
export async function createAgent(mcpClient) {
  // Convert MCP tools to LangChain format
  const tools = await loadMcpTools(null, mcpClient);
  logger.info(`Loaded ${tools.length} tools from MCP server`);

  // Fetch and cache resources
  cachedResources = await fetchResources(mcpClient);
  logger.info(`Cached ${Object.keys(cachedResources).length} resources`);

  // Fetch and cache prompts
  cachedPrompts = await fetchPrompts(mcpClient);
  logger.info(`Cached ${Object.keys(cachedPrompts).length} prompts`);

  // Create the LangChain ReAct agent
  return createReactAgent({ llm: model, tools });
}

/**
 * Process a user message with the LangChain agent
 * @param {string} userMessage - The user's message
 * @param {Object} agent - The LangChain agent
 * @param {Array} messages - Previous conversation messages
 * @returns {Object} - The LLM response with any tool calls
 */
export async function processMessage(userMessage, agent, messages = []) {
  try {
    // Add the user message to the conversation history
    const updatedMessages = [
      ...messages,
      { role: 'user', content: userMessage }
    ];

    // Invoke the agent with the messages
    const response = await agent.invoke({
      messages: updatedMessages,
    });

    // Extract tool calls from the response
    const toolCalls = response.messages
      .filter(msg => msg.tool_calls && msg.tool_calls.length > 0)
      .flatMap(msg => msg.tool_calls);

    // Get the final answer (last message)
    const lastMessage = response.messages[response.messages.length - 1];

    return {
      message: lastMessage,
      toolCalls: toolCalls,
      allMessages: response.messages,
    };
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}

/**
 * Get the system message for the RAGmonsters chat
 * Includes cached resources and prompts as context for the LLM
 * @returns {Object} - The system message
 */
export function getSystemMessage() {
  // Build resource context from cached resources
  let resourceContext = '';
  if (cachedResources && Object.keys(cachedResources).length > 0) {
    resourceContext = '\n\n## Available Knowledge (MCP Resources)\n\n';
    resourceContext += 'Use this information to answer questions without calling tools when possible:\n\n';
    for (const resource of Object.values(cachedResources)) {
      resourceContext += `### ${resource.name}\n${resource.content}\n\n`;
    }
  }

  // Build prompt context from cached prompts
  let promptContext = '';
  if (cachedPrompts && Object.keys(cachedPrompts).length > 0) {
    promptContext = '\n\n## Available Workflows (MCP Prompts)\n\n';
    promptContext += 'When the user asks for analysis, comparison, or strategy, follow the appropriate workflow:\n\n';
    for (const prompt of Object.values(cachedPrompts)) {
      promptContext += `### ${prompt.name}\n**Description:** ${prompt.description}\n\n**Workflow:**\n${prompt.content}\n\n---\n\n`;
    }
  }

  return {
    role: 'system',
    content: `You are a helpful assistant that can explore the RAGmonsters database using specialized tools.

## Available Tools

- **getMonsters**: Get a list of monsters with optional filtering, sorting, and pagination
- **getMonsterById**: Get detailed information about a specific monster by ID
- **getHabitats**: Get a list of all available habitats
- **getCategories**: Get a list of all available categories
- **getSubcategories**: Get subcategories, optionally filtered by category
- **getMonsterByHabitat**: Get monsters by habitat (exact match)
- **getMonsterByName**: Get monsters by name (partial match)
- **compareMonsters**: Compare two monsters side-by-side

## Guidelines

- When users ask about monsters, use the appropriate tools to provide accurate information
- Use the Available Knowledge section below to answer questions about schema, categories, habitats without calling tools
- When users request analysis or comparisons, follow the workflows in the Available Workflows section
- Format responses in a user-friendly way with proper formatting and organization
- Use numbered or bulleted lists when showing multiple items
- Be concise but informative${resourceContext}${promptContext}`
  };
}

/**
 * Format the response for the chat interface
 * @param {Object} response - The response from the LangChain agent
 * @returns {string} - The formatted response content
 */
export function formatResponse(response) {
  // Extract the final answer (last message)
  logger.info('Extracting final answer from response');

  // The response structure from LangChain's ReAct agent has an allMessages array
  if (response.allMessages && response.allMessages.length > 0) {
    // Get the last message in the allMessages array
    const lastMessage = response.allMessages[response.allMessages.length - 1];

    // Extract the content from the kwargs object
    if (lastMessage.kwargs && lastMessage.kwargs.content) {
      return lastMessage.kwargs.content;
    }

    // Fallback if the structure is different
    if (lastMessage.content) {
      return lastMessage.content;
    }
  }

  // Fallback for message directly in the response
  if (response.message && response.message.kwargs && response.message.kwargs.content) {
    return response.message.kwargs.content;
  }

  // Final fallback
  logger.error('Could not extract content from response', JSON.stringify(response));
  return 'Sorry, I could not process your request at this time.';
}
