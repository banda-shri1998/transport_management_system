import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  X,
  ChevronDown,
  Truck,
  Calendar,
  RotateCcw,
} from "lucide-react";
import api from "../../services/api";

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-md border border-slate-200 glass-panel py-2 pl-3 pr-8 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="">All</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </div>
  );
}

function RangeInput({ label, min, max, onMin, onMax }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => onMin(e.target.value)}
          className="w-full rounded-md border border-slate-200 glass-panel py-2 px-2.5 text-sm text-white font-mono tabular-nums focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <span className="text-slate-300">–</span>
        <input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => onMax(e.target.value)}
          className="w-full rounded-md border border-slate-200 glass-panel py-2 px-2.5 text-sm text-white font-mono tabular-nums focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>
    </div>
  );
}

export default function FreightFilterPanel({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  transportName,
  setTransportName,
  partyName,
  setPartyName,
  company,
  setCompany,
  location,
  setLocation,
  amountMin,
  setAmountMin,
  amountMax,
  setAmountMax,
  balanceStatus,
  setBalanceStatus,
  search,
  setSearch,
}) {
  const [showMore, setShowMore] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    transportName: [],
    partyName: [],
    company: [],
    location: [],
  });
  // Fetch filter options from API
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await api.get("/transports/filter-options");
        setFilterOptions(res.data);
      } catch (error) {
        console.error("Error fetching filter options:", error);
        setFilterOptions({
          transportName: [],
          partyName: [],
          company: [],
          location: [],
        });
      }
    };

    fetchFilterOptions();
  }, []);

  const options = useMemo(
    () => ({
      transportName: filterOptions.transportName || [],
      partyName: filterOptions.partyName || [],
      company: filterOptions.company || [],
      location: filterOptions.location || [],
      view: [10, 25, 50, 100],
    }),
    [filterOptions],
  );

  // const filtered = useMemo(() => {
  //   return RECORDS.filter((r) => {
  //     if (search) {
  //       const q = search.toLowerCase();
  //       const hit =
  //         String(r.freightMemoNo).includes(q) ||
  //         r.vehicleNo.toLowerCase().includes(q) ||
  //         r.lrNo.some((l) => l.toLowerCase().includes(q));
  //       if (!hit) return false;
  //     }
  //     if (dateFrom && r.date < dateFrom) return false;
  //     if (dateTo && r.date > dateTo) return false;
  //     if (transportName && r.transportName !== transportName) return false;
  //     if (partyName && r.partyName !== partyName) return false;
  //     if (company && r.company !== company) return false;
  //     if (location && r.location !== location) return false;
  //     if (amountMin && r.totalAmount < Number(amountMin)) return false;
  //     if (amountMax && r.totalAmount > Number(amountMax)) return false;
  //     if (balanceStatus === "due" && r.balance <= 0) return false;
  //     if (balanceStatus === "paid" && r.balance > 0) return false;
  //     if (missingBank && r.bankAccount) return false;
  //     return true;
  //   });
  // }, [
  //   search,
  //   dateFrom,
  //   dateTo,
  //   transportName,
  //   partyName,
  //   company,
  //   location,
  //   amountMin,
  //   amountMax,
  //   balanceStatus,
  //   missingBank,
  // ]);

  const activeChips = [
    search && { label: `"${search}"`, clear: () => setSearch("") },
    dateFrom && { label: `From ${dateFrom}`, clear: () => setDateFrom("") },
    dateTo && { label: `To ${dateTo}`, clear: () => setDateTo("") },
    transportName && {
      label: transportName,
      clear: () => setTransportName(""),
    },
    partyName && { label: partyName, clear: () => setPartyName("") },
    company && { label: `Company: ${company}`, clear: () => setCompany("") },
    location && { label: location, clear: () => setLocation("") },
    amountMin && { label: `Amt ≥ ${amountMin}`, clear: () => setAmountMin("") },
    amountMax && { label: `Amt ≤ ${amountMax}`, clear: () => setAmountMax("") },
    balanceStatus && {
      label: balanceStatus === "due" ? "Balance due" : "Fully paid",
      clear: () => setBalanceStatus(""),
    },
  ].filter(Boolean);

  const resetAll = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setTransportName("");
    setPartyName("");
    setCompany("");
    setLocation("");
    setAmountMin("");
    setAmountMax("");
    setBalanceStatus("");
  };

  return (
    <div className="mx-auto max-w p-6 font-sans">
      <div className="flex items-center justify-between border-b border-dashed border-slate-300 ">
        <div className="flex items-center gap-2">
          <Truck size={18} className="text-amber-600" />
          <h2 className="text-sm font-semibold text-white">
            Freight memo filters
          </h2>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-amber-600"
        >
          <RotateCcw size={13} /> Reset all
        </button>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1 lg:col-span-2">
            <label className="text-xs font-medium text-slate-500">
              Search memo / vehicle / LR no.
            </label>
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. FM-12345, MH45AF4242, LR-6515"
                className="w-full rounded-md border border-slate-200 glass-panel py-2 pl-8 pr-3 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">
              Date from
            </label>
            <div className="relative">
              <Calendar
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-md border border-slate-200 glass-panel py-2 pl-8 pr-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">
              Date to
            </label>
            <div className="relative">
              <Calendar
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-md border border-slate-200 glass-panel py-2 pl-8 pr-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <FilterSelect
            label="Transport"
            value={transportName}
            onChange={setTransportName}
            options={options.transportName}
          />
          <FilterSelect
            label="Party"
            value={partyName}
            onChange={setPartyName}
            options={options.partyName}
          />
          <FilterSelect
            label="Company"
            value={company}
            onChange={setCompany}
            options={options.company}
          />
          <FilterSelect
            label="Location"
            value={location}
            onChange={setLocation}
            options={options.location}
          />
        </div>

        <button
          onClick={() => setShowMore((s) => !s)}
          className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800"
        >
          {showMore ? "Hide" : "More filters"}
          <ChevronDown
            size={13}
            className={`transition-transform ${showMore ? "rotate-180" : ""}`}
          />
        </button>

        {showMore && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <RangeInput
              label="Total amount (₹)"
              min={amountMin}
              max={amountMax}
              onMin={setAmountMin}
              onMax={setAmountMax}
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                Payment status
              </label>
              <div className="flex gap-1.5">
                {[
                  { v: "", label: "All" },
                  { v: "due", label: "Balance due" },
                  { v: "paid", label: "Paid" },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setBalanceStatus(opt.v)}
                    className={`flex-1 rounded-md border py-2 text-xs font-medium transition-colors ${
                      balanceStatus === opt.v
                        ? "border-amber-500 bg-amber-50 text-amber-800"
                        : "border-slate-200 glass-panel text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeChips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            {activeChips.map((chip, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2.5 pr-1.5 text-xs font-medium text-slate-600"
              >
                {chip.label}
                <button
                  onClick={chip.clear}
                  className="rounded-full p-0.5 hover:bg-slate-200"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 glass-panel shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <span className="text-xs font-medium text-slate-500">
            {filtered.length} of {RECORDS.length} records
          </span>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400">
              <th className="px-5 py-2 font-medium">Memo no.</th>
              <th className="px-5 py-2 font-medium">Date</th>
              <th className="px-5 py-2 font-medium">Transport</th>
              <th className="px-5 py-2 font-medium">Vehicle</th>
              <th className="px-5 py-2 font-medium">Party</th>
              <th className="px-5 py-2 text-right font-medium">Amount</th>
              <th className="px-5 py-2 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr
                key={r._id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
              >
                <td className="px-5 py-2.5 font-mono text-xs text-slate-700">
                  {r.freightMemoNo}
                </td>
                <td className="px-5 py-2.5 text-slate-600">{r.date}</td>
                <td className="px-5 py-2.5 text-white">
                  {r.transportName}
                </td>
                <td className="px-5 py-2.5 font-mono text-xs text-slate-600">
                  {r.vehicleNo}
                </td>
                <td className="px-5 py-2.5 text-white">{r.partyName}</td>
                <td className="px-5 py-2.5 text-right font-mono tabular-nums text-slate-700">
                  ₹{r.totalAmount.toLocaleString("en-IN")}
                </td>
                <td
                  className={`px-5 py-2.5 text-right font-mono tabular-nums font-medium ${r.balance > 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  ₹{r.balance.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-8 text-center text-sm text-slate-400"
                >
                  No records match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-xs text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        // )} 
      </div> */}
    </div>
  );
}
