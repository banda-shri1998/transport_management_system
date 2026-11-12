import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import api from "../services/api";

const amount = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
const date = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

export default function VehicleDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/vehicles/${id}`).then((res) => setData(res.data)).catch((err) =>
      setError(err.response?.data?.message || "Unable to load vehicle details"),
    );
  }, [id]);

  return <><Navbar /><PageContainer title="Vehicle Details" subtitle="Vehicle profile, freight, fuel, and transport history.">
    <Link to="/vehicles" className="text-sm text-blue-600 underline">Back to vehicles</Link>
    {error && <p className="mt-4 text-red-600">{error}</p>}
    {!data && !error && <p className="mt-4">Loading...</p>}
    {data && <div className="mt-5 space-y-6">
      <section className="glass-panel grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-sm text-slate-500">Vehicle</p><p className="text-lg font-semibold">{data.vehicle.vehicleNo}</p></div>
        <div><p className="text-sm text-slate-500">Type / Ownership</p><p>{data.vehicle.vehicleType || "-"} / {data.vehicle.ownershipType}</p></div>
        <div><p className="text-sm text-slate-500">Transporter</p><p>{data.vehicle.transporter || data.vehicle.ownerName || "-"}</p></div>
        <div><p className="text-sm text-slate-500">Status</p><p>{data.vehicle.status}</p></div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[['Trips', data.summary.totalTrips], ['Quantity', Number(data.summary.totalQuantity || 0).toLocaleString('en-IN')], ['Freight', amount(data.summary.totalFreight)], ['Fuel Expense', amount(data.summary.totalFuelExpense)]].map(([label, value]) => <div key={label} className="cardDash rounded-2xl p-5"><p className="metric-label">{label}</p><p className="metric-value mt-2">{value}</p></div>)}
      </section>
      <section className="glass-panel overflow-auto"><div className="border-b px-6 py-4"><h2 className="text-lg font-semibold">Transport History</h2></div>
        <table className="w-full min-w-[700px] text-sm"><thead><tr><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Freight Memo</th><th className="px-4 py-3 text-left">Party</th><th className="px-4 py-3 text-right">Quantity</th><th className="px-4 py-3 text-right">Freight</th><th className="px-4 py-3 text-right">Fuel</th></tr></thead><tbody>{data.history.map((record) => <tr key={record._id} className="border-t"><td className="px-4 py-3">{date(record.date)}</td><td className="px-4 py-3">{record.freightMemoNo}</td><td className="px-4 py-3">{record.partyName}</td><td className="px-4 py-3 text-right">{record.quantity}</td><td className="px-4 py-3 text-right">{amount(record.totalAmount)}</td><td className="px-4 py-3 text-right">{amount(record.fuelExpense)}</td></tr>)}</tbody></table>
        {data.history.length === 0 && <p className="p-6 text-center text-slate-500">No transport history for this vehicle.</p>}
      </section>
    </div>}
  </PageContainer></>;
}
