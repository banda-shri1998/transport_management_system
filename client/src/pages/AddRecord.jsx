import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import TransportForm from "../components/TransportForm";
import api from "../services/api";
import useAuth from "../hooks/useAuth";

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
  trannsportname: "transportName",
  fmno: "freightMemoNo",
  freightmemo: "freightMemoNo",
  freightmemono: "freightMemoNo",
  lr: "lrNo",
  lrno: "lrNo",
  lrno0: "lrNo",
  lrno1: "lrNo",
  lrno2: "lrNo",
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
        if (!column || !hasValue(row[index])) return;
        if (column === "lrNo" && hasValue(record.lrNo)) {
          record.lrNo = `${record.lrNo}|${row[index]}`;
          return;
        }
        record[column] = row[index];
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
  const { user } = useAuth();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

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
  const [importPreview, setImportPreview] = useState(null);
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

  const validatePreviewRows = async (previewRows) => {
    setImporting(true);
    setError("");
    try {
      const response = await api.post("/transports/import/validate", {
        records: previewRows.map((item) => item.record),
      });
      const currentByRow = new Map(previewRows.map((item) => [item.row, item]));
      const rows = response.data.rows.map((item) => {
        const prior = currentByRow.get(item.row);
        return {
          ...item,
          include: item.valid ? (prior ? prior.include : true) : false,
          needsValidation: false,
        };
      });
      setImportPreview({ rows, fallback: false });
    } catch (validationError) {
      if (validationError.response?.status === 404) {
        const seenMemos = new Set();
        const currentByRow = new Map(previewRows.map((item) => [item.row, item]));
        const rows = previewRows.map((item) => {
          const reasons = [];
          const record = item.record;
          if (!hasValue(record.date)) reasons.push("Date is required");
          if (!hasValue(record.transportName)) reasons.push("Transport Name is required");
          if (!hasValue(record.freightMemoNo) || !Number.isInteger(Number(record.freightMemoNo))) reasons.push("Freight Memo No must be an integer");
          if (!hasValue(record.vehicleNo)) reasons.push("Vehicle No is required");
          if (!hasValue(record.partyName)) reasons.push("Party Name is required");
          const memo = String(record.freightMemoNo ?? "").trim();
          if (memo && seenMemos.has(memo)) reasons.push("Duplicate Freight Memo No in this file");
          if (memo) seenMemos.add(memo);
          const valid = reasons.length === 0;
          const prior = currentByRow.get(item.row);
          return {
            ...item,
            valid,
            reason: reasons.join("; "),
            include: valid ? (prior ? prior.include : true) : false,
            needsValidation: false,
          };
        });
        setImportPreview({ rows, fallback: true });
      } else {
        setError(validationError.response?.data?.message || validationError.message || "Could not validate import rows");
      }
    } finally {
      setImporting(false);
    }
  };

  const updatePreviewRecord = (rowIndex, field, value) => {
    setImportPreview((current) => ({
      ...current,
      rows: current.rows.map((item, index) => index === rowIndex
        ? { ...item, record: { ...item.record, [field]: value }, needsValidation: true }
        : item),
    }));
  };

  const confirmImport = async () => {
    const records = importPreview.rows
      .filter((item) => item.include && item.valid && !item.needsValidation)
      .map((item) => item.record);
    if (!records.length) return;
    setImporting(true);
    setError("");
    try {
      const response = await api.post("/transports/import", { records });
      setImportSummary(response.data);
      setImportPreview(null);
    } catch (importError) {
      setError(importError.response?.data?.message || importError.message || "Import failed");
    } finally {
      setImporting(false);
    }
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

      await validatePreviewRows(records.map((record, index) => ({
        row: index + 2,
        record,
        valid: false,
        include: true,
        needsValidation: false,
      })));
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
            {isAdmin && <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleImportFile}
                className="hidden"
              />}
            <button
              type="button"
              onClick={downloadTemplate}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Download Template
            </button>
            {isAdmin ? <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {importing ? "Preparing preview..." : "Import Records"}
              </button> : <span className="self-center text-xs text-slate-500">Bulk import is available to admins.</span>}
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
        {importPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <section className="max-h-[92vh] w-full max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5 dark:border-slate-700">
                <div>
                  <h2 className="text-xl font-semibold">Import Preview & Validation</h2>
                  <p className="mt-1 text-sm text-slate-500">{importPreview.rows.filter((item) => item.valid && !item.needsValidation).length} valid · {importPreview.rows.filter((item) => !item.valid || item.needsValidation).length} need attention. Correct required fields, revalidate, then choose rows to import.</p>
                  {importPreview.fallback && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Server-side preview validation is unavailable on this deployment. This preview checks required fields and duplicate memo numbers in the file; the import endpoint will still apply its database duplicate and cancellation checks.</p>}
                </div>
                <button type="button" onClick={() => setImportPreview(null)} className="rounded-xl border px-3 py-2">Close</button>
              </div>
              <div className="max-h-[calc(92vh-150px)] overflow-auto p-5">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800"><tr><th className="p-2">Import</th><th className="p-2">Source row</th><th className="p-2">Date</th><th className="p-2">Transporter</th><th className="p-2">Memo No</th><th className="p-2">Vehicle</th><th className="p-2">Party</th><th className="p-2">Validation</th></tr></thead>
                  <tbody>{importPreview.rows.map((item, index) => <tr key={item.row} className="border-b dark:border-slate-800">
                    <td className="p-2"><input aria-label={`Import row ${item.row}`} type="checkbox" checked={Boolean(item.include)} disabled={!item.valid || item.needsValidation} onChange={(event) => setImportPreview((current) => ({ ...current, rows: current.rows.map((row, rowIndex) => rowIndex === index ? { ...row, include: event.target.checked } : row) }))} /></td>
                    <td className="p-2">{item.row}</td>
                    {[["date", "Date"], ["transportName", "Transporter"], ["freightMemoNo", "Memo No"], ["vehicleNo", "Vehicle"], ["partyName", "Party"]].map(([field, label]) => <td className="p-2" key={field}><input aria-label={`${label}, row ${item.row}`} className="min-w-28" value={item.record[field] ?? ""} onChange={(event) => updatePreviewRecord(index, field, event.target.value)} /></td>)}
                    <td className={`max-w-xs p-2 text-xs ${item.valid && !item.needsValidation ? "text-emerald-600" : "text-amber-600"}`}>{item.needsValidation ? "Edited — revalidate" : item.valid ? "Valid" : item.reason}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="flex flex-wrap justify-end gap-3 border-t p-5 dark:border-slate-700">
                <button type="button" disabled={importing} onClick={() => validatePreviewRows(importPreview.rows)} className="rounded-xl border px-4 py-2.5 disabled:opacity-50">{importing ? "Validating..." : "Validate Rows"}</button>
                <button type="button" disabled={importing || !importPreview.rows.some((item) => item.include && item.valid && !item.needsValidation)} onClick={confirmImport} className="rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white disabled:opacity-50">{importing ? "Importing..." : `Import ${importPreview.rows.filter((item) => item.include && item.valid && !item.needsValidation).length} Selected`}</button>
              </div>
            </section>
          </div>
        )}
        {importSummary && (() => {
          const skipped = importSummary.duplicates || [];
          const duplicates = skipped.filter((item) => /duplicate/i.test(item.reason));
          const cancelled = skipped.filter((item) => /cancelled/i.test(item.reason));
          const failed = skipped.filter(
            (item) =>
              !/duplicate/i.test(item.reason) &&
              !/cancelled/i.test(item.reason),
          );
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Import Completed</h2>
                    <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      <p>✔ Imported: <strong>{importSummary.count || 0}</strong></p>
                      <p>⚠ Duplicates: <strong>{duplicates.length}</strong></p>
                      <p>🚫 Cancelled: <strong>{cancelled.length}</strong></p>
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
