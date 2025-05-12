# Custom PostgreSQL MCP Server for RAGmonsters

## Overview

This repository demonstrates a more advanced approach to integrating Large Language Models (LLMs) with databases using the Model Context Protocol (MCP). While generic MCP PostgreSQL servers allow LLMs to explore databases through raw SQL queries, this project takes a different approach by creating a **custom MCP server** that provides a domain-specific API tailored to the application's needs.

This implementation uses **FastMCP**, a high-performance implementation of the Model Context Protocol, which provides improved efficiency and reliability for tool-based interactions with LLMs.

This project uses the [RAGmonsters](https://github.com/LostInBrittany/RAGmonsters) dataset as its foundation. RAGmonsters is an open-source project that provides a rich, fictional dataset of monsters with various attributes, abilities, and relationships - specifically designed for demonstrating and testing Retrieval-Augmented Generation (RAG) systems.

### The Problem with Generic MCP Database Access

Generic MCP PostgreSQL servers provide LLMs with a `query` tool that allows them to:
- Explore database schemas
- Formulate SQL queries based on natural language questions
- Execute those queries against the database

While this approach works, it has several limitations for real-world applications:
- **Cognitive Load**: The LLM must understand the entire database schema
- **Inefficiency**: Multiple SQL queries are often needed to answer a single question
- **Security Concerns**: Raw SQL access requires careful prompt engineering to prevent injection attacks
- **Performance**: Complex queries may be inefficient if the LLM doesn't understand the database's indexing strategy
- **Domain Knowledge Gap**: The LLM lacks understanding of business rules and domain-specific constraints

### About RAGmonsters Dataset

[RAGmonsters](https://github.com/LostInBrittany/RAGmonsters) is an open dataset specifically designed for testing and demonstrating Retrieval-Augmented Generation (RAG) systems. It contains information about fictional monsters with rich attributes, abilities, and relationships - making it perfect for natural language querying demonstrations.

The PostgreSQL version of RAGmonsters provides a well-structured relational database with multiple tables and relationships, including:

- Monsters with various attributes (attack power, defense, health, etc.)
- Abilities that monsters can possess
- Elements (fire, water, earth, etc.) with complex relationships
- Habitats where monsters can be found
- Evolution chains and relationships between monsters

This rich, interconnected dataset is ideal for demonstrating the power of domain-specific APIs versus generic SQL access.

### Our Solution: Domain-Specific MCP API

This project demonstrates how to build a custom MCP server that provides a higher-level, domain-specific API for the RAGmonsters dataset. Instead of exposing raw SQL capabilities, our MCP server offers purpose-built functions that:

1. **Abstract Database Complexity**: Hide the underlying schema and SQL details
2. **Provide Domain-Specific Operations**: Offer functions that align with business concepts
3. **Optimize for Common Queries**: Implement efficient query patterns for frequently asked questions
4. **Enforce Business Rules**: Embed domain-specific logic and constraints
5. **Improve Security**: Limit the attack surface by removing direct SQL access

## Web Interface

The project includes two main interfaces for interacting with the RAGmonsters dataset:

### Explorer Interface

A data-focused interface for exploring and filtering the RAGmonsters dataset through the MCP API:

- Browse all monsters with filtering by category, habitat, and rarity
- View detailed information about each monster
- Interactive UI built with Bootstrap

### Chat Interface

A natural language interface for interacting with the RAGmonsters dataset:

- Ask questions about monsters in natural language
- Get Markdown-formatted responses with rich formatting
- Powered by LangGraph's ReAct agent pattern
- Seamless integration with the MCP tools

![RAGmonsters Explorer Screenshot](img/screenshot.jpg)

This interface allows users to:
- Browse all monsters in the dataset
- Filter monsters by habitat, category, and rarity
- View detailed information about each monster, including powers, abilities, strengths, and weaknesses

## Example: Domain-Specific API vs. Generic SQL

### Generic MCP PostgreSQL Approach:
```
User: "What are the top 3 monsters with the highest attack power that are vulnerable to fire?"

LLM: (Must understand schema, joins, and SQL syntax)
1. First query to understand the schema
2. Second query to find monsters with attack power
3. Third query to find vulnerabilities
4. Final query to join and filter results
```

### Our Custom MCP Server Approach:
```
User: "What are the top 3 monsters with the highest attack power that are vulnerable to fire?"

LLM: (Uses our domain-specific API)
1. Single call: getMonsters({ vulnerableTo: "fire", sortBy: "attackPower", limit: 3 })
```

## Project Structure

```
├── .env.example        # Example environment variables
├── package.json        # Node.js project configuration
├── README.md           # This documentation
├── img/                # Images for documentation
├── scripts/
│   ├── testMcpServer.js # Test script for the MCP server
│   └── testLogger.js    # Logger for test script
├── src/
│   ├── index.js        # Main application server
│   ├── mcp-server/     # Custom MCP server implementation with FastMCP
│   │   ├── index.js    # Server entry point
│   │   ├── tools/      # Domain-specific tools
│   │   │   ├── index.js      # Tool registration
│   │   │   └── monsters.js   # Monster-related operations
│   │   └── utils/     # Helper utilities
│   │       └── logger.js     # Logging functionality
│   ├── llm.js          # LangChain integration for LLM
│   └── public/         # Web interface files
│       ├── index.html  # Monster explorer interface
│       └── chat.html   # Chat interface for LLM interactions
```

## Features

- **Custom MCP Server with FastMCP**: High-performance domain-specific API for RAGmonsters data
- **Optimized Queries**: Pre-built efficient database operations
- **Business Logic Layer**: Domain rules and constraints embedded in the API
- **Structured Response Format**: Consistent JSON responses for LLM consumption
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Test Suite**: Scripts to verify server functionality and LLM integration
- **LLM Integration**: 
  - LangChain.js integration with OpenAI and other compatible LLM providers
  - LangGraph ReAct agent pattern for efficient tool use
  - Automatic handling of tool calls and responses
- **Web Interfaces**: 
  - Explorer interface for browsing and filtering monsters
  - Chat interface with Markdown rendering for natural language interaction

### Features
- **LangChain.js Integration**: Fully integrated LLM interactions with MCP tools
- **Web Interface**: Explorer and chat interfaces for interacting with the RAGmonsters dataset
- **Deployment Ready**: Configured for easy deployment on platforms like Clever Cloud

## Benefits of This Approach

1. **Improved Performance**: Optimized queries and caching strategies
2. **Better User Experience**: More accurate and faster responses
3. **Reduced Token Usage**: LLM doesn't need to process complex SQL or schema information
4. **Enhanced Security**: No direct SQL access means reduced risk of injection attacks
5. **Maintainability**: Changes to the database schema don't require retraining the LLM
6. **Scalability**: Can handle larger and more complex databases

## Getting Started

### Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure your PostgreSQL connection string and LLM API keys
4. Run the MCP server test script: `npm run test`
5. Run the LLM integration test script: `npm run test:llm`
6. Start the server: `npm start`

### Available Tools

The MCP server provides the following tools:

1. **getMonsters** - Get a list of monsters with optional filtering, sorting, and pagination
   - Parameters: filters (category, habitat, rarity), sort (field, direction), limit, offset
   - Returns: Array of monster objects with basic information

2. **getMonsterById** - Get detailed information about a specific monster by ID
   - Parameters: monsterId
   - Returns: Detailed monster object with all attributes, powers, abilities, strengths, and weaknesses

3. **add** - Simple utility to add two numbers (for testing)
   - Parameters: a, b
   - Returns: Sum of the two numbers

### LLM Integration Architecture

This project uses a modern approach to LLM integration with domain-specific tools:

#### LangGraph ReAct Agent Pattern

The application uses LangGraph's ReAct (Reasoning and Acting) agent pattern, which:

1. Processes user queries to understand intent
2. Determines which tools to use based on the query
3. Automatically executes the appropriate tools
4. Synthesizes results into a coherent response
5. Handles multi-step reasoning when needed

#### Testing LLM Integration

The project includes a test script that demonstrates how to use LangChain.js to integrate an LLM with the MCP server:

```
npm run test:llm
```

This script:

1. Connects to the MCP server using the StdioClientTransport
2. Loads all available MCP tools using LangChain's MCP adapters
3. Creates a LangChain agent with the OpenAI API
4. Processes a natural language query about monsters
5. Shows how the LLM makes tool calls to retrieve information
6. Logs detailed information about the interaction

You can modify the test queries in the script to explore different capabilities of the system. The script is located at `scripts/testLlmWithMcpServer.js`.

## Prerequisites

- Node.js 23 or later
- PostgreSQL database with RAGmonsters data
- Access to an LLM API (e.g., OpenAI)
- FastMCP package (included in dependencies)

## Environment Variables

Create a `.env` file with the following variables:

```
# PostgreSQL connection string
POSTGRESQL_ADDON_URI=postgres://username:password@host:port/database

# LLM API configuration
LLM_API_KEY=your_openai_api_key
LLM_API_MODEL=gpt-4o-mini
LLM_API_URL=https://api.openai.com/v1
```

### LLM Configuration

- **LLM_API_KEY**: Your OpenAI API key or compatible provider key
- **LLM_API_MODEL**: The model to use (default: gpt-4o-mini)
- **LLM_API_URL**: The API endpoint (default: OpenAI's endpoint)

The application supports any OpenAI-compatible API, including self-hosted models and alternative providers.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [RAGmonsters](https://github.com/LostInBrittany/RAGmonsters) for the sample dataset
- [Model Context Protocol](https://modelcontextprotocol.ai/) for the MCP specification
- [FastMCP](https://github.com/fastmcp/fastmcp) for the high-performance MCP implementation
- [Clever Cloud](https://www.clever-cloud.com/) for hosting capabilities
