import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import API from "../services/api";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(Number(value || 0));

const chartCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const statCards = [
  {
    key: "totalTrips",
    title: "Total Records",
    accent: "from-blue-600 to-cyan-500",
    description: "Trips currently stored in the system",
  },
  {
    key: "totalBalance",
    title: "Pending Payments",
    accent: "from-orange-500 to-amber-400",
    description: "Outstanding balance across all transports",
  },
  {
    key: "totalRevenue",
    title: "Total Revenue",
    accent: "from-emerald-600 to-teal-500",
    description: "Gross freight amount booked",
  },
  {
    key: "totalFuel",
    title: "Fuel Expense",
    accent: "from-violet-600 to-fuchsia-500",
    description: "Cumulative fuel spend recorded",
  },
];

const fuelColors = ["#2563eb", "#14b8a6", "#f59e0b", "#a855f7"];

export default function Dashboard() {
  const location = useLocation();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalRevenue: 0,
    totalFuel: 0,
    totalBalance: 0,
  });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const res = await API.get("/transports");
      const data = res.data;

      const totalTrips = data.length;
      const totalRevenue = data.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
      const totalFuel = data.reduce((sum, r) => sum + (r.fuelExpense || 0), 0);
      const totalBalance = data.reduce(
        (sum, r) =>
          sum +
          ((r.totalAmount || 0) -
            (r.advancePaid || 0) -
            (r.fuelExpense || 0) -
            (r.payAmount || 0)),
        0,
      );

      setRecords(data);
      setStats({
        totalTrips,
        totalRevenue,
        totalFuel,
        totalBalance,
      });
    };

    fetchDashboardData();
  }, [location.key]);

  useEffect(() => {
    if (!location.state?.success) return;

    const showTimer = setTimeout(() => setShowToast(true), 0);
    const hideTimer = setTimeout(() => setShowToast(false), 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [location.state]);

  const monthlyChartData = useMemo(() => {
    const monthMap = new Map();

    records.forEach((record) => {
      const date = new Date(record.date);
      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });

      if (!monthMap.has(key)) {
        monthMap.set(key, {
          key,
          label,
          revenue: 0,
          fuel: 0,
          balance: 0,
        });
      }

      const current = monthMap.get(key);
      current.revenue += Number(record.totalAmount || 0);
      current.fuel += Number(record.fuelExpense || 0);
      current.balance += Number(record.balance || 0);
    });

    return [...monthMap.values()].sort((a, b) => a.key.localeCompare(b.key)).slice(-6);
  }, [records]);

  const fuelTypeData = useMemo(() => {
    const totals = records.reduce((acc, record) => {
      const key = record.fuelType || "Other";
      acc[key] = (acc[key] || 0) + Number(record.fuelExpense || 0);
      return acc;
    }, {});

    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [records]);

  const topPartyData = useMemo(() => {
    const totals = records.reduce((acc, record) => {
      const key = record.partyName || "Unknown";
      acc[key] = (acc[key] || 0) + Number(record.totalAmount || 0);
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [records]);

  return (
    <>
      <Navbar />
      <PageContainer
        title="Dashboard"
        subtitle="Operational overview for transport records, collections, and cost performance."
      >
        {showToast && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/50 dark:text-emerald-300">
            Record added successfully.
          </div>
        )}

        <section className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.key} className="cardDash overflow-hidden rounded-3xl p-[1px]">
              <div className={`h-full rounded-[calc(1.5rem-1px)] bg-gradient-to-br ${card.accent} p-6 text-white`}>
                <p className="text-sm font-medium text-white/80">{card.title}</p>
                <p className="mt-4 text-3xl font-bold tracking-tight">
                  {card.key === "totalTrips" ? stats[card.key] : formatCurrency(stats[card.key])}
                </p>
                <p className="mt-3 text-sm text-white/80">{card.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="glass-panel p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Monthly Performance</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Revenue, fuel, and balance trend for the last six recorded months.
              </p>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={chartCurrency} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="revenue" radius={[10, 10, 0, 0]} fill="#2563eb" />
                  <Bar dataKey="fuel" radius={[10, 10, 0, 0]} fill="#14b8a6" />
                  <Bar dataKey="balance" radius={[10, 10, 0, 0]} fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Fuel Mix</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Distribution of recorded fuel expense by fuel type.
              </p>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fuelTypeData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {fuelTypeData.map((entry, index) => (
                      <Cell key={entry.name} fill={fuelColors[index % fuelColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {fuelTypeData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50/80 px-4 py-3 dark:bg-slate-950/40">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: fuelColors[index % fuelColors.length] }}
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="glass-panel p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Top Parties by Revenue</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Highest gross freight contributors in the current dataset.
              </p>
            </div>
            <div className="space-y-4">
              {topPartyData.map((party, index) => {
                const maxRevenue = topPartyData[0]?.revenue || 1;
                const width = `${Math.max((party.revenue / maxRevenue) * 100, 12)}%`;

                return (
                  <div key={party.name}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {index + 1}. {party.name}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(party.revenue)}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-200/80 dark:bg-slate-800">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-violet-600"
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Health Check</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-950/40">
                <p className="metric-label">Collection pressure</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {stats.totalBalance > 0 ? "Attention needed" : "Balanced"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-950/40">
                <p className="metric-label">Average revenue per trip</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(stats.totalTrips ? stats.totalRevenue / stats.totalTrips : 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-950/40">
                <p className="metric-label">Average fuel per trip</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(stats.totalTrips ? stats.totalFuel / stats.totalTrips : 0)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    </>
  );
}
