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
  openAIApiKey: process.env.LLM_API_KEY,
  temperature: 1,
  configuration: {
    baseURL: process.env.LLM_API_URL || 'https://api.openai.com/v1',
  }
});

/**
 * Create a LangChain agent with the provided MCP client
 * @param {Client} mcpClient - MCP client instance
 * @returns {Object} - The LangChain ReAct agent
 */
export async function createAgent(mcpClient) {
  // Convert MCP tools to LangChain format
  const tools = await loadMcpTools(null, mcpClient);

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
 * @returns {Object} - The system message
 */
export function getSystemMessage() {
  return {
    role: 'system',
    content: `You are a helpful assistant that can explore the RAGmonsters database using specialized tools.

You have access to the following tools:
- getMonsters: Get a list of monsters with optional filtering, sorting, and pagination
- getMonsterById: Get detailed information about a specific monster by ID

When users ask about monsters, use these tools to provide accurate information.
Always format your responses in a user-friendly way with proper formatting and organization.
If you need to show multiple monsters, consider using a numbered or bulleted list.

Be concise but informative in your responses.`
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
