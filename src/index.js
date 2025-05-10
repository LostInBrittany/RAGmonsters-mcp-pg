import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { initializeDbPool } from './mcp-server/index.js';

// Load environment variables
dotenv.config();

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 8080;

/**
 * Spawn the MCP server as a child process
 * @returns {Promise<ChildProcess>} The spawned MCP server process
 */
function spawnMCPServer() {
  return new Promise((resolve, reject) => {
    // Path to the MCP server script
    const mcpServerPath = path.join(__dirname, 'mcp-server', 'index.js');
    
    // Spawn the MCP server as a child process
    const mcpProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'], // We'll handle the stdio separately
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
    });
    
    // Handle process events
    mcpProcess.on('error', (err) => {
      console.error('Failed to start MCP server process:', err);
      reject(err);
    });
    
    // Log MCP server output to console in development mode
    if (process.env.NODE_ENV !== 'production') {
      mcpProcess.stdout.on('data', (data) => {
        console.log(`[MCP Server]: ${data.toString().trim()}`);
      });
      
      mcpProcess.stderr.on('data', (data) => {
        console.error(`[MCP Server Error]: ${data.toString().trim()}`);
      });
    }
    
    // Handle server exit
    mcpProcess.on('close', (code) => {
      if (code !== 0) {
        console.warn(`MCP server process exited with code ${code}`);
      } else {
        console.log('MCP server process exited normally');
      }
    });
    
    // Give the server a moment to initialize
    setTimeout(() => resolve(mcpProcess), 500);
  });
}

/**
 * Initialize the application
 */
async function initializeApp() {
  // Initialize database pool for the web application
  const dbPool = initializeDbPool();
  
  // Create Express application
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Start Express server
  const server = app.listen(PORT, () => {
    console.log(`Web server listening on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
  });
  
  // Return the initialized components
  return { app, server, dbPool };
}

// Start the application when this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeApp().catch(error => {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  });
}

export default initializeApp;
