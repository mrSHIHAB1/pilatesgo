import "dotenv/config";
import app from "./app";
import prisma from "./app/shared/prisma";
import { connectRedis, redisClient } from "./app/config/redis.config";

// ============================================
// CONFIG
// ============================================
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

let server: import("http").Server;

// ============================================
// DATABASE CONNECTION CHECK
// ============================================
const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✓ Database connection successful");
    return true;
  } catch (error) {
    console.error("✗ Database connection failed:", error);
    return false;
  }
};

// ============================================
// SERVER STARTUP
// ============================================
const startServer = async () => {
  try {
    const isDBConnected = await checkDatabaseConnection();
    if (!isDBConnected) {
      throw new Error("Cannot start server without database connection");
    }

    // Connect Redis
    await connectRedis();
    console.log("✓ Redis connection successful");

    const http = await import("http");
    server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`✓ Server started successfully`);
      console.log(`  Environment: ${NODE_ENV}`);
      console.log(`  Listening on: http://localhost:${PORT}`);
 
    });

    server.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      }
      console.error("Server error:", error);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} signal received: closing HTTP server`);

  if (server) {
    server.close(async () => {
      console.log("HTTP server closed");
      try {
        await prisma.$disconnect();
        console.log("Database connection closed");
      } catch (error) {
        console.error("Error closing database connection:", error);
      }

      try {
        await redisClient.quit();
        console.log("Redis connection closed");
      } catch (error) {
        console.error("Error closing Redis connection:", error);
      }

      console.log("Server shutdown complete");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forced shutdown - timeout exceeded");
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// ============================================
// PROCESS ERROR HANDLERS
// ============================================
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// ============================================
// START SERVER
// ============================================
startServer();