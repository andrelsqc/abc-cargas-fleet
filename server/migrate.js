import 'dotenv/config';
import fs from 'node:fs/promises';
import { pool,tx } from './db.js';
try {
 const base=await fs.readFile(new URL('../db/schema.sql',import.meta.url),'utf8');
 const upgrade=await fs.readFile(new URL('../db/upgrade-v2.sql',import.meta.url),'utf8');
 await tx(async c=>{
  await c.query('SELECT pg_advisory_xact_lock(882730)');
  await c.query(base);
  await c.query('CREATE TABLE IF NOT EXISTS fleet_schema_migrations(code TEXT PRIMARY KEY,applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  const prior=await c.query('SELECT code FROM fleet_schema_migrations WHERE code=$1',['fleet-v2']);
  if(!prior.rows.length){await c.query(upgrade);await c.query('INSERT INTO fleet_schema_migrations(code) VALUES($1)',['fleet-v2']);}
  const v3=await c.query('SELECT code FROM fleet_schema_migrations WHERE code=$1',['fleet-v3']);
  if(!v3.rows.length){await c.query(await fs.readFile(new URL('../db/upgrade-v3.sql',import.meta.url),'utf8'));await c.query('INSERT INTO fleet_schema_migrations(code) VALUES($1)',['fleet-v3']);}
  const v4=await c.query('SELECT code FROM fleet_schema_migrations WHERE code=$1',['fleet-v4']);
  if(!v4.rows.length){await c.query(await fs.readFile(new URL('../db/upgrade-v4.sql',import.meta.url),'utf8'));await c.query('INSERT INTO fleet_schema_migrations(code) VALUES($1)',['fleet-v4']);}
 });
 console.log('Database schema ready; existing records preserved.');
} finally {await pool.end();}
