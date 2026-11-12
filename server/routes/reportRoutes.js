import express from "express";
import Transport from "../models/Transport.js";
import Payment from "../models/Payment.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();
router.use(protect);

const DAY_MS = 24 * 60 * 60 * 1000;
const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const resolveDateRange = (query) => {
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const preset = query.preset || "all";
  if (
    ![
      "all",
      "today",
      "thisWeek",
      "thisMonth",
      "previousMonth",
      "custom",
    ].includes(preset)
  ) {
    const error = new Error("Choose a supported date range");
    error.status = 400;
    throw error;
  }
  let from;
  let to = new Date(today.getTime() + DAY_MS);
  if (preset === "today") from = today;
  else if (preset === "thisWeek") {
    from = new Date(today);
    from.setUTCDate(from.getUTCDate() - ((from.getUTCDay() + 6) % 7));
  } else if (preset === "thisMonth")
    from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  else if (preset === "previousMonth") {
    from = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
    );
    to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  } else if (preset === "custom" || query.from || query.to) {
    from = query.from ? validDate(query.from) : null;
    const end = query.to ? validDate(query.to) : null;
    to = end ? new Date(end.getTime() + DAY_MS) : null;
    if (
      (query.from && !from) ||
      (query.to && !end) ||
      (from && to && from >= to)
    ) {
      const error = new Error("Enter a valid date range");
      error.status = 400;
      throw error;
    }
  }
  return { from, to, preset };
};

const dateMatch = (field, range) => {
  const condition = {};
  if (range.from) condition.$gte = range.from;
  if (range.to) condition.$lt = range.to;
  return Object.keys(condition).length ? { [field]: condition } : {};
};

const number = (field) => ({
  $convert: {
    input: { $ifNull: [field, 0] },
    to: "double",
    onError: 0,
    onNull: 0,
  },
});
const transportBase = (range) => [
  { $match: dateMatch("date", range) },
  {
    $addFields: {
      _freight: number("$totalAmount"),
      _advance: number("$advancePaid"),
      _fuel: number("$fuelExpense"),
      _transporterPaid: {
        $max: [number("$payAmount"), number("$paymentAmount")],
      },
      _partyBalance: {
        $max: [
          {
            $subtract: [
              number("$totalAmount"),
              {
                $add: [
                  number("$advancePaid"),
                  { $max: [number("$payAmount"), number("$paymentAmount")] },
                ],
              },
            ],
          },
          0,
        ],
      },
      _transporterBalance: {
        $max: [
          {
            $subtract: [
              number("$totalAmount"),
              {
                $add: [
                  number("$advancePaid"),
                  number("$fuelExpense"),
                  { $max: [number("$payAmount"), number("$paymentAmount")] },
                ],
              },
            ],
          },
          0,
        ],
      },
    },
  },
];
const paymentBase = (range) => [
  { $match: dateMatch("paymentDate", range) },
  { $addFields: { _receipt: number("$amount") } },
];
const sumField = (field) => ({ $sum: field });
const sendError = (res, error) =>
  res
    .status(error.status || 500)
    .json({ message: error.message || "Unable to build report" });

router.get("/analytics", async (req, res) => {
  try {
    const range = resolveDateRange(req.query);
    const [
      transportSummary,
      receipts,
      monthly,
      transporters,
      parties,
      partyReceipts,
      vehicles,
      daily,
    ] = await Promise.all([
      Transport.aggregate([
        ...transportBase(range),
        {
          $group: {
            _id: null,
            totalTrips: { $sum: 1 },
            totalFreightRevenue: sumField("$_freight"),
            totalAdvanceReceived: sumField("$_advance"),
            totalTransporterPayments: sumField("$_transporterPaid"),
            totalFuelExpenses: sumField("$_fuel"),
            totalTransporterOutstanding: sumField("$_transporterBalance"),
          },
        },
      ]),
      Payment.aggregate([
        ...paymentBase(range),
        { $match: { reference: { $ne: "Marked paid" } } },
        { $group: { _id: null, totalPartyReceipts: sumField("$_receipt") } },
      ]),
      Transport.aggregate([
        ...transportBase(range),
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$date",
                timezone: "UTC",
              },
            },
            revenue: sumField("$_freight"),
            fuelExpenses: sumField("$_fuel"),
            transporterPayments: sumField("$_transporterPaid"),
            trips: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            month: "$_id",
            revenue: 1,
            fuelExpenses: 1,
            transporterPayments: 1,
            trips: 1,
          },
        },
      ]),
      Transport.aggregate([
        ...transportBase(range),
        {
          $group: {
            _id: "$transportName",
            trips: { $sum: 1 },
            freightRevenue: sumField("$_freight"),
            advanceReceived: sumField("$_advance"),
            transporterPayments: sumField("$_transporterPaid"),
            outstanding: sumField("$_transporterBalance"),
            fuelExpenses: sumField("$_fuel"),
          },
        },
        { $sort: { freightRevenue: -1, _id: 1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            name: "$_id",
            trips: 1,
            freightRevenue: 1,
            advanceReceived: 1,
            transporterPayments: 1,
            outstanding: 1,
            fuelExpenses: 1,
          },
        },
      ]),
      Transport.aggregate([
        ...transportBase(range),
        {
          $group: {
            _id: "$partyName",
            trips: { $sum: 1 },
            freightRevenue: sumField("$_freight"),
            advanceReceived: sumField("$_advance"),
            outstanding: sumField("$_partyBalance"),
          },
        },
        { $sort: { freightRevenue: -1, _id: 1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            name: "$_id",
            trips: 1,
            freightRevenue: 1,
            advanceReceived: 1,
            outstanding: 1,
          },
        },
      ]),
      Payment.aggregate([
        ...paymentBase(range),
        { $match: { reference: { $ne: "Marked paid" } } },
        {
          $lookup: {
            from: "transports",
            localField: "transport",
            foreignField: "_id",
            as: "transport",
          },
        },
        { $unwind: { path: "$transport", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$transport.partyName",
            partyReceipts: sumField("$_receipt"),
          },
        },
      ]),
      Transport.aggregate([
        ...transportBase(range),
        {
          $group: {
            _id: "$vehicleNo",
            trips: { $sum: 1 },
            freightRevenue: sumField("$_freight"),
            fuelExpenses: sumField("$_fuel"),
            transporterPayments: sumField("$_transporterPaid"),
          },
        },
        { $sort: { trips: -1, _id: 1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            vehicleNo: "$_id",
            trips: 1,
            freightRevenue: 1,
            fuelExpenses: 1,
            transporterPayments: 1,
          },
        },
      ]),
      Transport.aggregate([
        ...transportBase(range),
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date",
                timezone: "UTC",
              },
            },
            trips: { $sum: 1 },
            revenue: sumField("$_freight"),
            fuelExpenses: sumField("$_fuel"),
            transporterPayments: sumField("$_transporterPaid"),
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 7 },
        {
          $project: {
            _id: 0,
            date: "$_id",
            trips: 1,
            revenue: 1,
            fuelExpenses: 1,
            transporterPayments: 1,
          },
        },
      ]),
    ]);
    const summary = transportSummary[0] || {};
    const totalPartyReceipts = receipts[0]?.totalPartyReceipts || 0;
    const totalFreightRevenue = summary.totalFreightRevenue || 0;
    const totalFuelExpenses = summary.totalFuelExpenses || 0;
    const totalTransporterPayments = summary.totalTransporterPayments || 0;
    const partyReceiptMap = new Map(
      partyReceipts.map((item) => [item._id, item.partyReceipts]),
    );
    const partyRows = parties.map((item) => {
      const partyReceiptsTotal = partyReceiptMap.get(item.name) || 0;
      return {
        ...item,
        partyReceipts: partyReceiptsTotal,
        outstanding: Math.max(
          0,
          item.freightRevenue - item.advanceReceived - partyReceiptsTotal,
        ),
      };
    });
    res.json({
      dateRange: {
        preset: range.preset,
        from: range.from?.toISOString().slice(0, 10) || null,
        to: range.to
          ? new Date(range.to.getTime() - DAY_MS).toISOString().slice(0, 10)
          : null,
      },
      summary: {
        totalTrips: summary.totalTrips || 0,
        totalFreightRevenue,
        totalAdvanceReceived: summary.totalAdvanceReceived || 0,
        totalPartyReceipts,
        totalTransporterPayments,
        totalPartyOutstanding: Math.max(
          0,
          (summary.totalFreightRevenue || 0) -
            (summary.totalAdvanceReceived || 0) -
            totalPartyReceipts,
        ),
        totalTransporterOutstanding: summary.totalTransporterOutstanding || 0,
        totalFuelExpenses,
        netFinancialPosition:
          (summary.totalAdvanceReceived || 0) +
          totalPartyReceipts -
          totalTransporterPayments -
          totalFuelExpenses,
        netFinancialPositionFormula:
          "Advance received + party receipts − transporter payments − fuel expenses",
      },
      trends: monthly,
      transporters,
      parties: partyRows,
      vehicles,
      daily,
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.get("/reports/:type", async (req, res) => {
  try {
    const types = {
      daily: ["date", "%Y-%m-%d"],
      monthly: ["date", "%Y-%m"],
      party: ["partyName"],
      transporter: ["transportName"],
      vehicle: ["vehicleNo"],
    };
    const type = req.params.type;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 25),
    );
    const range = resolveDateRange(req.query);
    let rows;
    let total;
    if (type === "payment" || type === "fuel") {
      const isPayment = type === "payment";
      const model = isPayment ? Payment : Transport;
      const match = isPayment
        ? dateMatch("paymentDate", range)
        : dateMatch("date", range);
      const pipeline = [
        { $match: isPayment ? match : { ...match, fuelExpense: { $gt: 0 } } },
        ...(isPayment
          ? [
              {
                $lookup: {
                  from: "transports",
                  localField: "transport",
                  foreignField: "_id",
                  as: "transportRecord",
                },
              },
              {
                $unwind: {
                  path: "$transportRecord",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ]
          : []),
        { $sort: { [isPayment ? "paymentDate" : "date"]: -1, _id: -1 } },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            rows: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              {
                $project: isPayment
                  ? {
                      date: "$paymentDate",
                      category: { $literal: "Party receipt" },
                      partyName: "$transportRecord.partyName",
                      transporterName: 1,
                      freightMemoNo: 1,
                      amount: 1,
                      method: 1,
                      reference: 1,
                    }
                  : {
                      date: 1,
                      category: { $literal: "Fuel expense" },
                      vehicleNo: "$vehicleNo",
                      transporterName: "$transportName",
                      fuelType: 1,
                      amount: "$fuelExpense",
                      freightMemoNo: 1,
                    },
              },
            ],
          },
        },
      ];
      const [result] = await model.aggregate(pipeline);
      rows = result?.rows || [];
      total = result?.metadata[0]?.total || 0;
    } else if (types[type]) {
      const [dimension, format] = types[type];
      const groupId = format
        ? { $dateToString: { format, date: "$date", timezone: "UTC" } }
        : `$${dimension}`;
      const [result] = await Transport.aggregate([
        ...transportBase(range),
        {
          $group: {
            _id: groupId,
            trips: { $sum: 1 },
            freightRevenue: sumField("$_freight"),
            advanceReceived: sumField("$_advance"),
            transporterPayments: sumField("$_transporterPaid"),
            fuelExpenses: sumField("$_fuel"),
            transporterOutstanding: sumField("$_transporterBalance"),
            partyOutstanding: sumField("$_partyBalance"),
          },
        },
        { $sort: { _id: 1 } },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            rows: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          },
        },
      ]);
      rows = result?.rows || [];
      total = result?.metadata[0]?.total || 0;
    } else {
      return res.status(404).json({ message: "Unknown report type" });
    }
    res.json({
      type,
      dateRange: {
        preset: range.preset,
        from: range.from?.toISOString().slice(0, 10) || null,
        to: range.to
          ? new Date(range.to.getTime() - DAY_MS).toISOString().slice(0, 10)
          : null,
      },
      rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
