import express from "express";
import { protect, isAdmin } from "../middlewares/authmiddleware.js";
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  seedVehiclesFromTransports,
  getVehiclePerformance,
  getVehicleDetails,
} from "../controllers/vehicleController.js";

const router = express.Router();

router.use(protect);

// List vehicles (any authenticated user)
router.get("/", listVehicles);
router.get("/performance", getVehiclePerformance);
router.get("/:id", getVehicleDetails);

// Admin-only management
router.post("/seed-from-transports", isAdmin, seedVehiclesFromTransports);
router.post("/", isAdmin, createVehicle);
router.put("/:id", isAdmin, updateVehicle);
router.delete("/:id", isAdmin, deleteVehicle);

export default router;
