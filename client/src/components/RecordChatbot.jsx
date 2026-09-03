import { useState } from "react";
import api from "../services/api";

const money = (value) =>
  `Rs. ${new Intl.NumberFormat("en-IN").format(Number(value || 0))}`;
const rupee = (value) =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value || 0))}`;
const date = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "—";
const shortDate = (value) => {
  if (!value) return "—";
  const dt = new Date(value);
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const year = dt.getFullYear();
  return `${day}-${month}-${year}`;
};
const number = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
    Number(value || 0),
  );

const formatLrNo = (record) => {
  const lrNos = Array.isArray(record.lrNo)
    ? record.lrNo.filter(Boolean)
    : [record.lrNo].filter(Boolean);
  return lrNos.length ? lrNos.join(", ") : "—";
};

const recordStatus = (record) => {
  const status = record.paymentStatus || record.status;
  if (status) return status;
  return Number(record.balance || 0) > 0 ? "Unpaid" : "Paid";
};

const singleRecordDetail = (record) => {
  const quantity = Number(record.quantity || 0);
  const rate = Number(record.rate || 0);
  const fuelQty = Number(record.fuelQuantity || 0);
  const fuelRate = Number(record.fuelRate || 0);
  const partyLabel = record.location
    ? `${record.partyName || "—"} (${record.location})`
    : record.partyName || "—";

  return [
    `Freight memo no. ${record.freightMemoNo} for ${record.transportName || "—"} (Vehicle: ${record.vehicleNo || "—"}) on ${shortDate(record.date)}.`,
    `- Party: ${partyLabel}`,
    `- LR No: ${formatLrNo(record)}`,
    `- Quantity / Rate: ${number(quantity)} @ ${number(rate)}`,
    `- Total Amount: ${rupee(record.totalAmount)}`,
    `- Advance Paid: ${rupee(record.advancePaid)}`,
    `- Diesel Expense: ${number(fuelQty)} L @ ${rupee(fuelRate)} = ${rupee(record.fuelExpense)}`,
    `- Balance: ${rupee(record.balance)}`,
    `- Status: ${recordStatus(record)}`,
  ].join("\n");
};

const recordLine = (record) => {
  const statusText = recordStatus(record);
  const statusIcon =
    statusText && statusText.toLowerCase().includes("paid")
      ? "✅ Paid"
      : "⚠️ Unpaid";
  const transport = `${record.transportName || "—"} (${record.vehicleNo || "—"})`;
  const party = `${record.partyName || "—"} (${record.location || "—"})`;

  return `• Memo #${record.freightMemoNo} | ${shortDate(record.date)} | ${transport} | ${party} | Total: ${rupee(record.totalAmount)} | Bal: ${rupee(record.balance)} | ${statusIcon}`;
};

const formatDateLedger = (records) => {
  if (!records.length) return "";

  const dates = [
    ...new Set(records.map((record) => new Date(record.date))),
  ].sort((a, b) => a.getTime() - b.getTime());

  const start = shortDate(dates[0]);
  const end = shortDate(dates[dates.length - 1]);
  const pendingBalance = records.reduce(
    (sum, record) => sum + Number(record.balance || 0),
    0,
  );

  const lines = [
    `📦 **Freight Ledger Update (${start} - ${end})**`,
    "",
    ...records.map((record) => recordLine(record)),
    "",
    `💳 **Summary:** ${records.length} Records | **Total Pending Balance:** ${rupee(pendingBalance)}`,
  ];

  return lines.join("\n");
};

const normalizeNumeric = (value) => String(value ?? "").replace(/[^0-9]/g, "");

const getLrValues = (record) => {
  if (Array.isArray(record.lrNo)) return record.lrNo.filter(Boolean);
  return record.lrNo ? [record.lrNo] : [];
};

const parseDateToYmd = (rawValue) => {
  if (!rawValue) return null;
  const value = String(rawValue).trim();
  const dateFormats = [
    { regex: /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/, order: "ymd" },
    { regex: /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/, order: "dmy" },
  ];

  for (const format of dateFormats) {
    const match = value.match(format.regex);
    if (!match) continue;

    let year = match[1];
    let month = match[2];
    let day = match[3];

    if (format.order === "dmy") {
      day = match[1];
      month = match[2];
      year = match[3];
    }

    if (year.length === 2) year = `20${year}`;
    const dt = new Date(Number(year), Number(month) - 1, Number(day));
    if (Number.isNaN(dt.getTime())) continue;

    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }

  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return null;
  return `${asDate.getFullYear()}-${String(asDate.getMonth() + 1).padStart(2, "0")}-${String(asDate.getDate()).padStart(2, "0")}`;
};

const recordMatchesDate = (record, targetDate) => {
  if (!targetDate) return false;
  const value = record.date ? new Date(record.date) : null;
  if (!value || Number.isNaN(value.getTime())) return false;
  const recordDate = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  return recordDate === targetDate;
};

const sortByFreightMemo = (records) =>
  [...records].sort((left, right) => {
    const leftValue = Number(normalizeNumeric(left.freightMemoNo) || 0);
    const rightValue = Number(normalizeNumeric(right.freightMemoNo) || 0);
    return leftValue - rightValue;
  });

function answerFor(question, records) {
  const query = question.toLowerCase().trim();
  const total = records.length;
  const revenue = records.reduce(
    (sum, r) => sum + Number(r.totalAmount || 0),
    0,
  );
  const fuel = records.reduce((sum, r) => sum + Number(r.fuelExpense || 0), 0);
  const balance = records.reduce((sum, r) => sum + Number(r.balance || 0), 0);

  if (/^(help|what can you do|how does this work)/.test(query)) {
    return "I can find records by freight memo, vehicle, LR number, party or transporter, and provide totals for records, revenue, fuel and unpaid balance.";
  }
  if (
    /(total|summary|how many|count).*(record|trip)|^(record|trip).*(total|count)/.test(
      query,
    )
  ) {
    return `There are ${total} stored transport records.`;
  }
  if (/(total|summary).*(revenue|freight|amount)/.test(query))
    return `Total freight revenue is ${money(revenue)} across ${total} records.`;
  if (/(total|summary).*(fuel)/.test(query))
    return `Total fuel expense is ${money(fuel)}.`;
  if (
    /(total|summary|unpaid|pending|due).*(balance|payment|amount)|^(unpaid|pending|due)/.test(
      query,
    )
  )
    return `The current outstanding balance is ${money(balance)}.`;

  const fmMatch = query.match(
    /(?:^|\s)(?:fm|freight\s+memo)[-\s]*([0-9]+)(?:\s|$)|(?:^|\s)fm\s*#?([0-9]+)(?:\s|$)/i,
  );
  if (fmMatch) {
    const target = normalizeNumeric(fmMatch[1] || fmMatch[2]);
    const matches = records.filter(
      (record) => normalizeNumeric(record.freightMemoNo) === target,
    );
    if (!matches.length)
      return "I couldn't find a record with that freight memo number.";
    if (matches.length === 1) return singleRecordDetail(matches[0]);
    const shown = sortByFreightMemo(matches)
      .slice(0, 5)
      .map(recordLine)
      .join("\n");
    return `I found ${matches.length} matching freight memo records:\n${shown}${matches.length > 5 ? "\nShowing the first 5." : ""}`;
  }

  const lrMatch = query.match(
    /(?:^|\s)lr[-\s]*([0-9]+)(?:\s|$)|(?:^|\s)show\s+lr\s+([0-9]+)(?:\s|$)|(?:^|\s)find\s+lr\s+([0-9]+)(?:\s|$)/i,
  );
  if (lrMatch) {
    const target = normalizeNumeric(lrMatch[1] || lrMatch[2] || lrMatch[3]);
    const matches = records.filter((record) =>
      getLrValues(record).some((value) => normalizeNumeric(value) === target),
    );
    if (!matches.length) return "I couldn't find a record with that LR number.";
    if (matches.length === 1) return singleRecordDetail(matches[0]);
    const shown = sortByFreightMemo(matches)
      .slice(0, 5)
      .map(recordLine)
      .join("\n");
    return `I found ${matches.length} matching LR records:\n${shown}${matches.length > 5 ? "\nShowing the first 5." : ""}`;
  }

  const dateFromQuery = query.match(
    /(?:^|\s)(?:records?\s+on\s+)?(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})(?:\s|$)/,
  );
  if (dateFromQuery) {
    const targetDate = parseDateToYmd(dateFromQuery[1]);
    if (targetDate) {
      const matches = sortByFreightMemo(
        records.filter((record) => recordMatchesDate(record, targetDate)),
      );
      if (!matches.length)
        return `I couldn't find any records for ${dateFromQuery[1]}.`;
      const shown = matches.slice(0, 20).map(recordLine).join("\n");
      const summary = `📦 **Freight Ledger Update (${shortDate(matches[0].date)} - ${shortDate(matches[matches.length - 1].date)})**\n\n${shown}\n\n💳 **Summary:** ${matches.length} Records | **Total Pending Balance:** ${rupee(matches.reduce((sum, record) => sum + Number(record.balance || 0), 0))}`;
      return summary;
    }
  }

  const words = query
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 1 &&
        ![
          "show",
          "find",
          "record",
          "records",
          "for",
          "with",
          "vehicle",
          "memo",
          "freight",
          "lr",
          "number",
          "no",
          "the",
          "about",
        ].includes(word),
    );
  const matches = records.filter((record) => {
    const searchable = [
      record.freightMemoNo,
      record.vehicleNo,
      record.partyName,
      record.transportName,
      record.location,
      ...getLrValues(record),
    ]
      .join(" ")
      .toLowerCase();
    return words.length > 0 && words.every((word) => searchable.includes(word));
  });
  if (!matches.length)
    return "I couldn't find a matching record. Try a freight memo number, vehicle number, LR number, party, or transporter name.";
  if (matches.length === 1) return singleRecordDetail(matches[0]);
  const shown = matches.slice(0, 5).map(recordLine).join("\n");
  return `I found ${matches.length} matching record${matches.length === 1 ? "" : "s"}:\n${shown}${matches.length > 5 ? "\nShowing the first 5." : ""}`;
}

export default function RecordChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! Ask me about your transport records, such as “show freight memo 1024” or “what is the total unpaid balance?”",
    },
  ]);
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
      setMessages((current) => [
        ...current,
        { role: "bot", text: answerFor(question, response.data) },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text: "I couldn't load the records right now. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!localStorage.getItem("token")) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section className="mb-3 flex h-[440px] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <header className="bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-4 text-white">
            <h2 className="font-semibold">Records assistant</h2>
            <p className="text-xs text-white/80">
              Live answers from stored transport records
            </p>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${message.role === "user" ? "ml-8 bg-blue-600 text-white" : "mr-4 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"}`}
              >
                {message.text}
              </div>
            ))}
            {loading && (
              <p className="text-sm text-slate-500">Looking through records…</p>
            )}
          </div>
          <form
            onSubmit={ask}
            className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-700"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a record…"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <button
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={loading}
            >
              Send
            </button>
          </form>
        </section>
      )}
      <button
        onClick={() => setOpen((value) => !value)}
        className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-medium text-white shadow-xl shadow-blue-500/30 hover:-translate-y-0.5"
        aria-label="Open records assistant"
      >
        {open ? "Close chat" : "Ask records"}
      </button>
    </div>
  );
}
