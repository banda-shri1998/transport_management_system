import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import TransportForm from "../components/TransportForm";
import api from "../services/api";

const REQUIRED_IMPORT_COLUMNS = [
  "date",
  "transportName",
  "freightMemoNo",
  "vehicleNo",
  "partyName",
];

const HEADER_ALIASES = {
  date: "date",
  transport: "transportName",
  transporter: "transportName",
  transportname: "transportName",
  fmno: "freightMemoNo",
  freightmemo: "freightMemoNo",
  freightmemono: "freightMemoNo",
  lr: "lrNo",
  lrno: "lrNo",
  vehicle: "vehicleNo",
  vehicleno: "vehicleNo",
  truckno: "vehicleNo",
  party: "partyName",
  partyname: "partyName",
  company: "company",
  ut: "company",
  zc: "company",
  jk: "company",
  location: "location",
  solapurto: "location",
  solapurtolocation: "location",
  solapurtodestination: "location",
  qty: "quantity",
  quantity: "quantity",
  freight: "rate",
  rate: "rate",
  total: "totalAmount",
  totalamount: "totalAmount",
  advance: "advancePaid",
  advancepaid: "advancePaid",
  fuelrate: "fuelRate",
  diesel: "fuelQuantity",
  fuelquantity: "fuelQuantity",
  fuelqty: "fuelQuantity",
  fuelexpense: "fuelExpense",
  cngbill: "cngBill",
  fueltype: "fuelType",
  previousclosingbalance: "previousClosingBalance",
  prevbalance: "previousClosingBalance",
  paymentdate: "paymentDate",
  payamount: "payAmount",
  balance: "balance",
};

const parseCsv = (text) => {
  const rows = [];
  let value = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value.length > 0 || row.length > 0) rows.push([...row, value]);
  return rows.filter((currentRow) =>
    currentRow.some((cell) => String(cell).trim() !== ""),
  );
};

const normalizeHeader = (value) =>
  String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const hasValue = (value) => {
  const normalized = String(value ?? "").trim().replace(/,/g, "");
  return normalized !== "" && normalized !== "-";
};

const findHeaderRow = (rows) =>
  rows.findIndex((row) => {
    const mappedColumns = row
      .map((value) => HEADER_ALIASES[normalizeHeader(value)])
      .filter(Boolean);
    return (
      mappedColumns.includes("date") &&
      mappedColumns.filter((value, index, values) => values.indexOf(value) === index)
        .length >= 3
    );
  });

const mapImportRows = (rows) => {
  const headerRowIndex = findHeaderRow(rows);
  if (headerRowIndex < 0) return null;

  const columns = rows[headerRowIndex].map(
    (header) => HEADER_ALIASES[normalizeHeader(header)] || "",
  );
  const foundRequiredColumns = new Set(columns);
  const missingColumns = REQUIRED_IMPORT_COLUMNS.filter(
    (column) => !foundRequiredColumns.has(column),
  );

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  }

  const records = rows
    .slice(headerRowIndex + 1)
    .filter((row) => row.some(hasValue))
    .map((row) => {
      const record = {};
      columns.forEach((column, index) => {
        if (column && hasValue(row[index])) record[column] = row[index];
      });

      // The Suyog daily report stores CNG expenditure in a separate column.
      if (hasValue(record.cngBill) && !hasValue(record.fuelExpense)) {
        record.fuelExpense = record.cngBill;
        record.fuelType = "CNG";
      }

      delete record.cngBill;
      return record;
    });

  return records;
};

export default function AddRecord() {
  const navigate = useNavigate();

  const initialFormState = {
    date: "",
    transportName: "",
    freightMemoNo: "",
    lrNo: "",
    vehicleNo: "",
    partyName: "",
    company: "",
    location: "",
    quantity: "",
    rate: "",
    totalAmount: 0,
    advancePaid: "",
    fuelType: "",
    fuelRate: "",
    fuelQuantity: "",
    fuelExpense: 0,
    balance: 0,
    paymentDate: "",
    payAmount: "",
  };

  const [form, setForm] = useState(initialFormState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.post("/transports", form);
      setForm(initialFormState);
      navigate("/", { state: { success: true } });
    } catch (saveError) {
      setError(
        saveError.response?.data?.message ||
          saveError.message ||
          "Unable to save record",
      );
    } finally {
      setSaving(false);
    }
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
    if (!file) return;

    setError("");
    setMessage("");
    setImporting(true);

    try {
      let records = null;

      if (/\.xlsx?$/i.test(file.name)) {
        const workbook = XLSX.read(await file.arrayBuffer(), {
          type: "array",
          raw: false,
        });

        for (const sheetName of workbook.SheetNames) {
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            header: 1,
            defval: "",
            raw: false,
          });
          records = mapImportRows(rows);
          if (records) break;
        }
      } else {
        records = mapImportRows(parseCsv(await file.text()));
      }

      if (!records) {
        throw new Error(
          "No supported header row was found. Upload a CSV, XLS, or XLSX file with transport record columns.",
        );
      }

      if (records.length === 0) throw new Error("The selected file has no data rows");

      const response = await api.post("/transports/import", { records });
      setImportSummary(response.data);
      setMessage("");
    } catch (importError) {
      setError(
        importError.response?.data?.message || importError.message || "Import failed",
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const downloadErrorReport = () => {
    const rows = (importSummary?.duplicates || []).map((item) => ({
      Row: item.row,
      "Freight Memo No": item.freightMemoNo || "",
      Reason: item.reason,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 10 }, { wch: 20 }, { wch: 48 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Import Errors");
    XLSX.writeFile(workbook, "transport-import-errors.xlsx");
  };

  return (
    <>
      <Navbar />
      <PageContainer
        title="Add Transport Record"
        subtitle="Create a new transport entry with automatic freight, fuel, and balance calculations."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={downloadTemplate}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Download Template
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import Records"}
            </button>
          </>
        }
      >
        <TransportForm
          form={form}
          setForm={setForm}
          onSubmit={submit}
          submitText={saving ? "Saving..." : "Save Record"}
          isEdit={false}
        />
        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/80 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/40 dark:text-emerald-300">
            {message}
          </p>
        )}
        {importSummary && (() => {
          const skipped = importSummary.duplicates || [];
          const duplicates = skipped.filter((item) => /duplicate/i.test(item.reason));
          const failed = skipped.filter((item) => !/duplicate/i.test(item.reason));
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Import Completed</h2>
                    <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      <p>✔ Imported: <strong>{importSummary.count || 0}</strong></p>
                      <p>⚠ Duplicates: <strong>{duplicates.length}</strong></p>
                      <p>❌ Failed: <strong>{failed.length}</strong></p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setImportSummary(null)} className="rounded-xl px-3 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close import summary">✕</button>
                </div>
                {skipped.length > 0 && (
                  <div className="mt-5 max-h-64 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800"><tr><th className="px-4 py-3">Row</th><th className="px-4 py-3">Reason</th></tr></thead>
                      <tbody>{skipped.map((item, index) => <tr key={`${item.row}-${index}`} className="border-t border-slate-200 dark:border-slate-700"><td className="px-4 py-3">{item.row}</td><td className="px-4 py-3">{item.reason}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
                <div className="mt-6 flex justify-end gap-3">
                  {skipped.length > 0 && <button type="button" onClick={downloadErrorReport} className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">Download Error Report</button>}
                  <button type="button" onClick={() => setImportSummary(null)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900">Done</button>
                </div>
              </div>
            </div>
          );
        })()}
      </PageContainer>
    </>
  );
}
