import React from "react";

const ReportPagination = ({
  page,
  totalPages,
  limit,
  setLimit,
  totalRecords,
  setPage,
}) => {

  const start =
    totalRecords === 0
      ? 0
      : (page - 1) * limit + 1;

  const end =
    Math.min(page * limit, totalRecords);

  return (
    <div className="flex justify-between items-center mt-5">

      <div className="flex items-center gap-3">

        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="border rounded p-2"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <span>
          Showing {start}-{end} of {totalRecords}
        </span>

      </div>

      <div className="flex gap-2">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded"
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded"
        >
          Next
        </button>

      </div>

    </div>
  );
};

export default ReportPagination;