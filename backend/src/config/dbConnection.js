import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.log("Error connecting to MongoDB:", error);
        process.exit(1); // Exit the process with an error code
    }
};