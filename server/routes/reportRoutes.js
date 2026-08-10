import express from "express";
import Transport from "../models/Transport.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/party/:name", async (req, res) => {
  res.json(await Transport.find({ partyName: req.params.name }));
});

router.get("/trips/options", async (req, res) => {
  try {
    const [transportName, partyName, company, location] = await Promise.all([
      col.distinct("transportName"),
      col.distinct("partyName"),
      col.distinct("company"),
      col.distinct("location"),
    ]);
    res.json({
      transportName: transportName.sort(),
      partyName: partyName.sort(),
      company: company.sort(),
      location: location.sort(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load filter options" });
  }
});

router.get("/api/filtered-trips", async (req, res) => {
  try {
    const {
      search, dateFrom, dateTo, transportName, partyName,
      company, location, amountMin, amountMax, balanceStatus,
      missingBank, page = 1, pageSize = 25,
      sortBy = "date", sortDir = "desc",
    } = req.query;
 
    const query = {};
 
    if (search) {
      const re = new RegExp(search.trim(), "i");
      const asNumber = Number(search);
      query.$or = [
        { vehicleNo: re },
        { lrNo: re },
        ...(Number.isNaN(asNumber) ? [] : [{ freightMemoNo: asNumber }]),
      ];
    }
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo + "T23:59:59");
    }
    if (transportName) query.transportName = transportName;
    if (partyName) query.partyName = partyName;
    if (company) query.company = company;
    if (location) query.location = location;
    if (amountMin || amountMax) {
      query.totalAmount = {};
      if (amountMin) query.totalAmount.$gte = Number(amountMin);
      if (amountMax) query.totalAmount.$lte = Number(amountMax);
    }
    if (balanceStatus === "due") query.balance = { $gt: 0 };
    if (balanceStatus === "paid") query.balance = { $lte: 0 };
    if (missingBank === "true") query.bankAccount = "";
 
    const pageNum = Math.max(1, Number(page));
    const size = Math.max(1, Number(pageSize));
 
    const sortFields = { date: "date", freightMemoNo: "freightMemoNo" };
    const sortField = sortFields[sortBy] || "date";
    const dir = sortDir === "asc" ? 1 : -1;
    const sortSpec = { [sortField]: dir, freightMemoNo: dir };
 
    const [records, total] = await Promise.all([
      col.find(query).sort(sortSpec)
        .skip((pageNum - 1) * size).limit(size).toArray(),
      col.countDocuments(query),
    ]);
 
    res.json({ records, total, page: pageNum, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});
 

export default router;
