import Transport from "../models/Transport.js";
import Vehicle from "../models/Vehicle.js";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isNullOrEmptyVal = (val) => {
  if (val === null || val === undefined) return true;
  const str = String(val).trim().toLowerCase();
  return str === "" || str === "null" || str === "undefined";
};

const parseDate = (val) => {
  if (val === null || val === undefined) return undefined;

  if (val instanceof Date) {
    return isNaN(val.getTime()) ? undefined : val;
  }

  const str = String(val).trim();
  if (
    str.toLowerCase() === "null" ||
    str.toLowerCase() === "undefined" ||
    str === ""
  ) {
    return undefined;
  }

  // Try matching DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed month
    const year = parseInt(dmyMatch[3], 10);
    const date = new Date(year, month, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeLrNo = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter((item) => !isNullOrEmptyVal(item));
  }

  if (typeof value === "string") {
    return value
      .split("|")
      .map((item) => item.trim())
      .filter((item) => !isNullOrEmptyVal(item));
  }

  return [];
};

const normalizeFreightMemoNo = (value) => {
  if (isNullOrEmptyVal(value)) return undefined;
  const parsed = Number(String(value).trim());
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return undefined;
  return parsed;
};

const getDuplicateKey = (record) =>
  normalizeFreightMemoNo(record.freightMemoNo);

const formatDuplicateRecord = (record, index, reason) => ({
  row: index + 2,
  freightMemoNo: record.freightMemoNo,
  reason,
});

export const searchTransports = async (req, res) => {
  try {
    let {
      transporter,
      date,
      freightMemoNo,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      balanceStatus,
      partyName,
      transportName,
      company,
      location,
      search,
      sortBy = "date",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    page = Number(page);
    limit = Number(limit);

    const query = {};

    // Handle search parameter (for vehicle, LR no, or freight memo)
    if (search) {
      const re = new RegExp(search.trim(), "i");
      const asNumber = Number(search);
      query.$or = [
        { vehicleNo: re },
        { lrNo: { $in: [re] } },
        ...(Number.isFinite(asNumber) ? [{ freightMemoNo: asNumber }] : []),
      ];
    }

    // Handle transporter (legacy parameter)
    if (transporter) {
      query.transportName = {
        $regex: transporter,
        $options: "i",
      };
    }

    const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Helper to normalize multi-valued filter param (accepts arrays, comma-separated strings, or single value)
    const normalizeFilterParts = (val) => {
      if (!val && val !== 0) return [];
      if (Array.isArray(val))
        return val.map((p) => String(p).trim()).filter(Boolean);
      const str = String(val);
      return str
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    };

    // Handle transportName (supports array or comma-separated multi-values)
    const transportParts = normalizeFilterParts(transportName);
    if (transportParts.length === 1) {
      query.transportName = { $regex: transportParts[0], $options: "i" };
    } else if (transportParts.length > 1) {
      const ors = transportParts.map((v) => ({
        transportName: { $regex: `^${escapeRegex(v)}$`, $options: "i" },
      }));
      query.$and = query.$and || [];
      query.$and.push({ $or: ors });
    }

    // Handle partyName (multi-value)
    const partyParts = normalizeFilterParts(partyName);
    if (partyParts.length === 1) {
      query.partyName = { $regex: partyParts[0], $options: "i" };
    } else if (partyParts.length > 1) {
      const ors = partyParts.map((v) => ({
        partyName: { $regex: `^${escapeRegex(v)}$`, $options: "i" },
      }));
      query.$and = query.$and || [];
      query.$and.push({ $or: ors });
    }

    // Handle company (multi-value)
    const companyParts = normalizeFilterParts(company);
    if (companyParts.length === 1) {
      query.company = { $regex: companyParts[0], $options: "i" };
    } else if (companyParts.length > 1) {
      const ors = companyParts.map((v) => ({
        company: { $regex: `^${escapeRegex(v)}$`, $options: "i" },
      }));
      query.$and = query.$and || [];
      query.$and.push({ $or: ors });
    }

    // Handle location (multi-value)
    const locationParts = normalizeFilterParts(location);
    if (locationParts.length === 1) {
      query.location = { $regex: locationParts[0], $options: "i" };
    } else if (locationParts.length > 1) {
      const ors = locationParts.map((v) => ({
        location: { $regex: `^${escapeRegex(v)}$`, $options: "i" },
      }));
      query.$and = query.$and || [];
      query.$and.push({ $or: ors });
    }

    // Handle freightMemoNo (legacy parameter)
    if (
      freightMemoNo !== undefined &&
      freightMemoNo !== null &&
      freightMemoNo !== ""
    ) {
      const memoNo = normalizeFreightMemoNo(freightMemoNo);
      if (memoNo !== undefined) {
        query.freightMemoNo = memoNo;
      }
    }

    // Handle date range
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) {
        const start = new Date(dateFrom);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Handle single date (legacy parameter)
    if (date && !dateFrom && !dateTo) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      query.date = {
        $gte: start,
        $lte: end,
      };
    }

    // Handle amount range
    if (amountMin || amountMax) {
      query.totalAmount = {};
      if (amountMin) query.totalAmount.$gte = Number(amountMin);
      if (amountMax) query.totalAmount.$lte = Number(amountMax);
    }

    // Handle balance status
    if (balanceStatus === "due") {
      query.balance = { $gt: 0 };
    } else if (balanceStatus === "paid") {
      query.balance = { $lte: 0 };
    }

    const [totalRecords, summaryResult] = await Promise.all([
      Transport.countDocuments(query),
      Transport.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalFreight: { $sum: { $ifNull: ["$totalAmount", 0] } },
            totalAdvance: { $sum: { $ifNull: ["$advancePaid", 0] } },
            totalFuel: { $sum: { $ifNull: ["$fuelExpense", 0] } },
          },
        },
      ]),
    ]);

    const allowedSortFields = new Set(["date", "freightMemoNo"]);
    const sortField = allowedSortFields.has(sortBy) ? sortBy : "date";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const records = await Transport.find(query)
      .sort({ [sortField]: sortDirection, _id: 1 })
      .collation({ locale: "en", numericOrdering: true })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      records,
      summary: {
        totalFreight: summaryResult[0]?.totalFreight || 0,
        totalAdvance: summaryResult[0]?.totalAdvance || 0,
        totalFuel: summaryResult[0]?.totalFuel || 0,
      },
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const normalizeTransportPayload = (payload, options = {}) => {
  // Helper to get clean value: returns undefined if null/empty/"null"
  const cleanVal = (val) => (isNullOrEmptyVal(val) ? undefined : val);

  // Clean values for string and date fields
  const date = parseDate(payload.date);
  const transportName = cleanVal(payload.transportName);
  const freightMemoNo = normalizeFreightMemoNo(payload.freightMemoNo);
  const lrNo = normalizeLrNo(payload.lrNo);
  const vehicleNo = cleanVal(payload.vehicleNo);
  const partyName = cleanVal(payload.partyName);
  const company = isNullOrEmptyVal(payload.company)
    ? ""
    : String(payload.company).trim();
  const location = isNullOrEmptyVal(payload.location)
    ? ""
    : String(payload.location).trim();
  const fuelType = isNullOrEmptyVal(payload.fuelType)
    ? "Diesel"
    : String(payload.fuelType).trim();

  // Numeric fields
  const quantity = toNumber(payload.quantity);
  const rate = toNumber(payload.rate);
  const advancePaid = toNumber(payload.advancePaid);
  const fuelRate = toNumber(payload.fuelRate, 0);
  const fuelQuantity = toNumber(payload.fuelQuantity);

  const fuelExpense = !isNullOrEmptyVal(payload.fuelExpense)
    ? toNumber(payload.fuelExpense)
    : fuelRate * fuelQuantity;

  const totalAmount = !isNullOrEmptyVal(payload.totalAmount)
    ? toNumber(payload.totalAmount)
    : quantity * rate;

  const payAmount =
    options.allowPaymentFields && !isNullOrEmptyVal(payload.payAmount)
      ? toNumber(payload.payAmount)
      : 0;

  const previousClosingBalance = toNumber(payload.previousClosingBalance);

  const normalized = {
    date,
    transportName,
    freightMemoNo,
    lrNo,
    vehicleNo,
    partyName,
    company,
    location,
    quantity,
    rate,
    totalAmount,
    advancePaid,
    fuelType,
    fuelRate,
    fuelQuantity,
    fuelExpense,
    balance: totalAmount - advancePaid - fuelExpense - payAmount,
    previousClosingBalance,
  };

  if (options.allowPaymentFields) {
    normalized.paymentDate = parseDate(payload.paymentDate);
    normalized.payAmount = payAmount;
  }

  return normalized;
};

export const createTransport = async (req, res) => {
  try {
    const normalized = normalizeTransportPayload(req.body, {
      allowPaymentFields: false,
    });
    const duplicateKey = getDuplicateKey(normalized);

    if (duplicateKey !== undefined) {
      const existingMemo = await Transport.findOne({
        freightMemoNo: duplicateKey,
      }).lean();

      if (existingMemo) {
        return res.status(409).json({
          success: false,
          message: `Freight Memo No ${duplicateKey} already exists.`,
          duplicate: {
            freightMemoNo: duplicateKey,
            id: existingMemo._id,
          },
        });
      }
    }

    const record = await Transport.create(normalized);
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const importTransports = async (req, res) => {
  try {
    if (!Array.isArray(req.body.records) || req.body.records.length === 0) {
      return res
        .status(400)
        .json({ message: "No records provided for import" });
    }

    const invalidRecords = [];
    const validEntries = [];

    req.body.records.forEach((record, index) => {
      const normalized = normalizeTransportPayload(record, {
        allowPaymentFields: true,
      });

      const missingFields = [];
      if (!normalized.date) missingFields.push("Date");
      if (!normalized.transportName) missingFields.push("Transport Name");
      if (normalized.freightMemoNo === undefined)
        missingFields.push("Freight Memo No");
      if (!normalized.vehicleNo) missingFields.push("Vehicle No");
      if (!normalized.partyName) missingFields.push("Party Name");

      if (missingFields.length > 0) {
        invalidRecords.push({
          row: index + 2,
          freightMemoNo:
            normalized.freightMemoNo !== undefined
              ? normalized.freightMemoNo
              : "N/A",
          reason: `Missing required field(s): ${missingFields.join(", ")}`,
        });
      } else {
        validEntries.push({ record: normalized, index });
      }
    });

    const seenKeys = new Set();
    const fileDuplicates = [];
    const uniqueEntries = [];

    validEntries.forEach(({ record, index }) => {
      const key = getDuplicateKey(record);

      if (key === undefined) {
        uniqueEntries.push({ record, index });
        return;
      }

      if (seenKeys.has(key)) {
        fileDuplicates.push(
          formatDuplicateRecord(record, index, "Duplicate in import file"),
        );
        return;
      }

      seenKeys.add(key);
      uniqueEntries.push({ record, index });
    });

    const keys = [...seenKeys];
    const existingRecords =
      keys.length > 0
        ? await Transport.find(
            { freightMemoNo: { $in: keys } },
            { freightMemoNo: 1 },
          ).lean()
        : [];
    const existingKeys = new Set(
      existingRecords.map((record) =>
        normalizeFreightMemoNo(record.freightMemoNo),
      ),
    );
    const dbDuplicates = [];
    const recordsToCreate = uniqueEntries.flatMap(({ record, index }) => {
      const key = getDuplicateKey(record);

      if (key !== undefined && existingKeys.has(key)) {
        dbDuplicates.push(
          formatDuplicateRecord(record, index, "Already exists in database"),
        );
        return [];
      }

      return [record];
    });

    const created =
      recordsToCreate.length > 0
        ? await Transport.insertMany(recordsToCreate, { ordered: false })
        : [];

    const skippedRecords = [
      ...invalidRecords,
      ...fileDuplicates,
      ...dbDuplicates,
    ];

    return res.status(201).json({
      message:
        skippedRecords.length > 0
          ? `${created.length} records imported, ${skippedRecords.length} skipped`
          : `${created.length} records imported successfully`,
      count: created.length,
      total: req.body.records.length,
      skipped: skippedRecords.length,
      duplicates: skippedRecords,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getTransports = async (_, res) =>
  res.json(await Transport.find().sort({ date: -1 }));

export const updateTransport = async (req, res) => {
  try {
    const existingRecord = await Transport.findById(req.params.id);

    const normalized = normalizeTransportPayload(req.body, {
      allowPaymentFields: true,
    });

    // If payment was made and balance is changing, preserve the previous balance
    if (
      existingRecord &&
      existingRecord.balance !== normalized.balance &&
      normalized.balance !== existingRecord.balance
    ) {
      if (!req.body.previousClosingBalance) {
        normalized.previousClosingBalance = existingRecord.balance;
      }
    }

    const record = await Transport.findByIdAndUpdate(
      req.params.id,
      normalized,
      {
        new: true,
      },
    );

    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getTransportById = async (req, res) => {
  try {
    const record = await Transport.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json(record);
  } catch (err) {
    res.status(400).json({ message: "Invalid ID" });
  }
};

export const deleteTransport = async (req, res) => {
  await Transport.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};

export const getFilterOptions = async (req, res) => {
  try {
    const transportNames = await Transport.distinct("transportName");
    const partyNames = await Transport.distinct("partyName");
    const companies = await Transport.distinct("company");
    const locations = await Transport.distinct("location");

    res.status(200).json({
      transportName: transportNames.filter(Boolean).sort(),
      partyName: partyNames.filter(Boolean).sort(),
      company: companies.filter(Boolean).sort(),
      location: locations.filter(Boolean).sort(),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Return distinct vehicles with their most recently recorded fuelType.
export const getVehicleOptions = async (req, res) => {
  try {
    // Prefer explicit Vehicles collection if it exists / has documents
    try {
      const vehicleCount = await Vehicle.estimatedDocumentCount();
      if (vehicleCount > 0) {
        const vehicles = await Vehicle.find(
          {},
          { vehicleNo: 1, fuelType: 1, _id: 0 },
        )
          .sort({ vehicleNo: 1 })
          .lean();
        // map to the old shape
        return res.status(200).json(
          vehicles.map((v) => ({
            vehicleNo: v.vehicleNo,
            fuelType: v.fuelType,
          })),
        );
      }
    } catch (innerErr) {
      // if Vehicles collection doesn't exist or another issue, fall back to aggregation below
      console.error(
        "Vehicle collection check failed, falling back to transports aggregation:",
        innerErr.message,
      );
    }

    const vehicles = await Transport.aggregate([
      { $match: { vehicleNo: { $ne: null } } },
      // Sort by date desc so $first returns latest fuelType
      { $sort: { date: -1 } },
      { $group: { _id: "$vehicleNo", fuelType: { $first: "$fuelType" } } },
      { $project: { vehicleNo: "$_id", fuelType: 1, _id: 0 } },
      { $sort: { vehicleNo: 1 } },
    ]);

    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markRecordsPaid = async (req, res) => {
  try {
    const { ids, paymentDate } = req.body;

    const records = await Transport.find({
      _id: { $in: ids },
    });

    const resolvedPaymentDate = parseDate(paymentDate) || new Date();

    for (const record of records) {
      record.paymentAmount =
        (record.paymentAmount || 0) + (record.balance || 0);

      record.balance = 0;
      record.paymentStatus = "Paid";
      record.paymentDate = resolvedPaymentDate;

      await record.save();
    }

    res.status(200).json({
      success: true,
      message: "Records marked as paid",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
