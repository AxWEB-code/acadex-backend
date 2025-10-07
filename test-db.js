// test-db.js (CommonJS)
const { Client } = require("pg");
require("dotenv").config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    await client.connect();
    console.log("✅ Connected successfully to Supabase!");
    const res = await client.query("SELECT NOW()");
    console.log(res.rows[0]);
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  } finally {
    await client.end();
  }
}

main();
