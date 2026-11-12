import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Ensure MONGO_URI is set in your .env file
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: process.env.NODE_ENV !== "production",
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
};
export default connectDB;
