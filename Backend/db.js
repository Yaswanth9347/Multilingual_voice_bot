const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,  
  user: process.env.DB_USER,  
  password: process.env.DB_PASS,  
  database: process.env.DB_NAME,  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Connected to MySQL Database!");
    connection.release();
  }
});

module.exports = pool;
