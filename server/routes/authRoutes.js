import express from "express";
import { login, register, me } from "../controllers/authController.js";
import { protect, isAdmin } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", protect, isAdmin, register);
// GET /api/auth/me - return current user's profile (requires auth)
router.get("/me", protect, me);

export default router;
