import React from "react";
// import { useState, useEffect } from "react";

const ReportFilters = ({
  transporter,
  setTransporter,
  reportDate,
  setReportDate,
  freightMemoNo,
  setFreightMemoNo,
  handleSearch,
  clearFilters,
}) => {
  return (
    <div className="grid grid-cols-5 gap-4 mb-6">

      <input
        type="text"
        placeholder="Transporter"
        value={transporter}
        onChange={(e) => setTransporter(e.target.value)}
        className="border rounded p-2"
      />

      <input
        type="date"
        value={reportDate}
        onChange={(e) => setReportDate(e.target.value)}
        className="border rounded p-2"
      />

      <input
        type="text"
        placeholder="Freight Memo No"
        value={freightMemoNo}
        onChange={(e) => setFreightMemoNo(e.target.value)}
        className="border rounded p-2"
      />

      <button
        onClick={handleSearch}
        className="bg-blue-600 text-white rounded"
      >
        Search
      </button>

      <button
        onClick={clearFilters}
        className="bg-gray-600 text-white rounded"
      >
        Clear
      </button>

    </div>
  );
};

export default ReportFilters;

