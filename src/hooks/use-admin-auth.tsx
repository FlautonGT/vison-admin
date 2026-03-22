"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import type { AdminSession, SessionProfile } from "@/types";

interface AuthContextValue {
  admin: AdminSession | null;
  profile: SessionProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadSessionData() {
  const adminResponse = await adminApi.getAdminMe();
  if (adminResponse.error) throw new Error(adminResponse.error.message);
  return {
    admin: adminResponse.data ?? null,
    profile: adminResponse.data?.profile ?? null,
  };
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    const session = await loadSessionData();
    setAdmin(session.admin);
    setProfile(session.profile);
    if (typeof window !== "undefined") {
      localStorage.setItem("vison_admin_session", JSON.stringify(session.admin));
      localStorage.setItem("vison_admin_profile", JSON.stringify(session.profile));
    }
  };

  useEffect(() => {
    const token = adminApi.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    loadSessionData()
      .then((session) => {
        setAdmin(session.admin);
        setProfile(session.profile);
      })
      .catch(() => {
        adminApi.logout();
        setAdmin(null);
        setProfile(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const response = await adminApi.login(email, password);
    if (response.error) {
      setIsLoading(false);
      return { success: false, error: response.error.message };
    }

    try {
      await refresh();
      setIsLoading(false);
      return { success: true };
    } catch {
      adminApi.logout();
      setIsLoading(false);
      return { success: false, error: "Akun berhasil login, tetapi tidak memiliki akses admin." };
    }
  };

  const logout = () => {
    adminApi.logout();
    setAdmin(null);
    setProfile(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        profile,
        isLoading,
        isAuthenticated: !!admin,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
