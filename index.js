require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { check, validationResult } = require('express-validator');
const connection = require('./service/db'); // Make sure this exports properly
const authentication = require('./routers/auth');
const project = require('./routers/project');
const sprint = require('./routers/sprint');
const issue = require('./routers/issue');
const subissue = require('./routers/subissue');
const { verifyToken } = require('./routers/auth');

// Initialize Express app
const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL, 
  'http://localhost:3000',
  'https://jiraclient.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Database connection (modified to handle non-promise returns)
try {
  const dbConnection = connection();
  if (dbConnection && typeof dbConnection.catch === 'function') {
    dbConnection.catch(err => {
      console.error('Database connection failed:', err);
      process.exit(1);
    });
  }
  console.log('Connecting to database...');
} catch (err) {
  console.error('Database connection error:', err);
}

// Log environment info
console.log('Running in', process.env.NODE_ENV || 'development');
console.log('Frontend URL:', process.env.FRONTEND_URL);

// Global error handling for validation
app.use((req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
});

// API Routes
app.use('/auth', authentication.router);
app.use('/api/project', verifyToken, project);
app.use('/api/sprint', verifyToken, sprint);
app.use('/api/issue', verifyToken, issue);
app.use('/api/subissue', verifyToken, subissue);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const __dirname1 = path.resolve();
  
  // Serve static files
  app.use(express.static(path.join(__dirname1, "client/build")));
  
  // Handle React routing
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname1, "client", "build", "index.html"));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Welcome to the Jira-like API (Development Mode)');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});

module.exports = app;
