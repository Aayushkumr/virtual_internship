const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

if (!connectionString) { // Check if DATABASE_URL is set at all
  console.error("FATAL ERROR: DATABASE_URL is not set.");
  // For local development, you might want to allow it to proceed if you have a local .env
  // For production (like on Vercel), this should ideally cause a failure if not set.
  if (isProduction) {
    // process.exit(1); // Or handle more gracefully depending on your setup
  }
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // For Supabase, you might not need rejectUnauthorized: false if their certs are standard.
  // Often, just `ssl: isProduction` is enough, or `ssl: { rejectUnauthorized: true }` if you have the CA cert.
  // Start with `ssl: isProduction ? { rejectUnauthorized: false } : false` for broader compatibility.
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database via Supabase (or local)!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};