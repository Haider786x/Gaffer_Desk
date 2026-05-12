require("dotenv").config();

// ==================== Environment Validation ====================

const requiredEnvVars = ["MONGODB_URL", "JWT_SECRET"];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
  process.exit(1);
}

// Validate JWT_SECRET length
if (process.env.JWT_SECRET.length < 32) {
  console.error("❌ JWT_SECRET must be at least 32 characters long");
  process.exit(1);
}

// ==================== Server Startup ====================

const app = require("./app");
const db = require("./db/db");

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const startServer = async () => {
  try {
    // Connect to database
    console.log("📦 Connecting to MongoDB...");
    await db();

    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║      🎯 StatStriker API Server        ║
╠════════════════════════════════════════╣
║ Environment: ${NODE_ENV.padEnd(29)}║
║ Port: ${PORT.toString().padEnd(38)}║
║ Status: ✅ Running                     ║
╚════════════════════════════════════════╝
      `);
    });

    // Handle graceful shutdown
    process.on("SIGTERM", () => {
      console.log("📛 SIGTERM signal received: closing HTTP server");
      process.exit(0);
    });

    process.on("SIGINT", () => {
      console.log("📛 SIGINT signal received: closing HTTP server");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
