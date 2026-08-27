/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrateUserFromResponse = (res) => {
    // support different response shapes
    const token = res?.data?.token || res?.token || null;
    const payloadUser = res?.data?.user || res?.user || null;
    if (token) localStorage.setItem("token", token);
    if (payloadUser?.role) localStorage.setItem("role", payloadUser.role);
    if (token || payloadUser) setUser({ ...payloadUser, token });
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
        localStorage.setItem(
          "role",
          profile.data.role || localStorage.getItem("role") || "Staff",
        );
        setUser({ ...profile.data, token: localStorage.getItem("token") });
      }
    } catch (e) {
      // ignore - token is set and role may already be in localStorage
      console.error(e);
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
          setUser({ ...profile.data, token });
          if (profile.data.role)
            localStorage.setItem("role", profile.data.role);
        } else {
          setUser({ token, role });
        }
      } catch (e) {
        // fallback to token + stored role
        console.error(e);
        setUser({ token, role });
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
