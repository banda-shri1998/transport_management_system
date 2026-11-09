import express from "express";
import { protect, isAdmin } from "../middlewares/authmiddleware.js";
import { getOutstanding, listPayments, recordPayment } from "../controllers/paymentController.js";

const router = express.Router();
router.use(protect);
router.get("/outstanding", getOutstanding);
router.get("/", listPayments);
router.post("/", isAdmin, recordPayment);
export default router;
