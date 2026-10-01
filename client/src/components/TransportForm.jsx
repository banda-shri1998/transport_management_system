import { useEffect, useState } from "react";
import api from "../services/api";

const FUEL_RATES = {
  Diesel: 98.4,
  CNG: 99,
};

const sectionClass =
  "rounded-3xl border border-slate-200/80 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-950/30";
const labelClass =
  "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300";
const errorClass = "mt-2 text-xs font-medium text-red-500";
const metricCardClass =
  "rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80";

const toNumber = (value) => Number(value || 0);
const getTransportPairSelectValue = (form) =>
  form?.transportName && form?.vehicleNo
    ? `${form.transportName} | ${form.vehicleNo}`
    : "";

export default function TransportForm({
  form,
  setForm,
  onSubmit,
  submitText,
  isEdit,
}) {
  const [errors, setErrors] = useState({});
  const [pairs, setPairs] = useState([]);
  const [transportNameSuggestions, setTransportNameSuggestions] = useState([]);
  const [vehicleNoSuggestions, setVehicleNoSuggestions] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [vehiclesResult, transportsResult] = await Promise.allSettled([
        api.get("/Vehicles"),
        api.get("/transports"),
      ]);
      if (!mounted) return;

      const vehicleRecords =
        vehiclesResult.status === "fulfilled" &&
        Array.isArray(vehiclesResult.value.data)
          ? vehiclesResult.value.data
          : [];
      const transportRecords =
        transportsResult.status === "fulfilled" &&
        Array.isArray(transportsResult.value.data)
          ? transportsResult.value.data
          : [];
      const pairMap = new Map();
      const addPair = (transportName, vehicleNo) => {
        const name = String(transportName || "").trim();
        const number = String(vehicleNo || "").trim().toUpperCase();
        if (!name || !number || pairMap.has(number)) return;
        pairMap.set(number, { transportName: name, vehicleNo: number });
      };

      vehicleRecords.forEach((vehicle) =>
        addPair(vehicle.ownerName, vehicle.vehicleNo),
      );
      transportRecords.forEach((record) =>
        addPair(record.transportName, record.vehicleNo),
      );

      const allTransportNames = [
        ...vehicleRecords.map((vehicle) => vehicle.ownerName),
        ...transportRecords.map((record) => record.transportName),
      ];
      const merged = Array.from(pairMap.values());
      setPairs(merged);
      setTransportNameSuggestions(
        Array.from(new Set(allTransportNames.map((name) => String(name || "").trim()).filter(Boolean))).sort(),
      );
      setVehicleNoSuggestions(
        Array.from(new Set(merged.map((pair) => pair.vehicleNo))).sort(),
      );
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const totalAmount = toNumber(form.quantity) * toNumber(form.rate);
    const fuelExpense = toNumber(form.fuelQuantity) * toNumber(form.fuelRate);
    const balance =
      totalAmount -
      toNumber(form.advancePaid) -
      fuelExpense -
      (isEdit ? toNumber(form.payAmount) : 0);

    setForm((prev) => ({
      ...prev,
      totalAmount,
      fuelExpense,
      balance,
    }));
  }, [
    form.quantity,
    form.rate,
    form.advancePaid,
    form.fuelQuantity,
    form.fuelRate,
    form.payAmount,
    isEdit,
    setForm,
  ]);

  const validate = () => {
    const nextErrors = {};

    if (!form.date) nextErrors.date = "Date is required";
    if (!form.transportName)
      nextErrors.transportName = "Transport name is required";
    if (!form.vehicleNo) nextErrors.vehicleNo = "Vehicle number is required";
    if (!form.partyName) nextErrors.partyName = "Party name is required";
    if (toNumber(form.quantity) <= 0)
      nextErrors.quantity = "Quantity must be greater than 0";
    if (toNumber(form.rate) <= 0)
      nextErrors.rate = "Rate must be greater than 0";
    if (toNumber(form.advancePaid) < 0)
      nextErrors.advancePaid = "Advance cannot be negative";
    if (toNumber(form.fuelQuantity) < 0)
      nextErrors.fuelQuantity = "Fuel quantity cannot be negative";
    if (toNumber(form.fuelRate) < 0)
      nextErrors.fuelRate = "Fuel rate cannot be negative";

    return nextErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    onSubmit(e);
  };

  const setField = (name, value, clearError = true) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (clearError) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = [
      "quantity",
      "rate",
      "advancePaid",
      "fuelRate",
      "fuelQuantity",
      "payAmount",
      "freightMemoNo",
    ].includes(name)
      ? value === ""
        ? ""
        : Number(value)
      : value;

    if (name === "fuelType") {
      setForm((prev) => ({
        ...prev,
        fuelType: value,
        fuelRate: FUEL_RATES[value],
      }));
      return;
    }

    if (name === "transportName") {
      const transportName = String(parsedValue || "");
      const matched = pairs.filter(
        (pair) =>
          pair.transportName.trim().toLowerCase() ===
            transportName.trim().toLowerCase() && pair.vehicleNo,
      );
      const matchedVehicle = matched.length === 1 ? matched[0].vehicleNo : null;
      setForm((prev) => ({
        ...prev,
        transportName,
        vehicleNo: matchedVehicle || prev.vehicleNo,
      }));
      setErrors((prev) => ({
        ...prev,
        transportName: undefined,
        vehicleNo: undefined,
      }));
      return;
    }

    if (name === "vehicleNo") {
      const vehicleNo = String(parsedValue || "").toUpperCase();
      const match = pairs.find(
        (pair) =>
          pair.vehicleNo &&
          pair.vehicleNo.trim().toUpperCase() ===
            vehicleNo.trim().toUpperCase(),
      );
      const matchedTransport = match ? match.transportName : null;
      setForm((prev) => ({
        ...prev,
        vehicleNo,
        transportName: matchedTransport || prev.transportName,
      }));
      setErrors((prev) => ({
        ...prev,
        transportName: undefined,
        vehicleNo: undefined,
      }));
      return;
    }

    setField(name, parsedValue);
  };

  const clearForm = () => {
    setForm({
      date: "",
      transportName: "",
      vehicleNo: "",
      freightMemoNo: "",
      lrNo: "",
      partyName: "",
      company: "",
      location: "",
      quantity: "",
      rate: "",
      totalAmount: 0,
      fuelType: "",
      fuelRate: "",
      fuelQuantity: "",
      fuelExpense: 0,
      advancePaid: "",
      balance: 0,
      paymentDate: "",
      payAmount: "",
    });
    setErrors({});
  };

  const metrics = [
    { label: "Freight Total", value: form.totalAmount || 0 },
    { label: "Fuel Expense", value: form.fuelExpense || 0 },
    { label: "Current Balance", value: form.balance || 0 },
  ];

  const renderError = (field) =>
    errors[field] ? <p className={errorClass}>{errors[field]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="glass-panel space-y-8 p-6 sm:p-8">
      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className={metricCardClass}>
            <p className="metric-label">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Rs. {Number(metric.value || 0).toFixed(2)}
            </p>
          </div>
        ))}
      </section>

      <section className={sectionClass}>
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Basic Details
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Core transport and trip identification information.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          <div>
            <label className={labelClass}>Date</label>
            <input
              type="date"
              name="date"
              value={form.date || ""}
              placeholder="Select date"
              onChange={handleChange}
            />
            {renderError("date")}
          </div>

          <div>
            <label className={labelClass}>Select Transporter</label>
            <select
              value={getTransportPairSelectValue(form)}
              onChange={(e) => {
                const [transportName, vehicleNo] = e.target.value.split(" | ");
                if (transportName && vehicleNo) {
                  setForm((prev) => ({
                    ...prev,
                    transportName,
                    vehicleNo,
                  }));
                  setErrors((prev) => ({
                    ...prev,
                    transportName: undefined,
                    vehicleNo: undefined,
                  }));
                } else {
                  setForm((prev) => ({
                    ...prev,
                    transportName: "",
                    vehicleNo: "",
                  }));
                }
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Choose transporter and vehicle</option>
              {pairs.map((pair) => (
                <option
                  key={`${pair.transportName}-${pair.vehicleNo}`}
                  value={`${pair.transportName} | ${pair.vehicleNo}`}
                >
                  {pair.transportName} | {pair.vehicleNo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Transport Name</label>
            <input
              list="transportNames"
              name="transportName"
              value={form.transportName}
              placeholder="Enter transport name"
              onChange={handleChange}
            />
            <datalist id="transportNames">
              {transportNameSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {renderError("transportName")}
          </div>

          <div>
            <label className={labelClass}>Vehicle No</label>
            <input
              list="vehicleNos"
              name="vehicleNo"
              value={form.vehicleNo}
              placeholder="e.g. HR26AB1234"
              onChange={handleChange}
            />
            <datalist id="vehicleNos">
              {vehicleNoSuggestions.map((vehicleNo) => (
                <option key={vehicleNo} value={vehicleNo} />
              ))}
            </datalist>
            {renderError("vehicleNo")}
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Document & Party
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Reference details for freight and consignee tracking.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={labelClass}>Freight Memo No</label>
            <input
              type="number"
              name="freightMemoNo"
              value={form.freightMemoNo}
              placeholder="Enter freight memo no"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className={labelClass}>LR No</label>
            <input
              name="lrNo"
              value={form.lrNo}
              placeholder="e.g., 6521/22 or 6521|6522"
              onChange={handleChange}
            />
            <small
              style={{
                color: "#666",
                fontSize: "0.8rem",
                marginTop: "4px",
                display: "block",
              }}
            >
              Format: Use slash (6521/22) for range or pipe (6521|6522) for
              multiple numbers
            </small>
          </div>

          <div>
            <label className={labelClass}>Party Name</label>
            <input
              name="partyName"
              value={form.partyName}
              placeholder="Enter party name"
              onChange={handleChange}
            />
            {renderError("partyName")}
          </div>

          <div>
            <label className={labelClass}>Company</label>
            <select
              name="company"
              value={form.company || ""}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select company</option>
              <option value="UT">UT</option>
              <option value="ZC">ZC</option>
              <option value="JK">JK</option>
            </select>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Cargo & Rate
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quantity, rate, and delivery location.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={labelClass}>Location</label>
            <input
              name="location"
              value={form.location}
              placeholder="Enter location"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className={labelClass}>Quantity</label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              placeholder="Enter quantity"
              onChange={handleChange}
            />
            {renderError("quantity")}
          </div>

          <div>
            <label className={labelClass}>Rate</label>
            <input
              type="number"
              name="rate"
              value={form.rate}
              placeholder="Enter rate"
              onChange={handleChange}
            />
            {renderError("rate")}
          </div>

          <div>
            <label className={labelClass}>Total Amount</label>
            <input
              value={Number(form.totalAmount || 0).toFixed(2)}
              placeholder="Calculated automatically"
              disabled
              className="cursor-not-allowed opacity-80"
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Fuel Details
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Fuel type and automatic cost calculation.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={labelClass}>Fuel Type</label>
            <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white/80 p-1.5 dark:border-slate-700 dark:bg-slate-900/80">
              {Object.keys(FUEL_RATES).map((type) => (
                <label
                  key={type}
                  className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-center text-sm font-medium ${
                    form.fuelType === type
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="fuelType"
                    value={type}
                    checked={form.fuelType === type}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Fuel Rate</label>
            <input
              type="number"
              name="fuelRate"
              value={form.fuelRate ?? ""}
              placeholder="Select fuel type"
              readOnly
              className="cursor-not-allowed opacity-80"
            />
            {renderError("fuelRate")}
          </div>

          <div>
            <label className={labelClass}>Fuel Quantity</label>
            <input
              type="number"
              name="fuelQuantity"
              value={form.fuelQuantity}
              placeholder="Enter fuel quantity"
              onChange={handleChange}
            />
            {renderError("fuelQuantity")}
          </div>

          <div>
            <label className={labelClass}>Fuel Expense</label>
            <input
              value={Number(form.fuelExpense || 0).toFixed(2)}
              placeholder="Calculated automatically"
              disabled
              className="cursor-not-allowed opacity-80"
            />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Payment
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Advance and settlement tracking.
          </p>
        </div>
        <div
          className={`grid gap-5 ${isEdit ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2"}`}
        >
          {isEdit && (
            <>
              <div>
                <label className={labelClass}>Payment Date</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={form.paymentDate || ""}
                  placeholder="Select payment date"
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className={labelClass}>Pay Amount</label>
                <input
                  type="number"
                  name="payAmount"
                  value={form.payAmount ?? ""}
                  placeholder="Enter payment amount"
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>Advance Paid</label>
            <input
              type="number"
              name="advancePaid"
              value={form.advancePaid}
              placeholder="Enter advance amount"
              onChange={handleChange}
            />
            {renderError("advancePaid")}
          </div>

          <div>
            <label className={labelClass}>Balance</label>
            <input
              value={Number(form.balance || 0).toFixed(2)}
              placeholder="Calculated automatically"
              disabled
              className="cursor-not-allowed opacity-80"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 dark:from-white dark:to-slate-300 dark:text-slate-900">
          {submitText}
        </button>
        <button
          type="button"
          onClick={clearForm}
          className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
