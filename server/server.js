import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import Cancelled from "./models/Cancelled.js";

import authRoutes from "./routes/authRoutes.js";
import transportRoutes from "./routes/transportRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import partyRoutes from "./routes/partyRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "https://suyog-transport-co.vercel.app,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        const error = new Error("Not allowed by CORS");
        error.status = 403;
        callback(error);
      }
    },
    credentials: true,
  }),
);
app.use(
  express.json({
    limit: "50mb",
  }),
);
app.use("/api/auth", authRoutes);
app.use("/api/transports", transportRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/parties", partyRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (_, res) => res.send("Transport API running"));
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.MONGO_URI || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("MONGO_URI and a JWT_SECRET of at least 32 characters must be configured");
    }
    await connectDB();
    const collectionExists = await Cancelled.db.db
      .listCollections({ name: Cancelled.collection.collectionName })
      .hasNext();
    if (!collectionExists) {
      await Cancelled.createCollection();
    }
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (error) {
    console.error(`Server startup aborted: ${error.message}`);
    process.exit(1);
  }
};
startServer();
