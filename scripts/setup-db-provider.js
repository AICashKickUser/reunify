#!/usr/bin/env node
/**
 * Dynamically sets the Prisma database provider based on DATABASE_URL.
 * - If DATABASE_URL starts with "file:", sets provider to "sqlite"
 * - If DATABASE_URL starts with "postgresql://" or "postgres://", sets provider to "postgresql"
 * 
 * This allows the same codebase to work with both local SQLite and Vercel PostgreSQL.
 */

const fs = require('fs')
const path = require('path')

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
const dbUrl = process.env.DATABASE_URL || ''

let provider = 'sqlite' // default
if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  provider = 'postgresql'
}

console.log(`Setting Prisma provider to "${provider}" based on DATABASE_URL: ${dbUrl.substring(0, 30)}...`)

let schema = fs.readFileSync(schemaPath, 'utf8')
schema = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${provider}"`
)
fs.writeFileSync(schemaPath, schema)

console.log(`Prisma schema updated successfully.`)
