import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import { connectDB } from "./config/dbConnection.js";
import authRoutes from "./routes/auth.js";
import artisanRoutes from "./routes/artisan.js"
import adminRoutes from "./routes/admin.js"
import usersRoutes from "./routes/users.js"

dotenv.config();
const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(morgan('dev'));

app.get("/", (req, res) => {
    res.send("Welcome to my Backend Server");
})

app.use("/api/v1/auth", authRoutes)
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
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
        console.error("MONGODB_URI (or MONGO_URI) is missing in environment");
        process.exit(1);
    }
    await connectDB(); // Connect to MongoDB before accepting traffic
    app.listen(PORT, () => {
        console.log(`Server is running on ${PORT}`);
    });
};

start();
