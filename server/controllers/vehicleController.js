import Vehicle from "../models/Vehicle.js";
import Transport from "../models/Transport.js";

export const listVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ vehicleNo: 1 }).lean();
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

export const createVehicle = async (req, res) => {
  try {
    const { vehicleNo, ownerName, maximumCapacity, fuelType, fuelRate, notes } =
      req.body;
    if (!vehicleNo)
      return res.status(400).json({ message: "vehicleNo is required" });

    const parsedCapacity = Number(maximumCapacity || 0);
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 0) {
      return res
        .status(400)
        .json({ message: "maximumCapacity must be non-negative" });
    }

    const existing = await Vehicle.findOne({
      vehicleNo: String(vehicleNo).trim().toUpperCase(),
    });
    if (existing)
      return res.status(409).json({ message: "Vehicle already exists" });

    const created = await Vehicle.create({
      vehicleNo: String(vehicleNo).trim().toUpperCase(),
      ownerName: String(ownerName || "").trim(),
      maximumCapacity: parsedCapacity,
      fuelType,
      fuelRate,
      notes,
    });
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
    const { vehicleNo, ownerName, maximumCapacity, fuelType, fuelRate, notes } =
      req.body;
    const parsedCapacity = Number(maximumCapacity || 0);
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 0) {
      return res
        .status(400)
        .json({ message: "maximumCapacity must be non-negative" });
    }
    const updated = await Vehicle.findByIdAndUpdate(
      id,
      {
        vehicleNo: vehicleNo
          ? String(vehicleNo).trim().toUpperCase()
          : undefined,
        ownerName: String(ownerName || "").trim(),
        maximumCapacity: parsedCapacity,
        fuelType,
        fuelRate,
        notes,
      },
      { new: true },
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
    await Vehicle.findByIdAndDelete(id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
