# Custom PostgreSQL MCP Server for RAGmonsters

## Overview

This repository demonstrates a more advanced approach to integrating Large Language Models (LLMs) with databases using the Model Context Protocol (MCP). While generic MCP PostgreSQL servers allow LLMs to explore databases through raw SQL queries, this project takes a different approach by creating a **custom MCP server** that provides a domain-specific API tailored to the application's needs.

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
├── src/
│   ├── index.js        # Main application server
│   ├── mcp-server/     # Custom MCP server implementation
│   │   ├── index.js    # Server entry point
│   │   ├── tools/      # Domain-specific tools
│   │   │   ├── monsters.js    # Monster-related operations
│   │   │   ├── abilities.js   # Ability-related operations
│   │   │   └── elements.js    # Element-related operations
│   │   └── utils/     # Helper utilities
│   ├── llm.js          # LangChain integration for LLM
│   └── public/         # Web interface files
│       └── index.html  # Chat interface
```

## Features (Planned)

- **Custom MCP Server**: Domain-specific API for RAGmonsters data
- **Optimized Queries**: Pre-built efficient database operations
- **Business Logic Layer**: Domain rules and constraints embedded in the API
- **LangChain.js Integration**: For LLM interactions
- **Web Interface**: Simple chat interface to interact with the data
- **Deployment on Clever Cloud**: Easy deployment instructions

## Benefits of This Approach

1. **Improved Performance**: Optimized queries and caching strategies
2. **Better User Experience**: More accurate and faster responses
3. **Reduced Token Usage**: LLM doesn't need to process complex SQL or schema information
4. **Enhanced Security**: No direct SQL access means reduced risk of injection attacks
5. **Maintainability**: Changes to the database schema don't require retraining the LLM
6. **Scalability**: Can handle larger and more complex databases

## Getting Started

This project is currently in development. Check back soon for implementation details and usage instructions.

## Prerequisites

- Node.js 23 or later
- PostgreSQL database with RAGmonsters data
- Access to an LLM API (e.g., OpenAI)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [RAGmonsters](https://github.com/LostInBrittany/RAGmonsters) for the sample dataset
- [Model Context Protocol](https://modelcontextprotocol.ai/) for the MCP specification
- [Clever Cloud](https://www.clever-cloud.com/) for hosting capabilities
