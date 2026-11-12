import express from "express";
import Party from "../models/Party.js";
import { protect, isAdmin } from "../middlewares/authmiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/", isAdmin, async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ message: "Party name is required" });
  res.status(201).json(await Party.create({ ...req.body, name }));
});
router.get("/", async (_, res) => res.json(await Party.find()));


export default router;
