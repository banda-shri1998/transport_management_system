import Navbar from "../components/Navbar";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import PageContainer from "../components/PageContainer";
import api from "../services/api";
import FreightFilterPanel from "../components/reports/FreightFilterPanel";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

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
  const [fuelCategory, setFuelCategory] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [clearPaymentDate, setClearPaymentDate] = useState("");
  const [selectedColumns, setSelectedColumns] = useState(
    REPORT_COLUMNS.map((column) => column.key),
  );
  // New state: only fetch from server when user explicitly applies filters
  const [isFilterApplied, setIsFilterApplied] = useState(false);

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
        fuelType: fuelCategory || undefined,
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
      setReportSummary(
        res.data.summary || {
          totalFreight: 0,
          totalAdvance: 0,
          totalFuel: 0,
        },
      );
    } catch (error) {
      console.error("Error fetching records:", error);
    }
  };

  const handleApplyFilter = () => {
    // Mark that user applied filters; subsequent page/sort changes will fetch as long as filters remain applied
    setIsFilterApplied(true);
    setPage(1);
    fetchRecords(1);
  };

  useEffect(() => {
    // Only fetch automatically on page/limit/sort changes if the user has applied filters.
    // This prevents triggering server requests as users edit filter inputs — they must click Apply Filter.
    if (!limit || !isFilterApplied) return;

    const timeoutId = setTimeout(() => fetchRecords(page), 0);
    return () => clearTimeout(timeoutId);
  }, [page, limit, sortBy, sortOrder, isFilterApplied]);

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

  const currentRecords = records;
  const currentTotal = dbTotalRecords;
  const paginationTotalPages = totalPages;
  const startRecord = currentRecords.length === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, currentRecords.length);
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
  const buildFilterFilename = () => {
    const parts = [];
    if (search) parts.push(`search-${search.replace(/\s+/g, "-")}`);
    if (dateFrom) parts.push(`from-${dateFrom}`);
    if (dateTo) parts.push(`to-${dateTo}`);
    if (transportName)
      parts.push(`transport-${transportName.replace(/\s+/g, "-")}`);
    if (partyName) parts.push(`party-${partyName.replace(/\s+/g, "-")}`);
    if (balanceStatus) parts.push(`${balanceStatus.replace(/\s+/g, "-")}`);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filterPart = parts.length > 0 ? `${parts.join("_")}_` : "";
    return `transport-report_${filterPart}${timestamp}.xlsx`
      .replace(/_{2,}/g, "_")
      .replace(/_\./, ".");
  };

  const handleDownloadXlsx = () => {
    const totals = currentRecords.reduce(
      (summary, record) => ({
        quantity: summary.quantity + Number(record.quantity || 0),
        rate: summary.rate + Number(record.rate || 0),
        totalAmount: summary.totalAmount + Number(record.totalAmount || 0),
        advancePaid: summary.advancePaid + Number(record.advancePaid || 0),
        fuelExpense: summary.fuelExpense + Number(record.fuelExpense || 0),
        balance: summary.balance + Number(record.balance || 0),
      }),
      {
        quantity: 0,
        rate: 0,
        totalAmount: 0,
        advancePaid: 0,
        fuelExpense: 0,
        balance: 0,
      },
    );
    const rows = [
      visibleColumns.map((column) => column.label),
      ...currentRecords.map((record) =>
        visibleColumns.map((column) => {
          const value = record[column.key];
          if (column.key === "date") return getDateValue(value);
          if (column.key === "lrNo")
            return Array.isArray(value) ? value.join(", ") : value || "";
          return value ?? "";
        }),
      ),
      visibleColumns.map((column, index) =>
        index === 0 ? "Total" : (totals[column.key] ?? ""),
      ),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = visibleColumns.map((column) => ({
      wch: Math.max(column.label.length + 2, 14),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, buildFilterFilename());
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

  const totalTrips = currentTotal;
  const totalFreight = reportSummary.totalFreight;
  const totalAdvance = reportSummary.totalAdvance;
  const totalFuel = reportSummary.totalFuel;
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
    {
      label: "Fuel Expense",
      value: `Rs. ${formatCurrency(totalFuel)}`,
      accent: "from-rose-600 to-pink-500",
    },
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
        className="max-w-none"
      >
        <div className="min-w-0 space-y-8 glass-panel w-full">
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
            fuelCategory={fuelCategory}
            setFuelCategory={setFuelCategory}
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
                setFuelCategory("");
                setSearch("");
              }}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all duration-200"
            >
              Clear All
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

        <section
          ref={reportRef}
          className="glass-panel w-full min-w-0 overflow-hidden"
        >
          <div className="flex flex-col gap-4 border-b border-slate-200/80 px-4 py-4 dark:border-slate-800 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Filtered Records
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Selected Records: {selectedRecords.length}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
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
                disabled={selectedRecords.length === 0}
                className="min-h-10 rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
              >
                Clear Selected Payments
              </button>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                Records per page
                <select
                  className="min-h-10 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
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
              </label>
              <p className="self-center text-sm text-slate-500 dark:text-slate-400">
                Showing {startRecord}-{endRecord} of {currentTotal}
              </p>
            </div>
          </div>

          <div className="max-w-full overflow-x-auto">
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
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(r._id)}
                        onChange={() => handleCheckboxChange(r._id)}
                      />
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
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all duration-200"
              >
                Previous
              </button>

              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Page {page} of {paginationTotalPages}
              </span>

              <button
                disabled={page === paginationTotalPages}
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
