import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import TransportForm from "../components/TransportForm";
import api from "../services/api";
import useAuth from "../hooks/useAuth";
import ErrorPage from "./ErrorPage";

export default function EditRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { user, loading } = useAuth();

  const isAdmin =
    (user?.role || localStorage.getItem("role") || "")
      .toString()
      .toLowerCase() === "admin";

  useEffect(() => {
    if (!isAdmin && !loading) return; // don't fetch if not admin
    api.get(`/transports/${id}`).then((res) => {
      setForm({
        ...res.data,
        date: res.data.date?.slice(0, 10),
        paymentDate: res.data.paymentDate?.slice(0, 10) || "",
      });
    });
  }, [id, isAdmin, loading]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/transports/${id}`, form);
      navigate("/records");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin && !loading) {
    return (
      <ErrorPage
        status={403}
        title="Access denied"
        message="You must be an admin to edit records."
      />
    );
  }

  return (
    <>
      <Navbar />
      <PageContainer
        title="Edit Transport Record"
        subtitle="Adjust transport details, fuel costs, and payment settlements from one place."
      >
        {!form ? (
          <div className="glass-panel p-8 text-sm text-slate-500 dark:text-slate-400">
            Loading record...
          </div>
        ) : (
          <TransportForm
            form={form}
            setForm={setForm}
            onSubmit={submit}
            submitText={saving ? "Updating..." : "Update Record"}
            isEdit={true}
          />
        )}
      </PageContainer>
    </>
  );
}
