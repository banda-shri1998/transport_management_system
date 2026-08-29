import Navbar from "../components/Navbar";
import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import PageContainer from "../components/PageContainer";
import api from "../services/api";
import FreightFilterPanel from "../components/reports/FreightFilterPanel";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const normalizeHeader = (value) =>
  String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

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

const parseNumber = (value) => {
  const number = Number(
    String(value || "")
      .replace(/,/g, "")
      .trim(),
  );
  return Number.isFinite(number) ? number : 0;
};

const normalizeLrNo = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(/[|,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const PAGE_SIZE = 25;

const getFreightMemoSortValue = (value) => {
  const text = String(value ?? "").trim();
  const numericValue = Number(text.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numericValue) && text !== ""
    ? numericValue
    : text.toLowerCase();
};

const REPORT_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "lrNo", label: "LR No" },
  { key: "vehicleNo", label: "Vehicle" },
  { key: "partyName", label: "Party" },
  { key: "freightMemoNo", label: "Freight Memo" },
  { key: "transportName", label: "Transporter" },
  { key: "location", label: "Destination" },
  { key: "quantity", label: "Quantity" },
  { key: "rate", label: "Freight" },
  { key: "totalAmount", label: "Total" },
  { key: "advancePaid", label: "Advance" },
  { key: "fuelExpense", label: "Fuel" },
  { key: "balance", label: "Balance" },
];

export default function Reports() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [dbTotalRecords, setDbTotalRecords] = useState(0);
  const [reportSummary, setReportSummary] = useState({
    totalFreight: 0,
    totalAdvance: 0,
    totalFuel: 0,
  });
  const [records, setRecords] = useState([]);
  const [uploadedRecords, setUploadedRecords] = useState([]);
  const [reportFileName, setReportFileName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [transportName, setTransportName] = useState([]);
  const [partyName, setPartyName] = useState([]);
  const [company, setCompany] = useState([]);
  const [location, setLocation] = useState([]);
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [balanceStatus, setBalanceStatus] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [clearPaymentDate, setClearPaymentDate] = useState("");
  const [selectedColumns, setSelectedColumns] = useState(
    REPORT_COLUMNS.map((column) => column.key),
  );
  // New state: only fetch from server when user explicitly applies filters
  const [isFilterApplied, setIsFilterApplied] = useState(false);

  const fileInputRef = useRef(null);
  const reportRef = useRef(null);

  const handleCheckboxChange = (id) => {
    setSelectedRecords((prev) => {
      if (prev.includes(id)) {
        return prev.filter((recordId) => recordId !== id);
      }

      return [...prev, id];
    });
  };
  const getDateValue = (value) => value?.slice(0, 10) || "";

  // const escapeCsvValue = (value) => {
  //   const stringValue = String(value ?? "");
  //   return `"${stringValue.replace(/"/g, '""')}"`;
  // };

  const fetchRecords = async (pageNum = 1) => {
    try {
      const params = {
        dateFrom: dateFrom || undefined,
        amountMax: amountMax || undefined,
        amountMin: amountMin || undefined,
        balanceStatus: balanceStatus || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
        page: pageNum,
        limit,
        sortBy,
        sortOrder,
      };

      if (
        Array.isArray(partyName) ? partyName.length > 0 : Boolean(partyName)
      ) {
        params.partyName = Array.isArray(partyName) ? partyName : [partyName];
      }

      if (
        Array.isArray(transportName)
          ? transportName.length > 0
          : Boolean(transportName)
      ) {
        params.transportName = Array.isArray(transportName)
          ? transportName
          : [transportName];
      }

      if (Array.isArray(company) ? company.length > 0 : Boolean(company)) {
        params.company = Array.isArray(company) ? company : [company];
      }

      if (Array.isArray(location) ? location.length > 0 : Boolean(location)) {
        params.location = Array.isArray(location) ? location : [location];
      }

      const res = await api.get("/transports/search", { params });
      setRecords(res.data.records);
      setTotalPages(res.data.pagination.totalPages);
      setDbTotalRecords(res.data.pagination.totalRecords);
      setReportSummary(res.data.summary || {
        totalFreight: 0,
        totalAdvance: 0,
        totalFuel: 0,
      });
    } catch (error) {
      console.error("Error fetching records:", error);
    }
  };

  const handleApplyFilter = () => {
    // Mark that user applied filters; subsequent page/sort changes will fetch as long as filters remain applied
    setIsFilterApplied(true);

    if (uploadedRecords.length > 0) {
      setUploadedRecords([]);
      setReportFileName("");
    }
    setPage(1);
    fetchRecords(1);
  };

  useEffect(() => {
    // Only fetch automatically on page/limit/sort changes if the user has applied filters.
    // This prevents triggering server requests as users edit filter inputs — they must click Apply Filter.
    if (uploadedRecords.length === 0 && limit && isFilterApplied) {
      fetchRecords(page);
    }
  }, [page, limit, uploadedRecords.length, sortBy, sortOrder, isFilterApplied]);

  const handleSort = (field) => {
    setSortBy((currentField) => {
      if (currentField === field) {
        setSortOrder((currentOrder) =>
          currentOrder === "asc" ? "desc" : "asc",
        );
        return currentField;
      }

      setSortOrder("asc");
      return field;
    });
    setPage(1);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);
    setReportFileName(file.name);

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (rows.length < 2) {
        throw new Error(
          "The selected file must include a header row and at least one data row.",
        );
      }

      const headers = rows[0].map(normalizeHeader);
      const fieldMap = {
        date: "date",
        fmno: "freightMemoNo",
        freightmemonumber: "freightMemoNo",
        lrno: "lrNo",
        vehicleno: "vehicleNo",
        partyname: "partyName",
        transportname: "transportName",
        ownername: "transportName",
        company: "company",
        location: "location",
        quantity: "quantity",
        rate: "rate",
        totalamount: "totalAmount",
        freightamount: "totalAmount",
        advancepaid: "advancePaid",
        fuelexpense: "fuelExpense",
        fuelamount: "fuelExpense",
        balance: "balance",
        paymentdate: "paymentDate",
        payamount: "payAmount",
      };

      const mappedHeaders = headers.map((header) => {
        const key = Object.keys(fieldMap).find((known) =>
          header.includes(known),
        );
        return key ? fieldMap[key] : null;
      });

      const recordsFromFile = rows.slice(1).map((row) => {
        const record = {};

        row.forEach((value, index) => {
          const field = mappedHeaders[index];
          if (!field) return;
          record[field] = value;
        });

        const quantity = parseNumber(record.quantity);
        const rate = parseNumber(record.rate);
        const advancePaid = parseNumber(record.advancePaid);
        const fuelExpense = parseNumber(record.fuelExpense);
        const totalAmount = parseNumber(record.totalAmount);
        const balance =
          record.balance !== undefined && record.balance !== ""
            ? parseNumber(record.balance)
            : totalAmount - advancePaid - fuelExpense;

        return {
          date: record.date || "",
          transportName: record.transportName || "",
          partyName: record.partyName || "",
          company: record.company || "",
          location: record.location || "",
          vehicleNo: record.vehicleNo || "",
          lrNo: normalizeLrNo(record.lrNo),
          freightMemoNo: record.freightMemoNo || "",
          quantity,
          rate,
          totalAmount,
          advancePaid,
          fuelExpense,
          balance,
          paymentDate: record.paymentDate || "",
          payAmount: parseNumber(record.payAmount),
        };
      });

      if (recordsFromFile.length === 0) {
        throw new Error("Uploaded file contains no valid rows.");
      }

      setUploadedRecords(recordsFromFile);
      setPage(1);
    } catch (error) {
      setUploadError(error.message || "Unable to parse uploaded file.");
      setUploadedRecords([]);
      setReportFileName("");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleClearUpload = () => {
    // Clear uploaded mode and reset paging. Do not auto-fetch — only fetch when Apply Filter is clicked.
    setUploadedRecords([]);
    setReportFileName("");
    setUploadError("");
    setPage(1);
    setIsFilterApplied(false);
  };

  const baseRecords = uploadedRecords.length > 0 ? uploadedRecords : records;
  const currentRecords = useMemo(() => {
    if (uploadedRecords.length === 0) {
      return baseRecords;
    }

    return [...baseRecords].sort((a, b) => {
      const aValue =
        sortBy === "date"
          ? new Date(a.date || 0).getTime()
          : getFreightMemoSortValue(a.freightMemoNo);
      const bValue =
        sortBy === "date"
          ? new Date(b.date || 0).getTime()
          : getFreightMemoSortValue(b.freightMemoNo);

      if (aValue === bValue) return 0;
      const direction = sortOrder === "asc" ? 1 : -1;
      return aValue > bValue ? direction : -direction;
    });
  }, [baseRecords, uploadedRecords.length, sortBy, sortOrder]);
  const currentTotal =
    uploadedRecords.length > 0 ? uploadedRecords.length : dbTotalRecords;
  const isFileMode = uploadedRecords.length > 0;
  const paginationTotalPages = isFileMode ? 1 : totalPages;
  const startRecord =
    currentRecords.length === 0 ? 0 : isFileMode ? 1 : (page - 1) * limit + 1;
  const endRecord = isFileMode
    ? currentRecords.length
    : Math.min(page * limit, currentRecords.length);
  const visibleColumns = REPORT_COLUMNS.filter((column) =>
    selectedColumns.includes(column.key),
  );

  const getReportCellValue = (record, key) => {
    if (key === "date") return getDateValue(record.date);
    if (key === "lrNo")
      return Array.isArray(record.lrNo) ? record.lrNo.join(", ") : record.lrNo;
    if (
      key === "rate" ||
      key === "totalAmount" ||
      key === "advancePaid" ||
      key === "fuelExpense"
    ) {
      return formatCurrency(record[key]);
    }
    if (key === "balance") {
      return formatCurrency(
        record.balance ??
          (record.totalAmount || 0) -
            (record.advancePaid || 0) -
            (record.fuelExpense || 0),
      );
    }
    return record[key] ?? "";
  };

  const toggleColumn = (key) => {
    setSelectedColumns((currentColumns) => {
      if (currentColumns.includes(key)) {
        return currentColumns.length === 1
          ? currentColumns
          : currentColumns.filter((columnKey) => columnKey !== key);
      }
      return [
        ...REPORT_COLUMNS.map((column) => column.key).filter(
          (columnKey) =>
            currentColumns.includes(columnKey) || columnKey === key,
        ),
      ];
    });
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth - 40;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
    pdf.save(
      `transport-report-${reportFileName ? reportFileName.replace(/\.[^/.]+$/, "") : new Date().toISOString().slice(0, 10)}.pdf`,
    );
  };

  const handleDownloadXlsx = () => {
    const totals = currentRecords.reduce(
      (summary, record) => ({
        quantity: summary.quantity + Number(record.quantity || 0), rate: summary.rate + Number(record.rate || 0), totalAmount: summary.totalAmount + Number(record.totalAmount || 0), advancePaid: summary.advancePaid + Number(record.advancePaid || 0), fuelExpense: summary.fuelExpense + Number(record.fuelExpense || 0), balance: summary.balance + Number(record.balance || 0),
      }), { quantity: 0, rate: 0, totalAmount: 0, advancePaid: 0, fuelExpense: 0, balance: 0 },
    );
    const rows = [visibleColumns.map((column) => column.label), ...currentRecords.map((record) => visibleColumns.map((column) => {
      const value = record[column.key];
      if (column.key === "date") return getDateValue(value);
      if (column.key === "lrNo") return Array.isArray(value) ? value.join(", ") : value || "";
      return value ?? "";
    })), visibleColumns.map((column, index) => index === 0 ? "Total" : totals[column.key] ?? "")];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = visibleColumns.map((column) => ({ wch: Math.max(column.label.length + 2, 14) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `transport-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleClearPayment = async () => {
    try {
      await api.put("/transports/mark-paid", {
        ids: selectedRecords,
        paymentDate: clearPaymentDate || undefined,
      });

      setSelectedRecords([]);
      setClearPaymentDate("");
      // Only refresh list if filters are applied (respect the "only fetch on Apply Filter" behavior)
      if (isFilterApplied) {
        fetchRecords(page);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const uploadedSummary = uploadedRecords.reduce(
    (summary, record) => ({
      totalFreight: summary.totalFreight + Number(record.totalAmount || 0),
      totalAdvance: summary.totalAdvance + Number(record.advancePaid || 0),
      totalFuel: summary.totalFuel + Number(record.fuelExpense || 0),
    }),
    { totalFreight: 0, totalAdvance: 0, totalFuel: 0 },
  );
  const activeSummary = isFileMode ? uploadedSummary : reportSummary;
  const totalTrips = currentTotal;
  const totalFreight = activeSummary.totalFreight;
  const totalAdvance = activeSummary.totalAdvance;
  const totalFuel = activeSummary.totalFuel;
  const netBalance = totalFreight - totalAdvance - totalFuel;
  const statCards = [
    { label: "Trips", value: totalTrips, accent: "from-blue-600 to-cyan-500" },
    {
      label: "Freight",
      value: `Rs. ${formatCurrency(totalFreight)}`,
      accent: "from-emerald-600 to-teal-500",
    },
    {
      label: "Advance",
      value: `Rs. ${formatCurrency(totalAdvance)}`,
      accent: "from-amber-500 to-orange-500",
    },
    {
      label: "Balance",
      value: `Rs. ${formatCurrency(netBalance)}`,
      accent: "from-violet-600 to-fuchsia-500",
    },
    { label: "Fuel Expense", value: `Rs. ${formatCurrency(totalFuel)}`, accent: "from-rose-600 to-pink-500" },
  ];

  const sortIndicator = (field) => {
    if (sortBy !== field) return "sort";
    return sortOrder === "asc" ? "asc" : "desc";
  };

  return (
    <>
      <Navbar />
      <PageContainer
        title="Reports"
        subtitle="Filter operational data and export a report snapshot from the current view."
      >
        <div className="space-y-8 glass-panel w-full overflow-auto">
          <FreightFilterPanel
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            transportName={transportName}
            setTransportName={setTransportName}
            partyName={partyName}
            setPartyName={setPartyName}
            company={company}
            setCompany={setCompany}
            location={location}
            setLocation={setLocation}
            amountMin={amountMin}
            setAmountMin={setAmountMin}
            amountMax={amountMax}
            setAmountMax={setAmountMax}
            balanceStatus={balanceStatus}
            setBalanceStatus={setBalanceStatus}
            search={search}
            setSearch={setSearch}
          />
          <div className="px-6 py-4 flex flex-wrap gap-3 items-center">
            <button
              onClick={handleApplyFilter}
              className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 dark:from-white dark:to-slate-300 dark:text-slate-900 transition-all duration-200"
            >
              Apply Filter
            </button>
            <button
              onClick={() => {
                // Clearing filters should also mark filters as not applied so no automatic fetch happens
                setIsFilterApplied(false);
                setDateFrom("");
                setDateTo("");
                setTransportName("");
                setPartyName("");
                setCompany("");
                setLocation("");
                setAmountMin("");
                setAmountMax("");
                setBalanceStatus("");
                setSearch("");
              }}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all duration-200"
            >
              Clear All
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              {uploading ? "Uploading..." : "Upload CSV Report"}
            </button>
            <button
              type="button"
              onClick={handleDownloadXlsx}
              disabled={currentRecords.length === 0}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all duration-200 disabled:opacity-50"
            >
              Download Excel
            </button>
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
                Select report columns ({visibleColumns.length}/
                {REPORT_COLUMNS.length})
              </summary>
              <div className="absolute left-0 top-full z-10 mt-2 grid min-w-[230px] gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                {REPORT_COLUMNS.map((column) => (
                  <label
                    key={column.key}
                    className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.key)}
                      onChange={() => toggleColumn(column.key)}
                    />
                    {column.label}
                  </label>
                ))}
                <p className="pt-1 text-xs text-slate-500">
                  Selected columns are included in the table and downloaded PDF.
                </p>
              </div>
            </details>
            {uploadedRecords.length > 0 && (
              <button
                type="button"
                onClick={handleClearUpload}
                className="rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-500/20 hover:-translate-y-0.5 transition-all duration-200"
              >
                Clear Uploaded Report
              </button>
            )}
            {uploadError && (
              <p className="w-full text-sm text-red-600">{uploadError}</p>
            )}
            {reportFileName && (
              <p className="w-full text-sm text-slate-500">
                Viewing uploaded report: <strong>{reportFileName}</strong>
              </p>
            )}
          </div>
        </div>

        <section className="grid gap-5 py-5 md:grid-cols-2 xl:grid-cols-5">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="cardDash overflow-hidden rounded-3xl p-[1px]"
            >
              <div
                className={`rounded-[calc(1.5rem-1px)] bg-gradient-to-br ${card.accent} p-5 text-white`}
              >
                <p className="text-sm font-medium text-white/80">
                  {card.label}
                </p>
                <p className="mt-3 text-2xl font-bold tracking-tight">
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </section>

        <section ref={reportRef} className="glass-panel w-full overflow-auto">
          <div className="border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Filtered Records
            </h2>
            <div className="mb-4 font-semibold">
              Selected Records: {selectedRecords.length}
            </div>
            <div className="ml-4 flex items-end gap-2">
              <label className="flex flex-col text-sm">
                <span className="mb-1 text-xs font-medium text-slate-500">
                  Clear payment date
                </span>
                <input
                  type="date"
                  value={clearPaymentDate}
                  onChange={(event) => setClearPaymentDate(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition duration-200 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <button
                onClick={handleClearPayment}
                disabled={selectedRecords.length === 0 || isFileMode}
                className="rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/20 hover:-translate-y-0.5 disabled:opacity-50 transition-all duration-200"
              >
                Clear Selected Payments
              </button>
            </div>
            <select
              className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition duration-200 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ml-4"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10 records / page</option>
              <option value={25}>25 records / page</option>
              <option value={50}>50 records / page</option>
              <option value={100}>100 records / page</option>
            </select>

            <p>
              Showing {startRecord}-{endRecord} of {currentTotal}
            </p>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Check</th>
                  {visibleColumns.map((column) => (
                    <th key={column.key} className="px-4 py-3 text-left">
                      {column.key === "date" ? (
                        <button
                          type="button"
                          onClick={() => handleSort("date")}
                          className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-300"
                        >
                          {column.label} <span>{sortIndicator("date")}</span>
                        </button>
                      ) : column.key === "freightMemoNo" ? (
                        <button
                          type="button"
                          onClick={() => handleSort("freightMemoNo")}
                          className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-300"
                        >
                          {column.label}{" "}
                          <span>{sortIndicator("freightMemoNo")}</span>
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((r, index) => (
                  <tr key={r._id ?? index} className="border-t">
                    <td className="px-4 py-3">
                      {!isFileMode ? (
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(r._id)}
                          onChange={() => handleCheckboxChange(r._id)}
                        />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 ${
                          [
                            "rate",
                            "totalAmount",
                            "advancePaid",
                            "fuelExpense",
                            "balance",
                          ].includes(column.key)
                            ? "text-right"
                            : ""
                        }`}
                      >
                        {getReportCellValue(r, column.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-slate-200/80 px-6 py-4 dark:border-slate-800">
              <button
                disabled={page === 1 || isFileMode}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all duration-200"
              >
                Previous
              </button>

              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Page {isFileMode ? 1 : page} of {paginationTotalPages}
              </span>

              <button
                disabled={page === paginationTotalPages || isFileMode}
                className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all duration-200"
                onClick={() =>
                  setPage((p) => Math.min(paginationTotalPages, p + 1))
                }
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </PageContainer>
    </>
  );
}
