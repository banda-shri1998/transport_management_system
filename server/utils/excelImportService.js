import XLSX from "xlsx";
import Trip from "../models/Trip.js";

export const importTrips = async (req, res) => {
  const workbook = XLSX.readFile(req.file.path);

  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet);

  const trips = [];

  for (const row of rows) {
    const trip = {
      date: new Date(row["Date"]),

      transportName: row["Owner Name"],

      freightMemoNo: Number(row["FM No"]),

      lrNo: row["LR No"] ? [String(row["LR No"])] : [],

      vehicleNo: row["Vehicle No"],

      partyName: row["Party Name"],

      company: row["Company"],

      location: row["Location"],

      quantity: Number(row["Quantity"]),

      rate: Number(row["Freight"]),

      totalAmount: Number(row["Freight Amount"]),

      advancePaid: Number(row["Advance"] || 0),

      fuelType: "Diesel",

      fuelRate: 90.6,

      fuelQuantity: 0,

      fuelExpense: Number(row["Fuel Expense"] || 0),

      balance: Number(row["Balance"]),
    };

    trips.push(trip);
  }

  await Trip.insertMany(trips);

  res.json({
    success: true,
    imported: trips.length,
  });
};
