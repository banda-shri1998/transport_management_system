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
  const session = await Transport.startSession();
  try {
    let response;
    await session.withTransaction(async () => {
    const { transportId, transportIds, amount, paymentDate, method, reference } = req.body;
    const date = paymentDate ? new Date(paymentDate) : new Date();
    if (Number.isNaN(date.getTime())) {
      const error = new Error("Enter a valid payment date"); error.status = 400; throw error;
    }
    const paymentMethod = ["Cash", "Bank Transfer", "Cheque", "UPI", "Other"].includes(method) ? method : "Other";
    const paymentReference = String(reference || "").trim();

    if (Array.isArray(transportIds)) {
      const ids = [...new Set(transportIds.filter(Boolean).map(String))];
      if (!ids.length || ids.length > 500 || ids.some((id) => !/^[a-f\d]{24}$/i.test(id))) { const error = new Error("Select between 1 and 500 valid freight memos"); error.status = 400; throw error; }

      const transports = await Transport.find({ _id: { $in: ids } }).session(session);
      if (transports.length !== ids.length) {
        const error = new Error("One or more transport records were not found"); error.status = 404; throw error;
      }
      const alreadyPaid = transports.find((transport) => Number(transport.balance || 0) <= 0);
      if (alreadyPaid) {
        const error = new Error(`Freight Memo No ${alreadyPaid.freightMemoNo} is already paid`); error.status = 400; throw error;
      }

      const payments = await Payment.insertMany(transports.map((transport) => ({
        transport: transport._id,
        paymentDate: date,
        amount: Number(transport.balance),
        method: paymentMethod,
        reference: paymentReference,
        previousBalance: Number(transport.balance),
        remainingBalance: 0,
        transportName: transport.transportName,
        freightMemoNo: transport.freightMemoNo,
        recordedBy: req.user?.name || req.user?.email || "",
      })), { session });

      await Transport.bulkWrite(transports.map((transport) => ({
        updateOne: {
          filter: { _id: transport._id, balance: transport.balance },
          update: {
            $set: { balance: 0, paymentStatus: "Paid", paymentDate: date },
            $inc: { paymentAmount: Number(transport.balance), payAmount: Number(transport.balance) },
          },
        },
      })), { session });
      response = { payments, transports: await Transport.find({ _id: { $in: ids } }).session(session) };
      return;
    }

    const paidAmount = Number(amount);
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      const error = new Error("Payment amount must be greater than zero"); error.status = 400; throw error;
    }
    const transport = await Transport.findById(transportId).session(session);
    if (!transport) { const error = new Error("Transport record not found"); error.status = 404; throw error; }
    const previousBalance = Number(transport.balance || 0);
    if (paidAmount > previousBalance) {
      const error = new Error("Payment cannot exceed the outstanding balance"); error.status = 400; throw error;
    }
    const remainingBalance = Math.max(0, previousBalance - paidAmount);
    const [payment] = await Payment.create([{
      transport: transport._id,
      paymentDate: date,
      amount: paidAmount,
      method: paymentMethod,
      reference: paymentReference,
      previousBalance,
      remainingBalance,
      transportName: transport.transportName,
      freightMemoNo: transport.freightMemoNo,
      recordedBy: req.user?.name || req.user?.email || "",
    }], { session });
    transport.balance = remainingBalance;
    transport.paymentAmount = Number(transport.paymentAmount || 0) + paidAmount;
    transport.payAmount = Number(transport.payAmount || 0) + paidAmount;
    transport.paymentDate = date;
    transport.paymentStatus = remainingBalance === 0 ? "Paid" : "Partial";
    await transport.save({ session });
    response = { payment, transport };
    });
    res.status(201).json(response);
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  } finally {
    await session.endSession();
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
