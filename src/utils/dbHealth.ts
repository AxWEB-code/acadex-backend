// src/utils/dbHealth.ts
import prisma from "../prisma";

export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Optional: Add connection monitoring
export async function monitorConnectionPool() {
  try {
    const result = await prisma.$queryRaw<[{ current_connections: string, max_connections: string }]>`
      SELECT 
        count(*) as current_connections,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_activity 
      WHERE datname = current_database();
    `;
    
    console.log('📊 Connection Pool Stats:', {
      current: result[0]?.current_connections,
      max: result[0]?.max_connections
    });
    
    return result[0];
  } catch (error) {
    console.error('Error monitoring connection pool:', error);
    return null;
  }
}