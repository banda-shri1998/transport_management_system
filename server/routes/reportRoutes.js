import express from "express";
import Transport from "../models/Transport.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();
router.use(protect);

const normalizeLrNoForSearch = (value) => {
  if (value === undefined || value === null || value === "") return [];

  const rawValue = String(value).trim();
  if (!rawValue) return [];

  if (rawValue.includes("/")) {
    const [base, ...suffixes] = rawValue.split("/").map((part) => part.trim());
    const baseNum = Number(base);
    if (!Number.isFinite(baseNum) || !Number.isInteger(baseNum)) return [];

    const result = [baseNum];
    for (const suffix of suffixes) {
      if (!suffix) continue;
      const suffixLen = String(suffix).length;
      const modulus = Math.pow(10, suffixLen);
      const targetSuffix = Number(suffix);
      if (!Number.isFinite(targetSuffix)) continue;

      let basePrefix = Math.floor(baseNum / modulus);
      let candidate = basePrefix * modulus + targetSuffix;

      if (candidate < baseNum) {
        candidate = (basePrefix + 1) * modulus + targetSuffix;
      }

      result.push(candidate);
    }

    return result;
  }

  const values = rawValue
    .split(/[|,]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && Number.isInteger(item));

  return values.length > 0
    ? values
    : [Number(rawValue)].filter(
        (item) => Number.isFinite(item) && Number.isInteger(item),
      );
};

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
      search,
      dateFrom,
      dateTo,
      transportName,
      partyName,
      company,
      location,
      amountMin,
      amountMax,
      balanceStatus,
      missingBank,
      page = 1,
      pageSize = 25,
      sortBy = "date",
      sortDir = "⬆️",
    } = req.query;

    const query = {};

    if (search) {
      const trimmedSearch = String(search).trim();
      const re = new RegExp(trimmedSearch, "i");
      const asNumber = Number(trimmedSearch);
      const lrNoValues = normalizeLrNoForSearch(trimmedSearch);

      query.$or = [
        { vehicleNo: re },
        ...(lrNoValues.length > 0 ? [{ lrNo: { $in: lrNoValues } }] : []),
        ...(Number.isFinite(asNumber) ? [{ freightMemoNo: asNumber }] : []),
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
      col
        .find(query)
        .sort(sortSpec)
        .skip((pageNum - 1) * size)
        .limit(size)
        .toArray(),
      col.countDocuments(query),
    ]);

    res.json({
      records,
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.max(1, Math.ceil(total / size)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

export default router;
