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

const PartyStatement = () => {
  const [records, setRecords] = useState([]);
  const [party, setParty] = useState("");
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

  const filtered = records.filter(
    (r) =>
      party &&
      r.partyName?.toLowerCase().includes(party.toLowerCase())
  );

  const totalAmount = filtered.reduce(
    (sum, r) => sum + (r.totalAmount || 0),
    0
  );

  const paidAmount = filtered.reduce(
    (sum, r) => sum + (r.payAmount || 0) + (r.advancePaid || 0),
    0
  );

  const balance = filtered.reduce(
    (sum, r) => sum + (r.balance || 0),
    0
  );

  return (
    <>
      <Navbar />
      <PageContainer
        title="Party Statement"
        subtitle="Search statements, total revenue, settlement status, and balances by party."
      >
        <div className="space-y-8">
          <section className="glass-panel p-6">
            <div className="max-w-md">
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Search Party
              </label>
              <input
                placeholder="Enter party name to view statement..."
                className="w-full"
                value={party}
                onChange={(e) => setParty(e.target.value)}
              />
            </div>
          </section>

          {party && !loading && (
            <>
              <section className="grid gap-5 md:grid-cols-3">
                <div className="cardDash rounded-3xl p-5">
                  <p className="metric-label">Total Billed</p>
                  <p className="metric-value mt-2 text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                <div className="cardDash rounded-3xl p-5">
                  <p className="metric-label">Total Paid (Advance + Settlement)</p>
                  <p className="metric-value mt-2 text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(paidAmount)}
                  </p>
                </div>
                <div className="cardDash rounded-3xl p-5">
                  <p className="metric-label">Outstanding Balance</p>
                  <p className={`metric-value mt-2 ${balance > 0 ? "text-orange-500" : "text-emerald-600"}`}>
                    {formatCurrency(balance)}
                  </p>
                </div>
              </section>

              <section className="glass-panel overflow-hidden">
                <div className="border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Ledger Entries for "{party}"
                  </h2>
                </div>
                <div className="overflow-auto">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Vehicle No</th>
                        <th className="px-4 py-3 text-left">Transporter</th>
                        <th className="px-4 py-3 text-left">Destination</th>
                        <th className="px-4 py-3 text-right">Total Amount</th>
                        <th className="px-4 py-3 text-right">Advance Paid</th>
                        <th className="px-4 py-3 text-right">Settlement Paid</th>
                        <th className="px-4 py-3 text-right">Current Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, idx) => (
                        <tr key={r._id || idx} className="border-t">
                          <td className="px-4 py-3">{r.date?.slice(0, 10)}</td>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                            {r.vehicleNo}
                          </td>
                          <td className="px-4 py-3">{r.transportName}</td>
                          <td className="px-4 py-3">{r.location || "-"}</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatCurrency(r.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {formatCurrency(r.advancePaid)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            {formatCurrency(r.payAmount)}
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${r.balance > 0 ? "text-orange-500" : "text-emerald-600"}`}>
                            {formatCurrency(r.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No records found for party "{party}"
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

export default PartyStatement;
