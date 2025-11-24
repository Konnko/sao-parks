import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  try {
    // Drop all tables
    await sql`DROP TABLE IF EXISTS facilities CASCADE`;
    await sql`DROP TABLE IF EXISTS parks CASCADE`;
    await sql`DROP TABLE IF EXISTS districts CASCADE`;
    await sql`DROP TYPE IF EXISTS "FacilityType" CASCADE`;
    
    console.log('Dropped all tables');
    
    // Recreate everything from scratch
    await sql`
      CREATE TYPE "FacilityType" AS ENUM (
        'SPORTS_PLAYGROUND',
        'CHILD_PLAYGROUND',
        'NTO',
        'TOILET',
        'CHILL',
        'CHILDREN_ROOM'
      )
    `;
    
    await sql`
      CREATE TABLE districts (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        geometry JSON,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await sql`
      CREATE TABLE parks (
        id SERIAL PRIMARY KEY,
        name TEXT,
        description TEXT,
        geometry JSON,
        area DOUBLE PRECISION,
        balance_holder TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        district_id INTEGER REFERENCES districts(id)
      )
    `;
    
    await sql`CREATE INDEX parks_district_id_idx ON parks(district_id)`;
    
    await sql`
      CREATE TABLE facilities (
        id SERIAL PRIMARY KEY,
        external_id TEXT,
        name TEXT,
        type "FacilityType",
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        photo TEXT,
        description TEXT,
        area TEXT,
        maf_count INTEGER,
        type_coverage TEXT,
        contract_action TEXT,
        contract_with TEXT,
        contract_term DATERANGE,
        park_id INTEGER REFERENCES parks(id),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await sql`CREATE INDEX facilities_park_id_idx ON facilities(park_id)`;
    await sql`CREATE INDEX facilities_type_idx ON facilities(type)`;
    
    console.log('Migration successful! Database recreated with fresh schema.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
