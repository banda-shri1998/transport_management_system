import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import API from "../services/api";

const reportTypes = [
  ["daily", "Daily transport report"],
  ["monthly", "Monthly transport report"],
  ["party", "Party-wise report"],
  ["transporter", "Transporter-wise report"],
  ["vehicle", "Vehicle-wise report"],
  ["payment", "Payment report"],
  ["fuel", "Fuel expense report"],
];
const dateOptions = [
  ["today", "Today"],
  ["thisWeek", "This week"],
  ["thisMonth", "This month"],
  ["previousMonth", "Previous month"],
  ["custom", "Custom date range"],
  ["all", "All time"],
];
const labels = {
  _id: "Group",
  trips: "Trips",
  freightRevenue: "Freight revenue",
  advanceReceived: "Advance received",
  transporterPayments: "Paid to transporter",
  fuelExpenses: "Fuel expense",
  transporterOutstanding: "Transporter outstanding",
  partyOutstanding: "Party outstanding",
  date: "Date",
  category: "Transaction type",
  partyName: "Party",
  transporterName: "Transporter",
  freightMemoNo: "Freight memo",
  amount: "Amount",
  method: "Method",
  reference: "Reference",
  vehicleNo: "Vehicle",
  fuelType: "Fuel type",
  partyReceipts: "Party receipts",
};
const moneyFields = new Set([
  "freightRevenue",
  "advanceReceived",
  "transporterPayments",
  "fuelExpenses",
  "transporterOutstanding",
  "partyOutstanding",
  "amount",
]);
const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function Reports() {
  const [type, setType] = useState("daily");
  const [preset, setPreset] = useState("thisMonth");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (preset === "custom" && (!from || !to)) {
      setResult(null);
      return undefined;
    }
    let active = true;
    setLoading(true);
    API.get(`/reports/reports/${type}`, {
      params: {
        preset,
        page,
        limit: 25,
        ...(preset === "custom" ? { from, to } : {}),
      },
    })
      .then((response) => {
        if (active) {
          setResult(response.data);
          setError("");
        }
      })
      .catch((err) => {
        if (active)
          setError(
            err.response?.data?.message || "Unable to load this report.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [type, preset, from, to, page]);
  const rows = result?.rows || [];
  const columns = rows.length
    ? Object.keys(rows[0])
    : type === "payment"
      ? [
          "date",
          "category",
          "partyName",
          "transporterName",
          "freightMemoNo",
          "amount",
          "method",
          "reference",
        ]
      : type === "fuel"
        ? [
            "date",
            "category",
            "vehicleNo",
            "transporterName",
            "fuelType",
            "amount",
            "freightMemoNo",
          ]
        : [
            "_id",
            "trips",
            "freightRevenue",
            "advanceReceived",
            ...(type === "party" ? ["partyReceipts"] : []),
            "transporterPayments",
            "fuelExpenses",
            "partyOutstanding",
            "transporterOutstanding",
          ];
  return (
    <>
      <Navbar />
      <PageContainer
        title="Reports"
        subtitle="Date filtered transport, party, transporter, vehicle, payment, and fuel reports."
      >
        <section className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <label className="grid gap-1 text-sm font-medium">
            Report
            <select
              className="min-w-56 rounded-xl border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
            >
              {reportTypes.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Date range
            <select
              className="rounded-xl border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
              value={preset}
              onChange={(event) => {
                setPreset(event.target.value);
                setPage(1);
              }}
            >
              {dateOptions.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {preset === "custom" && (
            <>
              <label className="grid gap-1 text-sm font-medium">
                From
                <input
                  type="date"
                  value={from}
                  onChange={(event) => {
                    setFrom(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                To
                <input
                  type="date"
                  value={to}
                  onChange={(event) => {
                    setTo(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
                />
              </label>
            </>
          )}
        </section>
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-950 dark:bg-blue-950/40 dark:text-blue-100">
          Party receipts are payments received from parties. Transporter
          payments are payouts made to transporters. These are reported as
          separate transaction types.
        </div>
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}
        <section className="glass-panel overflow-hidden rounded-2xl">
          <div className="overflow-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      className="px-4 py-3 text-left font-medium text-slate-500"
                      key={column}
                    >
                      {labels[column] || column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    className="border-t border-slate-100 dark:border-slate-800"
                    key={`${row.date}-${row.freightMemoNo}-${index}`}
                  >
                    {columns.map((column) => (
                      <td className="px-4 py-3" key={column}>
                        {moneyFields.has(column)
                          ? money(row[column])
                          : (row[column] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      {preset === "custom" && (!from || !to)
                        ? "Choose both dates to run this report."
                        : "No records found for this report and date range."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
            <span>
              {loading
                ? "Loading…"
                : `${result?.pagination?.total || 0} results · Page ${result?.pagination?.page || page} of ${Math.max(1, result?.pagination?.totalPages || 1)}`}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={
                  page >= (result?.pagination?.totalPages || 1) || loading
                }
                onClick={() => setPage((value) => value + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700"
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      </PageContainer>
    </>
  );
}
