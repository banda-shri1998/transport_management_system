import { createContext, useEffect, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext('admin');

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });

    if (!res.data.token) {
      throw new Error("No token received");
    }

    localStorage.setItem("token", res.data.token);
    setUser({ token: res.data.token });
    setLoading(false);
  };

  const register = async ({ name, email, password, role = "Staff" }) => {
    const res = await api.post("/auth/register", { name, email, password, role });

    if (!res.data.token) {
      throw new Error("No token received");
    }

    localStorage.setItem("token", res.data.token);
    setUser({ token: res.data.token });
    setLoading(false);

    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setUser({ token });
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
