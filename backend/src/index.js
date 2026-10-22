import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/dbConnection.js";
import authRoutes from "./routes/auth.js";
import artisanRoutes from "./routes/artisan.js";
import adminRoutes from "./routes/admin.js";
import usersRoutes from "./routes/users.js";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "10kb" }));
app.use(morgan("dev"));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/", (req, res) => {
  res.send("Welcome to my Backend Server");
});

app.use("/api/v1", apiLimiter);
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/artisan", artisanRoutes)
app.use("/api/v1/admin", adminRoutes)
app.use("/api/v1/users", usersRoutes)

app.use((req, res) => {
    return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Route not found",
    });
});


const PORT = process.env.PORT || 5000;
const start = async () => {
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing in environment");
        process.exit(1);
    }
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
        console.error("MONGODB_URI (or MONGO_URI) is missing in environment");
        process.exit(1);
    }
    await connectDB(); // Connect to MongoDB before accepting traffic
    app.listen(PORT, () => {
        console.log(`Server is running on ${PORT}`);
    });
};

if (process.env.NODE_ENV !== "test") {
    start();
}

export default app;
