import "./config/env.js"; // validates env first, exits if invalid
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import postsRoutes from "./routes/posts.routes.js";
import usersRoutes from "./routes/users.routes.js";
import channelsRoutes from "./routes/channels.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();

//security
app.use(helmet());
app.set("trust proxy", 1);

//cors
const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
            cb(new Error(`CORS: ${origin} not allowed`));
        },
        credentials: true,
    })
);

//rate limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10,
    message: { error: "Too many login attempts. Try again in 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 120,
    message: { error: "Rate limit exceeded." },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json({ limit: "10kb" }));

// request logging
app.use(requestLogger);


app.get("/health", (req, res) => res.json({ status: "ok", env: env.NODE_ENV }));


app.use("/api/admin", apiLimiter);
app.use("/api/admin/login", loginLimiter, authRoutes);
app.use("/api/admin/posts", postsRoutes);
app.use("/api/admin/users", usersRoutes);
app.use("/api/admin/channels", channelsRoutes);
app.use("/api/admin/analytics", analyticsRoutes);

app.use(notFound);
app.use(errorHandler);


app.listen(env.PORT, () => {
    logger.info(`CampusX admin API running on port ${env.PORT} [${env.NODE_ENV}]`);
});