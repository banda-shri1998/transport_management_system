import express from "express";
import { protect, isAdmin } from "../middlewares/authmiddleware.js";
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  seedVehiclesFromTransports,
} from "../controllers/vehicleController.js";

const router = express.Router();

router.use(protect);

// List vehicles (any authenticated user)
router.get("/", listVehicles);

// Admin-only management
router.post("/seed-from-transports", isAdmin, seedVehiclesFromTransports);
router.post("/", isAdmin, createVehicle);
router.put("/:id", isAdmin, updateVehicle);
router.delete("/:id", isAdmin, deleteVehicle);

export default router;
