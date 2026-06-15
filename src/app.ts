import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { redisClient } from "./app/config/redis.config";
import { envVars } from "./app/config/env";
import router from "./app/routes";

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));
app.use(cookieParser());
app.use(morgan("dev", {
    skip: (req) => req.originalUrl.includes("socket.io")
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: envVars.EXPRESS_SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
}));

// Root health-check route
app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
});

// API routes
app.use("/api/v1", router);

// 404 handler — must come AFTER routes
app.use(notFound);

// Global error handler — must be LAST
app.use(globalErrorHandler);

export default app;
