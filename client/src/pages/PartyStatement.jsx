import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import api from "../services/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(Number(value || 0));

const Transporter = () => {
  const [records, setRecords] = useState([]);
  const [transporter, setTransporter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      const res = await api.get("/transports");
      setRecords(res.data);
    } catch (err) {
      console.error("Error fetching records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const transporterSummaries = Object.values(
    records.reduce((summaries, record) => {
      const transporterName = record.transportName?.trim();
      if (!transporterName) return summaries;

      const key = transporterName.toLowerCase();
      const summary = summaries[key] || {
        name: transporterName,
        balance: 0,
        records: 0,
      };

      summary.balance += Number(record.balance || 0);
      summary.records += 1;

      summaries[key] = summary;
      return summaries;
    }, {}),
  )
    .filter((summary) =>
      summary.name.toLowerCase().includes(transporter.trim().toLowerCase()),
    )
    .sort((first, second) => first.name.localeCompare(second.name));

  const totalDue = transporterSummaries.reduce(
    (sum, summary) => sum + summary.balance,
    0,
  );

  return (
    <>
      <Navbar />
      <PageContainer
        title="Transporter"
        subtitle="Review remaining balances due to each transporter."
      >
        <div className="space-y-6">
          <section className="glass-panel p-6">
            <div className="max-w-md">
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Search Transporter
              </label>
              <input
                placeholder="Search transporter name..."
                className="w-full"
                value={transporter}
                onChange={(e) => setTransporter(e.target.value)}
              />
            </div>
          </section>

          {!loading && (
            <>
              <section className="grid gap-5 md:grid-cols-2">
                <div className="cardDash rounded-2xl p-5">
                  <p className="metric-label">Transporters Shown</p>
                  <p className="metric-value mt-2 text-blue-600 dark:text-blue-400">
                    {transporterSummaries.length}
                  </p>
                </div>
                <div className="cardDash rounded-2xl p-5">
                  <p className="metric-label">Remaining Due</p>
                  <p
                    className={`metric-value mt-2 ${totalDue > 0 ? "text-orange-500" : "text-emerald-600"}`}
                  >
                    {formatCurrency(totalDue)}
                  </p>
                </div>
              </section>

              <section className="glass-panel overflow-hidden">
                <div className="border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Remaining Due by Transporter
                  </h2>
                </div>
                <div className="overflow-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left">Transporter</th>
                        <th className="px-4 py-3 text-right">Records</th>
                        <th className="px-4 py-3 text-right">Remaining Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transporterSummaries.map((summary) => (
                        <tr
                          key={summary.name.toLowerCase()}
                          className="border-t"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                            {summary.name}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {summary.records}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${summary.balance > 0 ? "text-orange-500" : "text-emerald-600"}`}
                          >
                            {formatCurrency(summary.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transporterSummaries.length === 0 && (
                    <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      {transporter.trim()
                        ? `No transporters found for "${transporter}"`
                        : "No transporter records found"}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
};

export default Transporter;
