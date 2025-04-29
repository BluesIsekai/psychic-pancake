const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '********' : 'not set');
console.log('DB_NAME:', process.env.DB_NAME);

// Fallback to hardcoded credentials if env vars are not available
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ypur_password',
  database: process.env.DB_NAME || 'login_app'
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Create database pool for better performance
let pool;

async function initDatabase() {
  try {
    console.log('Connecting to MySQL with:', {
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password ? '********' : 'not set'
    });
    
    // First connect without database to create it if needed
    const initialConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });

    console.log('Initial connection successful');
    const dbName = dbConfig.database;
    
    // Create database and tables
    await initialConnection.query(`
      CREATE DATABASE IF NOT EXISTS ${dbName};
      USE ${dbName};
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        password VARCHAR(255)
      );
    `);
    
    console.log(`Database '${dbName}' setup complete`);
    await initialConnection.end();
    
    // Create connection pool with the database
    pool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    console.log('Database connection pool created');
  } catch (err) {
    console.error('Database initialization error:', err);
    process.exit(1);
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hash]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?', 
      [username]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ success: true, username: rows[0].username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize database and start server
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});