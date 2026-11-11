import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import API from "../services/api";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
const shortMoney = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Number(value || 0),
  );
const dateOptions = [
  { value: "today", label: "Today" },
  { value: "thisWeek", label: "This week" },
  { value: "thisMonth", label: "This month" },
  { value: "previousMonth", label: "Previous month" },
  { value: "custom", label: "Custom range" },
  { value: "all", label: "All time" },
];
const metrics = [
  ["totalFreightRevenue", "Freight revenue"],
  ["totalAdvanceReceived", "Advance received"],
  ["totalTrips", "Trips"],
  ["totalTransporterPayments", "Transporter payments made"],
  ["totalPartyOutstanding", "Party outstanding"],
  ["totalTransporterOutstanding", "Transporter outstanding"],
  ["totalFuelExpenses", "Fuel expenses"],
  ["netFinancialPosition", "Net financial position"],
];
const table = (title, columns, rows) => (
  <div className="glass-panel overflow-hidden rounded-2xl">
    <div className="border-b border-slate-200 p-5 dark:border-slate-800">
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th
                className="px-4 py-3 text-left font-medium text-slate-500"
                key={key}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              className="border-t border-slate-100 dark:border-slate-800"
              key={`${row.name || row.date}-${i}`}
            >
              {columns.map(([key]) => (
                <td className="px-4 py-3" key={key}>
                  {key === "freightRevenue" ||
                  key === "fuelExpenses" ||
                  key === "transporterPayments" ||
                  key === "advanceReceived" ||
                  key === "outstanding" ||
                  key === "revenue"
                    ? money(row[key])
                    : (row[key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td
                className="px-4 py-6 text-center text-slate-500"
                colSpan={columns.length}
              >
                No data in this date range.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default function Dashboard() {
  const location = useLocation();
  const [preset, setPreset] = useState("thisMonth");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    API.get("/reports/analytics", {
      params: { preset, ...(preset === "custom" ? { from, to } : {}) },
    })
      .then((response) => {
        if (active) {
          setData(response.data);
          setError("");
        }
      })
      .catch((err) => {
        if (active)
          setError(
            err.response?.data?.message ||
              "Unable to load dashboard analytics.",
          );
      });
    return () => {
      active = false;
    };
  }, [preset, from, to, location.key]);
  const summary = data?.summary || {};
  return (
    <>
      <Navbar />
      <PageContainer
        title="Dashboard"
        subtitle="Financial and operational analytics from transport and payment records."
      >
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <label className="text-sm font-medium" htmlFor="dashboard-range">
            Date range
          </label>
          <select
            id="dashboard-range"
            className="rounded-xl border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {preset === "custom" && (
            <>
              <input
                aria-label="From date"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-xl border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
              />
              <span>to</span>
              <input
                aria-label="To date"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-xl border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
              />
            </>
          )}
          <Link
            className="ml-auto text-sm font-semibold text-blue-600"
            to="/reports"
          >
            Open detailed reports →
          </Link>
        </div>
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([key, label]) => (
            <article key={key} className="cardDash rounded-2xl p-5">
              <p className="metric-label">{label}</p>
              <p className="metric-value mt-2">{money(summary[key])}</p>
              {key === "netFinancialPosition" && (
                <p className="mt-2 text-xs text-slate-500">
                  Party receipts − transporter payments − fuel expenses
                </p>
              )}
            </article>
          ))}
        </section>
        <div className="mt-6">
          <section className="glass-panel rounded-2xl p-5">
            <h2 className="mb-1 text-lg font-semibold">
              Monthly revenue and expenses
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Freight revenue, fuel expenses, and transporter payments, grouped
              by trip month.
            </p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={shortMoney} />
                  <Tooltip formatter={(value) => money(value)} />
                  <Bar
                    dataKey="revenue"
                    name="Freight revenue"
                    fill="#2563eb"
                  />
                  <Bar
                    dataKey="fuelExpenses"
                    name="Fuel expenses"
                    fill="#14b8a6"
                  />
                  <Bar
                    dataKey="transporterPayments"
                    name="Transporter payments"
                    fill="#f59e0b"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="glass-panel rounded-2xl p-5 mt-6">
            <h2 className="mb-1 text-lg font-semibold">
              Daily transport activity
            </h2>
            <div className="mt-4 h-[330px] overflow-auto">
              {(data?.daily || []).map((item) => (
                <div
                  className="flex items-center justify-between border-b border-slate-100 py-3 text-sm dark:border-slate-800"
                  key={item.date}
                >
                  <span>
                    {item.date}{" "}
                    <span className="text-slate-500">· {item.trips} trips</span>
                  </span>
                  <span className="font-semibold">{money(item.revenue)}</span>
                </div>
              ))}
              {data && !data.daily && (
                <p className="py-10 text-center text-slate-500">
                  No activity in this range.
                </p>
              )}
            </div>
          </section>
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {table(
            "Transporter performance",
            [
              ["name", "Transporter"],
              ["trips", "Trips"],
              ["freightRevenue", "Freight value"],
              ["transporterPayments", "Paid to transporter"],
              ["outstanding", "Outstanding"],
            ],
            data?.transporters || [],
          )}
          {table(
            "Vehicle activity",
            [
              ["vehicleNo", "Vehicle number"],
              ["trips", "Trips"],
              ["freightRevenue", "Freight value"],
              ["fuelExpenses", "Fuel expense"],
              ["transporterPayments", "Transporter payments"],
            ],
            data?.vehicles || [],
          )}
        </div>
      </PageContainer>
    </>
  );
}
