const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function createTables() {
  try {
    await client.connect();

    // Create User table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT,
        email TEXT UNIQUE,
        image TEXT,
        "emailVerified" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create Account table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Account" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
        type TEXT,
        provider TEXT,
        "providerAccountId" TEXT,
        "refresh_token" TEXT,
        "access_token" TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        "session_state" TEXT,
        UNIQUE(provider, "providerAccountId")
      );
    `);

    // Create Session table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Session" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "sessionToken" TEXT UNIQUE,
        "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
        expires TIMESTAMP
      );
    `);

    // Create VerificationToken table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        identifier TEXT,
        token TEXT UNIQUE,
        expires TIMESTAMP,
        PRIMARY KEY (identifier, token)
      );
    `);

    // Create Usuario table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Usuario" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
        "fullName" TEXT,
        "birthDate" DATE,
        cpf TEXT,
        whatsapp TEXT,
        "whatsappCountryCode" TEXT,
        "whatsappConsent" BOOLEAN DEFAULT FALSE,
        "isClient" BOOLEAN DEFAULT FALSE,
        "isStore" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create Address table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Address" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "usuarioId" TEXT REFERENCES "Usuario"(id) ON DELETE CASCADE,
        street TEXT,
        number TEXT,
        complement TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        "zipCode" TEXT,
        "isPrimary" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create Store table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Store" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
        name TEXT,
        description TEXT,
        cnpj TEXT,
        whatsapp TEXT,
        "whatsappCountryCode" TEXT,
        "whatsappConsent" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await client.end();
  }
}

createTables();
