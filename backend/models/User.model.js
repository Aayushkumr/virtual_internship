const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {};

User.create = async (email, password, role = 'mentee') => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  console.log(`Attempting to insert user: ${email}, Role: ${role}`); // DEBUG LOG
  try {
    const { rows } = await db.query(
      'INSERT INTO "Users" (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at, updated_at', // Changed to "Users"
      [email, passwordHash, role]
    );
    console.log(`Successfully inserted user: ${email}, ID: ${rows[0].id}`); // DEBUG LOG
    return rows[0];
  } catch (error) {
    console.error(`Error during insert for ${email}:`, error); // DEBUG LOG - Log the full error
    if (error.code === '23505') { 
      const uniqueError = new Error('User with this email already exists.');
      uniqueError.statusCode = 409; 
      throw uniqueError;
    }
    throw error; 
  }
};

User.findByEmail = async (email) => {
  try {
    const { rows } = await db.query('SELECT * FROM "Users" WHERE email = $1', [email]); // Changed to "Users"
    return rows[0];
  } catch (error) {
    throw error;
  }
};

User.findById = async (id) => {
  try {
    const { rows } = await db.query('SELECT id, email, role, created_at, updated_at FROM "Users" WHERE id = $1', [id]); // Changed to "Users"
    return rows[0];
  } catch (error) {
    throw error;
  }
};

// Method to compare passwords (useful for login)
User.comparePassword = async (candidatePassword, hash) => {
  return bcrypt.compare(candidatePassword, hash);
};

module.exports = User;