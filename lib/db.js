import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const response = await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (err) {
        console.error("Error connecting to MongoDb", err.message);
        process.exit(1);
    }
};
