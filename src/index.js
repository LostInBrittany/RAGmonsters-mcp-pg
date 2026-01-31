import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { initializeDbPool, createMCPServer } from './mcp-server/index.js';
import { createAgent, processMessage, getSystemMessage, formatResponse } from './llm.js';
import logger from './mcp-server/utils/logger.js';

// Load environment variables
dotenv.config();

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 8080;

/**
 * Create an MCP client that connects to the server
 * @param {Object} server - The MCP server instance
 * @returns {Promise<Client>} The MCP client
 */
async function createMCPClient(server) {
  console.log('Creating STDIO transport to communicate with the MCP server');
  
  // Create a transport that communicates with the server via STDIO
  const transport = new StdioClientTransport({
    command: "node",
    args: ["./src/mcp-server/index.js"],
    debug: process.env.NODE_ENV !== 'production'  // Enable debug mode in development
  });

  // Create the MCP client with a reasonable timeout
  console.log('Creating MCP client');
  const client = new Client({
    name: "RAGmonsters-mcp-pg-client",
    version: "1.0.0",
    timeout: 10000  // 10 second timeout
  });
  
  await client.connect(transport);
  console.log("MCP client connected to server");
  return client;
}

/**
 * Initialize the application
 */
async function initializeApp() {
  // Initialize database pool for the web application
  const dbPool = initializeDbPool();
  
  // Create and start the MCP server
  const mcpServer = await createMCPServer(dbPool);
  mcpServer.start({
    transportType: "stdio",
  });
  console.log('MCP server started with STDIO transport');
  
  // Create an MCP client to communicate with the server
  const mcpClient = await createMCPClient(mcpServer);
  
  // List available tools, resources, and prompts
  try {
    const tools = await mcpClient.listTools();
    console.log(`Available MCP tools: ${tools.tools.map(t => t.name).join(', ')}`);

    const resources = await mcpClient.listResources();
    console.log(`Available MCP resources: ${resources.resources.map(r => r.uri).join(', ')}`);

    const prompts = await mcpClient.listPrompts();
    console.log(`Available MCP prompts: ${prompts.prompts.map(p => p.name).join(', ')}`);
  } catch (error) {
    console.error('Error listing MCP capabilities:', error);
  }
  
  // Create Express application
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // MCP tools API endpoint
  app.get('/api/tools', async (req, res) => {
    try {
      const tools = await mcpClient.listTools();
      res.json(tools);
    } catch (error) {
      console.error('Error listing MCP tools:', error);
      res.status(500).json({ error: 'Failed to list MCP tools' });
    }
  });
  
  // MCP tool execution endpoint
  app.post('/api/tools/:toolName', async (req, res) => {
    const { toolName } = req.params;
    const args = req.body;
    
    try {
      const result = await mcpClient.callTool({
        name: toolName,
        arguments: args
      });
      res.json(result);
    } catch (error) {
      console.error(`Error calling MCP tool ${toolName}:`, error);
      res.status(500).json({ error: `Failed to call MCP tool: ${error.message}` });
    }
  });
  
  // Initialize the LangChain agent with MCP tools
  let agent = null;
  
  // Chat endpoint for LLM interaction
  app.post('/api/chat', async (req, res) => {
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    try {
      // Get conversation history from session or create new one
      let conversation = {};
      if (conversationId && app.locals.conversations && app.locals.conversations[conversationId]) {
        conversation = app.locals.conversations[conversationId];
      } else {
        // Initialize conversation storage if it doesn't exist
        if (!app.locals.conversations) {
          app.locals.conversations = {};
        }
        
        // Create a new conversation with system message
        const newConversationId = Date.now().toString();
        app.locals.conversations[newConversationId] = {
          id: newConversationId,
          messages: [
            getSystemMessage()
          ]
        };
        conversation = app.locals.conversations[newConversationId];
      }
      
      // Create the agent if it doesn't exist
      if (!agent) {
        console.log('Creating LangChain agent with MCP tools');
        const tools = await mcpClient.listTools();
        agent = await createAgent(mcpClient);
      }
      
      // Process the message with LangChain agent
      console.log('Processing message with LangChain agent');
      const response = await processMessage(message, agent, conversation.messages);
      
      // Add all new messages to conversation history
      // Skip the first message which is the user message we already have
      const newMessages = response.allMessages.slice(conversation.messages.length);
      conversation.messages = [...conversation.messages, ...newMessages];
      
      // Format the response for the client
      const formattedResponse = formatResponse(response);
      
      // Return the response to the client
      return res.json({
        conversationId: conversation.id,
        message: formattedResponse
      });
      
    } catch (error) {
      console.error('Error processing chat message:', error);
      res.status(500).json({ error: `Failed to process message: ${error.message}` });
    }
  });
  
  // Start Express server
  const server = app.listen(PORT, () => {
    console.log(`Web server listening on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
    console.log(`API available at http://localhost:${PORT}/api/tools`);
    console.log(`Chat API available at http://localhost:${PORT}/api/chat`);
  });
  
  // Return the initialized components
  return { app, server, dbPool, mcpClient, mcpServer };
}

// Start the application when this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeApp().catch(error => {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  });
}

export default initializeApp;
