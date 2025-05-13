#!/usr/bin/env node

/**
 * Test script for the RAGmonsters MCP server with LLM integration
 * 
 * This script demonstrates how to use the custom MCP server with LangChain and an LLM.
 * It spawns the MCP server as a child process and interacts with it using LangChain's MCP adapters.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { loadMcpTools } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './testLogger.js';

// Load environment variables from .env file
dotenv.config();

// Get environment variables
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_MODEL = process.env.LLM_API_MODEL || "gpt-4o-mini";
const LLM_API_URL = process.env.LLM_API_URL || "https://api.openai.com/v1";

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Check for required environment variables
if (!LLM_API_KEY) {
  logger.error("Error: LLM_API_KEY environment variable is not set");
  process.exit(1);
}

logger.info(`Using LLM model: ${LLM_API_MODEL}`);
logger.info(`Using LLM API URL: ${LLM_API_URL}`);

// Initialize OpenAI client with API key and URL from environment
const model = new ChatOpenAI({ 
  modelName: LLM_API_MODEL,
  openAIApiKey: LLM_API_KEY,
  temperature: 0.2,
  configuration: {
    baseURL: LLM_API_URL
  }
});

// Setup MCP Client for RAGmonsters MCP Server
logger.info('Creating STDIO transport to communicate with the server');
const transport = new StdioClientTransport({
  command: "node",
  args: ["./src/mcp-server/index.js"],
  debug: true  // Enable debug mode for more verbose logging
});

logger.info('Creating MCP client');
const mcpClient = new Client({ 
  name: "RAGmonsters-mcp-pg-client", 
  version: "1.0.0",
  timeout: 10000 // 10 second timeout
});

await mcpClient.connect(transport);
logger.info("Client connected to server");

// Load MCP tools
logger.info('Loading MCP tools');
const toolsResponse = await mcpClient.listTools();
logger.info(`Available MCP tools: ${toolsResponse.tools.map(tool => tool.name).join(', ')}`);

// Convert MCP tools to LangChain format
const tools = await loadMcpTools(null, mcpClient);
logger.info(`Loaded ${tools.length} tools for LangChain`);

// Initialize the LangChain Agent with OpenAI and MCP Tools
logger.info('Creating LangChain agent');
const agent = createReactAgent({ llm: model, tools });


// Natural language query examples
const queries = [
  "Tell me about the monster called Abyssalurk",
  "What monsters live in the Volcanic Mountains?",
  "What monsters can be found in volcanic habitats?" // New test case for habitat matching
];

// System message for the LLM
const systemMessage = `You are a helpful assistant that can explore the RAGmonsters database using specialized tools.

You have access to the tools I give you with the request.
When users ask about monsters, use these tools to provide accurate information.
Always format your responses in a user-friendly way with proper formatting and organization.
If you need to show multiple monsters, consider using a numbered or bulleted list.

`;

// Main function to run the test
async function main() {
  try {
    // Process each query sequentially
    for (let i = 0; i < queries.length; i++) {
      const userQuery = queries[i];
      logger.info(`\n\n=========== TEST QUERY ${i + 1}/${queries.length} ===========`);
      logger.info(`Processing query: "${userQuery}"`);
      logger.info("Sending request to model with system message...");
      
      // Create messages for this query
      const messages = [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: userQuery
        }
      ];
      
      const response = await agent.invoke({
        messages: messages,
      });
      
      // Log the final answer
      const lastMessage = response?.messages?.[response.messages.length - 1]?.content ?? "No answer";
      logger.info(`LLM Response for query ${i + 1}:`);
      logger.info(lastMessage);
      
      // Extract and log any tool calls that were made
      const toolCalls = response.messages
        .filter(msg => msg.tool_calls && msg.tool_calls.length > 0)
        .flatMap(msg => msg.tool_calls);
      
      if (toolCalls.length > 0) {
        logger.info(`The LLM made ${toolCalls.length} tool calls:`);
        toolCalls.forEach((call, index) => {
          logger.info(`Tool Call #${index + 1}: ${call?.name}`);
          logger.info(`Arguments: ${JSON.stringify(call?.args)}`);
        });
      } else {
        logger.info("The LLM did not make any tool calls.");
      }
      
      logger.info(`Test ${i + 1} completed successfully!`);
      
      // Add a small delay between tests
      if (i < queries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    logger.error(`Error running test: ${error.message}`);
    logger.error(error.stack);
  } finally {
    // Cleanup
    logger.info("Closing MCP client connection");
    await mcpClient.close();
    logger.info("All tests completed.");
  }
}

// Run the test
await main();
process.exit(0);
