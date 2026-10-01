import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import api from "../services/api";
import useAuth from "../hooks/useAuth";
import { ChevronDown, Search, UsersRound } from "lucide-react";

export default function Vehicles() {
  const { user } = useAuth();
  const isAdmin = user?.role && String(user.role).toLowerCase() === "admin";

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedTransporter, setSelectedTransporter] = useState("");
  const [showTransporterOptions, setShowTransporterOptions] = useState(false);
  const [form, setForm] = useState({
    vehicleNo: "",
    ownerName: "",
    maximumCapacity: 0,
    fuelType: "Diesel",
    fuelRate: 0,
    notes: "",
  });
  const [error, setError] = useState("");

  const transporterOptions = [
    ...new Set(
      vehicles.map((vehicle) => vehicle.ownerName?.trim()).filter(Boolean),
    ),
  ].sort((first, second) => first.localeCompare(second));
  const visibleVehicles = vehicles.filter((vehicle) => {
    const matchesTransporter =
      !selectedTransporter || vehicle.ownerName === selectedTransporter;
    const query = vehicleSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [
        vehicle.vehicleNo,
        vehicle.ownerName,
        vehicle.fuelType,
        vehicle.maximumCapacity,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      );

    return matchesTransporter && matchesSearch;
  });

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
      setForm({
        vehicleNo: "",
        ownerName: "",
        maximumCapacity: 0,
        fuelType: "Diesel",
        fuelRate: 0,
        notes: "",
      });
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
      ownerName: v.ownerName || "",
      maximumCapacity: v.maximumCapacity || 0,
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
        ownerName: form.ownerName,
        maximumCapacity: form.maximumCapacity,
        fuelType: form.fuelType,
        fuelRate: form.fuelRate,
        notes: form.notes,
      });
      setForm({
        vehicleNo: "",
        ownerName: "",
        maximumCapacity: 0,
        fuelType: "Diesel",
        fuelRate: 0,
        notes: "",
      });
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
              className="mb-6 grid gap-3 md:grid-cols-6"
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
              <input
                placeholder="Owner Name"
                value={form.ownerName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, ownerName: e.target.value }))
                }
              />
              <input
                type="number"
                min="0"
                placeholder="Maximum Capacity"
                value={form.maximumCapacity}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    maximumCapacity: Number(e.target.value),
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
                        ownerName: "",
                        maximumCapacity: 0,
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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <button
                type="button"
                aria-expanded={showTransporterOptions}
                onClick={() => setShowTransporterOptions((open) => !open)}
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 sm:w-auto sm:min-w-48 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <UsersRound size={16} aria-hidden="true" />
                  {selectedTransporter || "All transporters"}
                </span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              {showTransporterOptions && (
                <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-full min-w-56 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTransporter("");
                      setShowTransporterOptions(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    All transporters
                  </button>
                  {transporterOptions.map((name) => (
                    <button
                      type="button"
                      key={name}
                      onClick={() => {
                        setSelectedTransporter(name);
                        setShowTransporterOptions(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label className="relative min-w-0 flex-1">
              <Search
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={vehicleSearch}
                onChange={(event) => setVehicleSearch(event.target.value)}
                placeholder="Search vehicle, owner, fuel, or capacity"
                aria-label="Search vehicles"
                className="min-h-11 w-full pl-10"
              />
            </label>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-slate-400">
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Owner Name</th>
                  <th className="px-3 py-2 text-right">Maximum Capacity</th>
                  <th className="px-3 py-2">Fuel Type</th>
                  <th className="px-3 py-2">Fuel Rate</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleVehicles.map((v) => (
                  <tr key={v._id} className="border-b hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono">{v.vehicleNo}</td>
                    <td className="px-3 py-2">{v.ownerName || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      {Number(v.maximumCapacity) > 0 ? v.maximumCapacity : "-"}
                    </td>
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
                {visibleVehicles.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-sm text-slate-400"
                    >
                      {vehicles.length === 0
                        ? "No vehicles configured."
                        : "No vehicles match these filters."}
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
