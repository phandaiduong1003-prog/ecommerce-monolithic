import express from "express";
import {
  createOrder,
  getOrderById,
} from "../controllers/order.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateToken, createOrder);
router.get("/:oid", authenticateToken, getOrderById);

export default router;