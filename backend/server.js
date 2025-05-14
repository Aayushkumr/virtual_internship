const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { PORT } = require('./config');
const db = require('./config/db'); // To initialize the pool and potentially test connection

// Import routes
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profiles.routes');
const requestRoutes = require('./routes/requests.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler.middleware');

const app = express();

// Middleware
// Define allowed origins
const allowedOrigins = [
  'http://localhost:8080', // Your previous setting
  'http://127.0.0.1:8080'  // Add the 127.0.0.1 origin
];

// Configure CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // This is important for cookies
}));

app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(cookieParser()); // Add cookie-parser middleware

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/requests', requestRoutes);

// Root route for basic testing
app.get('/', (req, res) => {
  res.send('MentorMatch API is running!');
});

// Centralized Error Handling
app.use(errorHandler);

// Start server and test DB connection
const startServer = async () => {
  try {
    // Test the database connection
    await db.query('SELECT NOW()');
    console.log('Database connected successfully.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1); // Exit if DB connection fails
  }
};

startServer();