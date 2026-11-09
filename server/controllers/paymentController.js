import Payment from "../models/Payment.js";
import Transport from "../models/Transport.js";

export const listPayments = async (req, res) => {
  try {
    const { transporter, from, to } = req.query;
    const query = {};
    if (transporter) query.transportName = { $regex: String(transporter), $options: "i" };
    if (from || to) {
      query.paymentDate = {};
      if (from) query.paymentDate.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }
    res.json(await Payment.find(query).sort({ paymentDate: -1, createdAt: -1 }).lean());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { transportId, amount, paymentDate, method, reference } = req.body;
    const paidAmount = Number(amount);
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than zero" });
    }
    const date = paymentDate ? new Date(paymentDate) : new Date();
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: "Enter a valid payment date" });
    }
    const transport = await Transport.findById(transportId);
    if (!transport) return res.status(404).json({ message: "Transport record not found" });
    const previousBalance = Number(transport.balance || 0);
    if (paidAmount > previousBalance) {
      return res.status(400).json({ message: "Payment cannot exceed the outstanding balance" });
    }
    const remainingBalance = Math.max(0, previousBalance - paidAmount);
    const payment = await Payment.create({
      transport: transport._id,
      paymentDate: date,
      amount: paidAmount,
      method: ["Cash", "Bank Transfer", "Cheque", "UPI", "Other"].includes(method) ? method : "Other",
      reference: String(reference || "").trim(),
      previousBalance,
      remainingBalance,
      transportName: transport.transportName,
      freightMemoNo: transport.freightMemoNo,
      recordedBy: req.user?.name || req.user?.email || "",
    });
    transport.balance = remainingBalance;
    transport.paymentAmount = Number(transport.paymentAmount || 0) + paidAmount;
    transport.payAmount = Number(transport.payAmount || 0) + paidAmount;
    transport.paymentDate = date;
    transport.paymentStatus = remainingBalance === 0 ? "Paid" : "Partial";
    await transport.save();
    res.status(201).json({ payment, transport });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getOutstanding = async (_req, res) => {
  try {
    const records = await Transport.find({ balance: { $gt: 0 } })
      .select("date transportName freightMemoNo vehicleNo balance totalAmount")
      .sort({ date: 1 })
      .lean();
    const today = new Date();
    const groupOutstanding = (field, outputField) => {
      const grouped = new Map();
      for (const record of records) {
        const name = record[field] || `Unknown ${outputField}`;
        const key = name.trim().toLowerCase();
        const age = Math.max(0, Math.floor((today - new Date(record.date)) / 86400000));
        const bucket = age <= 30 ? "days0to30" : age <= 60 ? "days31to60" : age <= 90 ? "days61to90" : "days90plus";
        const item = grouped.get(key) || { [outputField]: name.trim(), balance: 0, records: 0, days0to30: 0, days31to60: 0, days61to90: 0, days90plus: 0 };
        item.balance += Number(record.balance || 0);
        item[bucket] += Number(record.balance || 0);
        item.records += 1;
        grouped.set(key, item);
      }
      return [...grouped.values()].sort((a, b) => b.balance - a.balance);
    };
    res.json({
      parties: groupOutstanding("partyName", "partyName"),
      transporters: groupOutstanding("transportName", "transportName"),
      records,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
