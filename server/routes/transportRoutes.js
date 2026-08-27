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
  getVehicleOptions,
} from "../controllers/transportController.js";
import { protect, isAdmin } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/filter-options", getFilterOptions);
router.get("/vehicle-options", getVehicleOptions);
router.get("/search", searchTransports);
// Import records - admin only
router.post("/import", isAdmin, importTransports);

// Mark paid - admin only
router.put("/mark-paid", isAdmin, markRecordsPaid);

router.get("/", getTransports);

// Create, update, delete - admin only
// Allow staff to create records but keep admin-only protections for update/delete/import/mark-paid
router.post("/", createTransport);
router.get("/:id", getTransportById);
router.put("/:id", isAdmin, updateTransport);
router.delete("/:id", isAdmin, deleteTransport);

export default router;
