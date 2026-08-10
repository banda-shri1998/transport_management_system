import express from "express";
import {
  createTransport,
  getTransports,
  updateTransport,
  deleteTransport,
  getTransportById,
  importTransports,
  markRecordsPaid,
  searchTransports,
  getFilterOptions,
} from "../controllers/transportController.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/filter-options", getFilterOptions);
router.get("/search", searchTransports);
router.post("/import", importTransports);

router.put("/mark-paid", markRecordsPaid);

router.get("/", getTransports);

router.post("/", createTransport);

router.get("/:id", getTransportById);

router.put("/:id", updateTransport);

router.delete("/:id", deleteTransport);
export default router;
