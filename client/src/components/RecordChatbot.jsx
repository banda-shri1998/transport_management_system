import { useState } from "react";
import api from "../services/api";

const money = (value) => `Rs. ${new Intl.NumberFormat("en-IN").format(Number(value || 0))}`;
const date = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "—");

const recordLine = (record) =>
  `FM ${record.freightMemoNo} · ${record.vehicleNo} · ${record.partyName} · ${date(record.date)} · Balance ${money(record.balance)}`;

function answerFor(question, records) {
  const query = question.toLowerCase().trim();
  const total = records.length;
  const revenue = records.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);
  const fuel = records.reduce((sum, r) => sum + Number(r.fuelExpense || 0), 0);
  const balance = records.reduce((sum, r) => sum + Number(r.balance || 0), 0);

  if (/^(help|what can you do|how does this work)/.test(query)) {
    return "I can find records by freight memo, vehicle, LR number, party or transporter, and provide totals for records, revenue, fuel and unpaid balance.";
  }
  if (/(total|summary|how many|count).*(record|trip)|^(record|trip).*(total|count)/.test(query)) {
    return `There are ${total} stored transport records.`;
  }
  if (/(total|summary).*(revenue|freight|amount)/.test(query)) return `Total freight revenue is ${money(revenue)} across ${total} records.`;
  if (/(total|summary).*(fuel)/.test(query)) return `Total fuel expense is ${money(fuel)}.`;
  if (/(total|summary|unpaid|pending|due).*(balance|payment|amount)|^(unpaid|pending|due)/.test(query)) return `The current outstanding balance is ${money(balance)}.`;

  const words = query.split(/\s+/).filter((word) => word.length > 1 && !["show", "find", "record", "records", "for", "with", "vehicle", "memo", "freight", "lr", "number", "no", "the", "about"].includes(word));
  const matches = records.filter((record) => {
    const searchable = [record.freightMemoNo, record.vehicleNo, record.partyName, record.transportName, record.location, ...(record.lrNo || [])].join(" ").toLowerCase();
    return words.length > 0 && words.every((word) => searchable.includes(word));
  });
  if (!matches.length) return "I couldn't find a matching record. Try a freight memo number, vehicle number, LR number, party, or transporter name.";
  const shown = matches.slice(0, 5).map(recordLine).join("\n");
  return `I found ${matches.length} matching record${matches.length === 1 ? "" : "s"}:\n${shown}${matches.length > 5 ? "\nShowing the first 5." : ""}`;
}

export default function RecordChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "bot", text: "Hi! Ask me about your transport records, such as “show freight memo 1024” or “what is the total unpaid balance?”" }]);
  const [loading, setLoading] = useState(false);

  const ask = async (event) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", text: question }]);
    setLoading(true);
    try {
      const response = await api.get("/transports");
      setMessages((current) => [...current, { role: "bot", text: answerFor(question, response.data) }]);
    } catch {
      setMessages((current) => [...current, { role: "bot", text: "I couldn't load the records right now. Please check your connection and try again." }]);
    } finally { setLoading(false); }
  };

  if (!localStorage.getItem("token")) return null;
  return <div className="fixed bottom-5 right-5 z-50">
    {open && <section className="mb-3 flex h-[440px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <header className="bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 text-white"><h2 className="font-semibold">Records assistant</h2><p className="text-xs text-white/80">Live answers from stored transport records</p></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.map((message, index) => <div key={index} className={`whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${message.role === "user" ? "ml-8 bg-blue-600 text-white" : "mr-4 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"}`}>{message.text}</div>)}{loading && <p className="text-sm text-slate-500">Looking through records…</p>}</div>
      <form onSubmit={ask} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-700"><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about a record…" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /><button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={loading}>Send</button></form>
    </section>}
    <button onClick={() => setOpen((value) => !value)} className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-medium text-white shadow-xl shadow-blue-500/30 hover:-translate-y-0.5" aria-label="Open records assistant">{open ? "Close chat" : "Ask records"}</button>
  </div>;
}
