import "dotenv/config";
import express from "express";
import cors from "cors";
import prisma from "./config/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.get("/", (req, res) => {
  res.json({
    message: "E-commerce Monolithic API",
  });
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "OK",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      database: "disconnected",
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`E-commerce API running on port ${PORT}`);
});