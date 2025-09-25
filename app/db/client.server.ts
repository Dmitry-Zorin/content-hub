import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

declare global {
	var __pg__: Pool | undefined

	var __db__: ReturnType<typeof drizzle> | undefined
}

const pool =
	global.__pg__ ?? new Pool({ connectionString: process.env.DATABASE_URL })
export const db = global.__db__ ?? drizzle(pool)

if (!global.__pg__) global.__pg__ = pool
if (!global.__db__) global.__db__ = db
