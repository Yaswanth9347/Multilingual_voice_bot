const db = require("./db");

async function testDB() {
    try {
        const [rows] = await db.query("SELECT 1");
        console.log("✅ Database Connection Successful!", rows);
    } catch (error) {
        console.error("❌ Database Connection Failed:", error.message);
    }
}

testDB();
