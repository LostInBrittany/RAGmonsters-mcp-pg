/**
 * Database utility functions for the MCP server
 */
import logger from './logger.js';

/**
 * Execute a database query
 * @param {Object} pool - Database connection pool
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export async function executeQuery(pool, query, params = []) {
  logger.debug(`Executing query: ${query.trim().replace(/\s+/g, ' ')}`);
  logger.debug(`Query params: ${JSON.stringify(params)}`);
  
  let client;
  try {
    logger.debug('Getting connection from pool');
    client = await pool.connect();
    logger.debug('Connection acquired');
    
    const startTime = Date.now();
    const result = await client.query(query, params);
    const duration = Date.now() - startTime;
    
    logger.debug(`Query executed in ${duration}ms, returned ${result.rows.length} rows`);
    return result.rows;
  } catch (error) {
    logger.error(`Database query error: ${error.message}`);
    logger.error(error.stack);
    throw error;
  } finally {
    if (client) {
      logger.debug('Releasing connection back to pool');
      client.release();
    }
  }
};

/**
 * Execute a transaction with multiple queries
 * @param {Object} pool - PostgreSQL connection pool
 * @param {Function} callback - Callback function that receives a client and executes queries
 * @returns {Promise<any>} Transaction result
 */
export const executeTransaction = async (pool, callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get database schema information
 * @param {Object} pool - PostgreSQL connection pool
 * @returns {Promise<Object>} Database schema information
 */
export const getDatabaseSchema = async (pool) => {
  const tablesQuery = `
    SELECT 
      table_name,
      table_schema
    FROM 
      information_schema.tables
    WHERE 
      table_schema NOT IN ('pg_catalog', 'information_schema')
      AND table_type = 'BASE TABLE'
    ORDER BY 
      table_schema, table_name;
  `;
  
  const tables = await executeQuery(pool, tablesQuery);
  
  const schema = {};
  
  for (const table of tables) {
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type,
        is_nullable,
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_schema = $1
        AND table_name = $2
      ORDER BY 
        ordinal_position;
    `;
    
    const columns = await executeQuery(
      pool, 
      columnsQuery, 
      [table.table_schema, table.table_name]
    );
    
    const tableName = table.table_name;
    schema[tableName] = columns.map(col => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES',
      default: col.column_default
    }));
  }
  
  return schema;
};

/**
 * Check database health
 * @param {Object} pool - PostgreSQL connection pool
 * @returns {Promise<boolean>} True if database is healthy
 */
export const checkDatabaseHealth = async (pool) => {
  try {
    const result = await executeQuery(pool, 'SELECT 1');
    return result.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};
