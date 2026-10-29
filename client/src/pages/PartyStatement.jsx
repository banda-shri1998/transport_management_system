import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import api from "../services/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(Number(value || 0));

const Transporter = () => {
  const [records, setRecords] = useState([]);
  const [transporter, setTransporter] = useState("");
  const [selectedPaymentDate, setSelectedPaymentDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPaymentGroup, setSelectedPaymentGroup] = useState(null);

  useEffect(() => {
    let isCurrentRequest = true;
    const fetchRecords = async () => {
      try {
        const res = await api.get("/transports");
        if (!Array.isArray(res.data)) {
          throw new Error("Invalid transporter records response");
        }
        if (!isCurrentRequest) return;

        setRecords(res.data);
      } catch (error) {
        console.error("Error fetching records:", error);
      } finally {
        if (isCurrentRequest) setLoading(false);
      }
    };

    fetchRecords();
    return () => {
      isCurrentRequest = false;
    };
  }, []);

  const transporterSummaries = Object.values(
    records.reduce((summaries, record) => {
      const transporterName = record.transportName?.trim();
      if (!transporterName) return summaries;

      const key = transporterName.toLowerCase();
      const summary = summaries[key] || {
        name: transporterName,
        balance: 0,
        records: 0,
        lastPaymentDate: "",
        lastPaymentAmount: 0,
        paymentGroups: {},
      };

      summary.balance += Number(record.balance || 0);
      summary.records += 1;

      const paymentDate = record.paymentDate
        ? String(record.paymentDate).slice(0, 10)
        : "";
      const paymentAmount = Number(
        record.paymentAmount || record.payAmount || 0,
      );

      if (paymentDate && paymentAmount > 0) {
        const paymentGroup = summary.paymentGroups[paymentDate] || {
          date: paymentDate,
          total: 0,
          records: [],
        };
        paymentGroup.total += paymentAmount;
        const freightMemoNo = String(record.freightMemoNo ?? "-");
        const existingFreightPayment = paymentGroup.records.find(
          (payment) => payment.freightMemoNo === freightMemoNo,
        );
        if (existingFreightPayment) {
          existingFreightPayment.amount += paymentAmount;
        } else {
          paymentGroup.records.push({ freightMemoNo, amount: paymentAmount });
        }
        summary.paymentGroups[paymentDate] = paymentGroup;

        if (paymentDate > summary.lastPaymentDate) {
          summary.lastPaymentDate = paymentDate;
          summary.lastPaymentAmount = paymentAmount;
        } else if (paymentDate === summary.lastPaymentDate) {
          summary.lastPaymentAmount += paymentAmount;
        }
      }

      summaries[key] = summary;
      return summaries;
    }, {}),
  )
    .map((summary) => {
      const paymentGroups = Object.values(summary.paymentGroups).sort(
        (first, second) => second.date.localeCompare(first.date),
      );
      return {
        ...summary,
        lastPaymentGroup:
          paymentGroups.find(
            (group) => group.date === summary.lastPaymentDate,
          ) || null,
      };
    })
    .filter((summary) =>
      summary.name.toLowerCase().includes(transporter.trim().toLowerCase()),
    )
    .sort((first, second) => first.name.localeCompare(second.name));

  const totalDue = transporterSummaries.reduce(
    (sum, summary) => sum + summary.balance,
    0,
  );

  const formatDate = (date) =>
    date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN") : "-";

  const paymentRows = records
    .map((record, index) => ({
      ...record,
      paymentDate: record.paymentDate
        ? String(record.paymentDate).slice(0, 10)
        : "",
      paymentAmount: Number(record.paymentAmount || record.payAmount || 0),
      rowKey:
        record._id ||
        `${record.transportName}-${record.freightMemoNo}-${index}`,
    }))
    .filter(
      (record) =>
        record.paymentDate === selectedPaymentDate &&
        record.paymentAmount > 0 &&
        record.transportName
          ?.toLowerCase()
          .includes(transporter.trim().toLowerCase()),
    )
    .sort(
      (first, second) =>
        first.transportName.localeCompare(second.transportName) ||
        String(first.freightMemoNo).localeCompare(String(second.freightMemoNo)),
    );

  const selectedDatePaymentTotal = paymentRows.reduce(
    (sum, record) => sum + record.paymentAmount,
    0,
  );

  return (
    <>
      <Navbar />
      <PageContainer
        title="Transporter"
        subtitle="Review remaining balances due to each transporter."
      >
        <div className="space-y-6">
          <section className="glass-panel p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="transporter-search"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Search Transporter
                </label>
                <input
                  id="transporter-search"
                  placeholder="Search transporter name..."
                  className="w-full"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="payment-date-filter"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  Filter Payments by Date
                </label>
                <input
                  id="payment-date-filter"
                  type="date"
                  className="w-full"
                  value={selectedPaymentDate}
                  onChange={(e) => setSelectedPaymentDate(e.target.value)}
                />
              </div>
            </div>
          </section>

          {!loading && (
            <>
              {selectedPaymentDate ? (
                <>
                  <section className="grid gap-5 md:grid-cols-2">
                    <div className="cardDash rounded-2xl p-5">
                      <p className="metric-label">
                        Payments on {formatDate(selectedPaymentDate)}
                      </p>
                      <p className="metric-value mt-2 text-blue-600 dark:text-blue-400">
                        {paymentRows.length}
                      </p>
                    </div>
                    <div className="cardDash rounded-2xl p-5">
                      <p className="metric-label">Total Paid</p>
                      <p className="metric-value mt-2 text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(selectedDatePaymentTotal)}
                      </p>
                    </div>
                  </section>

                  <section className="glass-panel overflow-hidden">
                    <div className="border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Payments on {formatDate(selectedPaymentDate)}
                      </h2>
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full min-w-[500px] text-sm">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left">Transporter</th>
                            <th className="px-4 py-3 text-left">
                              Freight Memo No.
                            </th>
                            <th className="px-4 py-3 text-right">Payment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentRows.map((record) => (
                            <tr key={record.rowKey} className="border-t">
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                {record.transportName}
                              </td>
                              <td className="px-4 py-3">
                                {record.freightMemoNo ?? "-"}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedPaymentGroup({
                                      transporter: record.transportName,
                                      date: record.paymentDate,
                                      total: record.paymentAmount,
                                      records: [
                                        {
                                          freightMemoNo:
                                            record.freightMemoNo ?? "-",
                                          amount: record.paymentAmount,
                                          location : record.location ?? "-",
                                        },
                                      ],
                                    })
                                  }
                                  className="underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800 dark:hover:text-emerald-300"
                                  aria-label={`Show payment details for freight memo ${record.freightMemoNo ?? "unknown"}: ${formatCurrency(record.paymentAmount)}`}
                                >
                                  {formatCurrency(record.paymentAmount)}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {paymentRows.length === 0 && (
                        <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          {transporter.trim()
                            ? `No payments found for "${transporter}" on ${formatDate(selectedPaymentDate)}`
                            : `No payments found on ${formatDate(selectedPaymentDate)}`}
                        </div>
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <>
                  <section className="grid gap-5 md:grid-cols-2">
                    <div className="cardDash rounded-2xl p-5">
                      <p className="metric-label">Transporters Shown</p>
                      <p className="metric-value mt-2 text-blue-600 dark:text-blue-400">
                        {transporterSummaries.length}
                      </p>
                    </div>
                    <div className="cardDash rounded-2xl p-5">
                      <p className="metric-label">Remaining Due</p>
                      <p
                        className={`metric-value mt-2 ${totalDue > 0 ? "text-orange-500" : "text-emerald-600"}`}
                      >
                        {formatCurrency(totalDue)}
                      </p>
                    </div>
                  </section>

                  <section className="glass-panel overflow-hidden">
                    <div className="border-b border-slate-200/80 px-6 py-4 dark:border-slate-800">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Remaining Due by Transporter
                      </h2>
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full min-w-[650px] text-sm">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left">Transporter</th>
                            <th className="px-4 py-3 text-left">
                              Last Payment Date
                            </th>
                            <th className="px-4 py-3 text-right">
                              Last Payment Amount
                            </th>
                            <th className="px-4 py-3 text-right">
                              Trips Count
                            </th>
                            <th className="px-4 py-3 text-right">
                              Remaining Due
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transporterSummaries.map((summary) => (
                            <tr
                              key={summary.name.toLowerCase()}
                              className="border-t"
                            >
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                {summary.name}
                              </td>
                              <td className="px-4 py-3">
                                {summary.lastPaymentGroup ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedPaymentGroup({
                                        ...summary.lastPaymentGroup,
                                        transporter: summary.name,
                                      })
                                    }
                                    className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-4 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    {formatDate(summary.lastPaymentDate)}
                                  </button>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {summary.lastPaymentGroup ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedPaymentGroup({
                                        ...summary.lastPaymentGroup,
                                        transporter: summary.name,
                                      })
                                    }
                                    className="font-semibold text-emerald-600 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                                    aria-label={`Show payment details for ${summary.name}: ${formatCurrency(summary.lastPaymentAmount)}`}
                                  >
                                    {formatCurrency(
                                      summary.lastPaymentAmount,
                                    )}
                                  </button>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {summary.records}
                              </td>
                              <td
                                className={`px-4 py-3 text-right font-semibold ${summary.balance > 0 ? "text-orange-500" : "text-emerald-600"}`}
                              >
                                {formatCurrency(summary.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {transporterSummaries.length === 0 && (
                        <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          {transporter.trim()
                            ? `No transporters found for "${transporter}"`
                            : "No transporter records found"}
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </PageContainer>
      {selectedPaymentGroup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedPaymentGroup(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-detail-title"
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
              <div>
                <h2
                  id="payment-detail-title"
                  className="text-xl font-semibold text-slate-900 dark:text-white"
                >
                  Payment Details
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedPaymentGroup.transporter} ·{" "}
                  {formatDate(selectedPaymentGroup.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPaymentGroup(null)}
                className="rounded-xl px-3 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              <p className="mb-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Total Payment: {formatCurrency(selectedPaymentGroup.total)}
              </p>
              <div className="max-h-[60vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 dark:text-slate-400">
                      <th className="pb-3">Freight Memo No.</th>
                      <th className="pb-3 text-right">Transaction Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPaymentGroup.records.map((payment, index) => (
                      <tr
                        key={`${payment.freightMemoNo}-${index}`}
                        className="border-t border-slate-200 dark:border-slate-700"
                      >
                        <td className="py-3 font-medium text-slate-900 dark:text-white">
                          {payment.freightMemoNo}
                        </td>
                        <td className="py-3 text-right">
                          {formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default Transporter;
