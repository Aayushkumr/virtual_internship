require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/mentorship_platform', // Replace with your local DB connection string if different
  JWT_SECRET: process.env.JWT_SECRET || '$2b$10$tyvakNAhk3B0GQ63ptqe0u2eu5NNVX5GFhlPZzeHz6k3yii7KpLXy',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-very-strong-jwt-refresh-secret',
  // Add other configurations here
};