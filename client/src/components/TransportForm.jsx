import { useEffect, useState } from "react";

const FUEL_RATES = {
  Diesel: 98.4,
  CNG: 99,
};

const TRANSPORTER_VEHICLE_PAIRS = [
  { transportName: "Mahadev Kharade", vehicleNo: "MH12FC7196" },
  { transportName: "Komal Bharat Mahanvar", vehicleNo: "MH13AX3963" },
  { transportName: "Ujjwala R. Chavare", vehicleNo: "MH12NX9725" },
  { transportName: "Vinayak Gaikwad", vehicleNo: "MH14DM9767" },
  { transportName: "Vinayak Gaikwad", vehicleNo: "MH13CU5095" },
  { transportName: "Vinayak Gaikwad", vehicleNo: "MH13CU9849" },
  { transportName: "Nilesh T. Solankar", vehicleNo: "MH24J9115" },
  { transportName: "Archna Somnath Aglave", vehicleNo: "MH42T0683" },
  { transportName: "Archna Somnath Aglave", vehicleNo: "MH04GK8389" },
  { transportName: "Archna Somnath Aglave", vehicleNo: "MH13R4098" },
  { transportName: "Sushant Gaikwad", vehicleNo: "MH13EP3099" },
  { transportName: "New Sankalp Trs", vehicleNo: "MH45AF4242" },
  { transportName: "New Sankalp Trs", vehicleNo: "MH13DQ2564" },
  { transportName: "Rajkumar Dhavane", vehicleNo: "MH13DQ1998" },
  { transportName: "Avinash Khendad", vehicleNo: "MH12QW7342" },
  { transportName: "Jaysing Dhavne", vehicleNo: "MH42AQ6267" },
  { transportName: "Datta Thombe", vehicleNo: "MH10Z3939" },
  { transportName: "Shivaji Bhosale", vehicleNo: "MH12LT6777" },
  { transportName: "Siddheswar Thorat", vehicleNo: "MH13DQ2351" },
  { transportName: "Salim Mulani", vehicleNo: "MH12FC4491" },
  { transportName: "Jyoti R. Rautrao", vehicleNo: "MH13DQ6323" },
  { transportName: "Rahul Satpute", vehicleNo: "MH12MV7011" },
  { transportName: "Satish Gandhure", vehicleNo: "MH13DQ5053" },
  { transportName: "G. A. Pathan", vehicleNo: "MH13AX3385" },
  { transportName: "G. A. Pathan", vehicleNo: "MH14CP7886" },
  { transportName: "G. A. Pathan", vehicleNo: "MH36F0071" },
  { transportName: "G. A. Pathan", vehicleNo: "MH12KP7348" },
  { transportName: "Ambadas More", vehicleNo: "MH12FZ4202" },
  { transportName: "Ambadas More", vehicleNo: "MH12HV4363" },
  { transportName: "Ravi Jadhav ( STC )", vehicleNo: "MH12TV6320" },
  { transportName: "Santosh Gharbude ( STC )", vehicleNo: "MH12TV6326" },
  { transportName: "Prakash Bansode ( STC )", vehicleNo: "MH12TV6327" },
  { transportName: "Sachin Dede ( STC )", vehicleNo: "MH12TV6328" },
  { transportName: "Ramchandra k. Kantee ( STC )", vehicleNo: "MH13EP1183" },
  { transportName: "Sharad Thorat ( STC )", vehicleNo: "MH13EP1184" },
  { transportName: "Shrutghan Kshirsagar ( STC )", vehicleNo: "MH13EP1185" },
  { transportName: "Satish Aglave ( STC )", vehicleNo: "MH13EP1186" },
  { transportName: "Laxman Chorghade ( STC )", vehicleNo: "MH13EP1187" },
  { transportName: "Shukat Jahagirdar ( STC )", vehicleNo: "MH12SF1000" },
  { transportName: "Shri Sai Roadlines", vehicleNo: "" },
  { transportName: "Sanjay Limbaji Bhosale", vehicleNo: "" },
  { transportName: "Imtiyaj Bagwan", vehicleNo: "" },
  { transportName: "Anand B. Mane", vehicleNo: "" },
  { transportName: "Jai Hanuman Transport", vehicleNo: "" },
  { transportName: "Dhanjay Kure", vehicleNo: "" },
  { transportName: "Mayur Gavhane", vehicleNo: "MH46AR0036" },
  { transportName: "Dnyandev Saykar", vehicleNo: "MH16Q6379" },
  { transportName: "Dnyandev Saykar", vehicleNo: "MH16AE1011" },
  { transportName: "Dinesh Rankhambe", vehicleNo: "MH45AF3468" },
  { transportName: "Kalyan Atkare", vehicleNo: "MH48CB4453" },
  { transportName: "Kiran J. Salgar", vehicleNo: "MH45AF9405" },
  { transportName: "Dilip Hanmant Raut", vehicleNo: "MH13DQ6242" },
  { transportName: "Seema Sachin Gaikwad", vehicleNo: "MH13DQ9930" },
  { transportName: "Bhaurao Shankarrao Kawathe", vehicleNo: "MH13EP6566" },
  { transportName: "Sumit Sachin Kawathe", vehicleNo: "MH13R3666" },
  { transportName: "Rohan Trimbak Kadam", vehicleNo: "MH20CT1919" },
  { transportName: "Shashikant Balu Yadav", vehicleNo: "MH12NX3472" },
  { transportName: "Sudhir Bandu Manjare", vehicleNo: "MH13DQ9943" },
  { transportName: "Abhijit Chatke", vehicleNo: "MH10DT4375" },
  { transportName: "Rajkumar Dhavane", vehicleNo: "MH17BD3386" },
  { transportName: "Dadasaheb Navnath Dhere", vehicleNo: "MH45AF4848" },
  { transportName: "Ashish Phalke", vehicleNo: "MH45AX1063" },
];

const sectionClass =
  "rounded-3xl border border-slate-200/80 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-950/30";
const labelClass = "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300";
const errorClass = "mt-2 text-xs font-medium text-red-500";
const metricCardClass =
  "rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80";

const toNumber = (value) => Number(value || 0);

const getVehicleForTransportName = (transportName) => {
  if (!transportName) return null;
  const normalized = transportName.trim().toLowerCase();
  const matches = TRANSPORTER_VEHICLE_PAIRS.filter(
    (pair) => pair.transportName.trim().toLowerCase() === normalized && pair.vehicleNo,
  );
  return matches.length === 1 ? matches[0].vehicleNo : null;
};

const getTransportNameForVehicleNo = (vehicleNo) => {
  if (!vehicleNo) return null;
  const normalized = vehicleNo.trim().toUpperCase();
  const match = TRANSPORTER_VEHICLE_PAIRS.find(
    (pair) => pair.vehicleNo.trim().toUpperCase() === normalized,
  );
  return match ? match.transportName : null;
};

const getTransportPairSelectValue = (form) => {
  const match = TRANSPORTER_VEHICLE_PAIRS.find(
    (pair) =>
      pair.transportName === form.transportName && pair.vehicleNo === form.vehicleNo,
  );
  return match ? `${match.transportName} | ${match.vehicleNo}` : "";
};

const transportNameSuggestions = Array.from(
  new Set(TRANSPORTER_VEHICLE_PAIRS.map((pair) => pair.transportName).filter(Boolean)),
).sort();
const vehicleNoSuggestions = Array.from(
  new Set(TRANSPORTER_VEHICLE_PAIRS.map((pair) => pair.vehicleNo).filter(Boolean)),
).sort();

export default function TransportForm({
  form,
  setForm,
  onSubmit,
  submitText,
  isEdit,
}) {
  const [errors, setErrors] = useState({});

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
    if (!form.transportName) nextErrors.transportName = "Transport name is required";
    if (!form.vehicleNo) nextErrors.vehicleNo = "Vehicle number is required";
    if (!form.partyName) nextErrors.partyName = "Party name is required";
    if (toNumber(form.quantity) <= 0) nextErrors.quantity = "Quantity must be greater than 0";
    if (toNumber(form.rate) <= 0) nextErrors.rate = "Rate must be greater than 0";
    if (toNumber(form.advancePaid) < 0) nextErrors.advancePaid = "Advance cannot be negative";
    if (toNumber(form.fuelQuantity) < 0) nextErrors.fuelQuantity = "Fuel quantity cannot be negative";
    if (toNumber(form.fuelRate) < 0) nextErrors.fuelRate = "Fuel rate cannot be negative";

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
      ? Number(value)
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
      const matchedVehicle = getVehicleForTransportName(transportName);
      setForm((prev) => ({
        ...prev,
        transportName,
        vehicleNo: matchedVehicle || prev.vehicleNo,
      }));
      setErrors((prev) => ({ ...prev, transportName: undefined, vehicleNo: undefined }));
      return;
    }

    if (name === "vehicleNo") {
      const vehicleNo = String(parsedValue || "").toUpperCase();
      const matchedTransport = getTransportNameForVehicleNo(vehicleNo);
      setForm((prev) => ({
        ...prev,
        vehicleNo,
        transportName: matchedTransport || prev.transportName,
      }));
      setErrors((prev) => ({ ...prev, transportName: undefined, vehicleNo: undefined }));
      return;
    }

    setField(name, parsedValue);
  };

  const clearForm = () => {
    setForm({
      date: "",
      transportName: "",
      vehicleNo: "",
      freightMemoNo: 0,
      lrNo: "",
      partyName: "",
      company: "",
      location: "",
      quantity: 0,
      rate: 0,
      totalAmount: 0,
      fuelType: "Diesel",
      fuelRate: FUEL_RATES.Diesel,
      fuelQuantity: 0,
      fuelExpense: 0,
      advancePaid: 0,
      balance: 0,
      paymentDate: "",
      payAmount: 0,
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Basic Details</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Core transport and trip identification information.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
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
                  setErrors((prev) => ({ ...prev, transportName: undefined, vehicleNo: undefined }));
                } else {
                  setForm((prev) => ({ ...prev, transportName: "", vehicleNo: "" }));
                }
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Choose transporter and vehicle</option>
              {TRANSPORTER_VEHICLE_PAIRS.map((pair) => (
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
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Document & Party</h3>
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
              onChange={handleChange}
            />
          </div>

          <div>
            <label className={labelClass}>LR No</label>
            <input name="lrNo" value={form.lrNo} onChange={handleChange} />
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
            <input name="company" value={form.company || ""} onChange={handleChange} />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Cargo & Rate</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Quantity, rate, and delivery location.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className={labelClass}>Location</label>
            <input name="location" value={form.location} onChange={handleChange} />
          </div>

          <div>
            <label className={labelClass}>Quantity</label>
            <input type="number" name="quantity" value={form.quantity} onChange={handleChange} />
            {renderError("quantity")}
          </div>

          <div>
            <label className={labelClass}>Rate</label>
            <input type="number" name="rate" value={form.rate} onChange={handleChange} />
            {renderError("rate")}
          </div>

          <div>
            <label className={labelClass}>Total Amount</label>
            <input value={Number(form.totalAmount || 0).toFixed(2)} disabled className="cursor-not-allowed opacity-80" />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Fuel Details</h3>
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
            <input type="number" name="fuelRate" value={form.fuelRate} readOnly className="cursor-not-allowed opacity-80" />
            {renderError("fuelRate")}
          </div>

          <div>
            <label className={labelClass}>Fuel Quantity</label>
            <input type="number" name="fuelQuantity" value={form.fuelQuantity} onChange={handleChange} />
            {renderError("fuelQuantity")}
          </div>

          <div>
            <label className={labelClass}>Fuel Expense</label>
            <input value={Number(form.fuelExpense || 0).toFixed(2)} disabled className="cursor-not-allowed opacity-80" />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Payment</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Advance and settlement tracking.
          </p>
        </div>
        <div className={`grid gap-5 ${isEdit ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2"}`}>
          {isEdit && (
            <>
              <div>
                <label className={labelClass}>Payment Date</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={form.paymentDate || ""}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className={labelClass}>Pay Amount</label>
                <input type="number" name="payAmount" value={form.payAmount || 0} onChange={handleChange} />
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>Advance Paid</label>
            <input type="number" name="advancePaid" value={form.advancePaid} onChange={handleChange} />
            {renderError("advancePaid")}
          </div>

          <div>
            <label className={labelClass}>Balance</label>
            <input value={Number(form.balance || 0).toFixed(2)} disabled className="cursor-not-allowed opacity-80" />
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
