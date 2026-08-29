/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const decodeJwtRole = (token) => {
    if (!token) return null;
    try {
      const base64Payload = token.split(".")[1];
      if (!base64Payload) return null;
      const normalized = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(normalized)
          .split("")
          .map((char) => `%${"00" + char.charCodeAt(0).toString(16).slice(-2)}`)
          .join(""),
      );
      return JSON.parse(json)?.role || null;
    } catch {
      return null;
    }
  };

  const hydrateUserFromResponse = (res) => {
    // support different response shapes
    const token = res?.data?.token || res?.token || null;
    const payloadUser = res?.data?.user || res?.user || null;
    const roleFromToken = decodeJwtRole(token);
    const finalRole =
      payloadUser?.role ||
      roleFromToken ||
      localStorage.getItem("role") ||
      "Staff";

    if (token) localStorage.setItem("token", token);
    if (finalRole) localStorage.setItem("role", finalRole);

    if (token || payloadUser) {
      setUser({
        ...(payloadUser || {}),
        role: finalRole,
        token,
      });
    }
  };

  const login = async (email, password) => {
    const res = await api
      .post("/auth/login", { email, password })
      .catch((e) => {
        throw e;
      });

    if (!res?.data?.token && !res?.token) {
      throw new Error("No token received");
    }

    hydrateUserFromResponse(res);

    // try to fetch profile to get role if backend supports it
    try {
      const profileEndpoint =
        import.meta.env.VITE_PROFILE_ENDPOINT || "/auth/me";
      const profile = await api.get(profileEndpoint);
      if (profile?.data) {
        const nextRole = profile.data.role || decodeJwtRole(localStorage.getItem("token")) || localStorage.getItem("role") || "Staff";
        localStorage.setItem("role", nextRole);
        setUser({ ...profile.data, role: nextRole, token: localStorage.getItem("token") });
      }
    } catch (e) {
      // ignore - token is set and role may already be in localStorage
      const storedRole = localStorage.getItem("role") || decodeJwtRole(localStorage.getItem("token")) || "Staff";
      setUser({ role: storedRole, token: localStorage.getItem("token") });
    }

    setLoading(false);
  };

  const register = async ({ name, email, password, role = "Staff" }) => {
    const res = await api.post("/auth/register", {
      name,
      email,
      password,
      role,
    });

    if (!res?.data?.token && !res?.token) {
      throw new Error("No token received");
    }

    hydrateUserFromResponse(res);
    setLoading(false);

    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      if (!token) {
        setLoading(false);
        return;
      }

      // try to get user profile from server
      try {
        const profile = await api.get("/auth/me");
        if (profile?.data) {
          const nextRole = profile.data.role || decodeJwtRole(token) || role || "Staff";
          setUser({ ...profile.data, role: nextRole, token });
          if (nextRole) localStorage.setItem("role", nextRole);
        } else {
          const fallbackRole = decodeJwtRole(token) || role || "Staff";
          setUser({ token, role: fallbackRole });
          localStorage.setItem("role", fallbackRole);
        }
      } catch (e) {
        // fallback to token + stored role
        const fallbackRole = decodeJwtRole(token) || role || "Staff";
        setUser({ token, role: fallbackRole });
        localStorage.setItem("role", fallbackRole);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
