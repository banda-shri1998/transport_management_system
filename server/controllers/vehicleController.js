import Vehicle from "../models/Vehicle.js";
import Transport from "../models/Transport.js";

const normalizeVehicleNo = (value) => String(value || "").trim().toUpperCase();

const vehiclePayload = (body) => ({
  vehicleNo: normalizeVehicleNo(body.vehicleNo),
  vehicleType: String(body.vehicleType || "").trim(),
  ownershipType: ["Owned", "Attached", "Hired"].includes(body.ownershipType)
    ? body.ownershipType
    : "Owned",
  transporter: String(body.transporter || body.ownerName || "").trim(),
  ownerName: String(body.ownerName || body.transporter || "").trim(),
  maximumCapacity: Number(body.maximumCapacity || 0),
  fuelType: body.fuelType || "Diesel",
  fuelRate: Number(body.fuelRate || 0),
  notes: String(body.notes || "").trim(),
  insuranceExpiry: body.insuranceExpiry || null,
  pucExpiry: body.pucExpiry || null,
  fitnessExpiry: body.fitnessExpiry || null,
  status: ["Active", "Maintenance", "Inactive"].includes(body.status)
    ? body.status
    : "Active",
});

export const listVehicles = async (req, res) => {
  try {
    const { search = "", status, transporter } = req.query;
    const query = {};
    if (status) query.status = status;
    if (transporter) query.transporter = new RegExp(String(transporter), "i");
    if (search) {
      const re = new RegExp(String(search).trim(), "i");
      query.$or = [{ vehicleNo: re }, { transporter: re }, { vehicleType: re }];
    }
    const vehicles = await Vehicle.find(query).sort({ vehicleNo: 1 }).lean();
    const vehicleNumbers = vehicles
      .filter((vehicle) => !vehicle.ownerName)
      .map((vehicle) => vehicle.vehicleNo);
    const transportOwners = vehicleNumbers.length
      ? await Transport.find({ vehicleNo: { $in: vehicleNumbers } })
          .sort({ date: -1 })
          .select("vehicleNo transportName")
          .lean()
      : [];
    const ownerByVehicle = new Map();

    transportOwners.forEach((record) => {
      if (!ownerByVehicle.has(record.vehicleNo)) {
        ownerByVehicle.set(record.vehicleNo, record.transportName);
      }
    });

    const vehiclesWithOwners = vehicles.map((vehicle) => ({
      ...vehicle,
      ownerName:
        vehicle.ownerName || ownerByVehicle.get(vehicle.vehicleNo) || "",
    }));
    res.status(200).json(vehiclesWithOwners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVehicleDetails = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).lean();
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    const historyQuery = {
      $or: [
        { vehicle: vehicle._id },
        { vehicleNo: new RegExp(`^${vehicle.vehicleNo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      ],
    };
    const [history, summary] = await Promise.all([
      Transport.find(historyQuery).sort({ date: -1, _id: -1 }).lean(),
      Transport.aggregate([
        { $match: historyQuery },
        { $group: {
          _id: null,
          totalTrips: { $sum: 1 },
          totalQuantity: { $sum: { $ifNull: ["$quantity", 0] } },
          totalFreight: { $sum: { $ifNull: ["$totalAmount", 0] } },
          totalFuelExpense: { $sum: { $ifNull: ["$fuelExpense", 0] } },
        } },
      ]),
    ]);
    res.json({ vehicle, history, summary: summary[0] || { totalTrips: 0, totalQuantity: 0, totalFreight: 0, totalFuelExpense: 0 } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getVehiclePerformance = async (_req, res) => {
  try {
    const performance = await Transport.aggregate([
      { $group: {
        _id: "$vehicleNo",
        totalTrips: { $sum: 1 },
        totalQuantity: { $sum: { $ifNull: ["$quantity", 0] } },
        totalFreight: { $sum: { $ifNull: ["$totalAmount", 0] } },
        totalFuelExpense: { $sum: { $ifNull: ["$fuelExpense", 0] } },
        totalOutstanding: { $sum: { $ifNull: ["$balance", 0] } },
      } },
      { $project: { vehicleNo: "$_id", _id: 0, totalTrips: 1, totalQuantity: 1, totalFreight: 1, totalFuelExpense: 1, totalOutstanding: 1 } },
    ]);
    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const payload = vehiclePayload(req.body);
    if (!payload.vehicleNo)
      return res.status(400).json({ message: "vehicleNo is required" });
    if (!Number.isFinite(payload.maximumCapacity) || payload.maximumCapacity < 0) {
      return res
        .status(400)
        .json({ message: "maximumCapacity must be non-negative" });
    }

    const existing = await Vehicle.findOne({
      vehicleNo: payload.vehicleNo,
    });
    if (existing)
      return res.status(409).json({ message: "Vehicle already exists" });

    const created = await Vehicle.create(payload);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const seedVehiclesFromTransports = async (req, res) => {
  try {
    const transports = await Transport.find({ vehicleNo: { $ne: "" } })
      .sort({ date: -1 })
      .lean();
    const seen = new Map();

    transports.forEach((record) => {
      const vehicleNo = String(record.vehicleNo || "")
        .trim()
        .toUpperCase();
      if (!vehicleNo) return;
      if (!seen.has(vehicleNo)) {
        seen.set(vehicleNo, {
          vehicleNo,
          ownerName: record.transportName || "",
          maximumCapacity: 0,
          fuelType: record.fuelType || "Diesel",
          fuelRate: Number(record.fuelRate) || 0,
          notes: "Seeded from transport records",
        });
      }
    });

    const result = [];
    for (const item of [...seen.values()]) {
      const existing = await Vehicle.findOne({ vehicleNo: item.vehicleNo });
      if (!existing) {
        result.push(await Vehicle.create(item));
      }
    }

    res.status(200).json({
      success: true,
      created: result.length,
      total: seen.size,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = vehiclePayload(req.body);
    if (!payload.vehicleNo) return res.status(400).json({ message: "vehicleNo is required" });
    if (!Number.isFinite(payload.maximumCapacity) || payload.maximumCapacity < 0) {
      return res
        .status(400)
        .json({ message: "maximumCapacity must be non-negative" });
    }
    const updated = await Vehicle.findByIdAndUpdate(
      id,
      payload,
      { new: true, runValidators: true },
    );
    if (!updated) return res.status(404).json({ message: "Vehicle not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByIdAndUpdate(id, { status: "Inactive" }, { new: true });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ message: "Vehicle deactivated", vehicle });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
