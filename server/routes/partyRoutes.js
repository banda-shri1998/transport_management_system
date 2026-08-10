import express from "express";
import Party from "../models/Party.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();
router.use(protect);

router.post("/", async (req, res) => res.json(await Party.create(req.body)));
router.get("/", async (_, res) => res.json(await Party.find()));


export default router;
