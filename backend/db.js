import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Utilisation de la chaîne de connexion unique fournie par Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Requis par Neon pour sécuriser la connexion TLS/SSL dans le Cloud
    rejectUnauthorized: false 
  }
});

export default pool;