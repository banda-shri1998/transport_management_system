import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import api from "../services/api";
import useAuth from "../hooks/useAuth";

export default function Vehicles() {
  const { user } = useAuth();
  const isAdmin = user?.role && String(user.role).toLowerCase() === "admin";

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    vehicleNo: "",
    fuelType: "Diesel",
    fuelRate: 0,
    notes: "",
  });
  const [error, setError] = useState("");

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/vehicles");
      setVehicles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const seedFromTransports = async () => {
    try {
      const res = await api.post("/vehicles/seed-from-transports");
      if (res.data?.created >= 0) {
        fetchVehicles();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Unable to seed vehicles",
      );
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/vehicles", { ...form });
      setForm({ vehicleNo: "", fuelType: "Diesel", fuelRate: 0, notes: "" });
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to save");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this vehicle?")) return;
    await api.delete(`/vehicles/${id}`);
    fetchVehicles();
  };

  const startEdit = (v) => {
    setForm({
      vehicleNo: v.vehicleNo,
      fuelType: v.fuelType,
      fuelRate: v.fuelRate || 0,
      notes: v.notes || "",
      id: v._id,
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      if (!form.id) return;
      await api.put(`/vehicles/${form.id}`, {
        vehicleNo: form.vehicleNo,
        fuelType: form.fuelType,
        fuelRate: form.fuelRate,
        notes: form.notes,
      });
      setForm({ vehicleNo: "", fuelType: "Diesel", fuelRate: 0, notes: "" });
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to save");
    }
  };

  return (
    <>
      <Navbar />
      <PageContainer
        title="Vehicles"
        subtitle="Manage vehicle fuel types and rates (admin)"
      >
        <div className="mb-4">
          <p className="text-sm text-slate-500">
            Vehicles are used to auto-fill fuel type and rate on Add Record.
          </p>
        </div>

        {isAdmin && (
          <>
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={seedFromTransports}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm"
              >
                Seed from transport records
              </button>
            </div>
            <form
              onSubmit={form.id ? saveEdit : submit}
              className="mb-6 grid gap-3 md:grid-cols-4"
            >
              <input
                placeholder="Vehicle No"
                value={form.vehicleNo}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    vehicleNo: e.target.value.toUpperCase(),
                  }))
                }
              />
              <select
                value={form.fuelType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fuelType: e.target.value }))
                }
              >
                <option>Diesel</option>
                <option>CNG</option>
                <option>Petrol</option>
              </select>
              <input
                type="number"
                placeholder="Fuel Rate"
                value={form.fuelRate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fuelRate: Number(e.target.value) }))
                }
              />
              <div className="flex gap-2">
                <button className="rounded-2xl bg-blue-600 px-4 py-2 text-white">
                  {form.id ? "Save" : "Add"}
                </button>
                {form.id && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        vehicleNo: "",
                        fuelType: "Diesel",
                        fuelRate: 0,
                        notes: "",
                      })
                    }
                    className="rounded-2xl border px-4 py-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          </>
        )}

        <div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-slate-400">
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Fuel Type</th>
                  <th className="px-3 py-2">Fuel Rate</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id} className="border-b hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono">{v.vehicleNo}</td>
                    <td className="px-3 py-2">{v.fuelType}</td>
                    <td className="px-3 py-2">{v.fuelRate || "-"}</td>
                    <td className="px-3 py-2">
                      {isAdmin ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(v)}
                            className="text-xs text-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => remove(v._id)}
                            className="text-xs text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-8 text-center text-sm text-slate-400"
                    >
                      No vehicles configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </PageContainer>
    </>
  );
}
