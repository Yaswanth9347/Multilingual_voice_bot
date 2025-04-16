// server.js

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./db"); // Our non-promise pool from db.js
const MySQLStore = require("express-mysql-session")(session);
const axios = require("axios"); // For verifying Google tokens
require("dotenv").config();

const app = express();
app.use(express.json());

// Set the frontend URL; ensure it matches the URL your React app is served from
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
console.log("CORS origin set to:", FRONTEND_URL);

// Enable CORS to allow requests from the React app
app.use(
  cors({
    origin: FRONTEND_URL, // must match exactly (e.g., "http://localhost:3000")
    credentials: true,
  })
);

// --- Example: Using .promise() to run a simple query ---
db.promise()
  .query("SELECT 1 AS test")
  .then(([rows]) => {
    console.log("Example query result:", rows);
  })
  .catch((error) => {
    console.error("Query error:", error);
  });

// Ensure the temp_user table exists (for local development)
db.promise()
  .query(`
    CREATE TABLE IF NOT EXISTS temp_user (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    );
  `)
  .then(() => {
    console.log("temp_user table ensured.");
  })
  .catch((error) => {
    console.error("Error creating temp_user table:", error);
  });

// Set up MySQL-based session store
const sessionStore = new MySQLStore(
  {
    expiration: 1000 * 60 * 60, // 1 hour session expiration
    createDatabaseTable: true,
    schema: {
      tableName: "sessions",
      columnNames: {
        session_id: "session_id",
        expires: "expires",
        data: "data",
      },
    },
  },
  db
);

// Configure secure session settings
app.use(
  session({
    key: "session_cookie",
    secret: process.env.SESSION_SECRET || "your_secret_key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies only in production
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// --------- Authentication Endpoints (Simplified) ---------

// Check session endpoint
app.get("/session", (req, res) => {
  if (req.session.username) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// Traditional login endpoint
app.post("/login", async (req, res) => {
  // In a real application, validate and authenticate user credentials here.
  const { username, password } = req.body;
  // For brevity, we assume the credentials are valid.
  req.session.username = username; // Store session info
  res.json({ success: true, message: "Login successful!" });
});

// Register endpoint
app.post("/register", async (req, res) => {
  // In a real application, validate input, hash password, and insert user into DB.
  // This simplified version always returns success.
  res.json("Registration successful");
});

// Logout endpoint
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err)
      return res
        .status(500)
        .json({ success: false, message: "Logout failed" });
    res.json({ success: true, message: "Logged out successfully" });
  });
});

// --------- Google OAuth Endpoint ---------
// This endpoint handles Google OAuth verification and session creation.
app.post("/auth/google", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: "No token provided" });
  }
  try {
    // Verify the token with Google
    const googleResponse = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );
    const googleData = googleResponse.data;
    const email = googleData.email;
    if (!email) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }
    // Check if user already exists
    const [rows] = await db.promise().query("SELECT * FROM temp_user WHERE email = ?", [email]);
    if (rows.length === 0) {
      // If user doesn't exist, create a new record using email prefix as username
      const username = email.split('@')[0];
      const dummyPassword = "google_oauth_dummy"; // Placeholder password
      const hashedPassword = await bcrypt.hash(dummyPassword, 10);
      await db.promise().query(
        "INSERT INTO temp_user (email, username, password) VALUES (?, ?, ?)",
        [email, username, hashedPassword]
      );
    }
    // Create session for the user
    req.session.username = email.split('@')[0];
    res.json({ success: true, message: "Google OAuth login successful!" });
  } catch (error) {
    console.error("Google OAuth error:", error.response ? error.response.data : error);
    res.status(400).json({ success: false, message: "Google OAuth login failed" });
  }
});

// Start the Node server on port 5001 (or PORT from environment)
const PORT = process.env.NODE_PORT || process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
