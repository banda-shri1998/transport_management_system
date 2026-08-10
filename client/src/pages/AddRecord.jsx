import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import TransportForm from "../components/TransportForm";
import api from "../services/api";
import AllRecords from "./AllRecords";

export default function AddRecord() {
  const navigate = useNavigate();

  const initialFormState = {
    date: new Date().toISOString().slice(0, 10),
    transportName: "",
    freightMemoNo: 0,
    lrNo: "",
    vehicleNo: "",
    partyName: "",
    company: "",
    location: "",
    quantity: 0,
    rate: 0,
    totalAmount: 0,
    advancePaid: 0,
    fuelType: "Diesel",
    fuelRate: 90.6,
    fuelQuantity: 0,
    fuelExpense: 0,
    balance: 0,
    paymentDate: "",
    payAmount: 0,
  };

  const [form, setForm] = useState(initialFormState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.post("/transports", form);
      setForm(initialFormState);
      navigate("/", { state: { success: true } });
    } catch (saveError) {
      setError(
        saveError.response?.data?.message ||
          saveError.message ||
          "Unable to save record",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <PageContainer
        title="Add Transport Record"
        subtitle="Create a new transport entry with automatic freight, fuel, and balance calculations."
        actions={
          <button
            onClick={() => navigate("/import")}
            className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 dark:from-white dark:to-slate-300 dark:text-slate-900"
          >
            Import Records
          </button>
        }
      >
        <TransportForm
          form={form}
          setForm={setForm}
          onSubmit={submit}
          submitText={saving ? "Saving..." : "Save Record"}
          isEdit={false}
        />
        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/80 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
      </PageContainer>
    </>
  );
}
