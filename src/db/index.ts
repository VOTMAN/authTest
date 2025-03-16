import { configDotenv } from "dotenv";
configDotenv()

// import postgres from "postgres";
// export const sql = postgres(process.env.DATABASE_URL as string)

import pg from "pg";
const { Client } = pg
export const db = new Client({
  connectionString: process.env.DATABASE_URL,
})
