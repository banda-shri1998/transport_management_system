import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import api from "../services/api";
import useAuth from "../hooks/useAuth";

const money = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(amount || 0));
const dateLabel = (date) => date ? new Date(date).toLocaleDateString("en-IN") : "—";
const summarizeOutstanding = (records, field) => {
  const groups = new Map();
  const today = new Date();
  records.filter((record) => Number(record.balance) > 0).forEach((record) => {
    const label = String(record[field] || `Unknown ${field}`).trim();
    const key = label.toLowerCase();
    const age = Math.max(0, Math.floor((today - new Date(record.date)) / 86400000));
    const bucket = age <= 30 ? "days0to30" : age <= 60 ? "days31to60" : age <= 90 ? "days61to90" : "days90plus";
    const item = groups.get(key) || { [field]: label, balance: 0, records: 0, days0to30: 0, days31to60: 0, days61to90: 0, days90plus: 0 };
    const balance = Number(record.balance || 0);
    item.balance += balance;
    item[bucket] += balance;
    item.records += 1;
    groups.set(key, item);
  });
  return [...groups.values()].sort((a, b) => b.balance - a.balance);
};

export default function Payments() {
  const { user } = useAuth();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";
  const [records, setRecords] = useState([]);
  const [payments, setPayments] = useState([]);
  const [parties, setParties] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [outstandingView, setOutstandingView] = useState("parties");
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), method: "Bank Transfer", reference: "" });
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [backendWarning, setBackendWarning] = useState("");
  const [ledgerAvailable, setLedgerAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    setLoading(true);
    try {
      const [recordResult, paymentResult, outstandingResult] = await Promise.allSettled([
        api.get("/transports"), api.get("/payments"), api.get("/payments/outstanding"),
      ]);
      if (recordResult.status !== "fulfilled") throw recordResult.reason;
      const transportRecords = Array.isArray(recordResult.value.data) ? recordResult.value.data : [];
      setRecords(transportRecords);
      const paymentsReady = paymentResult.status === "fulfilled";
      const outstandingReady = outstandingResult.status === "fulfilled";
      setLedgerAvailable(paymentsReady && outstandingReady);
      setPayments(paymentsReady && Array.isArray(paymentResult.value.data) ? paymentResult.value.data : []);
      setTransporters(outstandingReady
        ? outstandingResult.value.data?.transporters || []
        : summarizeOutstanding(transportRecords, "transportName"));
      setParties(outstandingReady
        ? outstandingResult.value.data?.parties || []
        : summarizeOutstanding(transportRecords, "partyName"));
      if (!paymentsReady || !outstandingReady) {
        setBackendWarning("The deployed backend does not have the payment ledger routes yet. Outstanding balances below are calculated from transport records; recording payments and viewing transaction history require a backend redeploy.");
      } else {
        setBackendWarning("");
      }
      setError("");
    } catch (err) { setError(err.response?.data?.message || "Could not load transport records"); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const selected = records.find((record) => record._id === selectedId);
  const outstandingGroups = outstandingView === "parties" ? parties : transporters;
  const totalOutstanding = outstandingGroups.reduce((sum, group) => sum + group.balance, 0);
  const visiblePayments = useMemo(() => payments.filter((payment) => `${payment.transportName} ${payment.freightMemoNo} ${payment.reference}`.toLowerCase().includes(filter.toLowerCase())), [payments, filter]);

  const submit = async (event) => {
    event.preventDefault(); setError("");
    try {
      if (!ledgerAvailable) throw new Error("The payment ledger is unavailable until the backend is redeployed.");
      await api.post("/payments", { ...form, transportId: selectedId });
      setForm((current) => ({ ...current, amount: "", reference: "" }));
      await refresh();
    } catch (err) { setError(err.response?.data?.message || "Unable to record payment"); }
  };

  return <><Navbar /><PageContainer title="Transporter Payments & Outstanding" subtitle="Record transporter payments, review transaction history, and compare party or transporter aging.">
    {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
    {backendWarning && <p role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">{backendWarning}</p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="cardDash rounded-2xl p-5"><p className="metric-label">{outstandingView === "parties" ? "Party outstanding" : "Outstanding to transporters"}</p><p className="metric-value mt-2 text-orange-600">{money(totalOutstanding)}</p></div>
      <div className="cardDash rounded-2xl p-5"><p className="metric-label">{outstandingView === "parties" ? "Parties" : "Transporters"} with balance</p><p className="metric-value mt-2">{outstandingGroups.length}</p></div>
      <div className="cardDash rounded-2xl p-5"><p className="metric-label">Ledger transactions</p><p className="metric-value mt-2">{payments.length}</p></div>
    </div>

    {isAdmin && ledgerAvailable ? <section className="glass-panel mt-6 p-5">
      <h2 className="mb-4 text-lg font-semibold">Record a payment</h2>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <select className="lg:col-span-2" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} required>
          <option value="">Choose outstanding trip</option>
          {records.filter((record) => Number(record.balance) > 0).map((record) => <option key={record._id} value={record._id}>{record.transportName} · Memo {record.freightMemoNo} · Due {money(record.balance)}</option>)}
        </select>
        <input type="number" min="0.01" step="0.01" max={selected?.balance} placeholder="Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
        <input type="date" value={form.paymentDate} onChange={(event) => setForm({ ...form, paymentDate: event.target.value })} required />
        <select value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}><option>Bank Transfer</option><option>UPI</option><option>Cash</option><option>Cheque</option><option>Other</option></select>
        <input placeholder="Reference (optional)" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} />
        <div className="flex items-center gap-3 lg:col-span-6"><button className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white disabled:opacity-50" disabled={!selectedId}>Save payment</button>{selected && <span className="text-sm text-slate-500">Remaining after payment: {money(Math.max(0, Number(selected.balance) - Number(form.amount || 0)))}</span>}</div>
      </form>
      <p className="mt-3 text-xs text-slate-500">Each entry is saved as a separate ledger transaction.</p>
    </section> : <p className="mt-6 rounded-xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">{isAdmin ? "Payment entry will be enabled when the payment routes are deployed." : "Administrators can record payments. You can review the ledger and outstanding balances here."}</p>}

    <section className="glass-panel mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><div><h2 className="text-lg font-semibold">{outstandingView === "parties" ? "Party-wise outstanding" : "Transporter-wise outstanding"}</h2><p className="text-sm text-slate-500">Aging is calculated from the trip date.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setOutstandingView("parties")} className={`rounded-xl px-3 py-2 text-sm ${outstandingView === "parties" ? "bg-blue-600 text-white" : "border"}`}>Parties</button><button type="button" onClick={() => setOutstandingView("transporters")} className={`rounded-xl px-3 py-2 text-sm ${outstandingView === "transporters" ? "bg-blue-600 text-white" : "border"}`}>Transporters</button><input className="max-w-xs" placeholder={`Search ${outstandingView === "parties" ? "party" : "transporter"}`} value={filter} onChange={(event) => setFilter(event.target.value)} /></div></div>
      <div className="overflow-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr><th className="p-3 text-left">{outstandingView === "parties" ? "Party" : "Transporter"}</th><th className="p-3 text-right">Outstanding</th><th className="p-3 text-right">0–30 days</th><th className="p-3 text-right">31–60 days</th><th className="p-3 text-right">61–90 days</th><th className="p-3 text-right">90+ days</th></tr></thead><tbody>{outstandingGroups.filter((group) => (group.partyName || group.transportName).toLowerCase().includes(filter.toLowerCase())).map((group) => <tr className="border-t" key={group.partyName || group.transportName}><td className="p-3 font-medium">{group.partyName || group.transportName}<span className="ml-2 text-xs text-slate-500">{group.records} trips</span></td><td className="p-3 text-right font-semibold">{money(group.balance)}</td><td className="p-3 text-right">{money(group.days0to30)}</td><td className="p-3 text-right">{money(group.days31to60)}</td><td className="p-3 text-right">{money(group.days61to90)}</td><td className="p-3 text-right">{money(group.days90plus)}</td></tr>)}{!loading && outstandingGroups.length === 0 && <tr><td className="p-5 text-center text-slate-500" colSpan="6">No outstanding balances.</td></tr>}</tbody></table></div>
    </section>

    <section className="glass-panel mt-6 overflow-hidden"><div className="border-b p-5"><h2 className="text-lg font-semibold">Transporter payment ledger</h2><p className="text-sm text-slate-500">Previous and remaining balances are recorded for each transporter transaction.</p></div><div className="overflow-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Transporter / Memo</th><th className="p-3 text-left">Method / Reference</th><th className="p-3 text-right">Paid</th><th className="p-3 text-right">Previous due</th><th className="p-3 text-right">Remaining</th></tr></thead><tbody>{visiblePayments.map((payment) => <tr className="border-t" key={payment._id}><td className="p-3">{dateLabel(payment.paymentDate)}</td><td className="p-3">{payment.transportName} / {payment.freightMemoNo ?? "—"}</td><td className="p-3">{payment.method}{payment.reference ? ` · ${payment.reference}` : ""}</td><td className="p-3 text-right font-semibold">{money(payment.amount)}</td><td className="p-3 text-right">{money(payment.previousBalance)}</td><td className="p-3 text-right">{money(payment.remainingBalance)}</td></tr>)}{!loading && visiblePayments.length === 0 && <tr><td className="p-5 text-center text-slate-500" colSpan="6">No ledger transactions found.</td></tr>}</tbody></table></div></section>
  </PageContainer></>;
}
