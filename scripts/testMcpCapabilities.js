/**
 * Test script to verify MCP resources and prompts work with @langchain/mcp-adapters
 * Tests the MultiServerMCPClient's ability to access resources and prompts
 */
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testMcpCapabilities() {
  console.log('='.repeat(60));
  console.log('Testing MCP Capabilities with @langchain/mcp-adapters v1.1.2');
  console.log('='.repeat(60));

  // Create the MCP client connecting to our server via stdio
  const client = new MultiServerMCPClient({
    mcpServers: {
      ragmonsters: {
        transport: 'stdio',
        command: 'node',
        args: [path.join(__dirname, '../src/mcp-server/index.js')],
        env: process.env
      }
    }
  });

  try {
    // Initialize connections
    console.log('\n1. Initializing connection to MCP server...');
    await client.initializeConnections();
    console.log('   ✓ Connected successfully');

    // Test Tools
    console.log('\n2. Testing Tools...');
    const tools = await client.getTools();
    console.log(`   ✓ Found ${tools.length} tools:`);
    tools.forEach(tool => {
      console.log(`     - ${tool.name}: ${tool.description?.substring(0, 50)}...`);
    });

    // Test Resources
    console.log('\n3. Testing Resources...');
    const resources = await client.listResources();
    const serverResources = resources['ragmonsters'] || [];
    console.log(`   ✓ Found ${serverResources.length} resources:`);
    serverResources.forEach(resource => {
      console.log(`     - ${resource.uri}: ${resource.name}`);
    });

    // Read each resource
    if (serverResources.length > 0) {
      console.log('\n4. Reading Resources...');
      for (const resource of serverResources) {
        try {
          const content = await client.readResource('ragmonsters', resource.uri);
          const textContent = content[0]?.text || '';
          const preview = textContent.substring(0, 100).replace(/\n/g, ' ');
          console.log(`   ✓ ${resource.uri}:`);
          console.log(`     Preview: ${preview}...`);
        } catch (error) {
          console.log(`   ✗ ${resource.uri}: ${error.message}`);
        }
      }
    }

    // Test Prompts (via raw MCP client)
    console.log('\n5. Testing Prompts...');
    const mcpClient = await client.getClient('ragmonsters');
    if (mcpClient) {
      try {
        const promptsResult = await mcpClient.listPrompts();
        const prompts = promptsResult.prompts || [];
        console.log(`   ✓ Found ${prompts.length} prompts:`);
        prompts.forEach(prompt => {
          console.log(`     - ${prompt.name}: ${prompt.description?.substring(0, 50)}...`);
        });

        // Get a sample prompt
        if (prompts.length > 0) {
          console.log('\n6. Getting a sample prompt...');
          const samplePrompt = await mcpClient.getPrompt({ name: prompts[0].name });
          const promptContent = samplePrompt.messages?.[0]?.content;
          if (promptContent) {
            const textContent = typeof promptContent === 'string'
              ? promptContent
              : promptContent.text || JSON.stringify(promptContent);
            const preview = textContent.substring(0, 200).replace(/\n/g, ' ');
            console.log(`   ✓ ${prompts[0].name}:`);
            console.log(`     Preview: ${preview}...`);
          }
        }
      } catch (error) {
        console.log(`   ✗ Prompts error: ${error.message}`);
      }
    } else {
      console.log('   ✗ Could not get raw MCP client');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log('='.repeat(60));
    console.log(`Tools:     ${tools.length} available (auto-integrated with LangChain)`);
    console.log(`Resources: ${serverResources.length} available (via listResources/readResource)`);

    const mcpClientForSummary = await client.getClient('ragmonsters');
    if (mcpClientForSummary) {
      const promptsResult = await mcpClientForSummary.listPrompts();
      console.log(`Prompts:   ${promptsResult.prompts?.length || 0} available (via raw MCP client)`);
    }

    console.log('\nConclusion:');
    console.log('- Tools: ✓ Fully supported by MultiServerMCPClient');
    console.log('- Resources: ✓ Supported via listResources() and readResource()');
    console.log('- Prompts: ⚠ Requires getClient() to access raw MCP client');

  } catch (error) {
    console.error('\nError:', error.message);
    console.error(error.stack);
  } finally {
    // Close the connection
    console.log('\nClosing connection...');
    await client.close();
    console.log('Done.');
  }
}

testMcpCapabilities();
