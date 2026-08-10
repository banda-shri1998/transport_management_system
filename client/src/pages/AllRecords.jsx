import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";

const EXPORT_COLUMNS = [
  "date",
  "transportName",
  "freightMemoNo",
  "lrNo",
  "vehicleNo",
  "partyName",
  "company",
  "location",
  "quantity",
  "rate",
  "totalAmount",
  "advancePaid",
  "fuelType",
  "fuelRate",
  "fuelQuantity",
  "fuelExpense",
  "previousClosingBalance",
  "paymentDate",
  "payAmount",
  "balance",
];

const escapeCsvValue = (value) => {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const parseCsv = (text) => {
  const rows = [];
  let currentValue = "";
  let currentRow = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => String(cell).trim() !== ""));
};

const normalizeHeader = (value) =>
  String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();

const normalizeVehicleToken = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const parseVehicleFilter = (value) =>
  value
    .split(/[\n,]+/)
    .map(normalizeVehicleToken)
    .filter(Boolean);

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function AllRecords() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [importSummary, setImportSummary] = useState(null);
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get("/transports");
      setRecords(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const vehicleTokens = parseVehicleFilter(vehicleFilter);

  const filteredRecords = records.filter((r) => {
    const matchesSearch = [r.vehicleNo, r.partyName, r.lrNo, r.transportName]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    if (!matchesSearch) {
      return false;
    }

    if (vehicleTokens.length === 0) {
      return true;
    }

    const recordVehicle = normalizeVehicleToken(r.vehicleNo);
    return vehicleTokens.some((token) => recordVehicle.includes(token));
  });

  const totalValue = filteredRecords.reduce(
    (sum, record) => sum + (record.totalAmount || 0),
    0,
  );
  const totalBalance = filteredRecords.reduce(
    (sum, record) => sum + (record.balance || 0),
    0,
  );

  const exportRecords = () => {
    const csvRows = [
      EXPORT_COLUMNS,
      ...filteredRecords.map((record) => [
        record.date?.slice(0, 10) || "",
        record.transportName || "",
        record.freightMemoNo ?? "",
        Array.isArray(record.lrNo) ? record.lrNo.join("|") : record.lrNo || "",
        record.vehicleNo || "",
        record.partyName || "",
        record.company || "",
        record.location || "",
        record.quantity ?? 0,
        record.rate ?? 0,
        record.totalAmount ?? 0,
        record.advancePaid ?? 0,
        record.fuelType || "Diesel",
        record.fuelRate ?? 0,
        record.fuelQuantity ?? 0,
        record.fuelExpense ?? 0,
        record.previousClosingBalance ?? 0,
        record.paymentDate?.slice(0, 10) || "",
        record.payAmount ?? 0,
        record.balance ?? 0,
      ]),
    ];

    const csvContent = csvRows
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `transport-records-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setError("");
    setMessage(`${filteredRecords.length} records exported`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/transport-records-template.csv";
    link.download = "transport-records-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setMessage("");
    setError("");
    setImportSummary(null);
    setImporting(true);

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (rows.length < 2) {
        throw new Error("The selected CSV file is empty or missing data rows");
      }

      const headers = rows[0].map(normalizeHeader);
      const missingColumns = EXPORT_COLUMNS.filter(
        (column) => !headers.includes(normalizeHeader(column)),
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Missing required columns: ${missingColumns.join(", ")}`,
        );
      }

      const recordsToImport = rows.slice(1).map((row) => {
        const rowObject = {};

        headers.forEach((header, index) => {
          rowObject[header] = row[index] ?? "";
        });

        return {
          date: rowObject.date,
          transportName: rowObject.transportname,
          freightMemoNo: rowObject.freightmemono,
          lrNo: rowObject.lrno,
          vehicleNo: rowObject.vehicleno,
          partyName: rowObject.partyname,
          company: rowObject.company,
          location: rowObject.location,
          quantity: rowObject.quantity,
          rate: rowObject.rate,
          totalAmount: rowObject.totalamount,
          advancePaid: rowObject.advancepaid,
          fuelType: rowObject.fueltype,
          fuelRate: rowObject.fuelrate,
          fuelQuantity: rowObject.fuelquantity,
          fuelExpense: rowObject.fuelexpense,
          previousClosingBalance: rowObject.previousclosingbalance,
          paymentDate: rowObject.paymentdate,
          payAmount: rowObject.payamount,
          balance: rowObject.balance,
        };
      });

      const response = await api.post("/transports/import", { records: recordsToImport });
      await fetchRecords();
      setImportSummary(response.data);
      setMessage(response.data?.message || `${recordsToImport.length} records imported successfully`);
    } catch (importError) {
      setError(
        importError.response?.data?.message ||
          importError.message ||
          "Import failed",
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <Navbar />

      <PageContainer
        title="All Transport Records"
        subtitle="Browse, search, import, export, and update your complete transport ledger."
      >
        <div className="space-y-8">
          <section className="grid gap-5 md:grid-cols-3">
            <div className="cardDash rounded-3xl p-5">
              <p className="metric-label">Visible records</p>
              <p className="metric-value mt-2">{filteredRecords.length}</p>
            </div>
            <div className="cardDash rounded-3xl p-5">
              <p className="metric-label">Visible freight</p>
              <p className="metric-value mt-2">
                Rs. {formatCurrency(totalValue)}
              </p>
            </div>
            <div className="cardDash rounded-3xl p-5">
              <p className="metric-label">Visible balance</p>
              <p className="metric-value mt-2">
                Rs. {formatCurrency(totalBalance)}
              </p>
            </div>
          </section>

          <section className="glass-panel p-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-start">
              <input
                type="text"
                placeholder="Search vehicle, party, LR, transport..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />

              <textarea
                rows="3"
                placeholder="Filter multiple vehicles: MH12AB1234, MH14CD5678"
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full resize-none"
              />

              <div className="flex flex-wrap gap-2 xl:justify-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  📋 Download Template
                </button>
                <button
                  type="button"
                  onClick={handleImportClick}
                  disabled={importing}
                  className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {importing ? "Importing..." : "Import Records"}
                </button>
                <button
                  type="button"
                  onClick={exportRecords}
                  disabled={filteredRecords.length === 0}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Export Records
                </button>
                <button
                  onClick={() => navigate("/add")}
                  className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 dark:from-white dark:to-slate-300 dark:text-slate-900"
                >
                  + Add Record
                </button>
              </div>
            </div>

            {vehicleTokens.length > 0 && (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Filtering {vehicleTokens.length} vehicle
                {vehicleTokens.length > 1 ? "s" : ""}.
              </p>
            )}

            {message && (
              <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/40 dark:text-emerald-300">
                {message}
              </p>
            )}
            {importSummary?.duplicates?.length > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/80 dark:bg-amber-950/40 dark:text-amber-200">
                <p className="font-semibold">
                  Uploaded {importSummary.total ?? "all"} rows. Imported {importSummary.count ?? 0}. Skipped {importSummary.skipped ?? importSummary.duplicates.length}.
                </p>
                <div className="mt-3 max-h-56 overflow-auto rounded-xl border border-amber-200/80 bg-white/70 dark:border-amber-900/70 dark:bg-slate-950/40">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead>
                      <tr>
                        <th className="px-3 py-2">CSV Row</th>
                        <th className="px-3 py-2">Freight Memo No</th>
                        <th className="px-3 py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importSummary.duplicates.map((duplicate, index) => (
                        <tr key={`${duplicate.row}-${duplicate.freightMemoNo}-${index}`} className="border-t border-amber-200/70 dark:border-amber-900/60">
                          <td className="px-3 py-2">{duplicate.row}</td>
                          <td className="px-3 py-2">{duplicate.freightMemoNo || "-"}</td>
                          <td className="px-3 py-2">{duplicate.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {error && (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/80 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}
          </section>

          <section className="glass-panel overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Vehicle</th>
                    <th className="px-4 py-3 text-left">Transporter</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Party Name</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Fuel Expense</th>
                    <th className="px-4 py-3 text-right">Advance</th>
                    <th className="px-4 py-3 text-center">Payment Amount</th>
                    <th className="px-4 py-3 text-center">Payment Date</th>
                    <th className="px-4 py-3 text-right">Prev. Balance</th>
                    <th className="px-4 py-3 text-right">Current Balance</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan="15"
                        className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                      >
                        Loading records...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan="15"
                        className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                      >
                        No records found
                      </td>
                    </tr>
                  )}

                  {filteredRecords.map((r) => (
                    <tr key={r._id} className="border-t">
                      <td className="px-4 py-3">{r.date?.slice(0, 10)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {r.vehicleNo}
                      </td>
                      <td className="px-4 py-3">{r.transportName}</td>
                      <td className="px-4 py-3">{r.location}</td>
                      <td className="px-4 py-3">{r.partyName}</td>
                      <td className="px-4 py-3 text-right">{r.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(r.rate)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(r.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(r.fuelExpense)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(r.advancePaid)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatCurrency(r.payAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.paymentDate ? r.paymentDate.slice(0, 10) : "-"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          (r.previousClosingBalance || 0) > 0 ? "text-orange-500" : "text-emerald-600"
                        }`}
                      >
                        Rs. {formatCurrency(r.previousClosingBalance || 0)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          r.balance > 0 ? "text-orange-500" : "text-emerald-600"
                        }`}
                      >
                        Rs. {formatCurrency(r.balance)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/edit/${r._id}`)}
                          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900/80 dark:bg-blue-950/40 dark:text-blue-300"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </PageContainer>
    </>
  );
}
